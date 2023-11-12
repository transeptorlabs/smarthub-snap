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
import snapPackageInfo from '../../../snap/package.json';
import packageInfo from '../../package.json';

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
      console.error('[ERROR] refresher:', e.message);
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
        }
      }, 5000) // 5 seconds
  
      return () => {
        clearInterval(interval);
      };

    } catch (e) {
      console.error('[ERROR] refresher:', e.message);
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
    try {
      event.preventDefault();
      const newAccount = await createAccount(accountName)
      await selectKeyringSnapAccount(newAccount);
      await getSmartAccount(newAccount.id);
      setAccountName('')
    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleDeleteAccount = async (event: any) => {
    try {
      event.preventDefault();
      let keyringAccountIdFound = ''
      state.snapKeyring.accounts.forEach(account => {
        if (account.options.name as string === accountNameDelete)
        keyringAccountIdFound =  account.id
      })
  
      if (keyringAccountIdFound === '') {
        dispatch({ type: MetamaskActions.SetError, payload: new Error('Account name not found.') });
      } else {
        await deleteAccount(keyringAccountIdFound)
  
        // update selected to first account when the deleted account it the current selected account
        if(keyringAccountIdFound === state.selectedSnapKeyringAccount.id) {
          const accounts = await getKeyringSnapAccounts()
          console.log('accounts after delet:', accounts)
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
    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleDepositClick = async (e: any) => {
    try {
      e.preventDefault();
      setTransactionType(TransactionType.Deposit)
      setModalOpenTransaction(true)
    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  }

  const handleWithdrawClick = async (e: any) => {
    try {
      e.preventDefault();
      setTransactionType(TransactionType.Withdraw)
      setModalOpenTransaction(true)
    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  }

  const handleClearActivity = async (e: any) => {
    try {
      e.preventDefault();
      await clearActivityData();
      await handleFetchBundlerUrls();
    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  }

  const handleBundlerUrlSubmit = async (e: any, chainId: string) => {
    try {
      e.preventDefault();
      await addBundlerUrl(chainId, formBundlerUrls[chainId]);
      await handleFetchBundlerUrls();
    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
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
              title: 'Connect SmartHub snap',
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
                description: `${state.selectedSnapKeyringAccount.address}`,
                descriptionBold: `${state.selectedSnapKeyringAccount.options.name}`,
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
                  {/* TODO: Comment for now until we can support these features */}
                  {/* <SimpleButton text='Deposit' onClick={(e: any) => {handleDepositClick(e)}}></SimpleButton> */}
                  {/* <SimpleButton text='Withdraw' onClick={(e: any) => {handleWithdrawClick(e)}}></SimpleButton> */}
                  {/* <SimpleButton text='Send' onClick={(e: any) => {() =>{}}}></SimpleButton>
                  <SimpleButton text='Bridge' onClick={(e: any) => {() =>{}}}></SimpleButton> */}
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
              custom: <Faq queston={'What is ERC-4337?'} description={'ERC-4337 is a higher-layer infrastructure for Ethereum to allow account abstraction. This will allows user to use a smart contract account to handle all network interactions. ERC-4337 introduces a new transaction called a UserOperation. Users will send signed UserOperations to a network of nodes called a Bundlers. Bundlers, will send these transactions to Entrypoint smart contract to execute the UserOperations. ERC-4337 also introduces paymaster smart contracts to allow transaction sponsorship. With paymaster users have gasless transactions or pay gas fees with ERC-20 tokens.'} />
            }}
            fullWidth
          />

          <Card
            content={{
              custom: <Faq queston={'What is a smart account?'} description={'Smart Accounts are a new type of account introduced by the ERC-4337 standard. This will allows user to use a smart contract account to handle all network interactions. Smart Accounts offer several advantages over EOAs such as programmability, improved security, and improved user experience.'} />
            }}
            fullWidth
          />

          <Card
            content={{
              custom: <Faq queston={'How is does smart account ownership work?'} description={'Smart accounts are own by Ethereum EOAs. EOAs are used to sign all user Operations for a smart account.'} />
            }}
            fullWidth
          />
          <Card
            content={{
              custom: <Faq queston={'Why SmartHub snap needed?'} description={'Account abstraction introduces new core components to make managing crypto simple. It has potential, but it can be difficult for developers and users to use all its core components. We have a solution that simplifies interacting with those core components.'} />
            }}
            fullWidth
          />
          <Card
            content={{
              custom: <Faq queston={'What is SmartHub snap?'} description={'SmartHub is a snap that makes it easy for developers and MetaMask wallet users to use ERC-4337 without dealing with its complexity.'} />
            }}
            fullWidth
          />

          <Card
            content={{
              custom: <Faq queston={'How does is SmartHub snap work?'} description={'The snap adds extra features to MetaMask by including RPC methods that work with ERC-4337 core components.'} />
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
                title: 'Snap Info',
                listItems: [
                  `Snap version(installed): ${state.installedSnap.version}`,
                  `Snap version(expected): ${snapPackageInfo.version}`,
                  `Dapp version: ${packageInfo.version}`
                ],
              }}
              disabled={!state.isFlask}
              fullWidth
            />
          )}

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
          Please note that this SmartHub snap is only available in MetaMask Flask,
          and is actively being developed by{' '}
          <a href="https://github.com/transeptorlabs" target="_blank">
            Transeptor Labs.
          </a>
          {' '}Learn more about ERC4337 at {' '}
          <a href="https://www.erc4337.io/" target="_blank">
          https://www.erc4337.io/
          </a>
        </p>
      </Notice>
      
    </Container>
  );
};

export default Index;
