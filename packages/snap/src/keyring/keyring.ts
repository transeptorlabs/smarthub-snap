import { Buffer } from 'buffer';
import { Common, Hardfork } from '@ethereumjs/common';
import { JsonTx, TransactionFactory } from '@ethereumjs/tx';
import {
  Address,
  ecsign,
  stripHexPrefix,
  toBuffer,
  toChecksumAddress,
} from '@ethereumjs/util';
import {
  SignTypedDataVersion,
  TypedDataV1,
  TypedMessage,
  concatSig,
  personalSign,
  recoverPersonalSignature,
  signTypedData,
} from '@metamask/eth-sig-util';
import type {
  Keyring,
  KeyringAccount,
  KeyringRequest,
  SubmitRequestResponse,
} from '@metamask/keyring-api';
import {
  EthAccountType,
  EthMethod,
  emitSnapKeyringEvent,
} from '@metamask/keyring-api';
import { KeyringEvent } from '@metamask/keyring-api/dist/events';
import type { Json, JsonRpcRequest } from '@metamask/utils';
import { v4 as uuid } from 'uuid';
import { Wallet as EthersWallet, ethers } from 'ethers';
import { EntryPoint__factory } from '@account-abstraction/contracts';
import { deepHexlify } from '@account-abstraction/utils';
import { storeKeyRing } from '../state/state';
import {
  isEvmChain,
  serializeTransaction,
  isUniqueAccountName,
} from '../utils';
import { DEFAULT_ENTRY_POINT, getSmartAccountAddress } from '../4337';
import { UserOperation } from '../types';
import packageInfo from '../../package.json';

export type KeyringState = {
  wallets: Record<string, Wallet>;
  pendingRequests: Record<string, KeyringRequest>;
};

export type Wallet = {
  account: KeyringAccount;
  privateKey: string;
};

export class SimpleKeyring implements Keyring {
  #wallets: Record<string, Wallet>;

  #pendingRequests: Record<string, KeyringRequest>;

  constructor(state: KeyringState) {
    this.#wallets = state.wallets;
    this.#pendingRequests = state.pendingRequests;
  }

