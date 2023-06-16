import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { getSimpleScAccount } from './wallet';
import { HttpRpcClient, getBalance, getDeposit } from './client';
import { SimpleAccountAPI } from '@account-abstraction/sdk';
import { UserOperationStruct } from '@account-abstraction/contracts';
import { heading, panel, text } from '@metamask/snaps-ui';
import { deepHexlify } from '@account-abstraction/utils'
import { resolveProperties } from 'ethers/lib/utils';

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
export const onRpcRequest: OnRpcRequestHandler = async ({
  origin,
  request,
}) => {
  const chainId = await ethereum.request({ method: 'eth_chainId' });
  const rpcClient = new HttpRpcClient(parseInt(chainId as string, 16));
  let result;
  let scAccount: SimpleAccountAPI;
  let scOwnerAddress: string;
  let scAddress: string;
  let target: string;
  let data: string;
  let index: number;
  let userOp: UserOperationStruct;
  let hexifiedUserOp: UserOperationStruct;
  let jsonRequestData: [UserOperationStruct, string];

  if (!request.params) {
    request.params = [];
  }

  // handle methods
  switch (request.method) {
    case 'eth_sendUserOperation':
      target = (request.params as any[])[0];
      data = (request.params as any[])[1];
      index = (request.params as any[])[2];
      scAccount = await getSimpleScAccount(
        rpcClient.getEntryPointAddr(),
        rpcClient.getAccountFactoryAddr(),
        index,
      );

      if (
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: panel([
              heading(
                `(${origin}) - Do you want to send a User operation?`,
              ),
              text(`Target: ${target}`),
              text(`ChainId: ${parseInt(chainId as string, 16)}`),
              text(`Entry point contract: ${rpcClient.getEntryPointAddr()}`),
              text(`Smart contract account: ${await scAccount.getAccountAddress()}`),
            ]),
          },
          })
        ) {

        // create user operation and send it
        userOp = await scAccount.createSignedUserOp({target, data});
        hexifiedUserOp = deepHexlify(await resolveProperties(userOp));
        jsonRequestData = [hexifiedUserOp, rpcClient.getEntryPointAddr()];
        
        return await rpcClient.send(request.method, jsonRequestData);
      } else {
        throw new Error('User cancelled the operation')
      }
    case 'sc_account':
      scOwnerAddress = (request.params as any[])[0];
      scAccount = await getSimpleScAccount(
        rpcClient.getEntryPointAddr(),
        rpcClient.getAccountFactoryAddr(),
      );
      scAddress = await scAccount.getCounterFactualAddress();

      result = JSON.stringify({
        address: scAddress,
        balance: await getBalance(scAddress),
        nonce: await scAccount.getNonce(),
        index: scAccount.index,
        entryPoint: rpcClient.getEntryPointAddr(),
        factoryAddress: rpcClient.getAccountFactoryAddr(),
        deposit: await getDeposit(scAddress, rpcClient.getEntryPointAddr()),
        ownerAddress: await scAccount.owner.getAddress(),
        bundlerUrl: rpcClient.getBundlerUrl()
      });
      return result
    case 'eth_chainId':
      return await rpcClient.send(request.method, request.params as any[]);
    case 'eth_supportedEntryPoints':
      return await rpcClient.send(request.method, request.params as any[]);
    case 'eth_estimateUserOperationGas':
      return await rpcClient.send(request.method, request.params as any[]);
    case 'eth_getUserOperationReceipt':
      return await rpcClient.send(request.method, request.params as any[]);
    case 'eth_getUserOperationByHash':
      return await rpcClient.send(request.method, request.params as any[]);
    case 'web3_clientVersion':
      return await rpcClient.send(request.method, request.params as any[]);
    case 'debug_bundler_clearState':
      return await rpcClient.send(request.method, request.params as any[]);
    case 'debug_bundler_dumpMempool':
      return await rpcClient.send(request.method, request.params as any[]);
    case 'debug_bundler_sendBundleNow':
      return await rpcClient.send(request.method, request.params as any[]);
    case 'debug_bundler_setBundlingMode':
      return await rpcClient.send(request.method, request.params as any[]);
    case 'debug_bundler_setReputation':
      return await rpcClient.send(request.method, request.params as any[]);
    case 'debug_bundler_dumpReputation':
      return await rpcClient.send(request.method, request.params as any[]);
    default:
      throw new Error('Method not found.');
  }
};
