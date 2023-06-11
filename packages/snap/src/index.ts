// ethers example snap: https://github.com/MetaMask/snaps/tree/main/packages/examples/examples/ethers-js
import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { heading, panel, text } from '@metamask/snaps-ui';
import { depositToEntryPoint, estimateDepositToEntryPoint, getAbstractAccount, getOwnerAddr } from './wallet';
import { HttpRpcClient, getBalance, getDeposit } from './client';
import { convertToEth } from './utils';
import { BigNumber } from 'ethers';

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
  let scAccount;
  let address;
  let gasFee: BigNumber;
  let totalAmount: BigNumber;

  if (!request.params) {
    request.params = []
  }

  switch (request.method) {
    case 'deposit':
      gasFee = await estimateDepositToEntryPoint(rpcClient.getEntryPointAddr(), (request.params as any[])[0], (request.params as any[])[1]);
      totalAmount = gasFee.add(BigNumber.from((request.params as any[])[0]))
      
      if (await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Do you want to send a depoist to the entry point contract?'),
            text(`Amount: ${convertToEth((request.params as any[])[0])} ETH`),
            text(`Account to receive depoist: ${(request.params as any[])[1]}`),
            text(`Entry point: ${rpcClient.getEntryPointAddr()}`),
            text(`Gas(estimated): ${convertToEth(gasFee.toString())} ETH`),
            text(`Total (amount + gas fee): ${convertToEth(totalAmount.toString())} ETH`)
          ]),
        },
      })){
        return await depositToEntryPoint(rpcClient.getEntryPointAddr(), (request.params as any[])[0], (request.params as any[])[1])
      } else {
        return ''
      }
      
    case 'hello':
      scAccount = await getAbstractAccount(
        rpcClient.getEntryPointAddr(),
        rpcClient.getAccountFactoryAddr()
      )
      address = await scAccount.getCounterFactualAddress()

      result = await snap.request({
        method: 'snap_dialog',
        params: {
          type: 'confirmation',
          content: panel([
            heading('Do you want to send this User Operation'),
            text(`address: ${address}`),
            text(`balance: ${await getBalance(address)}`),
            text(`params: ${request.params}`)
          ]),
        },
      });
      return result;
    case 'sc_account':
      scAccount = await getAbstractAccount(
        rpcClient.getEntryPointAddr(),
        rpcClient.getAccountFactoryAddr()
      )
      address = await scAccount.getCounterFactualAddress()

      return JSON.stringify(
        {
          address,
          balance: await getBalance(address),
          nonce: await scAccount.getNonce(),
          index: scAccount.index,
          entryPoint: rpcClient.getEntryPointAddr(),
          deposit: await getDeposit(address, rpcClient.getEntryPointAddr())
        }
      )
    case 'sc_account_owner':
      address = await getOwnerAddr()
      return JSON.stringify(
        {
          address,
          balance: await getBalance(address),
        }
      )
    case 'eth_chainId':
      return await rpcClient.send(request.method, request.params as any[]);
    case 'eth_supportedEntryPoints':
      return await rpcClient.send(request.method, request.params as any[]);
    case 'eth_sendUserOperation':
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
