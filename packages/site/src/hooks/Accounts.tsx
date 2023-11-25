import { useContext } from 'react';
import { MetamaskActions, MetaMaskContext } from '.';
import { AccountActivity, BundlerUrls, SmartContractAccount } from "../types";
import { bundlerUrls, fetchUserOpHashes, connectedAccounts, getChainId, getKeyringSnapRpcClient, getMMProvider, getNextRequestId, getScAccount, getUserOperationReceipt, sendSupportedEntryPoints, listConnectedAccounts } from "../utils";
import { KeyringAccount } from "@metamask/keyring-api";
import { KeyringSnapRpcClient } from '@metamask/keyring-api';
import type { Json } from '@metamask/utils';

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

  const createAccount = async (accountName: string) => {
    const newAccount = await snapRpcClient.createAccount({
      name: accountName,
    });
    await getKeyringSnapAccounts()
    return newAccount
  };

  const deleteAccount = async (keyringAccountId: string) => {
    await snapRpcClient.deleteAccount(keyringAccountId);
    await getKeyringSnapAccounts()
  };

  const sendRequestSync = async (
    keyringAccountId: string,
    method: string,
    params: any[] = [],
  ): Promise<{
    pending: false;
    result: Json;
  }> => {
    const id = await getNextRequestId();
    const result = await snapRpcClient.submitRequest({
      id: id.toString(),
      account: keyringAccountId,
      scope: '',
      request: {
        method,
        params: params,
      },
    });
    return result as {
      pending: false;
      result: Json;
    };
  };

  const approveRequest = async (requestId: string) => {
    await snapRpcClient.approveRequest(requestId);
    await getKeyringSnapAccounts()
  };

  const rejectRequest = async (requestId: string) => {
    await snapRpcClient.rejectRequest(requestId);
    await getKeyringSnapAccounts()
  };

  const rejectAllPendingRequests = async () => {
    const pendingRequests = await snapRpcClient.listRequests();
    for (const rq of pendingRequests) {
      await snapRpcClient.rejectRequest(rq.id);
    }
    await getKeyringSnapAccounts()
  }

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

  const getAccountActivity = async (
    keyringAccountId: string,
  ): Promise<AccountActivity[]> => {
    const userOpHashes = await fetchUserOpHashes(keyringAccountId);
    const accountActivity: AccountActivity[] = []
    for (const userOpHash of userOpHashes) {
      accountActivity.push(
        {
          userOpHash,
          userOperationReceipt: await getUserOperationReceipt(userOpHash),
        }
      )
    }

    dispatch({
      type: MetamaskActions.SetAccountActivity,
      payload: accountActivity,
    });

    return accountActivity;
  };

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

  const updateConnectedAccounts = async () => {
    const accounts = await connectedAccounts();
    dispatch({
      type: MetamaskActions.SetConnectedAccounts,
      payload: accounts,
    });
  };

  const getConnectedAccounts = async () => {
    const accounts = await listConnectedAccounts();
    dispatch({
      type: MetamaskActions.SetConnectedAccounts,
      payload: accounts,
    });
  };

  const getWalletChainId = async (): Promise<string> => {
    return await getChainId()
  };

  const setWalletListener = async () => {
    if (!state.isWalletListener) {   
      const provider = getMMProvider()
      if (provider) {
        provider.on('chainChanged', async (chainId) => {
          dispatch({
            type: MetamaskActions.SetChainId,
            payload: chainId,
          });
        });

        provider.on('accountsChanged', async (accounts) => {
         dispatch({
            type: MetamaskActions.SetConnectedAccounts,
            payload: accounts,
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
    setWalletListener,
    getAccountActivity,
    getBundlerUrls,
    updateChainId,
    getWalletChainId,
    sendRequestSync,
    approveRequest,
    rejectRequest,
    rejectAllPendingRequests,
    updateConnectedAccounts,
    getConnectedAccounts,
  }
}