import { useContext, useEffect } from 'react';
import { MetamaskActions, MetaMaskContext } from '.';
import { EOA } from "../types";
import { connectWallet, getAccountBalance, getBundlerUrls, getMMProvider, getScAccount, sendSupportedEntryPoints } from "../utils";

export const useAcount = () => {
  const [state, dispatch] = useContext(MetaMaskContext);

  const connectEoa = async () => {
    let eoa = await connectWallet()
    dispatch({
      type: MetamaskActions.SetEOA,
      payload: eoa,
    });
  };

  const refreshEOAState = async (newAccount: string) => {
    const changedeoa: EOA = {
      address: newAccount,
      balance: await getAccountBalance(newAccount),
      connected: true,
    }
    dispatch({
      type: MetamaskActions.SetEOA,
      payload: changedeoa,
    });
  };

  const getScAccountState = async () => {
    const [scAccount, supportedEntryPoints] = await Promise.all([
      getScAccount(),
      sendSupportedEntryPoints(),
    ]);

    dispatch({
      type: MetamaskActions.SetScAccount,
      payload: scAccount,
    });

    dispatch({
      type: MetamaskActions.SetSupportedEntryPoints,
      payload: supportedEntryPoints,
    });
  };

  const setWalletListener = async () => {
    if (!state.isChainIdListener) {
      console.log('setWalletListener:', state)
      const provider = getMMProvider()
      if (provider) {
        provider.on('chainChanged', async (chainId) => {
          console.log('chainChanged:', state)
          dispatch({
            type: MetamaskActions.SetChainId,
            payload: chainId,
          });
    
          await connectEoa().catch((e) => {
            fatalError(e)
          });
          await getScAccountState().catch((e) => {
            fatalError(e)
          });        
        });
     
        provider.on('accountsChanged', async (accounts) => {
          console.log('accountsChanged:', state)
          await refreshEOAState((accounts as string[])[0]).catch((e) => {
            fatalError(e);
          });        
        });

        dispatch({
          type: MetamaskActions.SetWalletListener,
          payload: true,
        });
      }
    }
  };

  const fatalError = async (e: any) => {
    dispatch({ type: MetamaskActions.SetError, payload: e });
    dispatch({ type: MetamaskActions.SetClearAccount, payload: true});
  }

  return {
    connectEoa,
    refreshEOAState,
    getScAccountState,
    setWalletListener
  }
}