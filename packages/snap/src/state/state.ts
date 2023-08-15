import { KeyringState } from '../keyring';
import { DEFAULT_STATE } from './state.contants';

export const getState = async (keyringAccountId?: string): Promise<{
  keyringState: KeyringState,
  bundlerUrls: { [chainId: string]: string };
  userOpHashesPending: { [key: string]: string }; // key = keyringAccountId-chainId-userOpHash
  smartAccountActivity: {
    [keyringAccountId: string]: {
      scAccount: {
        [chainId: string]: {
          userOpHashesConfirmed: string[];
        };
      };
    };
  }
}> => {
  let state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as {
    keyringState: KeyringState,
    bundlerUrls: { [chainId: string]: string };
    userOpHashesPending: { [key: string]: string };
    smartAccountActivity: {
      [keyringAccountId: string]: {
        scAccount: {
          [chainId: string]: {
            userOpHashesConfirmed: string[];
          };
        };
      };
    }
  } | null;

  if (state === null) {
    // initialize state if empty and set default data
    state = DEFAULT_STATE;
  }

  // if keyringAccountId does not exist, initialize it
  if (keyringAccountId !== undefined) {
  if (state.smartAccountActivity[keyringAccountId] === undefined || state.smartAccountActivity[keyringAccountId] === null) {
    state.smartAccountActivity[keyringAccountId] = {
      scAccount: {
        '0x539': {
          userOpHashesConfirmed: [],
        },
        '0x1': {
          userOpHashesConfirmed: [],
        },
        '0x5': {
          userOpHashesConfirmed: [],
        },
        '0x89': {
          userOpHashesConfirmed: [],
        },
        '0x13881': {
          userOpHashesConfirmed: [],
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

export const getUserOpHashsConfirmed = async (
  keyringAccountId: string,
  chainId: string,
): Promise<string[]> => {
  const state = await getState(keyringAccountId);

  // Creating a copy ensures that the original array remains intact, isolating the changes to the copied array and preventing unintended side effects.
  return Array.from(
    state.smartAccountActivity[keyringAccountId].scAccount[chainId].userOpHashesConfirmed,
  );
};

export const getAllUserOpHashsPending = async (): Promise<{
  [key: string]: string;
}> => {
  const state = await getState();
  // Creating a copy ensures that the original array remains intact, isolating the changes to the copied array and preventing unintended side effects.
  return Object.assign({}, state.userOpHashesPending);
};

export const getUserOpHashsPending = async (
  keyringAccountId: string,
  chainId: string,
): Promise<string[]> => {
  const state = await getState();

  const foundUserOpHashesPending: string[] = [];
  const userOpHashesPending = Object.assign({}, state.userOpHashesPending);

  for (const key in userOpHashesPending) {
    if (
      key.includes(`${keyringAccountId}-${chainId}`) &&
      userOpHashesPending[key] !== undefined
    ) {
      foundUserOpHashesPending.push(userOpHashesPending[key]);
    }
  }
  return foundUserOpHashesPending;
};

export const getBundlerUrls = async (): Promise<{
  [chainId: string]: string;
}> => {
  const state = await getState();
  // Creating a copy ensures that the original array remains intact, isolating the changes to the copied array and preventing unintended side effects.
  return Object.assign({}, state.bundlerUrls);
};

export const storeUserOpHashConfirmed = async (
  keyringAccountId: string,
  chainId: string,
  userOpHash: string,
): Promise<boolean> => {
  const state = await getState(keyringAccountId);

  state.smartAccountActivity[keyringAccountId].scAccount[chainId].userOpHashesConfirmed.push(
    userOpHash,
  );

  // remove userOpHash from pending
  delete state.userOpHashesPending[
    `${keyringAccountId}-${chainId}-${userOpHash}`
  ];

  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });
  return true;
};

export const storeUserOpHashPending = async (
  userOpHash: string,
  keyringAccountId: string,
  chainId: string,
): Promise<boolean> => {
  const state = await getState();
  state.userOpHashesPending[`${keyringAccountId}-${chainId}-${userOpHash}`] =
    userOpHash;

  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });
  return true;
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

export const clearState = async (): Promise<boolean> => {
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'clear' },
  });
  return true;
};

export const storeKeyRing = async (keyring:KeyringState): Promise<boolean> => {
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
