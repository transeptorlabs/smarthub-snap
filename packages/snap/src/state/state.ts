import { DEFAULT_STATE } from "./state.contants";

export const getState = async (
  eoaIndex = 0,
  scIndex = 0,
): Promise<{
  bundlerUrls: { [chainId: string]: string };
  userOpHashesPending: { [key: string]: string }; // key = eoaIndex-scIndex-chainId
  [eoaIndex: number]: {
    scAccounts: {
      [scIndex: number]: {
        [chainId: string]: {
          userOpHashesConfirmed: string[];
        };
      };
    };
  };
}> => {
  let state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as {
    bundlerUrls: { [chainId: string]: string };
    userOpHashesPending: { [key: string]: string };
    [eoaIndex: number]: {
      scAccounts: {
        [scIndex: number]: {
          [chainId: string]: {
            userOpHashesConfirmed: string[];
          };
        };
      };
    };
  } | null;

  if (state === null) {
    // initialize state if empty and set default data
    state = DEFAULT_STATE;
  }

  // if eoaIndex does not exist, initialize it
  if (state[eoaIndex] === undefined || state[eoaIndex] === null) {
    state[eoaIndex] = {
      scAccounts: {},
    };
  }

  // if scIndex does not exist, initialize it
  if (
    state[eoaIndex].scAccounts[scIndex] === undefined ||
    state[eoaIndex].scAccounts[scIndex] === null
  ) {
    state[eoaIndex].scAccounts[scIndex] = {
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
    };
  }

  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });

  return state;
};

export const getUserOpHashsConfirmed = async (
  eoaIndex: number,
  scIndex: number,
  chainId: string,
): Promise<string[]> => {
  const state = await getState(eoaIndex, scIndex);

  // Creating a copy ensures that the original array remains intact, isolating the changes to the copied array and preventing unintended side effects.
  return Array.from(
    state[eoaIndex].scAccounts[scIndex][chainId].userOpHashesConfirmed,
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
  eoaIndex: number,
  scIndex: number,
  chainId: string,
): Promise<string[]> => {
  const state = await getState();

  const foundUserOpHashesPending: string[] = [];
  const userOpHashesPending = Object.assign({}, state.userOpHashesPending);

  for (const key in userOpHashesPending) {
    if (
      key.includes(`${eoaIndex}-${scIndex}-${chainId}`) &&
      userOpHashesPending[key] !== undefined
    ) {
      foundUserOpHashesPending.push(userOpHashesPending[key]);
    }
  }
  return foundUserOpHashesPending;
};

export const getTotalSmartAccount = async (
  eoaIndex: number,
): Promise<number> => {
  const state = await getState();
  // Creating a copy ensures that the original array remains intact, isolating the changes to the copied array and preventing unintended side effects.
  const smartAccounts = Object.assign({}, state[eoaIndex].scAccounts);
  return Object.keys(smartAccounts).length;
};

export const getBundlerUrls = async (): Promise<{
  [chainId: string]: string;
}> => {
  const state = await getState();
  // Creating a copy ensures that the original array remains intact, isolating the changes to the copied array and preventing unintended side effects.
  return Object.assign({}, state.bundlerUrls);
};

export const storeUserOpHashConfirmed = async (
  userOpHash: string,
  eoaIndex: number,
  scIndex: number,
  chainId: string,
): Promise<boolean> => {
  const state = await getState(eoaIndex, scIndex);

  state[eoaIndex].scAccounts[scIndex][chainId].userOpHashesConfirmed.push(
    userOpHash,
  );

  // remove userOpHash from pending
  delete state.userOpHashesPending[
    `${eoaIndex}-${scIndex}-${chainId}-${userOpHash}`
  ];

  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });
  return true;
};

export const storeUserOpHashPending = async (
  userOpHash: string,
  eoaIndex: number,
  scIndex: number,
  chainId: string,
): Promise<boolean> => {
  const state = await getState();
  state.userOpHashesPending[`${eoaIndex}-${scIndex}-${chainId}-${userOpHash}`] =
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
