import { v4 as uuid } from 'uuid';
import {
  DEFAULT_BUNDLER_URLS,
  DEFAULT_STATE,
  getState,
  getUserOpHashsConfirmed,
} from '../src/state';
import { restoreGlobal, setupSnapMock } from './testUtils';

describe('state module - State', () => {
  beforeEach(() => {
    setupSnapMock();
  });

  afterEach(() => {
    restoreGlobal();
  });

  describe('getState', () => {
    it('should return the default state when no state is retrieved', async () => {
      (global as any).snap.request.mockReturnValueOnce(Promise.resolve(null));

      const result = await getState();

      expect(JSON.stringify(result)).toStrictEqual(
        JSON.stringify(DEFAULT_STATE),
      );
    });
  });

  describe('getUserOpHashsConfirmed', () => {
    it('should return an array of userOpHashesConfirmed', async () => {
      const keyringAccountId = uuid();
      const mockState = {
        keyringState: {
          wallets: {},
          requests: {},
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

      (global as any).snap.request.mockReturnValueOnce(
        Promise.resolve(mockState),
      );

      const result = await getUserOpHashsConfirmed(keyringAccountId, '0x1');
      expect(result).toStrictEqual(['hash1', 'hash2']);
    });
  });

  describe('getAllUserOpHashsPending', () => {
    it('placeholder', async () => {
      expect(true).toBe(true);
    });
  });

  describe('getUserOpHashsPending', () => {
    it('placeholder', async () => {
      expect(true).toBe(true);
    });
  });

  describe('getTotalSmartAccount', () => {
    it('placeholder', async () => {
      expect(true).toBe(true);
    });
  });

  describe('getBundlerUrls', () => {
    it('placeholder', async () => {
      expect(true).toBe(true);
    });
  });

  describe('storeUserOpHashConfirmed', () => {
    it('placeholder', async () => {
      expect(true).toBe(true);
    });
  });

  describe('storeUserOpHashPending', () => {
    it('placeholder', async () => {
      expect(true).toBe(true);
    });
  });

  describe('storeBundlerUrl', () => {
    it('placeholder', async () => {
      expect(true).toBe(true);
    });
  });

  describe('clearState', () => {
    it('placeholder', async () => {
      expect(true).toBe(true);
    });
  });
});
