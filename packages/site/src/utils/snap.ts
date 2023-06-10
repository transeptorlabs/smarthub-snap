import { BigNumber } from 'ethers';
import { defaultSnapOrigin } from '../config';
import { GetSnapsResponse, Snap } from '../types';
import { Account, ReputationEntry, SmartContractAccount, UserOperation } from '../types/erc-4337';

/**
 * Get the installed snaps in MetaMask.
 *
 * @returns The snaps installed in MetaMask.
 */
export const getSnaps = async (): Promise<GetSnapsResponse> => {
  return (await window.ethereum.request({
    method: 'wallet_getSnaps',
  })) as unknown as GetSnapsResponse;
};

/**
 * Connect a snap to MetaMask.
 *
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export const connectSnap = async (
  snapId: string = defaultSnapOrigin,
  params: Record<'version' | string, unknown> = {},
) => {
  await window.ethereum.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: params,
    },
  });
};

/**
 * Get the snap from MetaMask.
 *
 * @param version - The version of the snap to install (optional).
 * @returns The snap object returned by the extension.
 */
export const getSnap = async (version?: string): Promise<Snap | undefined> => {
  try {
    const snaps = await getSnaps();

    return Object.values(snaps).find(
      (snap) =>
        snap.id === defaultSnapOrigin && (!version || snap.version === version),
    );
  } catch (e) {
    console.log('Failed to obtain installed snap', e);
    return undefined;
  }
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');

/**
 * Invoke the "hello" method from the example snap.
 */
export const sendHello = async () => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: { snapId: defaultSnapOrigin, request: { method: 'hello' } },
  });
};


// ERC-4337 account management
export const sendScAccountOwner = async (): Promise<Account> => {
  const result = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'sc_account_owner' },
    },
  });

  const parsedResult = JSON.parse(result as string) 
  return {
    address: parsedResult.address,
    balance: BigNumber.from(parsedResult.balance).toString(),
  } as Account;
};

export const sendScAccount = async (): Promise<SmartContractAccount> => {
  const result = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: { snapId: defaultSnapOrigin, request: { method: 'sc_account' } },
  });

  const parsedResult = JSON.parse(result as string) 
  return {
    address: parsedResult.address,
    balance: BigNumber.from(parsedResult.balance).toString(),
    nonce: BigNumber.from(parsedResult.nonce).toString(),
    index: BigNumber.from(parsedResult.index).toString(),
  } as SmartContractAccount;
};

export const sendDepoist = async (amount: BigNumber, receiverAddr: string) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: { snapId: defaultSnapOrigin, request: { method: 'deposit', params: [amount.toString(), receiverAddr] } },
  });
};

// ERC-4337 wrappers
export const sendSupportedEntryPoints = async (): Promise<string[]> => {
  return (await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'eth_supportedEntryPoints', params: [] },
    },
  })) as string[];
};

export const sendUserOperation = async (
  userOp: UserOperation,
  supportedEntryPoints: string,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'eth_sendUserOperation',
        params: [userOp, supportedEntryPoints],
      },
    },
  });
};

export const sendEstimateUserOperationGas = async () => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'eth_estimateUserOperationGas' },
    },
  });
};

export const sendGetUserOperationReceipt = async (userOpHash: string) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'eth_getUserOperationReceipt', params: [userOpHash] },
    },
  });
};

export const sendClientVersion = async () => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'web3_clientVersion' },
    },
  });
};

export const sendDebugBundlerClearState = async () => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'debug_bundler_clearState' },
    },
  });
};

export const sendDebugBundlerDumpMempool = async () => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'debug_bundler_dumpMempool' },
    },
  });
};

export const sendDebugBundlerSendBundleNow = async () => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'debug_bundler_sendBundleNow' },
    },
  });
};

export const sendDebugBundlerSetBundlingMode = async (
  mode: 'auto' | 'manual',
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'debug_bundler_setBundlingMode', params: [mode] },
    },
  });
};

export const sednDebugBundlerSetReputation = async (
  reputations: ReputationEntry[],
  supportedEntryPoints: string,
) => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'debug_bundler_setReputation',
        params: [reputations, supportedEntryPoints],
      },
    },
  });
};

export const sendDebugBundlerDumpReputation = async () => {
  return await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'debug_bundler_dumpReputation' },
    },
  });
};
