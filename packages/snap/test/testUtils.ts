const originalGlobal = global;

const setupSnapMock = () => {
  (global as any).snap = {
    request: jest.fn(() => Promise.resolve(null)),
  };
};

const restoreGlobal = () => {
  global = originalGlobal;
};

export { setupSnapMock, restoreGlobal };
