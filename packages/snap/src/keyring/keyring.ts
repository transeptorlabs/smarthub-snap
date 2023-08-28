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
import {
  Keyring,
  KeyringAccount,
  KeyringRequest,
  SubmitRequestResponse,
} from '@metamask/keyring-api';
import type { Json, JsonRpcRequest } from '@metamask/utils';
import { v4 as uuid } from 'uuid';

import { Wallet as EthersWallet, ethers } from 'ethers';
import { EntryPoint__factory } from '@account-abstraction/contracts';
import { deepHexlify } from '@account-abstraction/utils';
import { resolveProperties } from 'ethers/lib/utils';
import { heading, panel, text } from '@metamask/snaps-ui';
import { HttpRpcClient } from '../client';
import {
  getBundlerUrls,
  storeKeyRing,
  storeUserOpHash,
} from '../state/state';
import {
  isEvmChain,
  serializeTransaction,
  isUniqueAccountName,
} from '../utils';
import { DEFAULT_ENTRY_POINT } from '../4337';
import { UserOperation } from '../types';

export type KeyringState = {
  wallets: Record<string, Wallet>;
  pendingRequests: Record<string, KeyringRequest>;
  signedTx: Record<string, string>;
};

export type Wallet = {
  account: KeyringAccount;
  privateKey: string;
};

export class SimpleKeyring implements Keyring {
  #wallets: Record<string, Wallet>;

  #pendingRequests: Record<string, KeyringRequest>;

  #signedTx: Record<string, string>;

  constructor(state: KeyringState) {
    this.#wallets = state.wallets;
    this.#pendingRequests = state.pendingRequests;
    this.#signedTx = state.signedTx;
  }

