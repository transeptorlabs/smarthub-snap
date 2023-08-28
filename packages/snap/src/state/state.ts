import { KeyringState } from '../keyring';
import { DEFAULT_BUNDLER_URLS, DEFAULT_STATE } from './state.contants';

export const getState = async (
  keyringAccountId?: string,
): Promise<{
  keyringState: KeyringState;
  bundlerUrls: { [chainId: string]: string };
  smartAccountActivity: {
    [keyringAccountId: string]: {
      scAccount: {
        [chainId: string]: {
          userOpHashes: string[];
          txHashes: string[];
        };
      };
    };
  };
}> => {
  let state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as {
    keyringState: KeyringState;
    bundlerUrls: { [chainId: string]: string };
    smartAccountActivity: {
      [keyringAccountId: string]: {
        scAccount: {
          [chainId: string]: {
            userOpHashes: string[];
            txHashes: string[];
          };
        };
      };
    };
  } | null;

  if (state === null) {
    // initialize state if empty and set default data
    state = DEFAULT_STATE;
  }

  // if keyringAccountId does not exist, initialize it
  if (keyringAccountId !== undefined) {
    if (
      state.smartAccountActivity[keyringAccountId] === undefined ||
      state.smartAccountActivity[keyringAccountId] === null
    ) {
      state.smartAccountActivity[keyringAccountId] = {
        scAccount: {
          '0x539': {
            userOpHashes: [],
            txHashes: [],
          },
          '0x1': {
            userOpHashes: [],
            txHashes: [],
          },
          '0x5': {
            userOpHashes: [],
            txHashes: [],
          },
          '0x89': {
            userOpHashes: [],
            txHashes: [],
          },
          '0x13881': {
            userOpHashes: [],
            txHashes: [],
          },
        },
      };
    }
  }

  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });

  return state;
};

export const getUserOpHashes = async (
  keyringAccountId: string,
  chainId: string,
): Promise<string[]> => {
  const state = await getState(keyringAccountId);
  return state.smartAccountActivity[keyringAccountId].scAccount[chainId].userOpHashes;
};

export const storeUserOpHash = async (
  keyringAccountId: string,
  chainId: string,
  userOpHash: string,
): Promise<boolean> => {
  const state = await getState(keyringAccountId);

  state.smartAccountActivity[keyringAccountId].scAccount[
    chainId
  ].userOpHashes.push(userOpHash);

  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });
  return true;
};

export const getBundlerUrls = async (): Promise<{
  [chainId: string]: string;
}> => {
  const state = await getState();
  // Creating a copy ensures that the original array remains intact, isolating the changes to the copied array and preventing unintended side effects.
  return Object.assign({}, state.bundlerUrls);
};

export const storeBundlerUrl = async (
  chainId: string,
  url: string,
): Promise<boolean> => {
  const state = await getState();
  state.bundlerUrls[chainId] = url;

  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });
  return true;
};

export const getTxHashes = async (
  keyringAccountId: string,
  chainId: string,
): Promise<string[]> => {
  const state = await getState(keyringAccountId);
  return state.smartAccountActivity[keyringAccountId].scAccount[chainId].txHashes;
};

export const storeTxHash = async (
  keyringAccountId: string,
  txHash: string,
  keyringRequestId: string,
  chainId: string,
): Promise<boolean> => {
  const state = await getState(keyringAccountId);

  delete state.keyringState.signedTx[keyringRequestId];
  state.smartAccountActivity[keyringAccountId].scAccount[
    chainId
  ].txHashes.push(txHash);

  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });
  return true;
};

export const storeKeyRing = async (keyring: KeyringState): Promise<boolean> => {
  const state = await getState();
  state.keyringState = keyring;

  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });
  return true;
};

export const getKeyRing = async (): Promise<KeyringState> => {
  const state = await getState();
  return Object.assign({}, state.keyringState);
};

export const clearActivityData = async (): Promise<boolean> => {
  const state = await getState();
  state.bundlerUrls = DEFAULT_BUNDLER_URLS;
  state.smartAccountActivity = {};

  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });
  return true;
};
