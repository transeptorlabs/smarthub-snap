import { OnRpcRequestHandler, OnCronjobHandler } from '@metamask/snaps-types';
import { SimpleAccountAPI } from '@account-abstraction/sdk';
import { UserOperationStruct } from '@account-abstraction/contracts';
import { copyable, heading, panel, text } from '@metamask/snaps-ui';
import { deepHexlify } from '@account-abstraction/utils';
import { resolveProperties } from 'ethers/lib/utils';
import { BigNumber } from 'ethers';
import { HttpRpcClient, getBalance, getDeposit } from './client';
import { findAccountIndex, getSimpleScAccount } from './wallet';
import {
  clearState,
  getBundlerUrls,
  getUserOpHashsConfirmed,
  getAllUserOpHashsPending,
  getUserOpHashsPending,
  storeBundlerUrl,
  storeUserOpHashConfirmed,
  storeUserOpHashPending,
  getKeyRing,
} from './state';
import {
  GetUserOpParams,
  SendUserOpParams,
  SmartAccountActivityParams,
  SmartAccountParams,
  UserOperationReceipt,
} from './types';
import {
  MethodNotSupportedError,
  buildHandlersChain,
  handleKeyringRequest,
} from '@metamask/keyring-api';
import { InternalMethod, KeyringState, PERMISSIONS, SimpleKeyring } from './keyring';

let keyring: SimpleKeyring;

/**
 * Handle execution permissions.
 *
 * @param args - Request arguments.
 * @param args.origin - Caller origin.
 * @param args.request - Request to execute.
 * @returns Nothing, throws `MethodNotSupportedError` if the caller IS allowed
 * to call the method, throws an `Error` otherwise.
 */
const permissionsHandler: OnRpcRequestHandler = async ({
  origin,
  request,
}): Promise<never> => {
  const hasPermission = Boolean(PERMISSIONS.get(origin)?.includes(request.method));
  console.log('hasPermission:', hasPermission);
  if (!hasPermission) {
    throw new Error(`origin ${origin} cannot call method ${request.method}`);
  }
  throw new MethodNotSupportedError(request.method);
};

/**
 * Handle keyring requests.
 *
 * @param args - Request arguments.
 * @param args.request - Request to execute.
 * @returns The execution result.
 */
const keyringHandler: OnRpcRequestHandler = async ({ request }) => {
  if (!keyring) {
    const keyringState: KeyringState = await getKeyRing();
    console.log('keyringState:', keyringState, 'request:', request);
    if (!keyring) {
      keyring = new SimpleKeyring(keyringState);
    }
  }
  return await handleKeyringRequest(keyring, request);
};

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
const erc4337Handler: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  const [bundlerUrls, chainId] = await Promise.all([
    getBundlerUrls(),
    ethereum.request({ method: 'eth_chainId' }),
  ]);
  const rpcClient = new HttpRpcClient(bundlerUrls, chainId as string);
  let result;
  let scAccount: SimpleAccountAPI;
  let scOwnerAddress: string;
  let scAddress: string;
  let eoaIndex: number;
  let scIndex: number;

  if (!request.params) {
    request.params = [];
  }

  switch (request.method) {
    case InternalMethod.SmartAccount: {
      const params: SmartAccountParams = (
        request.params as any[]
      )[0] as SmartAccountParams;

      eoaIndex = await findAccountIndex(params.scOwnerAddress);
      scOwnerAddress = params.scOwnerAddress;
      scAccount = await getSimpleScAccount(
        rpcClient.getEntryPointAddr(),
        rpcClient.getAccountFactoryAddr(),
        eoaIndex,
      );
      scIndex = BigNumber.from(scAccount.index).toNumber();
      scAddress = await scAccount.getCounterFactualAddress();

      const [balance, nonce, deposit] = await Promise.all([
        await getBalance(scAddress),
        await scAccount.getNonce(),
        await getDeposit(scAddress, rpcClient.getEntryPointAddr()),
      ]);

      result = JSON.stringify({
        address: scAddress,
        balance,
        nonce,
        index: scAccount.index,
        entryPoint: rpcClient.getEntryPointAddr(),
        factoryAddress: rpcClient.getAccountFactoryAddr(),
        deposit,
        ownerAddress: scOwnerAddress,
      });

      return result;
    }

    case InternalMethod.ConfirmedUserOps: {
      const params: SmartAccountActivityParams = (
        request.params as any[]
      )[0] as SmartAccountActivityParams;

      eoaIndex = await findAccountIndex(params.scOwnerAddress);
      scIndex = params.scIndex;
      scAccount = await getSimpleScAccount(
        rpcClient.getEntryPointAddr(),
        rpcClient.getAccountFactoryAddr(),
        eoaIndex,
      );

      const userOpHashesConfirmed: string[] = await getUserOpHashsConfirmed(
        eoaIndex,
        scIndex,
        chainId as string,
      );
      result = userOpHashesConfirmed;
      return result;
    }

    case InternalMethod.PendingUserOps: {
      const params: SmartAccountActivityParams = (
        request.params as any[]
      )[0] as SmartAccountActivityParams;

      eoaIndex = await findAccountIndex(params.scOwnerAddress);
      scIndex = params.scIndex;
      scAccount = await getSimpleScAccount(
        rpcClient.getEntryPointAddr(),
        rpcClient.getAccountFactoryAddr(),
        eoaIndex,
      );

      const userOpHashesPending: string[] = await getUserOpHashsPending(
        eoaIndex,
        scIndex,
        chainId as string,
      );
      result = userOpHashesPending;
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
      result = await clearState();
      if (!result) {
        throw new Error('Failed to clear activity data');
      }
      return result;
    }

    case InternalMethod.ChainId: {
      return await rpcClient.send(request.method, request.params as any[]);
    }

    case InternalMethod.SendUserOperation: {
      const params: SendUserOpParams = (
        request.params as any[]
      )[0] as SendUserOpParams;
      const { target } = params;
      const { data } = params;
      eoaIndex = await findAccountIndex(params.scOwnerAddress);
      scAccount = await getSimpleScAccount(
        rpcClient.getEntryPointAddr(),
        rpcClient.getAccountFactoryAddr(),
        eoaIndex as unknown as number,
      );
      scIndex = BigNumber.from(scAccount.index).toNumber();

      if (
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: panel([
              heading(`(${origin}) - Do you want to send a User operation?`),
              text(`Target contract: ${target}`),
              text(`ChainId: ${parseInt(chainId as string, 16)}`),
              text(`Entry point contract: ${rpcClient.getEntryPointAddr()}`),
              text(
                `Smart contract account: ${await scAccount.getAccountAddress()}`,
              ),
            ]),
          },
        })
      ) {
        // create user operation and send it on success confirmation
        const userOp: UserOperationStruct = await scAccount.createSignedUserOp({
          target,
          data,
        });
        const hexifiedUserOp: UserOperationStruct = deepHexlify(
          await resolveProperties(userOp),
        );
        const rpcResult = await rpcClient.send(request.method, [
          hexifiedUserOp,
          rpcClient.getEntryPointAddr(),
        ]);

        if (rpcResult.sucess === true) {
          if (
            !(await storeUserOpHashPending(
              rpcResult.data as string,
              eoaIndex,
              scIndex,
              chainId as string,
            ))
          ) {
            throw new Error('Failed to store user operation hash');
          }
          return snap.request({
            method: 'snap_dialog',
            params: {
              type: 'alert',
              content: panel([
                heading('User Operation Sent'),
                text(
                  `Sent from Smart account: ${await scAccount.getAccountAddress()}`,
                ),
                text(`User operation hash: ${rpcResult.data}`),
                text(`Signed by owner(EOA): ${params.scOwnerAddress}`),
                text(`To contract: ${target}`),
              ]),
            },
          });
        }
        return snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: panel([
              heading('Failed to send User Operation'),
              text(
                `Sent from Smart account: ${await scAccount.getAccountAddress()}`,
              ),
              text(`Error Message: ${rpcResult.data}`),
            ]),
          },
        });
      }
      throw new Error('User cancelled the User Operation');
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
      return await rpcClient.send(request.method, request.params as any[]);
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
      throw new Error('Method not found.');
  }
};

