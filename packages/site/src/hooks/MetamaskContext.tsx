import {
  createContext,
  Dispatch,
  ReactNode,
  Reducer,
  useEffect,
  useReducer,
} from 'react';
import { AppTab, BundlerUrls, Snap } from '../types';
import { isFlask, getSnap, KeyringState } from '../utils';
import { AccountActivity, SmartContractAccount } from '../types/erc-4337';
import { KeyringAccount } from "@metamask/keyring-api";
import { BigNumber, ethers } from 'ethers';

export type MetamaskState = {
  isFlask: boolean;
  installedSnap?: Snap;
  error?: Error;
  isChainIdListener: boolean;
  chainId: string;
  activeTab: AppTab;
  snapKeyring: KeyringState;
  selectedSnapKeyringAccount: KeyringAccount;
  selectedAccountBalance: string;
  scAccount: SmartContractAccount;
  accountActivity: AccountActivity[];
  bundlerUrls?: BundlerUrls;
};

const initialState: MetamaskState = {
  isFlask: false,
  error: undefined,
  installedSnap: undefined,
  isChainIdListener: false,
  chainId: '',
  activeTab: AppTab.SmartAccount,
  snapKeyring: {
    pendingRequests: [],
    accounts: [],
  },
  selectedSnapKeyringAccount: {
    id: '',
    name: '',
    address: '',
    options: {},
    supportedMethods: [],
    type: 'eip155:erc4337',
  },
  selectedAccountBalance: '0', // in wei
  scAccount: {
    initCode: '',
    connected: false,
    address: '',
    balance: '', // in wei
    nonce: BigNumber.from(0),
    index: BigNumber.from(0),
    entryPoint: '',
    deposit: '',
    factoryAddress: '',
    ownerAddress: '',
  },
  accountActivity: [],
  bundlerUrls: undefined,
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
  SetWalletListener = 'SetWalletListener',
  SetChainId = 'SetChainId',
  SetActiveTab = 'SetActiveTab',
  SetSnapKeyring = 'SetSnapKeyring',
  SetSelectedSnapKeyringAccount = "SetSelectedKeyringAccount",
  SetScAccount = "SetScAccount",
  SetAccountActivity = 'SetAccountActivity',
  SetSelectedAccountBalance = 'SetSelectedAccountBalance',
  SetClearAccount = 'SetClearAccount',
  SetBundlerUrls = 'SetBundlerUrls',
  SetSupportedEntryPoints = 'SetSupportedEntryPoints',
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

    case MetamaskActions.SetSelectedSnapKeyringAccount:
      return {
        ...state,
        selectedSnapKeyringAccount: action.payload,
      };

    case MetamaskActions.SetSelectedSnapKeyringAccount:
      return {
        ...state,
        selectedSnapKeyringAccount: action.payload,
      };

    case MetamaskActions.SetSelectedAccountBalance:
    return {
      ...state,
      selectedAccountBalance: action.payload,
    };

    case MetamaskActions.SetScAccount:
      return {
        ...state,
        scAccount: action.payload,
      };

    case MetamaskActions.SetAccountActivity:
      return {
        ...state,
        accountActivity: action.payload,
      };

    case MetamaskActions.SetWalletListener:
      return {
        ...state,
        isChainIdListener: action.payload,
      };

    case MetamaskActions.SetActiveTab:
      return {
        ...state,
        activeTab: action.payload,
      };

    case MetamaskActions.SetChainId:
      return {
        ...state,
        chainId: action.payload,
      };

    case MetamaskActions.SetBundlerUrls:
      return {
        ...state,
        bundlerUrls: action.payload,
      };

    case MetamaskActions.SetSnapKeyring:
      return {
        ...state,
        snapKeyring: action.payload,
      };
      
    case MetamaskActions.SetClearAccount:
      return {
        ...state,
        selectedSnapKeyringAccount: {
          id: '',
          name: '',
          address: '',
          options: {},
          supportedMethods: [],
          type: 'eip155:erc4337',
        },
        scAccount: {
          initCode: '',
          connected: false,
          address: '',
          balance: '', // in wei
          nonce: BigNumber.from(0),
          index: BigNumber.from(0),
          entryPoint: '',
          deposit: '',
          factoryAddress: '',
          ownerAddress: '',
        },
        accountActivity: [],
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
      }, 5000);
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
