import { useContext } from 'react';
import { MetamaskActions, MetaMaskContext } from '.';
import { BundlerUrls, SmartAccountActivity, SmartContractAccount } from "../types";
import { bundlerUrls, getChainId, getKeyringClient, getMMProvider, getScAccount, getSmartAccountActivity, sendSupportedEntryPoints } from "../utils";
import { KeyringAccount } from "@metamask/keyring-api";
import { KeyringSnapRpcClient } from '@metamask/keyring-api';

export const useAcount = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const client: KeyringSnapRpcClient = getKeyringClient();

  const getKeyringSnapAccounts = async (): Promise<KeyringAccount[]> => {
    const accounts = await client.listAccounts();
    const pendingRequests = await client.listRequests();
    console.log('snap accounts:', accounts);
    console.log('snap pendingRequests:', pendingRequests);
    dispatch({ 
      type: MetamaskActions.SetSnapKeyring,
      payload: {
        accounts,
        pendingRequests,
      } 
    });
    return accounts;
  }

  const selectKeyringSnapAccount = async (selectedKeyringAccount: KeyringAccount): Promise<KeyringAccount> => {
    dispatch({
      type: MetamaskActions.SetSelectedSnapKeyringAccount,
      payload: selectedKeyringAccount,
    });
    console.log('selectedKeyringAccount:', selectedKeyringAccount);
    return selectedKeyringAccount;
  };

  const createAccount = async (accountName: string) => {
    console.log('Creating account:', accountName);
    const newAccount = await client.createAccount(accountName);
    console.log('newAccount result:', newAccount);
    await getKeyringSnapAccounts()
    return newAccount
  };

  const deleteAccount = async (keyringAccountId: string) => {
    console.log('Delete account');
    const result = await client.deleteAccount(keyringAccountId);
    console.log('delete result:', result);
    await getKeyringSnapAccounts()
  };

  const getSmartAccount = async (keyringAccountId: string): Promise<SmartContractAccount> => {
    const [scAccount, supportedEntryPoints] = await Promise.all([
      getScAccount(keyringAccountId),
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

  const getAccountActivity = async (keyringAccountId: string): Promise<SmartAccountActivity> => {
    const result: SmartAccountActivity = await getSmartAccountActivity(keyringAccountId);
    console.log('getAccountActivity result:', result);
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

  const updateChainId = async (chainId?: string) => {
    console.log('setting chainId:', chainId);
    dispatch({
      type: MetamaskActions.SetChainId,
      payload: chainId ? chainId : await getChainId(),
    });
  };

  const getWalletChainId = async (chainId?: string): Promise<string> => {
    return await getChainId()
  };

  const setChainIdListener = async () => {
    if (!state.isChainIdListener) {   
      const provider = getMMProvider()
      if (provider) {
        provider.on('chainChanged', async (chainId) => {
          console.log('chainChanged:', chainId);
          dispatch({
            type: MetamaskActions.SetChainId,
            payload: chainId,
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
    getKeyringSnapAccounts,
    selectKeyringSnapAccount,
    getSmartAccount,
    createAccount,
    deleteAccount,
    setChainIdListener,
    getAccountActivity,
    getBundlerUrls,
    updateChainId,
    getWalletChainId,
  }
}