export const onRpcRequest: OnRpcRequestHandler = buildHandlersChain(
  permissionsHandler,
  keyringHandler,
  erc4337Handler,
);

export const onCronjob: OnCronjobHandler = async ({ request }) => {
  const [bundlerUrls, chainId] = await Promise.all([
    getBundlerUrls(),
    ethereum.request({ method: 'eth_chainId' }),
  ]);

  try {
    let rpcClient: HttpRpcClient;
    let userOpHash: string;
    let allUserOpHashesPending: { [key: string]: string } = {};
    let userOperationReceipt: UserOperationReceipt;
    let firstkey: string;

    switch (request.method) {
      case 'checkUserOperationReceiptReady': {
        allUserOpHashesPending = await getAllUserOpHashsPending();
        if (Object.keys(allUserOpHashesPending).length === 0) {
          return null;
        }

        firstkey = Object.keys(allUserOpHashesPending)[0]; // key = eoaIndex-scIndex-chainId-userOpHash
        userOpHash = allUserOpHashesPending[firstkey];

        rpcClient = new HttpRpcClient(
          bundlerUrls,
          firstkey.split('-')[2] as string,
        );

        const rpcResult = await rpcClient.send('eth_getUserOperationReceipt', [
          userOpHash,
        ]);

        if (rpcResult.sucess === false) {
          return null;
        }

        if (rpcResult.data === null) {
          return null;
        }

        userOperationReceipt = rpcResult.data as UserOperationReceipt;
        await storeUserOpHashConfirmed(
          userOpHash,
          Number(firstkey.split('-')[0]),
          Number(firstkey.split('-')[1]),
          firstkey.split('-')[2],
        );

        return snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: panel([
              heading('User Operation Confirmed'),
              text(`Success: ${userOperationReceipt.success}`),
              text(`Revert: ${userOperationReceipt.reason}`),
              copyable(
                `TransactionHash: ${userOperationReceipt.receipt.transactionHash}`,
              ),
              text(`userOpHash: ${userOperationReceipt.userOpHash}`),
              text(`Sender: ${userOperationReceipt.sender}`),
              text(`Nonce: ${userOperationReceipt.nonce}`),
              text(`Paymaster: ${userOperationReceipt.paymaster}`),
              text(`Actual Gas Cost: ${userOperationReceipt.actualGasCost}`),
              text(`Actual Gas Used: ${userOperationReceipt.actualGasUsed}`),
            ]),
          },
        });
      }
      default:
        throw new Error('Method not found.');
    }
  } catch (error) {
    if (
      error.message ===
      `ChainId ${parseInt(chainId as string, 16)} not supported`
    ) {
      return null;
    }
    console.log('error from cronjob:', error);
    throw error;
  }
};
