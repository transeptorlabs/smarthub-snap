import { DEFAULT_STATE, getState, getUserOpHashsConfirmed } from '../src/state';
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
  
      const result = await getState(0, 0);
  
      expect(result).toEqual(expect.objectContaining(DEFAULT_STATE));
    });
  });

  describe('getUserOpHashsConfirmed', () => {
    it('should return an array of userOpHashesConfirmed', async () => { 
      const mockState = {
        0: {
          scAccounts: {
            0: {
              '0x539': {
                userOpHashesConfirmed: ['hash1', 'hash2'],
              },
            },
          },
        },
      };

      (global as any).snap.request.mockReturnValueOnce(Promise.resolve(mockState));

      const result = await getUserOpHashsConfirmed(0, 0, '0x539');
      expect(result).toEqual(['hash1', 'hash2']);
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
