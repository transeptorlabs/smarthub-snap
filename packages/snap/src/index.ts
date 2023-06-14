import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { heading, panel, text } from '@metamask/snaps-ui';
import { BigNumber, Wallet, ethers } from 'ethers';
import {
  depositToEntryPoint,
  encodeFunctionData,
  estimateGas,
  estimateGasCost,
  getAbstractAccount,
  getOwnerAddr,
  getWallet,
  withdrawFromEntryPoint,
} from './wallet';
import { HttpRpcClient, getBalance, getDeposit, getGasPrice } from './client';
import { convertToEth } from './utils';
import { UserOperationStruct } from '@account-abstraction/contracts';
import { SimpleAccountAPI } from './erc4337';

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

  let recevierAddress: string;
  let estimateGasAmount: BigNumber;
  let gasPrice: BigNumber;
  let txFeeTotal: BigNumber;
  let encodedData = '';
  let value: BigNumber;
  let amount: BigNumber;
  let userOp: UserOperationStruct

  if (!request.params) {
    request.params = [];
  }

  // handle methods
  switch (request.method) {
    // case 'deposit':
    //   signer = (request.params as any[])[0];
    //   value = BigNumber.from((request.params as any[])[0]);
    //   recevierAddress = (request.params as any[])[1];
    //   gasPrice = await getGasPrice();
    //   encodedData = await encodeFunctionData(
    //     rpcClient.getEntryPointContract(signer),
    //     'depositTo',
    //     [recevierAddress],
    //   );

    //   estimateGasAmount = await estimateGas(
    //     await signer.getAddress(),
    //     rpcClient.getEntryPointAddr(),
    //     encodedData,
    //   );

    //   txFeeTotal = (await estimateGasCost(estimateGasAmount, gasPrice)).add(
    //     value,
    //   );

    //   if (
    //     await snap.request({
    //       method: 'snap_dialog',
    //       params: {
    //         type: 'confirmation',
    //         content: panel([
    //           heading(
    //             `(${origin}) Do you want to send a deposit to the entry point contract?`,
    //           ),
    //           text(`Amount: ${convertToEth(value.toString())} ETH`),
    //           text(`ChainId: ${parseInt(chainId as string, 16)}`),
    //           text(`Account to receive deposit: ${recevierAddress}`),
    //           text(`Entry point contract: ${rpcClient.getEntryPointAddr()}`),
    //           text(`Gas (estimated): ${estimateGasAmount.toString()} gas`),
    //           text(`Gas fee: ${convertToEth(gasPrice.toString())} ETH`),
    //           text(
    //             `Total (amount + (gas fee * estimated gas)): ${convertToEth(
    //               txFeeTotal.toString(),
    //             )} ETH`,
    //           ),
    //         ]),
    //       },
    //     })
    //   ) {
    //     depositToEntryPoint(
    //       signer,
    //       rpcClient.getEntryPointAddr(),
    //       value,
    //       encodedData,
    //       estimateGasAmount,
    //       gasPrice,
    //     );
    //     return 'done'
    //   }
    //   return '';
    // case 'withdraw':
    //   // Note only the account that has the deposit can withdraw from the entry point contract
    //   signer = (request.params as any[])[0];
    //   scAccount = await getAbstractAccount(
    //     rpcClient.getEntryPointAddr(),
    //     rpcClient.getAccountFactoryAddr(),
    //     signer,
    //   );
    //   amount = BigNumber.from((request.params as any[])[0]);
    //   recevierAddress = (request.params as any[])[1];

    //   encodedData = await encodeFunctionData(
    //     rpcClient.getEntryPointContract(signer),
    //     'withdrawTo',
    //     [recevierAddress, amount],
    //   );

    //   userOp = {await scAccount.createUserOpToSign({
    //     target: rpcClient.getEntryPointAddr(),
    //     data: encodedData,
    //   })}

    //   if (
    //     await snap.request({
    //       method: 'snap_dialog',
    //       params: {
    //         type: 'confirmation',
    //         content: panel([
    //           heading(
    //             'Do you want to send withdraw deposit from entry point contract?',
    //           ),
    //           text(
    //             `Amount to withdraw: ${convertToEth(amount.toString())} ETH`,
    //           ),
    //           text(`ChainId: ${parseInt(chainId as string, 16)}`),
    //           text(`Account to receive withdraw: ${recevierAddress}`),
    //           text(`Entry point contract: ${rpcClient.getEntryPointAddr()}`),
    //           text(`call Gas Limit (estimated): ${userOp.callGasLimit.toString()} gas`),
    //           text(`verification Gas Limit (estimated): ${userOp.verificationGasLimit.toString()} gas`),
    //           text(`pre verification Gas (estimated): ${userOp.preVerificationGas.toString()} gas`),
    //           text(`max Fee Per Gas (estimated): ${convertToEth(userOp.maxPriorityFeePerGas.toString())} ETH`),
    //           text(`maxP riority Fee Per Gas(estimated): ${convertToEth(userOp.maxFeePerGas.toString())} ETH`),
    //         ]),
    //       },
    //     })
    //   ) {
    //     result = await rpcClient.send('eth_sendUserOperation', [userOp, rpcClient.getEntryPointAddr()]);
    //   } else {
    //     result = '';
    //   }
    //   return result;
    case 'sc_account':
      scOwnerAddress = (request.params as any[])[0];
      scAccount = await getAbstractAccount(
        rpcClient.getEntryPointAddr(),
        rpcClient.getAccountFactoryAddr(),
        scOwnerAddress,
      );
      scAddress = await scAccount.getCounterFactualAddress();

      return JSON.stringify({
        address: scAddress,
        balance: await getBalance(scAddress),
        nonce: await scAccount.getNonce(),
        index: scAccount.index,
        entryPoint: rpcClient.getEntryPointAddr(),
        factoryAddress: rpcClient.getAccountFactoryAddr(),
        deposit: await getDeposit(scAddress, rpcClient.getEntryPointAddr()),
      });
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
