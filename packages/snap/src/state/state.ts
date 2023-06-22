
const getState = async (
  index = '0',
): Promise<{
  bundlerUrls: { [chainId: string]: string };
  scAccounts: {
    [scIndex: string]: {
      userOpHashesConfirmed: string[];
      userOpHashesPending: string[];
    }
  }
  ;
}> => {
  let state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as {
    bundlerUrls: { [chainId: string]: string };
    scAccounts: {
      [scIndex: string]: {
        userOpHashesConfirmed: string[];
        userOpHashesPending: string[];
      }
    }
  } | null;

  if (state === null) {
    // initialize state if empty and set default data
    state = {
      bundlerUrls: {
        '0x539': 'http://localhost:3000/rpc', // 1337
        '0x1': '', // ethereum mainnet
        '0x5':'', // goerli
        '0x89':'', // polygon mainnet
        '0x13881':'' // polygon mumbai
      },
      scAccounts: {
        '0': { 
          userOpHashesConfirmed: [], 
          userOpHashesPending: [],
        },
      }
    };

    await snap.request({
      method: 'snap_manageState',
      params: { operation: 'update', newState: state },
    });
  }

  // if index does not exist, initialize it and set default data
  if (!state.scAccounts[index] === undefined || state.scAccounts[index] === null) {
    state.scAccounts[index] = { 
      userOpHashesConfirmed: [], 
      userOpHashesPending: [],
    };
    await snap.request({
      method: 'snap_manageState',
      params: { operation: 'update', newState: state },
    });
  }

  return state;
};

export const getUserOpHashsConfirmed = async (
  index = '0',
): Promise<string[]> => {
  const state = await getState(index);
  // Creating a copy ensures that the original array remains intact, isolating the changes to the copied array and preventing unintended side effects.
  return Array.from(state.scAccounts[index].userOpHashesConfirmed);
};

export const getUserOpHashsPending = async (index = '0'): Promise<string[]> => {
  const state = await getState(index);
  // Creating a copy ensures that the original array remains intact, isolating the changes to the copied array and preventing unintended side effects.
  return Array.from(state.scAccounts[index].userOpHashesPending);
};

export const getBundlerUrls = async (
  index = '0',
): Promise<{[chainId: string]: string }> => {
  const state = await getState(index);
  // Creating a copy ensures that the original array remains intact, isolating the changes to the copied array and preventing unintended side effects.
  return Object.assign({}, state.bundlerUrls);
};

export const storeUserOpHashConfirmed = async (
  userOpHash: string,
  index = '0',
): Promise<boolean> => {
  const state = await getState(index);
  state.scAccounts[index].userOpHashesConfirmed.push(userOpHash);

  // remove from pending if exists
  const removeIndex = state.scAccounts[index].userOpHashesPending.indexOf(userOpHash);
  if (removeIndex > -1) {
    state.scAccounts[index].userOpHashesPending.splice(removeIndex, 1);
  }

  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });
  return true;
};

export const storeUserOpHashPending = async (
  userOpHash: string,
  index = '0',
): Promise<boolean> => {
  const state = await getState(index);
  state.scAccounts[index].userOpHashesPending.push(userOpHash);

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
