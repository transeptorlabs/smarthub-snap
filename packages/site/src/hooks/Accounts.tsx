import { useContext, useEffect } from 'react';
import { MetamaskActions, MetaMaskContext } from '.';
import { EOA, SmartContractAccount } from "../types";
import { connectWallet, getAccountBalance, getBundlerUrls, getChainId, getMMProvider, getScAccount, sendSupportedEntryPoints } from "../utils";

export const useAcount = () => {
  const [state, dispatch] = useContext(MetaMaskContext);

  const getEoa = async (): Promise<EOA> => {
    let eoa = await connectWallet()
    dispatch({
      type: MetamaskActions.SetEOA,
      payload: eoa,
    });
    return eoa;
  };

  const getScAccountState = async (ownerEoa: string): Promise<SmartContractAccount> => {
    const [scAccount, supportedEntryPoints] = await Promise.all([
      getScAccount(ownerEoa),
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
    return scAccount;
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

  const setWalletListener = async () => {
    if (!state.isChainIdListener) {
      console.log('setWalletListener:', state)
      const chainId = await getChainId();
      dispatch({
        type: MetamaskActions.SetChainId,
        payload: chainId,
      });
      
      const provider = getMMProvider()
      if (provider) {
        provider.on('chainChanged', async (chainId) => {
          dispatch({
            type: MetamaskActions.SetChainId,
            payload: chainId,
          });
    
          const ownerEoa = await getEoa().catch((e) => {
            fatalError(e)
          });
          if (!ownerEoa) return;
          await getScAccountState(ownerEoa.address).catch((e) => {
            fatalError(e)
          });        
        });
     
        provider.on('accountsChanged', async (accounts) => {
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
    getEoa,
    getScAccountState,
    refreshEOAState,
    setWalletListener
  }
}