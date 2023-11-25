import { BigNumber } from 'ethers';
import { JsonTx } from '@ethereumjs/tx';
import { UserOperation } from './erc-4337.types';

export type NotifyParams = {
  heading: string;
  message: string;
  copyable: string;
};

export type SmartAccountParams = {
  keyringAccountId: string;
  chainId: string;
};

export type UserOpCallDataParams = {
  keyringAccountId: string;
  to: string;
  value: BigNumber;
  data: string;
};

export type GetUserOpParams = {
  userOpHash: string;
  chainId: string;
};

export type SendUserOpParams = {
  target: string;
  data: string;
  keyringAccountId: string;
  chainId: string;
};

export type SmartAccountActivityParams = {
  keyringAccountId: string;
  chainId: string;
};

export type EstimateCreationGasParams = {
  keyringAccountId: string;
};

export type EstimateUserOperationGas = {
  userOp: UserOperation;
};

export type SignEntryPointDepositTxParams = {
  keyringAccountId: string;
  type: 'eoa' | 'eip4337';
  tx: JsonTx;
};
