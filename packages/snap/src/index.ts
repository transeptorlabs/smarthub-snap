import type {
  OnRpcRequestHandler,
  OnKeyringRequestHandler,
} from '@metamask/snaps-types';
import {
  KeyringAccount,
  MethodNotSupportedError,
  handleKeyringRequest,
} from '@metamask/keyring-api';
import { BigNumber } from 'ethers';
import { copyable, heading, panel, text } from '@metamask/snaps-ui';
import { HttpRpcClient, getBalance } from './client';
import {
  clearActivityData,
  getBundlerUrls,
  storeBundlerUrl,
  getKeyRing,
  getUserOpHashes,
  getTxHashes,
  storeTxHash,
  getNextRequestId,
} from './state';
import {
  EstimateCreationGasParams,
  EstimateUserOperationGas,
  GetTxHashesParams,
  GetUserOpParams,
  NotifyParams,
  SmartAccountActivityParams,
  SmartAccountParams,
  StoreTxHashParams,
  UserOpCallDataParams,
} from './types';
import {
  InternalMethod,
  KeyringState,
  PERMISSIONS,
  SimpleKeyring,
} from './keyring';
import {
  DEFAULT_ACCOUNT_FACTORY,
  DEFAULT_ENTRY_POINT,
  estimateCreationGas,
  getAccountInitCode,
  getDeposit,
  getNonce,
  getSmartAccountAddress,
  getUserOpCallData,
} from './4337';

let keyring: SimpleKeyring;

/**
 * Verify if the caller can call the requested method.
 *
 * @param origin - Caller origin.
 * @param method - Method being called.
 * @returns True if the caller is allowed to call the method, false otherwise.
 */
function hasPermission(origin: string, method: string): boolean {
  return PERMISSIONS.get(origin)?.includes(method) ?? false;
}

