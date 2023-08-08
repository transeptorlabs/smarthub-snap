export const DEFAULT_STATE = {
    bundlerUrls: {
      '0x539': 'http://localhost:3000/rpc', // 1337
      '0x1': '', // ethereum mainnet
      '0x5': '', // goerli
      '0x89': '', // polygon mainnet
      '0x13881': '', // polygon mumbai
    },
    userOpHashesPending: {},
    0: {
      scAccounts: {
        0: {
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
      },
    },
  };