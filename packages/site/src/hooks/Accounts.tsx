import { useContext } from 'react';
import { MetamaskActions, MetaMaskContext } from '.';
import { BundlerUrls, EOA, SmartAccountActivity, SmartContractAccount } from "../types";
import { bundlerUrls, connectWallet, getAccountBalance, getChainId, getMMProvider, getScAccount, getSmartAccountActivity, sendSupportedEntryPoints } from "../utils";

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

  const updateChain = async () => {
    const chainId = await getChainId();
    dispatch({
      type: MetamaskActions.SetChainId,
      payload: chainId,
    });
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

  const refreshEOAState = async (newAccount: string): Promise<EOA>  => {
    const changedeoa: EOA = {
      address: newAccount,
      balance: await getAccountBalance(newAccount),
      connected: true,
    }
    dispatch({
      type: MetamaskActions.SetEOA,
      payload: changedeoa,
    });

    return changedeoa
  };

  const getAccountActivity = async (ownerEoa: string, scIndex: number): Promise<SmartAccountActivity> => {
    const result: SmartAccountActivity = await getSmartAccountActivity(ownerEoa, scIndex);
    dispatch({
      type: MetamaskActions.SetSmartAccountActivity,
      payload: result,
    });
    return result;
  }

  const getBundlerUrls = async (): Promise<BundlerUrls> => {
    const urls = await bundlerUrls();
    dispatch({
      type: MetamaskActions.SetBundlerUrls,
      payload: urls,
    });

    return urls
  };

  const setWalletListener = async () => {
    if (!state.isChainIdListener) {   
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
          const smartAccount = await getScAccountState(ownerEoa.address).catch((e) => {
            fatalError(e)
          });  
          if (!smartAccount) return;   
          
          await getAccountActivity(ownerEoa.address, Number(smartAccount.index)).catch((e) => {
            fatalError(e)
          });
        });
     
        provider.on('accountsChanged', async (accounts) => {
          await refreshEOAState((accounts as string[])[0]).catch((e) => {
            fatalError(e);
          });  
          const smartAccount = await getScAccountState((accounts as string[])[0]).catch((e) => {
            fatalError(e)
          }); 
          if (!smartAccount) return;   
  
          await getAccountActivity((accounts as string[])[0], Number(smartAccount.index)).catch((e) => {
            fatalError(e)
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
    setWalletListener,
    getAccountActivity,
    getBundlerUrls,
    updateChain,
  }
}