const intitKeyRing = async () => {
  const keyringState: KeyringState = await getKeyRing();
  keyring = new SimpleKeyring(keyringState);
};

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - Request arguments.
 * @param args.request - Request to execute.
 * @param args.origin - Caller origin.
 * @returns The execution result.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  console.log(
    `SNAPS/RPC request (origin="${origin}"):`,
    JSON.stringify(request, undefined, 2),
  );

  // Check if origin is allowed to call method.
  if (!hasPermission(origin, request.method)) {
    throw new Error(
      `Origin '${origin}' is not allowed to call '${request.method}'`,
    );
  }

  // Handle custom methods.
  const [bundlerUrls, chainId] = await Promise.all([
    getBundlerUrls(),
    ethereum.request({ method: 'eth_chainId' }),
  ]);
  const rpcClient = new HttpRpcClient(bundlerUrls, chainId as string);
  let result;
  await intitKeyRing();

  if (!request.params) {
    request.params = [];
  }

  switch (request.method) {
    case InternalMethod.Notify: {
      const params: NotifyParams = (request.params as any[])[0] as NotifyParams;

      const display: any = [heading(params.heading), text(params.message)];

      if (params.copyable !== '') {
        display.push(copyable(params.copyable));
      }

      return snap.request({
        method: 'snap_dialog',
        params: {
          type: 'alert',
          content: panel(display),
        },
      });
    }

    case InternalMethod.GetNextRequestId: {
      return await getNextRequestId();
    }

    case InternalMethod.SmartAccount: {
      const params: SmartAccountParams = (
        request.params as any[]
      )[0] as SmartAccountParams;

      const keyringAccount: KeyringAccount | undefined =
        await keyring.getAccount(params.keyringAccountId);
      if (!keyringAccount) {
        throw new Error('Account not found');
      }

      const owner = keyringAccount.options.owner as string | undefined;
      if (!owner) {
        throw new Error('Owner not found');
      }

      const scAddress = await getSmartAccountAddress(owner);
      const [smartAcountBalance, ownerBalance, nonce, deposit] =
        await Promise.all([
          await getBalance(scAddress),
          await getBalance(owner),
          await getNonce(scAddress),
          await getDeposit(scAddress),
        ]);

      result = JSON.stringify({
        initCode: await getAccountInitCode(owner),
        address: scAddress,
        balance: smartAcountBalance, // in wei
        nonce,
        index: BigNumber.from(0),
        entryPoint: DEFAULT_ENTRY_POINT,
        factoryAddress: DEFAULT_ACCOUNT_FACTORY,
        deposit,
        ownerAddress: owner,
        owner: {
          address: owner,
          balance: ownerBalance, // in wei
        },
      });

      return result;
    }

    case InternalMethod.GetUserOpsHashes: {
      const params: SmartAccountActivityParams = (
        request.params as any[]
      )[0] as SmartAccountActivityParams;

      const ownerAccount = await keyring.getAccount(params.keyringAccountId);
      if (!ownerAccount) {
        throw new Error('Account not found');
      }

      const userOpHashes: string[] = await getUserOpHashes(
        ownerAccount.id,
        chainId as string,
      );
      result = userOpHashes;
      return result;
    }

    case InternalMethod.GetUserOpCallData: {
      const params: UserOpCallDataParams = (
        request.params as any[]
      )[0] as UserOpCallDataParams;

      const ownerAccount: KeyringAccount | undefined = await keyring.getAccount(
        params.keyringAccountId,
      );
      if (!ownerAccount) {
        throw new Error('Account not found');
      }

      const scAddress = await getSmartAccountAddress(ownerAccount.address);
      return await getUserOpCallData(
        scAddress,
        params.to,
        params.value,
        params.data,
      );
    }

    case InternalMethod.EstimateCreationGas: {
      const params: EstimateCreationGasParams = (
        request.params as any[]
      )[0] as EstimateCreationGasParams;

      const ownerAccount: KeyringAccount | undefined = await keyring.getAccount(
        params.keyringAccountId,
      );
      if (!ownerAccount) {
        throw new Error('Account not found');
      }

      const initCode = await getAccountInitCode(ownerAccount.address);
      console.log('SNAPS/', 'initCode ', initCode);
      result = await estimateCreationGas(initCode);
      return JSON.stringify(result);
    }

    case InternalMethod.GetTxHashes: {
      const params: GetTxHashesParams = (
        request.params as any[]
      )[0] as GetTxHashesParams;
      return await getTxHashes(params.keyringAccountId, params.chainId);
    }

    case InternalMethod.StoreTxHash: {
      const params: StoreTxHashParams = (
        request.params as any[]
      )[0] as StoreTxHashParams;
      result = await storeTxHash(
        params.keyringAccountId,
        params.txHash,
        params.chainId,
      );
      return result;
    }

    case InternalMethod.AddBundlerUrl: {
      result = await storeBundlerUrl(
        (request.params as any[])[0],
        (request.params as any[])[1],
      );
      return result;
    }

    case InternalMethod.GetBundlerUrls: {
      result = JSON.stringify(await getBundlerUrls());
      return result;
    }

    case InternalMethod.ClearActivityData: {
      result = await clearActivityData();
      if (!result) {
        throw new Error('Failed to clear activity data');
      }
      return result;
    }

    case InternalMethod.ChainId: {
      return await rpcClient.send(request.method, request.params as any[]);
    }

    case InternalMethod.GetUserOperationReceipt: {
      const params: GetUserOpParams = (
        request.params as any[]
      )[0] as GetUserOpParams;
      const rpcResult = await rpcClient.send(request.method, [
        params.userOpHash,
      ]);
      if (rpcResult.sucess === true && rpcResult.data !== null) {
        result = JSON.stringify(rpcResult.data);
        return result;
      }
      return rpcResult.data;
    }

    case InternalMethod.SupportedEntryPoints: {
      return await rpcClient.send(request.method, []);
    }

    case InternalMethod.EstimateUserOperationGas: {
      const params: EstimateUserOperationGas = (
        request.params as any[]
      )[0] as EstimateUserOperationGas;

      const rpcResult = await rpcClient.send(request.method, [
        params.userOp,
        DEFAULT_ENTRY_POINT,
      ]);

      if (rpcResult.sucess === true) {
        result = JSON.stringify(rpcResult.data);
        return result;
      }
      throw new Error(`Failed to estimate gass: ${rpcResult.data}`);
    }

    case InternalMethod.GetUserOperationByHash: {
      const params: GetUserOpParams = (
        request.params as any[]
      )[0] as GetUserOpParams;
      const rpcResult = await rpcClient.send(request.method, [
        params.userOpHash,
      ]);
      if (rpcResult.sucess === true && rpcResult.data !== null) {
        result = JSON.stringify(rpcResult.data);
        return result;
      }
      return rpcResult.data;
    }

    case InternalMethod.Web3ClientVersion: {
      return await rpcClient.send(request.method, request.params as any[]);
    }

    case InternalMethod.BundlerClearState: {
      return await rpcClient.send(request.method, request.params as any[]);
    }

    case InternalMethod.BundlerDumpMempool: {
      return await rpcClient.send(request.method, request.params as any[]);
    }

    case InternalMethod.BundlerSendBundleNow: {
      return await rpcClient.send(request.method, request.params as any[]);
    }

    case InternalMethod.BundlerSetBundlingMode: {
      return await rpcClient.send(request.method, request.params as any[]);
    }

    case InternalMethod.BundlerSetReputation: {
      return await rpcClient.send(request.method, request.params as any[]);
    }

    case InternalMethod.BundlerDumpReputation: {
      return await rpcClient.send(request.method, request.params as any[]);
    }
    default:
      throw new MethodNotSupportedError(request.method);
  }
};

/**
 * Handle keyring requests.
 *
 * @param args - Request arguments.
 * @param args.request - Request to execute.
 * @param args.origin - Caller origin.
 * @returns The execution result.
 */
export const onKeyringRequest: OnKeyringRequestHandler = async ({
  origin,
  request,
}) => {
  console.log(
    `SNAPS/Keyring request (origin="${origin}"):`,
    JSON.stringify(request, undefined, 2),
  );

  // Check if origin is allowed to call method.
  if (!hasPermission(origin, request.method)) {
    throw new Error(
      `Origin '${origin}' is not allowed to call '${request.method}'`,
    );
  }

  // Handle keyring methods.
  await intitKeyRing();
  return await handleKeyringRequest(keyring, request);
};
