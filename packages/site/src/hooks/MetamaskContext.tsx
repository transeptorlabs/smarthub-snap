import {
  createContext,
  Dispatch,
  ReactNode,
  Reducer,
  useEffect,
  useReducer,
} from 'react';
import { Snap } from '../types';
import { isFlask, getSnap } from '../utils';
import { EOA, SmartContractAccount } from '../types/erc-4337';

export type MetamaskState = {
  isFlask: boolean;
  isChainIdListener: boolean;
  installedSnap?: Snap;
  error?: Error;
  userOpsHash?: string;
  eoa: EOA;
  scAccount: SmartContractAccount;
};

const initialState: MetamaskState = {
  isFlask: false,
  error: undefined,
  installedSnap: undefined,
  isChainIdListener: false,
  userOpsHash: '',
  eoa: {
    connected: false,
    address: '',
    balance: '',  // in wei
  },
  scAccount: {
    connected: false,
    address: '',
    balance: '', // in wei
    nonce: '',
    index: '',
    entryPoint: '',
    depoist: '',
    factoryAddress: '',
    ownerAddress: '',
    bundlerUrl: '',
    chainId: '',
    userOperationReceipts: [],
    userOpHashesPending: [],
  },
};

type MetamaskDispatch = { type: MetamaskActions; payload: any };

export const MetaMaskContext = createContext<
  [MetamaskState, Dispatch<MetamaskDispatch>]
>([
  initialState,
  () => {
    /* no op */
  },
]);

export enum MetamaskActions {
  SetInstalled = 'SetInstalled',
  SetFlaskDetected = 'SetFlaskDetected',
  SetError = 'SetError',
  SetEOA = "SetEOA",
  SetScAccount = "SetScAccount",
  SetSupportedEntryPoints = 'SetSupportedEntryPoints',
  SetWalletListener = 'SetWalletListener',
  SetUserOpHash = 'SetUserOpHash',
  SetClearAccount = 'SetClearAccount',
}

const reducer: Reducer<MetamaskState, MetamaskDispatch> = (state, action) => {
  switch (action.type) {
    case MetamaskActions.SetInstalled:
      return {
        ...state,
        installedSnap: action.payload,
      };

    case MetamaskActions.SetFlaskDetected:
      return {
        ...state,
        isFlask: action.payload,
      };

    case MetamaskActions.SetError:
      return {
        ...state,
        error: action.payload,
      };

    case MetamaskActions.SetEOA:
      return {
        ...state,
        eoa: action.payload,
      };

    case MetamaskActions.SetScAccount:
      return {
        ...state,
        scAccount: action.payload,
      };

    case MetamaskActions.SetWalletListener:
      return {
        ...state,
        isChainIdListener: action.payload,
      };

    case MetamaskActions.SetUserOpHash:
      return {
        ...state,
        userOpsHash: action.payload,
      };

    case MetamaskActions.SetClearAccount:
      return {
        ...state,
        eoa: {
          connected: false,
          address: '',
          balance: '',  // in wei
        },
        scAccount: {
          connected: false,
          address: '',
          balance: '', // in wei
          nonce: '',
          index: '',
          entryPoint: '',
          depoist: '',
          factoryAddress: '',
          ownerAddress: '',
          bundlerUrl: '',
        },
      };

    default:
      return state;
  }
};

/**
 * MetaMask context provider to handle MetaMask and snap status.
 *
 * @param props - React Props.
 * @param props.children - React component to be wrapped by the Provider.
 * @returns JSX.
 */
export const MetaMaskProvider = ({ children }: { children: ReactNode }) => {
  if (typeof window === 'undefined') {
    return <>{children}</>;
  }

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function detectFlask() {
      const isFlaskDetected = await isFlask();

      dispatch({
        type: MetamaskActions.SetFlaskDetected,
        payload: isFlaskDetected,
      });
    }

    async function detectSnapInstalled() {
      const installedSnap = await getSnap();
      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    }

    detectFlask();

    if (state.isFlask) {
      detectSnapInstalled();
    }
  }, [state.isFlask, window.ethereum]);

  useEffect(() => {
    let timeoutId: number;

    if (state.error) {
      timeoutId = window.setTimeout(() => {
        dispatch({
          type: MetamaskActions.SetError,
          payload: undefined,
        });
      }, 10000);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [state.error]);

  return (
    <MetaMaskContext.Provider value={[state, dispatch]}>
      {children}
    </MetaMaskContext.Provider>
  );
};