  async listAccounts(): Promise<KeyringAccount[]> {
    return Object.values(this.#wallets).map((wallet) => wallet.account);
  }

  async getAccount(id: string): Promise<KeyringAccount | undefined> {
    return this.#wallets[id].account;
  }

  async createAccount(
    name: string,
    options: Record<string, Json> | null = null,
  ): Promise<KeyringAccount> {
    const { privateKey, address } = await this.#generateKeyPair(name);

    if (!isUniqueAccountName(name, Object.values(this.#wallets))) {
      throw new Error(`Account name already in use: ${name}`);
    }

    const account: KeyringAccount = {
      id: uuid(),
      name,
      options,
      address,
      supportedMethods: [
        'eth_sendTransaction',
        'eth_signTransaction',
        'eth_sign',
        'eth_signTypedData_v1',
        'eth_signTypedData_v2',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
        'eth_signTypedData',
        'personal_sign',
      ],
      type: 'eip155:erc4337',
    };

    this.#wallets[account.id] = { account, privateKey };
    await this.#saveState();

    await snap.request({
      method: 'snap_manageAccounts',
      params: {
        method: 'createAccount',
        params: { account },
      },
    });
    return account;
  }

  async filterAccountChains(_id: string, chains: string[]): Promise<string[]> {
    // The `id` argument is not used because all accounts created by this snap
    // are expected to be compatible with any EVM chain.
    return chains.filter((chain) => isEvmChain(chain));
  }

  async updateAccount(account: KeyringAccount): Promise<void> {
    const currentAccount = this.#wallets[account.id].account;
    const newAccount: KeyringAccount = {
      ...currentAccount,
      ...account,
      // Restore read-only properties.
      address: currentAccount.address,
      supportedMethods: currentAccount.supportedMethods,
      type: currentAccount.type,
      options: currentAccount.options,
    };

    if (!isUniqueAccountName(account.name, Object.values(this.#wallets))) {
      throw new Error(`Account name already in use: ${account.name}`);
    }

    this.#wallets[account.id].account = newAccount;
    await this.#saveState();

    await snap.request({
      method: 'snap_manageAccounts',
      params: {
        method: 'updateAccount',
        params: { account },
      },
    });
  }

  async deleteAccount(id: string): Promise<void> {
    delete this.#wallets[id];
    await this.#saveState();

    await snap.request({
      method: 'snap_manageAccounts',
      params: {
        method: 'deleteAccount',
        params: { id },
      },
    });
  }

  async listRequests(): Promise<KeyringRequest[]> {
    return Object.values(this.#pendingRequests);
  }

  async getRequest(id: string): Promise<KeyringRequest> {
    return this.#pendingRequests[id];
  }

  /* 
    This snap implements asynchronous implementation, the request is stored in queue of pending requests to be approved or rejected by the user.
  */
  async submitRequest(request: KeyringRequest): Promise<SubmitRequestResponse> {
    console.log('SNAPS/', ' submitRequest requests', JSON.stringify(request));

    if (request.request.id === '') {
      throw new Error('Request id is required');
    }

    this.#pendingRequests[request.request.id] = request;
    await this.#saveState();
    return {
      pending: true,
    };
  }

  async approveRequest(_id: string): Promise<void> {
    try {
      const request: KeyringRequest = await this.getRequest(_id);
      console.log(
        'SNAPS/',
        ' approveRequest requests',
        JSON.stringify(request),
      );
      const { method, params } = request.request as JsonRpcRequest;
      const signature = await this.#handleSigningRequest(
        method,
        params as Json,
      );
      await snap.request({
        method: 'snap_manageAccounts',
        params: {
          method: 'submitResponse',
          params: { id: _id, result: signature },
        },
      });

      delete this.#pendingRequests[_id];
      if (method === 'eth_signTransaction') {
        this.#signedTx[_id] = signature as string;
      }

      await this.#saveState();
    } catch (e) {
      delete this.#pendingRequests[_id];
      await this.#saveState();
      throw e;
    }
  }

  async rejectRequest(_id: string): Promise<void> {
    const request: KeyringRequest = await this.getRequest(_id);
    console.log('SNAPS/', ' rejectRequest requests', JSON.stringify(request));

    await snap.request({
      method: 'snap_manageAccounts',
      params: {
        method: 'submitResponse',
        params: { id: _id, result: null },
      },
    });

    delete this.#pendingRequests[_id];
    await this.#saveState();
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

  async #handleSigningRequest(method: string, params: Json): Promise<Json> {
    switch (method) {
      case 'personal_sign': {
        const [from, message] = params as string[];
        return this.#signPersonalMessage(from, message);
      }

      case 'eth_sendTransaction': {
        const [from, userOperation] = params as [string, UserOperation];
        const provider = new ethers.providers.Web3Provider(ethereum as any);
        const entryPointContract = new ethers.Contract(
          DEFAULT_ENTRY_POINT,
          EntryPoint__factory.abi,
          provider,
        );

        // sign the userOp
        const { privateKey, account } = this.#getWalletByAddress(from);
        const wallet = new EthersWallet(privateKey);
        userOperation.signature = '0x';
        const userOpHash = ethers.utils.arrayify(
          await entryPointContract.getUserOpHash(userOperation),
        );
        const signature = await wallet.signMessage(userOpHash);
        userOperation.signature = signature;

        // send the userOp
        const hexifiedUserOp: UserOperation = deepHexlify(userOperation);
        await this.#handleSendUserOp(account.id, hexifiedUserOp);

        return signature;
      }

      case 'eth_signTransaction': {
        const [from, tx] = params as [string, JsonTx, Json];
        const provider = new ethers.providers.Web3Provider(ethereum as any);
        const { privateKey } = this.#getWalletByAddress(from);
        const wallet = new EthersWallet(privateKey, provider);
        return await wallet.signTransaction(tx as any);
      }

      case 'eth_signTypedData':
      case 'eth_signTypedData_v1':
      case 'eth_signTypedData_v2':
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4': {
        const [from, data, opts] = params as [
          string,
          Json,
          { version: SignTypedDataVersion },
        ];
        return this.#signTypedData(from, data, opts);
      }

      case 'eth_sign': {
        const [from, data] = params as [string, string];
        return this.#signMessage(from, data);
      }

      default: {
        throw new Error(`EVM method not supported: ${method}`);
      }
    }
  }

  async #handleSendUserOp(
    accountId: string,
    signedUserOp: UserOperation,
  ): Promise<void> {
    console.log('SNAPS/', 'handle handleSendUserOp ', accountId, signedUserOp);

    // connect to rpc
    const [bundlerUrls, chainId] = await Promise.all([
      getBundlerUrls(),
      ethereum.request({ method: 'eth_chainId' }),
    ]);
    const rpcClient = new HttpRpcClient(bundlerUrls, chainId as string);
    const rpcResult = await rpcClient.send('eth_sendUserOperation', [
      signedUserOp,
      DEFAULT_ENTRY_POINT,
    ]);

    // store userOp hash pending
    if (rpcResult.sucess === true) {
      await storeUserOpHash(
        accountId,
        chainId as string,
        rpcResult.data as string,
      );

      snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: panel([
            heading('User Operation Sent'),
            text(`Sent from Smart account: ${signedUserOp.sender}`),
            text(`User operation hash: ${rpcResult.data}`),
          ]),
        },
      });
    } else {
      throw new Error(`Failed to send user op: ${rpcResult.data}`);
    }
  }

  #signTransaction(from: string, tx: JsonTx): Json {
    if (!tx.chainId) {
      throw new Error('Missing chainId');
    }

    // Patch the transaction to make sure that the `chainId` is a hex string.
    if (!tx.chainId.startsWith('0x')) {
      tx.chainId = `0x${parseInt(tx.chainId, 10).toString(16)}`;
    }

    const wallet = this.#getWalletByAddress(from);
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
      signedTx: this.#signedTx,
    } as KeyringState);
  }
}
