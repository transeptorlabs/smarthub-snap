export const DEFAULT_BUNDLER_URLS = {
  '0x539': 'http://localhost:4337/rpc', // 1337 - private
  '0x5': '', // goerli
  '0xaa36a7': '', // 11155111 - sepolia
  // '0x1': '', // ethereum mainnet
  // '0x89': '', // polygon mainnet
  // '0x13881': '', // polygon mumbai
  // '0xa4b1': '', // Arbitrum
  // '0xa': '', // Optimism
};

export const DEFAULT_STATE = {
  keyringState: {
    wallets: {},
    pendingRequests: {},
  },
  requestIdCounter: 0,
  bundlerUrls: DEFAULT_BUNDLER_URLS,
  smartAccountActivity: {},
};
