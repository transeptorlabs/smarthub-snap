import type { BigNumberish, BytesLike } from 'ethers';

export type UserOperation = {
  sender: string;
  nonce: BigNumberish;
  initCode: BytesLike;
  callData: BytesLike;
  callGasLimit: BigNumberish;
  verificationGasLimit: BigNumberish;
  preVerificationGas: BigNumberish;
  maxFeePerGas: BigNumberish;
  maxPriorityFeePerGas: BigNumberish;
  paymasterAndData: BytesLike;
  signature: BytesLike;
};

export type ReputationEntry = {
  address: string;
  opsSeen: number;
  opsIncluded: number;
  status?: ReputationStatus;
};

export enum ReputationStatus {
  OK,
  THROTTLED,
  BANNED,
}

export type Account = {
  address: string;
  balance: string;
};

export type SmartContractAccount = {
  address: string;
  balance: string;
  nonce: string;
  index: string;
  entryPoint: string;
  depoist: string;
};
