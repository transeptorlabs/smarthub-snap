import { v4 as uuid } from 'uuid';
import {
  DEFAULT_BUNDLER_URLS,
  DEFAULT_STATE,
  getAllUserOpHashsPending,
  getState,
  getUserOpHashsConfirmed,
  getUserOpHashsPending,
  storeUserOpHashConfirmed,
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
  });

  describe('getUserOpHashsConfirmed', () => {
    it('should return an array of an users confirmed OpHashes for a specific chainId', async () => {
      const keyringAccountId = uuid();
      const mockState = {
        keyringState: {
          wallets: {},
          pendingRequests: {},
        },
        bundlerUrls: DEFAULT_BUNDLER_URLS,
        userOpHashesPending: {},
        smartAccountActivity: {
          [keyringAccountId]: {
            scAccount: {
              '0x1': {
                userOpHashesConfirmed: ['hash1', 'hash2'],
              },
              '0x5': {
                userOpHashesConfirmed: ['hash3', 'hash4'],
              },
            },
          },
        },
      };

      (global as any).snap.request.mockReturnValue(Promise.resolve(mockState));

      const result = await getUserOpHashsConfirmed(keyringAccountId, '0x1');
      expect(result).toStrictEqual(['hash1', 'hash2']);
    });
  });

  describe('storeUserOpHashConfirmed', () => {
    it('should store a user confirmed userOpHash', async () => {
      const keyringAccountId = uuid();
      const mockState = {
        keyringState: {
          wallets: {},
          pendingRequests: {},
        },
        bundlerUrls: DEFAULT_BUNDLER_URLS,
        userOpHashesPending: {},
        smartAccountActivity: {
          [keyringAccountId]: {
            scAccount: {
              '0x1': {
                userOpHashesConfirmed: ['hash1', 'hash2'],
              },
              '0x5': {
                userOpHashesConfirmed: ['hash3', 'hash4'],
              },
            },
          },
        },
      };

      (global as any).snap.request.mockReturnValue(Promise.resolve(mockState));

      let result = await getUserOpHashsConfirmed(keyringAccountId, '0x1');
      expect(result).toStrictEqual(['hash1', 'hash2']);

      await storeUserOpHashConfirmed(keyringAccountId, '0x1', 'hash5');
      result = await getUserOpHashsConfirmed(keyringAccountId, '0x1');
      expect(result).toStrictEqual(['hash1', 'hash2', 'hash5']);
    });
  });

  describe('getAllUserOpHashsPending', () => {
    it('should return all pending userOps across all user smart accounts stored in snap keyring', async () => {
      const keyringAccountId = uuid();
      const mockState = {
        keyringState: {
          wallets: {},
          pendingRequests: {},
        },
        bundlerUrls: DEFAULT_BUNDLER_URLS,
        userOpHashesPending: {
          [`${keyringAccountId}-${'0x1'}-${'hash1'}`]: 'hash1',
          [`${keyringAccountId}-${'0x1'}-${'hash2'}`]: 'hash2',
        },
        smartAccountActivity: {},
      };

      (global as any).snap.request.mockReturnValue(Promise.resolve(mockState));

      const result = await getAllUserOpHashsPending();
      expect(result).toStrictEqual({
        [`${keyringAccountId}-${'0x1'}-${'hash1'}`]: 'hash1',
        [`${keyringAccountId}-${'0x1'}-${'hash2'}`]: 'hash2',
      });
    });
  });

  describe('getUserOpHashsPending', () => {
    it('should return an array of an users pending OpHashes for a specific chainId', async () => {
      const keyringAccountId = uuid();
      const mockState = {
        keyringState: {
          wallets: {},
          pendingRequests: {},
        },
        bundlerUrls: DEFAULT_BUNDLER_URLS,
        userOpHashesPending: {
          [`${keyringAccountId}-${'0x1'}-${'hash1'}`]: 'hash1',
          [`${keyringAccountId}-${'0x1'}-${'hash2'}`]: 'hash2',
          [`${keyringAccountId}-${'0x5'}-${'hash3'}`]: 'hash3',
        },
        smartAccountActivity: {},
      };

      (global as any).snap.request.mockReturnValue(Promise.resolve(mockState));

      const result = await getUserOpHashsPending(keyringAccountId, '0x1');
      expect(result).toStrictEqual(['hash1', 'hash2']);
    });
  });

  describe('storeUserOpHashPending', () => {
    it('placeholder', async () => {
      expect(true).toBe(true);
    });
  });

  describe('getBundlerUrls', () => {
    it('placeholder', async () => {
      expect(true).toBe(true);
    });
  });

  describe('storeBundlerUrl', () => {
    it('placeholder', async () => {
      expect(true).toBe(true);
    });
  });

  describe('clearActivityData', () => {
    it('placeholder', async () => {
      expect(true).toBe(true);
    });
  });

  describe('storeKeyRing', () => {
    it('placeholder', async () => {
      expect(true).toBe(true);
    });
  });

  describe('getKeyRing', () => {
    it('placeholder', async () => {
      expect(true).toBe(true);
    });
  });
});
