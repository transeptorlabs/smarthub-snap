import { BigNumber } from 'ethers';
import { defaultSnapOrigin } from '../config';
import {
  GetSnapsResponse,
  Snap,
  ReputationEntry,
  SmartContractAccount,
  UserOperationReceipt,
  BundlerUrls,
} from '../types';
import { getMMProvider } from './metamask';

// Snap management *****************************************************************
/**
 * Get the installed snaps in MetaMask.
 *
 * @returns The snaps installed in MetaMask.
 */
export const getSnaps = async (): Promise<GetSnapsResponse> => {
  return (await getMMProvider().request({
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
  await getMMProvider().request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: params,
    },
  });
};

/**
 * Get the ERC4337 relayer snap from MetaMask.
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

export const connectErc4337Relayer = async (): Promise<boolean> => {
  return (await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'connect_erc4337_relayer', params: [] },
    },
  })) as boolean;
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');

// ERC-4337 account management *****************************************************
export const getScAccount = async (
  ownerEoa: string,
): Promise<SmartContractAccount> => {
  const result = await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'sc_account', params: [{scOwnerAddress: ownerEoa }] },
    },
  });

  const parsedResult = JSON.parse(result as string);
  return {
    address: parsedResult.address,
    balance: BigNumber.from(parsedResult.balance).toString(),
    entryPoint: parsedResult.entryPoint,
    factoryAddress: parsedResult.factoryAddress,
    nonce: BigNumber.from(parsedResult.nonce).toString(),
    index: BigNumber.from(parsedResult.index).toString(),
    deposit: BigNumber.from(parsedResult.deposit).toString(),
    connected: true,
    ownerAddress: parsedResult.ownerAddress,
  } as SmartContractAccount;
};

export const getConfirmedUserOperationReceipts = async (
  ownerEoa: string,
  scIndex: number,
): Promise<UserOperationReceipt[]> => {
  const result = await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'get_confirmed_userOperationReceipts',
        params: [
          {
            ownerEoa,
            scIndex,
          }],
      },
    },
  });

  const parsedResult = JSON.parse(result as string);
  console.log('getConfirmedUserOperationReceipts result', parsedResult);
  return [];
};

export const clearActivityData = async (): Promise<boolean> => {
  return (await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'clear_activity_data', params: [] },
    },
  })) as boolean;
};

export const addBundlerUrl = async (
  chainId: string,
  url: string,
): Promise<boolean> => {
  return (await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'add_bundler_url', params: [chainId, url] },
    },
  })) as boolean;
};

export const getBundlerUrls = async (): Promise<BundlerUrls> => {
  const result = (await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'get_bundler_urls', params: [] },
    },
  })) as string;
  const parsedResult = JSON.parse(result as string);
  return parsedResult as BundlerUrls;
};

// ERC-4337 wrappers ******************************************************
export const sendSupportedEntryPoints = async (): Promise<string[]> => {
  return (await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'eth_supportedEntryPoints', params: [] },
    },
  })) as string[];
};

export const sendUserOperation = async (
  target: string,
  data: string,
  scOwnerAddress: string,
) => {
  return await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'eth_sendUserOperation',
        params: [
          {
            target,
            data,
            scOwnerAddress,
          }
        ],
      },
    },
  });
};

export const sendEstimateUserOperationGas = async () => {
  return await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'eth_estimateUserOperationGas' },
    },
  });
};

export const sendGetUserOperationReceipt = async (userOpHash: string) => {
  return await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'eth_getUserOperationReceipt', params: [userOpHash] },
    },
  });
};

export const sendClientVersion = async () => {
  return await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'web3_clientVersion' },
    },
  });
};

export const sendDebugBundlerClearState = async () => {
  return await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'debug_bundler_clearState' },
    },
  });
};

export const sendDebugBundlerDumpMempool = async () => {
  return await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'debug_bundler_dumpMempool' },
    },
  });
};

export const sendDebugBundlerSendBundleNow = async () => {
  return await getMMProvider().request({
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
  return await getMMProvider().request({
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
  return await getMMProvider().request({
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
  return await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'debug_bundler_dumpReputation' },
    },
  });
};
