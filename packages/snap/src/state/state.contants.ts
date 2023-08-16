export const DEFAULT_STATE = {
  keyringState: {
    wallets: {},
    requests: {},
  },
  bundlerUrls: {
    '0x539': 'http://localhost:3000/rpc', // 1337 - private
    '0x1': '', // ethereum mainnet
    '0x5': '', // goerli
    '0x89': '', // polygon mainnet
    '0x13881': '', // polygon mumbai
    '0xa4b1': '', // Arbitrum
    '0xa': '', // Optimism
  },
  userOpHashesPending: {},
  smartAccountActivity: {},
};
