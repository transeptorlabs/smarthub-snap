export const DEFAULT_STATE = {
  keyringState: {
    wallets: {},
    requests: {},
  },
  bundlerUrls: {
    '0x539': 'http://localhost:3000/rpc', // 1337
    '0x1': '', // ethereum mainnet
    '0x5': '', // goerli
    '0x89': '', // polygon mainnet
    '0x13881': '', // polygon mumbai
  },
  userOpHashesPending: {},
  smartAccountActivity: {},
};