  /*
    Will generate a private key using a deterministic 256-bit value specific to the Snap and the user’s MetaMask account(i.e., snapId + MetaMask secret recovery phrase + account name as salt).
    This private key will be used to sign userOps for eip155:erc4337 type keyring account.
    Since the private key is generated deterministically, the user will be able to recover the same account for a given Snap version account name(human readable) and MetaMask SRP.
  */
  async #generateKeyPair(
    name: string,
  ): Promise<{ privateKey: string; address: string }> {
    const privKey = await snap.request({
      method: 'snap_getEntropy',
      params: {
        version: 1,
        salt: name,
      },
    });

    const privateKeyBuffer = Buffer.from(stripHexPrefix(privKey), 'hex');
    const address = toChecksumAddress(
      Address.fromPrivateKey(privateKeyBuffer).toString(),
    );
    return { privateKey: privateKeyBuffer.toString('hex'), address };
  }

  #getWalletByAddress(address: string): Wallet {
    const walletMatch = Object.values(this.#wallets).find(
      (wallet) =>
        wallet.account.address.toLowerCase() === address.toLowerCase(),
    );

    if (walletMatch === undefined) {
      throw new Error(`Cannot find wallet for address: ${address}`);
    }
    return walletMatch;
  }

  #getWalletById(accountId: string): Wallet {
    const walletMatch = Object.values(this.#wallets).find(
      (wallet) => wallet.account.id.toLowerCase() === accountId.toLowerCase(),
    );

    if (walletMatch === undefined) {
      throw new Error(`Cannot find wallet for accountId: ${accountId}`);
    }
    return walletMatch;
  }

  async listAccounts(): Promise<KeyringAccount[]> {
    return Object.values(this.#wallets).map((wallet) => wallet.account);
  }

  async getAccount(id: string): Promise<KeyringAccount | undefined> {
    return this.#wallets[id].account;
  }

  async createAccount(
    options: Record<string, Json> = {},
  ): Promise<KeyringAccount> {
    console.log(
      `SNAPS/Keyring handler (createAccount):`,
      JSON.stringify(options, undefined, 2),
    );

    // extract name from options
    const name = options?.name as string | undefined;
    if (!name) {
      throw new Error('Account name is required');
    }

    if (!isUniqueAccountName(name, Object.values(this.#wallets))) {
      throw new Error(`Account name already in use: ${name}`);
    }
    const { privateKey, address } = await this.#generateKeyPair(name);
    const account: KeyringAccount = {
      id: uuid(),
      options: {
        name,
        smartAccountAddress: await getSmartAccountAddress(address),
      },
      address,
      methods: [
        EthMethod.PersonalSign,
        EthMethod.Sign,
        EthMethod.SignTransaction,
        EthMethod.SignTypedDataV1,
        EthMethod.SignTypedDataV3,
        EthMethod.SignTypedDataV4,
      ],
      type: EthAccountType.Eip4337,
    };

    this.#wallets[account.id] = { account, privateKey };
    await this.#saveState();
    await this.#emitEvent(KeyringEvent.AccountCreated, { account });
    return account;
  }

  async filterAccountChains(_id: string, chains: string[]): Promise<string[]> {
    // The `id` argument is not used because all accounts created by this snap
    // are expected to be compatible with any EVM chain.
    return chains.filter((chain) => isEvmChain(chain));
  }

  async updateAccount(account: KeyringAccount): Promise<void> {
    const currentAccount = this.#wallets[account.id].account;
    if (currentAccount === undefined) {
      throw new Error(`Account '${account.id}' not found`);
    }

    const newAccount: KeyringAccount = {
      ...currentAccount,
      ...account,
      // Restore read-only properties.
      address: currentAccount.address,
      methods: currentAccount.methods,
      type: currentAccount.type,
      options: currentAccount.options,
    };

    if (account.options.name !== currentAccount.options.name) {
      throw new Error(`Account name can not change: ${account.options.name}`);
    }

    if (account.type !== currentAccount.type) {
      throw new Error(`Account type can not change: ${account.type}`);
    }

    this.#wallets[account.id].account = newAccount;
    await this.#saveState();
    await this.#emitEvent(KeyringEvent.AccountUpdated, {
      account: newAccount,
    });
  }

  async deleteAccount(id: string): Promise<void> {
    delete this.#wallets[id];
    await this.#saveState();
    await this.#emitEvent(KeyringEvent.AccountDeleted, { id });
  }

  async listRequests(): Promise<KeyringRequest[]> {
    return Object.values(this.#pendingRequests);
  }

  async getRequest(id: string): Promise<KeyringRequest> {
    return this.#pendingRequests[id];
  }

  async submitRequest(request: KeyringRequest): Promise<SubmitRequestResponse> {
    console.log(
      'SNAPS/submitRequest requests:',
      JSON.stringify(request, undefined, 2),
    );
    const scope = 'sync';
    return scope === 'sync'
      ? this.#syncSubmitRequest(request)
      : this.#asyncSubmitRequest(request);
  }

  #getCurrentUrl(): string {
    const dappUrlPrefix =
      process.env.NODE_ENV === 'production'
        ? process.env.DAPP_ORIGIN_PRODUCTION
        : process.env.DAPP_ORIGIN_DEVELOPMENT;
    const dappVersion: string = packageInfo.version;

    // Ensuring that both dappUrlPrefix and dappVersion are truthy
    if (dappUrlPrefix && dappVersion && process.env.NODE_ENV === 'production') {
      return `${dappUrlPrefix}${dappVersion}/`;
    }
    // Default URL if dappUrlPrefix or dappVersion are falsy, or if URL construction fails
    return dappUrlPrefix as string;
  }

  /* 
    Asynchronous request are stored in queue of pending requests to be approved or rejected by the user.
  */
  async #asyncSubmitRequest(
    request: KeyringRequest,
  ): Promise<SubmitRequestResponse> {
    this.#pendingRequests[request.id] = request;
    await this.#saveState();
    const dappUrl = this.#getCurrentUrl();
    return {
      pending: true,
      redirect: {
        url: dappUrl,
        message: 'Redirecting to Snap Simple Keyring to sign transaction',
      },
    };
  }

  /* 
    Synchronous request are not stored and the result is return to the user.
  */
  async #syncSubmitRequest(
    request: KeyringRequest,
  ): Promise<SubmitRequestResponse> {
    const { method, params = [] } = request.request as JsonRpcRequest;
    const result = await this.#handleSigningRequest(
      method,
      params,
      request.account,
    );
    return {
      pending: false,
      result,
    };
  }

  async approveRequest(id: string): Promise<void> {
    try {
      const { request, account } = await this.getRequest(id);
      if (request === undefined) {
        throw new Error(`Request '${id}' not found`);
      }

      console.log(
        'SNAPS/',
        ' approveRequest requests',
        JSON.stringify(request),
      );

      const result = await this.#handleSigningRequest(
        request.method,
        (request.params as Json) ?? [],
        account,
      );

      delete this.#pendingRequests[id];
      await this.#saveState();
      await this.#emitEvent(KeyringEvent.RequestApproved, { id, result });
    } catch (e) {
      delete this.#pendingRequests[id];
      await this.#saveState();
      throw e;
    }
  }

  async rejectRequest(id: string): Promise<void> {
    const request: KeyringRequest = await this.getRequest(id);
    console.log(
      'SNAPS/rejectRequest requests:',
      JSON.stringify(request, undefined, 2),
    );

    if (request === undefined) {
      throw new Error(`Request '${id}' not found`);
    }

    delete this.#pendingRequests[id];
    await this.#saveState();
    await this.#emitEvent(KeyringEvent.RequestRejected, { id });
  }

  async #handleSigningRequest(
    method: string,
    params: Json,
    accountId: string,
  ): Promise<Json> {
    switch (method) {
      case EthMethod.PersonalSign: {
        const [from, message] = params as [string, string];
        return this.#signPersonalMessage(from, message);
      }

      case EthMethod.SignTransaction: {
        const [tx] = params as [any];

        // check to see if tx initCode is present
        if (tx.initCode) {
          const userOp = tx as UserOperation;
          return (await this.#signUserOp(accountId, userOp)) as Json;
        }
        return this.#signTransaction(accountId, tx as JsonTx);
      }

      case EthMethod.SignTypedDataV1: {
        const [from, data] = params as [string, Json];
        return this.#signTypedData(from, data, {
          version: SignTypedDataVersion.V1,
        });
      }

      case EthMethod.SignTypedDataV3: {
        const [from, data] = params as [string, Json];
        return this.#signTypedData(from, data, {
          version: SignTypedDataVersion.V3,
        });
      }

      case EthMethod.SignTypedDataV4: {
        const [from, data] = params as [string, Json];
        return this.#signTypedData(from, data, {
          version: SignTypedDataVersion.V4,
        });
      }

      case EthMethod.Sign: {
        const [from, data] = params as [string, string];
        return this.#signMessage(from, data);
      }

      default: {
        throw new Error(`EVM method not supported: ${method}`);
      }
    }
  }

  async #signUserOp(
    accountId: string,
    userOp: UserOperation,
  ): Promise<UserOperation> {
    const provider = new ethers.providers.Web3Provider(ethereum as any);
    const entryPointContract = new ethers.Contract(
      DEFAULT_ENTRY_POINT,
      EntryPoint__factory.abi,
      provider,
    );

    // sign the userOp
    const { privateKey } = this.#getWalletById(accountId);
    const wallet = new EthersWallet(privateKey);
    userOp.signature = '0x';
    const userOpHash = ethers.utils.arrayify(
      await entryPointContract.getUserOpHash(userOp),
    );
    const signature = await wallet.signMessage(userOpHash);
    return deepHexlify({ ...userOp, signature });
  }

  #signTransaction(accountId: string, tx: JsonTx): Json {
    if (!tx.chainId) {
      throw new Error('Missing chainId');
    }

    // Patch the transaction to make sure that the `chainId` is a hex string.
    if (!tx.chainId.startsWith('0x')) {
      tx.chainId = `0x${parseInt(tx.chainId, 10).toString(16)}`;
    }

    const wallet = this.#getWalletById(accountId);
    const privateKey = Buffer.from(wallet.privateKey, 'hex');
    const common = Common.custom(
      { chainId: Number(tx.chainId) },
      {
        hardfork:
          tx.maxPriorityFeePerGas || tx.maxFeePerGas
            ? Hardfork.London
            : Hardfork.Istanbul,
      },
    );

    const signedTx = TransactionFactory.fromTxData(tx, {
      common,
    }).sign(privateKey);

    return serializeTransaction(signedTx.toJSON(), signedTx.type);
  }

  #signTypedData(
    from: string,
    data: Json,
    opts: { version: SignTypedDataVersion } = {
      version: SignTypedDataVersion.V1,
    },
  ): string {
    const { privateKey } = this.#getWalletByAddress(from);
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');

    return signTypedData({
      privateKey: privateKeyBuffer,
      data: data as unknown as TypedDataV1 | TypedMessage<any>,
      version: opts.version,
    });
  }

  #signPersonalMessage(from: string, message: string): string {
    const { privateKey } = this.#getWalletByAddress(from);
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');
    const messageBuffer = Buffer.from(message.slice(2), 'hex');

    const signature = personalSign({
      privateKey: privateKeyBuffer,
      data: messageBuffer,
    });

    const recoveredAddress = recoverPersonalSignature({
      data: messageBuffer,
      signature,
    });

    if (recoveredAddress.toLowerCase() !== from.toLowerCase()) {
      throw new Error(
        `Signature verification failed for account "${from}" (got "${recoveredAddress}")`,
      );
    }

    return signature;
  }

  #signMessage(from: string, data: string): string {
    const { privateKey } = this.#getWalletByAddress(from);
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');
    const message = stripHexPrefix(data);
    const signature = ecsign(Buffer.from(message, 'hex'), privateKeyBuffer);
    return concatSig(toBuffer(signature.v), signature.r, signature.s);
  }

  async #saveState(): Promise<void> {
    await storeKeyRing({
      wallets: this.#wallets,
      pendingRequests: this.#pendingRequests,
    } as KeyringState);
  }

  async #emitEvent(
    event: KeyringEvent,
    data: Record<string, Json>,
  ): Promise<void> {
    await emitSnapKeyringEvent(snap, event, data);
  }
}
