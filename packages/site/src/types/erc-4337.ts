import type { BigNumber, BigNumberish, BytesLike, ethers } from 'ethers';

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

export type SmartContractAccount = {
  initCode: string;
  address: string;
  owner: {
    address: string;
    balance: string;
  }
  balance: string;
  nonce: BigNumber;
  index: BigNumber;
  entryPoint: string;
  factoryAddress: string;
  deposit: string;
  connected: boolean;
};

export enum AccountActivityType {
  SmartContract = 'SmartContract',
  EOA = 'EOA',
}

export type AccountActivity = {
  type: AccountActivityType;
  userOpHash: string;
  userOperationReceipt: UserOperationReceipt | null;
  txHash?: string;
};

export type UserOperationReceipt = {
  // / the request hash
  userOpHash: string;
  // / the account sending this UserOperation
  sender: string;
  // / account nonce
  nonce: BigNumberish;
  // / the paymaster used for this userOp (or empty)
  paymaster?: string;
  // / actual payment for this UserOperation (by either paymaster or account)
  actualGasCost: BigNumberish;
  // / total gas used by this UserOperation (including preVerification, creation, validation and execution)
  actualGasUsed: BigNumberish;
  // / did this execution completed without revert
  success: boolean;
  // / in case of revert, this is the revert reason
  reason?: string;
  // / the logs generated by this UserOperation (not including logs of other UserOperations in the same bundle)
  logs: any[];

  // the transaction receipt for this transaction (of entire bundle, not only this UserOperation)
  receipt: ethers.providers.TransactionReceipt;
};

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

export const DefaultGasOverheads: GasOverheads = {
  fixed: 21000,
  perUserOp: 18300,
  perUserOpWord: 4,
  zeroByte: 4,
  nonZeroByte: 16,
  bundleSize: 1,
  sigSize: 65,
};

export type GasOverheads = {
  /**
   * fixed overhead for entire handleOp bundle.
   */
  fixed: number;

  /**
   * per userOp overhead, added on top of the above fixed per-bundle.
   */
  perUserOp: number;

  /**
   * overhead for userOp word (32 bytes) block
   */
  perUserOpWord: number;

  // perCallDataWord: number

  /**
   * zero byte cost, for calldata gas cost calculations
   */
  zeroByte: number;

  /**
   * non-zero byte cost, for calldata gas cost calculations
   */
  nonZeroByte: number;

  /**
   * expected bundle size, to split per-bundle overhead between all ops.
   */
  bundleSize: number;

  /**
   * expected length of the userOp signature.
   */
  sigSize: number;
};
