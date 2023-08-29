import { EntryPoint__factory } from '@account-abstraction/contracts';
import { ethers } from 'ethers';
import { getMMProvider } from './metamask';
import { DefaultGasOverheads, GasOverheads, UserOperation, UserOperationReceipt } from '../types';
import { getUserOperationReceipt } from './snap';
import { arrayify, defaultAbiCoder, keccak256 } from 'ethers/lib/utils';

export const getDummySignature = async (
  userOp: UserOperation,
  entryPointAddress: string,
): Promise<string> => {
  const provider = new ethers.providers.Web3Provider(getMMProvider() as any);
  const entryPointContract = new ethers.Contract(
    entryPointAddress,
    EntryPoint__factory.abi,
    provider,
  );
  const randomWallet = ethers.Wallet.createRandom();
  const dummySignature = randomWallet.signMessage(
    await entryPointContract.getUserOpHash(userOp),
  );
  return dummySignature;
};

export const getUserOperationReceipts = async (userOpHashes: string[]): Promise<UserOperationReceipt[]> => {

  const userOperationReceipts: UserOperationReceipt[] = [];
  userOpHashes.forEach(async (userOpHash: string) => {
    const receipt = await getUserOperationReceipt(userOpHash);
    if (receipt !== null) {
      userOperationReceipts.push(receipt);
    }
  });

  if (userOperationReceipts.length === 0) {
    return [];
  }

  return userOperationReceipts
};

export function calcPreVerificationGas (userOp: UserOperation, overheads?: Partial<GasOverheads>): number {
  const ov = { ...DefaultGasOverheads, ...(overheads ?? {}) }

  const packed = arrayify(packUserOp(userOp, false))
  const lengthInWord = (packed.length + 31) / 32
  const callDataCost = packed.map(x => x === 0 ? ov.zeroByte : ov.nonZeroByte).reduce((sum, x) => sum + x)
  const ret = Math.round(
    callDataCost +
    ov.fixed / ov.bundleSize +
    ov.perUserOp +
    ov.perUserOpWord * lengthInWord
  )
  return ret
}

export function packUserOp (op: UserOperation, forSignature = true): string {
  if (forSignature) {
    return defaultAbiCoder.encode(
      ['address', 'uint256', 'bytes32', 'bytes32',
        'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
        'bytes32'],
      [op.sender, op.nonce, keccak256(op.initCode), keccak256(op.callData),
        op.callGasLimit, op.verificationGasLimit, op.preVerificationGas, op.maxFeePerGas, op.maxPriorityFeePerGas,
        keccak256(op.paymasterAndData)])
  } else {
    // for the purpose of calculating gas cost encode also signature (and no keccak of bytes)
    return defaultAbiCoder.encode(
      ['address', 'uint256', 'bytes', 'bytes',
        'uint256', 'uint256', 'uint256', 'uint256', 'uint256',
        'bytes', 'bytes'],
      [op.sender, op.nonce, op.initCode, op.callData,
        op.callGasLimit, op.verificationGasLimit, op.preVerificationGas, op.maxFeePerGas, op.maxPriorityFeePerGas,
        op.paymasterAndData, op.signature])
  }
}

