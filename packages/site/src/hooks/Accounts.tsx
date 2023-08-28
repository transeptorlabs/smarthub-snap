import { useContext } from 'react';
import { MetamaskActions, MetaMaskContext } from '.';
import { BundlerUrls, SmartAccountActivity, SmartContractAccount } from "../types";
import { bundlerUrls, fetchUserOpHashes, getAccountBalance, getChainId, getKeyringSnapRpcClient, getMMProvider, getScAccount, getSmartAccountActivity, getTxHashes, parseChainId, sendSupportedEntryPoints } from "../utils";
import { KeyringAccount } from "@metamask/keyring-api";
import { KeyringSnapRpcClient } from '@metamask/keyring-api';

export const useAcount = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const snapRpcClient: KeyringSnapRpcClient = getKeyringSnapRpcClient();

  const getKeyringSnapAccounts = async (): Promise<KeyringAccount[]> => {
    const accounts = await snapRpcClient.listAccounts();
    const pendingRequests = await snapRpcClient.listRequests();
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
    return selectedKeyringAccount;
  };

  const updateAccountBalance = async (account: string): Promise<string> => {
    const balance = await getAccountBalance(account)
    dispatch({
      type: MetamaskActions.SetSelectedAccountBalance,
      payload: balance,
    });
    return balance;
  };

  const createAccount = async (accountName: string) => {
    const newAccount = await snapRpcClient.createAccount(accountName);
    await getKeyringSnapAccounts()
    return newAccount
  };

  const deleteAccount = async (keyringAccountId: string) => {
    await snapRpcClient.deleteAccount(keyringAccountId);
    await getKeyringSnapAccounts()
  };

  const sendRequest = async (keyringAccountId: string, method: string, params: any[] = []) => {
    await snapRpcClient.submitRequest({
      account: keyringAccountId,
      scope: `eip155:${parseChainId(state.chainId)}`,
      request: {
        id: `rq:${keyringAccountId}`,
        jsonrpc: '2.0',
        method,
        params: params,
      }
    });
    await getKeyringSnapAccounts()
  };

  const approveRequest = async (requestId: string) => {
    await snapRpcClient.approveRequest(requestId);
    await getKeyringSnapAccounts()
  };

  const rejectRequest = async (requestId: string) => {
    await snapRpcClient.rejectRequest(requestId);
    await getKeyringSnapAccounts()
  };

  const getSmartAccount = async (keyringAccountId: string): Promise<SmartContractAccount> => {
    const [scAccount, supportedEntryPoints] = await Promise.all([
      getScAccount(keyringAccountId),
      sendSupportedEntryPoints(),
    ]);

    console.log('getSmartAccount result:', scAccount, supportedEntryPoints)

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
    const userOpHashes = await fetchUserOpHashes(keyringAccountId);
    const txHashes = await getTxHashes(keyringAccountId, state.chainId);
    const result: SmartAccountActivity = await getSmartAccountActivity(userOpHashes, txHashes);
    console.log('getAccountActivity result:', result)
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
    dispatch({
      type: MetamaskActions.SetChainId,
      payload: chainId ? chainId : await getChainId(),
    });
  };

  const getWalletChainId = async (): Promise<string> => {
    return await getChainId()
  };

  const setChainIdListener = async () => {
    if (!state.isChainIdListener) {   
      const provider = getMMProvider()
      if (provider) {
        provider.on('chainChanged', async (chainId) => {
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
    sendRequest,
    approveRequest,
    rejectRequest,
    updateAccountBalance,
  }
}