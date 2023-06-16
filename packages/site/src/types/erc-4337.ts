import type { BigNumberish, BytesLike } from 'ethers';
import { UserOperationStruct } from '@account-abstraction/contracts'

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

export type EOA = {
  address: string;
  balance: string;
  connected: boolean;
};

export type SmartContractAccount = {
  address: string;
  ownerAddress: string;
  balance: string;
  nonce: string;
  index: string;
  entryPoint: string;
  factoryAddress: string
  depoist: string;
  connected: boolean;
  bundlerUrl: string;
};

export type UserOpToSign = {
  userOpHash: string;
  userOp: UserOperationStruct;
}