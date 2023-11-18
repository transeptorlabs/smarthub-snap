import snapPackageInfo from '../../../snap/package.json';
import { BigNumber } from 'ethers';
import { defaultSnapOrigin } from '../config';
import {
  GetSnapsResponse,
  Snap,
  ReputationEntry,
  SmartContractAccount,
  BundlerUrls,
  UserOperation,
  UserOperationReceipt,
  SignedTxs,
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
  params: Record<'version' | string, unknown> = {
    version: snapPackageInfo.version,
  },
) => {
  console.log('snap info:', snapId, params);
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

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');

// ERC-4337 account management *****************************************************
export const notify = async (
  heading: string,
  message: string,
  copyable: string,
) => {
  await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'notify',
        params: [
          {
            heading,
            message,
            copyable,
          },
        ],
      },
    },
  });
};

export const getNextRequestId = async (): Promise<number> => {
  return (await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'get_next_request_id',
        params: [],
      },
    },
  })) as number;
};

export const getScAccount = async (
  keyringAccountId: string,
): Promise<SmartContractAccount> => {
  const result = await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'sc_account', params: [{ keyringAccountId }] },
    },
  });

  const parsedResult = JSON.parse(result as string);
  return {
    initCode: parsedResult.initCode,
    address: parsedResult.address,
    balance: BigNumber.from(parsedResult.balance).toString(),
    entryPoint: parsedResult.entryPoint,
    factoryAddress: parsedResult.factoryAddress,
    nonce: BigNumber.from(parsedResult.nonce),
    index: BigNumber.from(parsedResult.index),
    deposit: BigNumber.from(parsedResult.deposit).toString(),
    connected: true,
    ownerAddress: parsedResult.ownerAddress,
    owner: {
      address: parsedResult.owner.address,
      balance: BigNumber.from(parsedResult.owner.balance).toString(),
    },
  } as SmartContractAccount;
};

// TODO: remove this method
export const getSignedTxs = async (): Promise<SignedTxs> => {
  const result = (await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'get_signed_txs', params: [] },
    },
  })) as string;
  const parsedResult = JSON.parse(result as string);
  return parsedResult as SignedTxs;
};

// TODO: Update this method
export const storeTxHash = async (
  keyringAccountId: string,
  txHash: string,
  keyringRequestId: string,
  chainId: string,
): Promise<boolean> => {
  return (await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'store_tx_hash',
        params: [
          {
            keyringAccountId,
            txHash,
            keyringRequestId,
            chainId,
          },
        ],
      },
    },
  })) as boolean;
};

// TODO: Update this method
export const getTxHashes = async (
  keyringAccountId: string,
  chainId: string,
): Promise<string[]> => {
  return (await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'get_tx_hashes',
        params: [
          {
            keyringAccountId,
            chainId,
          },
        ],
      },
    },
  })) as string[];
};

export const fetchUserOpHashes = async (
  keyringAccountId: string,
): Promise<string[]> => {
  return (await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'get_user_ops_hashes',
        params: [
          {
            keyringAccountId,
          },
        ],
      },
    },
  })) as string[];
};

export const getUserOperationReceipt = async (
  userOpHash: string,
): Promise<UserOperationReceipt> => {
  const result = (await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'eth_getUserOperationReceipt',
        params: [{ userOpHash }],
      },
    },
  })) as string;
  const parsedResult = JSON.parse(result as string);
  return parsedResult as UserOperationReceipt;
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

export const bundlerUrls = async (): Promise<BundlerUrls> => {
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

// Build UserOp *****************************************************
export const getUserOpCallData = async (
  keyringAccountId: string,
  to: string,
  value: BigNumber,
  data: string,
): Promise<string> => {
  return (await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'get_user_op_call_data',
        params: [
          {
            keyringAccountId,
            to,
            value,
            data,
          },
        ],
      },
    },
  })) as string;
};

export const estimatCreationGas = async (
  keyringAccountId: string,
): Promise<BigNumber> => {
  const result = await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'estimate_creation_gas',
        params: [
          {
            keyringAccountId,
          },
        ],
      },
    },
  });
  const parsedResult = JSON.parse(result as string);
  return BigNumber.from(parsedResult) as BigNumber;
};

// ERC-4337 wrappers ******************************************************
export const sendSupportedEntryPoints = async (): Promise<string[]> => {
  // TODO: Add account activity
  // return (await getMMProvider().request({
  //   method: 'wallet_invokeSnap',
  //   params: {
  //     snapId: defaultSnapOrigin,
  //     request: { method: 'eth_supportedEntryPoints', params: [] },
  //   },
  // })) as string[];
  return ['0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'];
};

export const estimateUserOperationGas = async (
  userOp: UserOperation,
): Promise<{
  preVerificationGas: BigNumber;
  verificationGas: BigNumber;
  validAfter: BigNumber;
  validUntil: BigNumber;
  callGasLimit: BigNumber;
}> => {
  const result = await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: { method: 'eth_estimateUserOperationGas', params: [{ userOp }] },
    },
  });

  const parsedResult = JSON.parse(result as string);
  return {
    preVerificationGas: BigNumber.from(parsedResult.preVerificationGas),
    verificationGas: BigNumber.from(parsedResult.verificationGas),
    validAfter: BigNumber.from(parsedResult.validAfter),
    validUntil: BigNumber.from(parsedResult.validUntil),
    callGasLimit: BigNumber.from(parsedResult.callGasLimit),
  };
};

export const getUserOperationByHash = async (
  userOpHash: string,
): Promise<UserOperation> => {
  const result = await getMMProvider().request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: defaultSnapOrigin,
      request: {
        method: 'eth_getUserOperationByHash',
        params: [
          {
            userOpHash,
          },
        ],
      },
    },
  });

  const parsedResult = JSON.parse(result as string);
  return parsedResult as UserOperation;
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

export const sendDebugBundlerSetReputation = async (
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
