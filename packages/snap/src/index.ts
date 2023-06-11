import { OnRpcRequestHandler } from '@metamask/snaps-types';
import { heading, panel, text } from '@metamask/snaps-ui';
import { BigNumber, Wallet } from 'ethers';
import { SimpleAccountAPI } from '@account-abstraction/sdk';
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
  let signer: Wallet;
  let scAddress: string;
  let ownerAddress: string;

  let recevierAddress: string;
  let estimateGasAmount: BigNumber;
  let gasPrice: BigNumber;
  let txFeeTotal: BigNumber;
  let encodedData = '';
  let value: BigNumber;
  let amount: BigNumber;

  if (!request.params) {
    request.params = [];
  }

  // handle methods
  switch (request.method) {
    case 'deposit':
      signer = await getWallet();
      value = BigNumber.from((request.params as any[])[0]);
      recevierAddress = (request.params as any[])[1];
      gasPrice = await getGasPrice();
      encodedData = await encodeFunctionData(
        rpcClient.getEntryPointContract(signer),
        'depositTo',
        [recevierAddress],
      );

      estimateGasAmount = await estimateGas(
        signer.address,
        rpcClient.getEntryPointAddr(),
        encodedData,
      );

      txFeeTotal = (await estimateGasCost(estimateGasAmount, gasPrice)).add(
        value,
      );

      if (
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: panel([
              heading(
                `(${origin}) Do you want to send a deposit to the entry point contract?`,
              ),
              text(`Amount: ${convertToEth(value.toString())} ETH`),
              text(`ChainId: ${parseInt(chainId as string, 16)}`),
              text(`Account to receive deposit: ${recevierAddress}`),
              text(`Entry point contract: ${rpcClient.getEntryPointAddr()}`),
              text(`Gas (estimated): ${estimateGasAmount.toString()} gas`),
              text(`Gas fee: ${convertToEth(gasPrice.toString())} ETH`),
              text(
                `Total (amount + (gas fee * estimated gas)): ${convertToEth(
                  txFeeTotal.toString(),
                )} ETH`,
              ),
            ]),
          },
        })
      ) {
        result = await depositToEntryPoint(
          signer,
          rpcClient.getEntryPointAddr(),
          value,
          encodedData,
          estimateGasAmount,
          gasPrice,
        );
      } else {
        result = '';
      }

      return result;

    case 'withdraw':
      // Note only the account that has the deposit can withdraw from the entry point contract
      signer = await getWallet();
      amount = BigNumber.from((request.params as any[])[0]);
      recevierAddress = (request.params as any[])[1];
      gasPrice = await getGasPrice();
      encodedData = await encodeFunctionData(
        rpcClient.getEntryPointContract(signer),
        'withdrawTo',
        [recevierAddress, amount],
      );

      estimateGasAmount = await estimateGas(
        signer.address,
        rpcClient.getEntryPointAddr(),
        encodedData,
      );
      txFeeTotal = await estimateGasCost(estimateGasAmount, gasPrice);

      if (
        await snap.request({
          method: 'snap_dialog',
          params: {
            type: 'confirmation',
            content: panel([
              heading(
                'Do you want to send withdraw deposit from entry point contract?',
              ),
              text(
                `Amount to withdraw: ${convertToEth(amount.toString())} ETH`,
              ),
              text(`ChainId: ${parseInt(chainId as string, 16)}`),
              text(`Account to receive withdraw: ${recevierAddress}`),
              text(`Entry point contract: ${rpcClient.getEntryPointAddr()}`),
              text(`Gas (estimated): ${estimateGasAmount.toString()} gas`),
              text(`Gas fee: ${convertToEth(gasPrice.toString())} ETH`),
              text(
                `Total (amount + (gas fee * estimated gas)): ${convertToEth(
                  txFeeTotal.toString(),
                )} ETH`,
              ),
            ]),
          },
        })
      ) {
        result = await withdrawFromEntryPoint(
          signer,
          rpcClient.getEntryPointAddr(),
          encodedData,
          estimateGasAmount,
          gasPrice,
        );
      } else {
        result = '';
      }
      return result;

    case 'sc_account':
      scAccount = await getAbstractAccount(
        rpcClient.getEntryPointAddr(),
        rpcClient.getAccountFactoryAddr(),
      );
      scAddress = await scAccount.getCounterFactualAddress();

      return JSON.stringify({
        address: scAddress,
        balance: await getBalance(scAddress),
        nonce: await scAccount.getNonce(),
        index: scAccount.index,
        entryPoint: rpcClient.getEntryPointAddr(),
        deposit: await getDeposit(scAddress, rpcClient.getEntryPointAddr()),
      });
    case 'sc_account_owner':
      ownerAddress = await getOwnerAddr();
      return JSON.stringify({
        address: ownerAddress,
        balance: await getBalance(ownerAddress),
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
