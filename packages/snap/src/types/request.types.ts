import { UserOperationStruct } from '@account-abstraction/contracts';
import { BigNumber } from 'ethers';

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
  userOp: UserOperationStruct;
};
