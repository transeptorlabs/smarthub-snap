import { v4 as uuid } from 'uuid';
import {
  DEFAULT_BUNDLER_URLS,
  DEFAULT_STATE,
  clearActivityData,
  getBundlerUrls,
  getKeyRing,
  getNextRequestId,
  getState,
  getTxHashes,
  getUserOpHashes,
  storeBundlerUrl,
  storeKeyRing,
  storeTxHash,
  storeUserOpHash,
} from '../src/state';
import { restoreGlobal, setupSnapMock } from './testUtils';

describe('state module - State', () => {
  beforeEach(() => {
    setupSnapMock();
    jest.clearAllMocks();
  });

  afterEach(() => {
    restoreGlobal();
  });

  describe('getState', () => {
    it('should return the default state when no state is retrieved', async () => {
      (global as any).snap.request.mockReturnValue(Promise.resolve(null));

      const result = await getState();

      expect(JSON.stringify(result)).toStrictEqual(
        JSON.stringify(DEFAULT_STATE),
      );
    });

    it('should initialize state for keyringAccountId when it does not exist', async () => {
      (global as any).snap.request.mockReturnValue(Promise.resolve(null));
      const keyringAccountId = uuid();

      let result = await getState();
      expect(JSON.stringify(result)).toStrictEqual(
        JSON.stringify(DEFAULT_STATE),
      );
      expect(result.smartAccountActivity[keyringAccountId]).toBeUndefined();

      result = await getState(keyringAccountId);
      expect(result.smartAccountActivity[keyringAccountId]).toBeDefined();
    });
  });

  describe('getUserOpHashes', () => {
    it('should return an array of an users confirmed OpHashes for a specific chainId', async () => {
      const keyringAccountId = uuid();
      const mockState = {
        keyringState: {
          wallets: {},
          pendingRequests: {},
          signedTx: {},
        },
        requestIdCounter: 0,
        bundlerUrls: DEFAULT_BUNDLER_URLS,
        smartAccountActivity: {
          [keyringAccountId]: {
            scAccount: {
              '0x1': {
                userOpHashes: ['hash1', 'hash2'],
                txHashes: [],
              },
              '0x5': {
                userOpHashes: ['hash3', 'hash4'],
                txHashes: [],
              },
            },
          },
        },
      };

      (global as any).snap.request.mockReturnValue(Promise.resolve(mockState));

      const result = await getUserOpHashes(keyringAccountId, '0x1');
      expect(result).toStrictEqual(['hash1', 'hash2']);
    });
  });

  describe('storeUserOpHash', () => {
    it('should store a user confirmed userOpHash', async () => {
      const keyringAccountId = uuid();
      const mockState = {
        keyringState: {
          wallets: {},
          pendingRequests: {},
          signedTx: {},
        },
        requestIdCounter: 0,
        bundlerUrls: DEFAULT_BUNDLER_URLS,
        smartAccountActivity: {
          [keyringAccountId]: {
            scAccount: {
              '0x1': {
                userOpHashes: ['hash1', 'hash2'],
                txHashes: [],
              },
              '0x5': {
                userOpHashes: ['hash3', 'hash4'],
                txHashes: [],
              },
            },
          },
        },
      };

      (global as any).snap.request.mockReturnValue(Promise.resolve(mockState));

      let result = await getUserOpHashes(keyringAccountId, '0x1');
      expect(result).toStrictEqual(['hash1', 'hash2']);

      await storeUserOpHash(keyringAccountId, '0x1', 'hash5');
      result = await getUserOpHashes(keyringAccountId, '0x1');
      expect(result).toStrictEqual(['hash1', 'hash2', 'hash5']);
    });
  });

  describe('getBundlerUrls', () => {
    it('should return a copy of state.bundlerUrls', async () => {
      const mockState = {
        keyringState: {
          wallets: {},
          pendingRequests: {},
          signedTx: {},
        },
        requestIdCounter: 0,
        bundlerUrls: DEFAULT_BUNDLER_URLS,
        smartAccountActivity: {},
      };

      (global as any).snap.request.mockReturnValue(Promise.resolve(mockState));

      const result = await getBundlerUrls();

      expect(result).toStrictEqual(mockState.bundlerUrls);
    });
  });

  describe('storeBundlerUrl', () => {
    it('should return a copy of state.bundlerUrls with newly added bundler Url', async () => {
      const mockState = {
        keyringState: {
          wallets: {},
          pendingRequests: {},
          signedTx: {},
        },
        requestIdCounter: 0,
        bundlerUrls: DEFAULT_BUNDLER_URLS,
        smartAccountActivity: {},
      };

      (global as any).snap.request.mockReturnValue(Promise.resolve(mockState));
      let result = await getBundlerUrls();
      expect(result).toStrictEqual(mockState.bundlerUrls);

      // add new bundler url
      await storeBundlerUrl('0x1', 'https://bundler.url');
      result = await getBundlerUrls();
      expect(result['0x1']).toBe('https://bundler.url');
    });
  });

  describe('getTxHashes', () => {
    it('should return an array of an users confirmed txHashes for a specific chainId', async () => {
      const keyringAccountId = uuid();
      const mockState = {
        keyringState: {
          wallets: {},
          pendingRequests: {},
          signedTx: {},
        },
        requestIdCounter: 0,
        bundlerUrls: DEFAULT_BUNDLER_URLS,
        smartAccountActivity: {
          [keyringAccountId]: {
            scAccount: {
              '0x1': {
                userOpHashes: [],
                txHashes: ['hash1', 'hash2'],
              },
            },
          },
        },
      };

      (global as any).snap.request.mockReturnValue(Promise.resolve(mockState));

      const result = await getTxHashes(keyringAccountId, '0x1');
      expect(result).toStrictEqual(['hash1', 'hash2']);
    });
  });

  describe('storeTxHash', () => {
    it('should store a user confirmed userOpHash', async () => {
      const keyringAccountId = uuid();
      const mockState = {
        keyringState: {
          wallets: {},
          pendingRequests: {},
          signedTx: {
            '1': 'mockSignedTx',
          },
        },
        requestIdCounter: 0,
        bundlerUrls: DEFAULT_BUNDLER_URLS,
        smartAccountActivity: {
          [keyringAccountId]: {
            scAccount: {
              '0x1': {
                userOpHashes: [],
                txHashes: ['hash1', 'hash2'],
              },
              '0x5': {
                userOpHashes: [],
                txHashes: ['hash3', 'hash4'],
              },
            },
          },
        },
      };

      (global as any).snap.request.mockReturnValue(Promise.resolve(mockState));

      const stateBefore = await getState();
      expect(stateBefore.keyringState.signedTx['1']).toBe('mockSignedTx');

      let result = await getTxHashes(keyringAccountId, '0x1');
      expect(result).toStrictEqual(['hash1', 'hash2']);

      await storeTxHash(keyringAccountId, 'hash5', '1', '0x1');
      result = await getTxHashes(keyringAccountId, '0x1');
      expect(result).toStrictEqual(['hash1', 'hash2', 'hash5']);

      const stateAfter = await getState();
      expect(stateAfter.keyringState.signedTx['1']).toBeUndefined();
    });
  });

  describe('clearActivityData', () => {
    it('should clear all smart account Activity data', async () => {
      const keyringAccountId = uuid();
      const mockState = {
        keyringState: {
          wallets: {},
          pendingRequests: {},
          signedTx: {},
        },
        requestIdCounter: 0,
        bundlerUrls: DEFAULT_BUNDLER_URLS,
        smartAccountActivity: {
          [keyringAccountId]: {
            scAccount: {
              '0x1': {
                userOpHashes: ['hash1', 'hash2'],
                txHashes: [],
              },
              '0x5': {
                userOpHashes: ['hash3', 'hash4'],
                txHashes: [],
              },
            },
          },
        },
      };

      (global as any).snap.request.mockReturnValue(Promise.resolve(mockState));

      const stateBefore = await getState();
      expect(stateBefore.smartAccountActivity[keyringAccountId]).toBeDefined();

      await clearActivityData();

      const stateAfter = await getState();
      expect(stateAfter.smartAccountActivity[keyringAccountId]).toBeUndefined();
    });
  });

  describe('getKeyRing', () => {
    it('get current user keyring state', async () => {
      const mockState = {
        keyringState: {
          wallets: {},
          pendingRequests: {},
          signedTx: {
            '1': 'mockSignedTx',
          },
        },
        requestIdCounter: 0,
        bundlerUrls: DEFAULT_BUNDLER_URLS,
        smartAccountActivity: {},
      };

      (global as any).snap.request.mockReturnValue(Promise.resolve(mockState));

      const keyring = await getKeyRing();
      expect(keyring.signedTx['1']).toBe('mockSignedTx');
    });
  });

  describe('storeKeyRing', () => {
    it('store new user keyring state', async () => {
      const mockState = {
        keyringState: {
          wallets: {},
          pendingRequests: {},
          signedTx: {
            '1': 'mockSignedTx',
          },
        },
        requestIdCounter: 0,
        bundlerUrls: DEFAULT_BUNDLER_URLS,
        smartAccountActivity: {},
      };

      (global as any).snap.request.mockReturnValue(Promise.resolve(mockState));

      await storeKeyRing({
        wallets: {},
        pendingRequests: {},
        signedTx: {
          '1': 'mockSignedTx',
          '2': 'mockSignedTx2',
        },
      });

      expect((global as any).snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'update', newState: mockState },
      });

      const keyringAfter = await getKeyRing();
      expect(keyringAfter.signedTx['2']).toBe('mockSignedTx2');
    });
  });

  describe('getNextRequestId', () => {
    it('increments requestIdCounter and updates state', async () => {
      const mockState = {
        keyringState: {
          wallets: {},
          pendingRequests: {},
          signedTx: {},
        },
        requestIdCounter: 42,
        bundlerUrls: DEFAULT_BUNDLER_URLS,
        smartAccountActivity: {},
      };

      (global as any).snap.request.mockReturnValue(Promise.resolve(mockState));

      const result = await getNextRequestId();

      expect(result).toBe(43);
      expect(mockState.requestIdCounter).toBe(43);
      expect((global as any).snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: { operation: 'update', newState: mockState },
      });
    });
  });
});
