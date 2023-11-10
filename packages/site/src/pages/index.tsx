import { useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { MetamaskActions, MetaMaskContext, useAcount } from '../hooks';
import {
  connectSnap,
  getSnap,
  shouldDisplayReconnectButton,
  convertToEth, 
  clearActivityData,
  parseChainId,
  addBundlerUrl,
  getUserOperationReceipt,
  notify,
} from '../utils';
import {
  ConnectSnapButton,
  InstallFlaskButton,
  ReconnectButton,
  Card,
  CommonInputForm,
  SimpleButton,
  TabMenu,
  BundlerInputForm,
  AccountActivityDisplay,
  Faq,
  Modal,
  EthereumTransactionModalComponent,
  TransactionType,
  ModalType,
} from '../components';
import { AppTab, BundlerUrls, SupportedChainIdMap } from '../types';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 1.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 64.8rem;
  width: 100%;
  height: 100%;
  margin-top: 1.5rem;
`;

const Notice = styled.div`
  background-color: ${({ theme }) => theme.colors.background.alternative};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  color: ${({ theme }) => theme.colors.text.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;

  & > * {
    margin: 0;
  }
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 1.2rem;
    padding: 1.6rem;
  }
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error.muted};
  border: 1px solid ${({ theme }) => theme.colors.error.default};
  color: ${({ theme }) => theme.colors.error.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;

const LineBreak = styled.hr`
  color: ${(props) => props.theme.colors.primary};
  border: solid 1px ${(props) => props.theme.colors.border.default};
  width: 60%;
  ${({ theme }) => theme.mediaQueries.small} {
    width: 80%;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;

  ${({ theme }) => theme.mediaQueries.small} {
    flex-direction: column;
  }
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.large};
  margin: 0;
  margin-bottom: 0rem;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [formBundlerUrls, setFormBundlerUrls] = useState({} as BundlerUrls);
  const [accountName, setAccountName] = useState('');
  const [accountNameDelete, setAccountNameDelete] = useState('');
  const [modalOpenTransaction, setModalOpenTransaction] = useState(false);
  const transactionRef = useRef<any>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.Deposit);

  const {
    getKeyringSnapAccounts, 
    createAccount, 
    deleteAccount, 
    selectKeyringSnapAccount,
    getSmartAccount,
    getAccountActivity,
    getBundlerUrls,
    updateChainId,
    setChainIdListener,
    updateAccountBalance,
  } = useAcount();

  useEffect(() => {
    async function initNetwork() {
      if (state.isFlask) {
        await updateChainId()
        await setChainIdListener()
      }
    }

    initNetwork().catch((error) => dispatch({ type: MetamaskActions.SetError, payload: error }));
  }, [state.isFlask]);

  useEffect(() => {
    async function initAccounts() {
      if (state.installedSnap) {
        const account = await getKeyringSnapAccounts()
        await handleFetchBundlerUrls()
        if (account.length > 0) {
          await selectKeyringSnapAccount(account[0]);
          await getSmartAccount(account[0].id);
          await updateAccountBalance(account[0].address);
          await getAccountActivity(account[0].id);
        }
      }
    }

    initAccounts().catch((error) => dispatch({ type: MetamaskActions.SetError, payload: error }));
  }, [state.installedSnap]);

  // realtime refresh - refreshes account activity every 10 seconds
  useEffect(() => {
    let interval: any
    try {  
      interval = setInterval(async () => {
        if (state.accountActivity.length > 0) {
          const accountActivity = state.accountActivity
          for (const activity of accountActivity) {
            if (activity.userOpHash !== '' && activity.userOperationReceipt === null) {
              const userOpReceipt = await getUserOperationReceipt(activity.userOpHash)

              if (userOpReceipt !== null) {
                notify('Transaction confirmed (userOpHash)', 'View activity for details.', activity.userOpHash)
              }
              activity.userOperationReceipt = userOpReceipt
            }
          }
          
          dispatch({
            type: MetamaskActions.SetAccountActivity,
            payload: accountActivity,
          });
        }
      }, 10000) // 10 seconds
  
      return () => {
        clearInterval(interval);
      };

    } catch (e) {
      console.error('[ERROR] refreaher:', e.message);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    } 
  }, [state.accountActivity]);

  // realtime refresh - refreshes account balances every 5 seconds
  useEffect(() => {
    let interval: any
    try {  
      interval = setInterval(async () => {
        if (state.scAccount.connected === true) {
          await getSmartAccount(state.selectedSnapKeyringAccount.id);
          await updateAccountBalance(state.selectedSnapKeyringAccount.address);
        }
      }, 5000) // 5 seconds
  
      return () => {
        clearInterval(interval);
      };

    } catch (e) {
      console.error('[ERROR] refreaher:', e.message);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    } 
  }, [state.selectedSnapKeyringAccount, state.scAccount]);

  const handleFetchBundlerUrls = async () => {
    const urls = await getBundlerUrls();
    setFormBundlerUrls(urls);
  };

  const createBundlerUrlForm = () => {
    return (
      <div>
        {Object.entries(formBundlerUrls).map(([chainId, url]) => (
          <BundlerInputForm
            key={chainId}
            onSubmitClick={(e)=> handleBundlerUrlSubmit(e, chainId)}
            buttonText="Save"
            onInputChange={(e)=> handleBundlerUrlChange(e, chainId)}
            inputValue={url}
            inputPlaceholder="Enter url"
            networkName={SupportedChainIdMap[chainId] ? SupportedChainIdMap[chainId].name : 'Unknown'}
            chainId={parseChainId(chainId).toString()}
        />
        ))}
      </div>
    );
  };

  // Click handlers
  const handleReConnectSnapClick = async (event: any) => {
    try {
      event.preventDefault();
      await connectSnap();
      const installedSnap = await getSnap();
      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });

    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleCreateAccount = async (event: any) => {
    event.preventDefault();
    const newAccount = await createAccount(accountName)
    await selectKeyringSnapAccount(newAccount);
    await getSmartAccount(newAccount.id);
    await updateAccountBalance(newAccount.address);
    setAccountName('')
  };

  const handleDeleteAccount = async (event: any) => {
    event.preventDefault();
    let keyringAccountIdFound = ''
    state.snapKeyring.accounts.forEach(account => {
      if (account.name === accountNameDelete)
      keyringAccountIdFound =  account.id
    })

    if (keyringAccountIdFound === '') {
      dispatch({ type: MetamaskActions.SetError, payload: new Error('Account name not found.') });
    } else {
      await deleteAccount(keyringAccountIdFound)

      // update selected to first account when the deleted account it the current selected account
      if(keyringAccountIdFound === state.selectedSnapKeyringAccount.id) {
        const accounts = await getKeyringSnapAccounts()
        if (accounts.length > 0) {
          await selectKeyringSnapAccount(accounts[0]);
          await getSmartAccount(accounts[0].id);
          await getAccountActivity(accounts[0].id);
        } else {
          dispatch({ type: MetamaskActions.SetClearAccount, payload: true })
        }
      }
      setAccountNameDelete('')
    }
  };

  const handleDepositClick = async (e: any) => {
    e.preventDefault();
    setTransactionType(TransactionType.Deposit)
    setModalOpenTransaction(true)
  }

  const handleWithdrawClick = async (e: any) => {
    e.preventDefault();
    setTransactionType(TransactionType.Withdraw)
    setModalOpenTransaction(true)
  }

  const handleClearActivity = async (e: any) => {
    e.preventDefault();
    await clearActivityData();
    await handleFetchBundlerUrls();
  }

  const handleBundlerUrlSubmit = async (e: any, chainId: string) => {
    e.preventDefault();
    await addBundlerUrl(chainId, formBundlerUrls[chainId]);
    await handleFetchBundlerUrls();
  }

  // Form input handlers
  const handleBundlerUrlChange = async (e: any, chainId: string) => {
    const inputValue = e.target.value;
    setFormBundlerUrls({
      ...formBundlerUrls,
      [chainId]: inputValue,
    })
  }

  const handleAccountNameChange = async (e: any) => {
    setAccountName(e.target.value);
  }

  const handleAccountNameDelete = async (e: any) => {
    setAccountNameDelete(e.target.value);
  }

  const closeTransactionModal = () => {
    setModalOpenTransaction(false);
  };

  return (
    <Container>
      <TabMenu></TabMenu>
      <LineBreak></LineBreak>

      {/* Init state */}
      <CardContainer>
        {!state.isFlask && (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}

        {!state.installedSnap && (
          <Card
            content={{
              title: 'Connect ERC-4337 Relayer',
              description: 'Features include:',
              listItems: [
                'Access and control smart accounts with MetaMask. Enjoy smart contract functionality with ease and convenience.',
                'Manage ERC-4337 accounts(create, sign, send, transfer funds)',
                'Manage stake and deposit with supported entrypoint contracts',
              ],
              button: <ConnectSnapButton onClick={handleReConnectSnapClick}/>
            }}
            disabled={!state.isFlask}
            fullWidth
          />
        )}
      </CardContainer>
  
      {/* Error message display*/}
      {state.error && (
        <ErrorMessage>
          <b>An error happened:</b> {state.error.message}
        </ErrorMessage>
      )}

      {/* Account tab (smart account details, deposit, withdraw, smart account activity)*/}
      {state.activeTab === AppTab.SmartAccount && (
        <CardContainer ref={transactionRef}>
          {state.scAccount.connected && state.installedSnap && (
            <Card
              content={{
                title: 'Smart Account',
                description: `${state.scAccount.address}`,
                descriptionBold: `${state.selectedSnapKeyringAccount.name}`,
                stats: [
                  {
                    id: `1`,
                    title: 'Deposit',
                    value: `${convertToEth(state.scAccount.deposit)} ETH`,
                  },
                  {
                    id: `2`,
                    title: 'Balance',
                    value: `${convertToEth(state.scAccount.balance)} ETH`,
                  },
                ],
                custom: 
                <ButtonContainer>
                  <SimpleButton text='Deposit' onClick={(e: any) => {handleDepositClick(e)}}></SimpleButton>
                  <SimpleButton text='Withdraw' onClick={(e: any) => {handleWithdrawClick(e)}}></SimpleButton>
                  <SimpleButton text='Send' onClick={(e: any) => {() =>{}}}></SimpleButton>
                  <SimpleButton text='Bridge' onClick={(e: any) => {() =>{}}}></SimpleButton>
                </ButtonContainer>
              }}
              disabled={!state.isFlask}
              copyDescription
              isAccount
              isSmartAccount
              fullWidth
              showTooltip
            />
          )}

          <Modal modalType={ModalType.Transaction} isOpen={modalOpenTransaction} buttonRef={transactionRef} onClose={closeTransactionModal} top={100} right={0}>
            <EthereumTransactionModalComponent  transactionType={transactionType}/>
          </Modal>
          
          {state.scAccount.connected && state.installedSnap && (
            <Card
              content={{
                title: 'Activity',
                custom: <AccountActivityDisplay />,
              }}
              disabled={!state.isFlask}
              fullWidth
            />
          )}

          {state.installedSnap && state.snapKeyring.accounts.length === 0 && (
            <Card
              content={{
                title: 'Create a Smart Account',
                custom: 
                  <CommonInputForm
                    key={"create"}
                    buttonText="Create"
                    onSubmitClick={handleCreateAccount}
                    inputs={[
                      {
                        id: "1",
                        onInputChange: handleAccountNameChange,
                        inputValue: accountName,
                        inputPlaceholder:"Enter account name",
                        type: 'text',
                      }
                    ]}
                  />,
              }}
              disabled={!state.isFlask}
              fullWidth
            />
          )}

          <Title>FAQ</Title>
          <Card
            content={{
              custom: <Faq queston={'What is ERC-4337 Relayer?  '} description={'bahhahah'} />
            }}
            fullWidth
          />

          <Card
            content={{
              custom: <Faq queston={'How does is ERC-4337 Relayer work?'} description={'bahhahah'} />
            }}
            fullWidth
          />
        </CardContainer>
      )}

      {/* Mangement tab */}
      {state.activeTab === AppTab.Management && (
        <CardContainer>
          {state.installedSnap && (
            <Card
              content={{
                title: 'Create a Smart Account',
                custom:
                  <CommonInputForm
                    key={"create"}
                    buttonText="Create"
                    onSubmitClick={handleCreateAccount}
                    inputs={[
                      {
                        id: "1",
                        onInputChange: handleAccountNameChange,
                        inputValue: accountName,
                        inputPlaceholder:"Enter account name",
                        type: 'text',
                      }
                    ]}
                  />,
              }}
              disabled={!state.isFlask}
              fullWidth
            />
          )}

          {state.installedSnap && state.snapKeyring.accounts.length > 0 && (
            <Card
              content={{
                title: 'Delete Smart Account',
                custom: 
                  <CommonInputForm
                    key={"delete"}
                    buttonText="delete"
                    onSubmitClick={handleDeleteAccount}
                    inputs={[
                      {
                        id: "1",
                        onInputChange: handleAccountNameDelete,
                        inputValue: accountNameDelete,
                        inputPlaceholder:"Enter account name",
                        type: 'text',
                      }
                    ]}
                  />,
              }}
              disabled={!state.isFlask}
              fullWidth
            />
          )}
        </CardContainer>
      )}

      {/* Setting tab */}
      {state.activeTab === AppTab.Settings && (
        <CardContainer>

          {state.installedSnap && (
            <Card
              content={{
                title: 'Bundler RPC Urls',
                description: 'A list of bundler RPC Url to relay your user operations.',
                custom: createBundlerUrlForm()
              }}
              disabled={!state.isFlask}
              fullWidth
            />
          )}

          {state.installedSnap && (
            <Card
              content={{
                title: 'ERC-4337 Relayer is installed and ready to use',
                description: `Installed with v${state.installedSnap.version}. Use MetaMask settings page, to see the more details on the installed snap.`,
              }}
              disabled={!state.isFlask}
              fullWidth
            />
          )}

          {shouldDisplayReconnectButton(state.installedSnap) && (
            <Card
              content={{
                title: 'Local dev - Reconnect snap',
                description:
                  'While connected to a local running snap this button will always be displayed in order to update the snap if a change is made.',
                button: (
                  <ReconnectButton
                    onClick={handleReConnectSnapClick}
                    disabled={!state.installedSnap}
                  />
                ),
              }}
              disabled={!state.installedSnap}
              fullWidth
            />
          )}

          {state.installedSnap && (
              <ErrorMessage>
                <p>This resets your smart account's activity and bundler Url inside the Snap. Your balances and incoming transactions won't change.</p>
              <SimpleButton text={'Clear activity data'} onClick={handleClearActivity}></SimpleButton>
            </ErrorMessage>
          )}
        </CardContainer>
      )}

      <Notice>
        <p>
          Please note that this snap is only available in MetaMask Flask,
          and is actively being developed by{' '}
          <a href="https://github.com/transeptorlabs" target="_blank">
            Transeptor Labs
          </a>
        </p>
      </Notice>
    </Container>
  );
};

export default Index;
