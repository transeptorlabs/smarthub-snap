const getState = async (
  index = '0',
): Promise<{
  [scIndex: string]: {
    userOpHashesConfirmed: string[];
    userOpHashesPending: string[];
  };
}> => {
  let state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as {
    [scIndex: string]: {
      userOpHashesConfirmed: string[];
      userOpHashesPending: string[];
    };
  } | null;

  if (state === null) {
    // initialize state if empty and set default data
    state = {
      '0': { userOpHashesConfirmed: [], userOpHashesPending: [] },
    };

    await snap.request({
      method: 'snap_manageState',
      params: { operation: 'update', newState: state },
    });
  }

  // if index does not exist, initialize it and set default data
  if (!state[index] === undefined || state[index] === null) {
    state[index] = { userOpHashesConfirmed: [], userOpHashesPending: [] };
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
  return Array.from(state[index].userOpHashesConfirmed);
};

export const getUserOpHashsPending = async (index = '0'): Promise<string[]> => {
  const state = await getState(index);
  // Creating a copy ensures that the original array remains intact, isolating the changes to the copied array and preventing unintended side effects.
  return Array.from(state[index].userOpHashesPending);
};

export const storeUserOpHashConfirmed = async (
  userOpHash: string,
  index = '0',
): Promise<boolean> => {
  const state = await getState(index);
  state[index].userOpHashesConfirmed.push(userOpHash);

  // remove from pending if exists
  const removeIndex = state[index].userOpHashesPending.indexOf(userOpHash);
  if (removeIndex > -1) {
    state[index].userOpHashesPending.splice(removeIndex, 1);
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
  state[index].userOpHashesPending.push(userOpHash);

  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'update', newState: state },
  });
  return true;
};

export const getAllIndexes = async (): Promise<string[]> => {
  const state = (await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  })) as {
    [scIndex: string]: {
      userOpHashesConfirmed: string[];
      userOpHashesPending: string[];
    };
  } | null;

  if (state === null) {
    return [];
  }

  return Object.keys(state);
};

export const clearState = async (): Promise<boolean> => {
  await snap.request({
    method: 'snap_manageState',
    params: { operation: 'clear' },
  });
  return true;
};
