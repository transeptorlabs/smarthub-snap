import { useContext, useEffect, useState } from 'react';
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
  convertToWei,
  estimateGas,
  getMMProvider,
  getUserOpCallData,
  estimatCreationGas,
  estimateUserOperationGas,
  getDummySignature,
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
  AccountRequestDisplay,
  AccountActivity,
  Faq,
} from '../components';
import { AppTab, BundlerUrls, SupportedChainIdMap } from '../types';
import { BigNumber, ethers } from 'ethers';
import { EntryPoint__factory, UserOperationStruct } from '@account-abstraction/contracts';

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
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [formBundlerUrls, setFormBundlerUrls] = useState({} as BundlerUrls);
  const [accountName, setAccountName] = useState('');
  const [accountNameDelete, setAccountNameDelete] = useState('');

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
    sendRequest,
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
          await getAccountActivity(account[0].id);
          await updateAccountBalance(account[0].address);
        }
      }
    }

    initAccounts().catch((error) => dispatch({ type: MetamaskActions.SetError, payload: error }));
  }, [state.installedSnap]);


  // useEffect(() => {
  //   let interval: any
  //   try {  
  //     interval = setInterval(async () => {
  //       if (state.eoa.connected === true && state.scAccount.connected === true) {
  //         await Promise.all([
  //           refreshEOAState(state.eoa.address),
  //           getScAccountState(state.eoa.address),
  //           getAccountActivity(state.eoa.address, Number(state.scAccount.index)),
  //         ]);
  //       }
  //     }, 10000) // 10 seconds
  
  //     return () => {
  //       clearInterval(interval);
  //     };

  //   } catch (e) {
  //     console.error('[ERROR] refreaher:', e.message);
  //     dispatch({ type: MetamaskActions.SetError, payload: e });
  //   } 
  // }, [state.eoa, state.scAccount, state.smartAccountActivity]);


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

  const handleDepositSubmit = async (e: any) => {
    try {
      e.preventDefault();
      const depositInWei = convertToWei(depositAmount);
  
      // check the owner account has enough balance
      if (BigNumber.from(state.selectedAccountBalance).lt(depositInWei)) {
        dispatch({ type: MetamaskActions.SetError, payload: new Error('owner account has, insufficient funds.') });
        return;
      }
      
      const provider = new ethers.providers.Web3Provider(getMMProvider() as any);
      const entryPointContract = new ethers.Contract(state.scAccount.entryPoint, EntryPoint__factory.abi)

      // estimate gas 
      const feeData = await provider.getFeeData()
      const encodedFunctionData = entryPointContract.interface.encodeFunctionData('depositTo', [state.scAccount.address]);
      const estimateGasAmount = await estimateGas(
        state.selectedSnapKeyringAccount.address,
        state.scAccount.entryPoint,
        encodedFunctionData,
      );
 
      // set transation data (eth transaction type 2)
      const transactionData = await entryPointContract.populateTransaction.depositTo(state.scAccount.address, {
        type: 2,
        nonce: await provider.getTransactionCount(state.selectedSnapKeyringAccount.address, 'latest'),
        gasLimit: estimateGasAmount.toNumber(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? BigNumber.from(0),
        maxFeePerGas: feeData.maxFeePerGas ?? BigNumber.from(0),
        value: depositInWei.toString(),
      })
      transactionData.chainId = parseChainId(state.chainId)
  
      // send request to keyring for approval
      await sendRequest(
        state.selectedSnapKeyringAccount.id,
        'eth_signTransaction',
        [state.selectedSnapKeyringAccount.address, transactionData] // [from, transactionData]
      );

      setDepositAmount('');
    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  }

  const handleWithdrawSubmit = async (e: any) => {
    e.preventDefault();
    const withdrawAmountInWei = convertToWei(withdrawAmount);

    // check the smart account has enough deposit
    if (BigNumber.from(state.scAccount.deposit).lt(withdrawAmountInWei)) {
      dispatch({ type: MetamaskActions.SetError, payload: new Error('Smart contract account, insufficient deposit') });
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(getMMProvider() as any);
      const entryPointContract = new ethers.Contract(state.scAccount.entryPoint, EntryPoint__factory.abi)

      // get call data
      const callData = await getUserOpCallData(
        state.selectedSnapKeyringAccount.id,
        entryPointContract.address,
        BigNumber.from(0),
        entryPointContract.interface.encodeFunctionData('withdrawTo', [state.selectedSnapKeyringAccount.address, withdrawAmountInWei.toString()]) // users intent(contract they want to interact with)
      )

      // set transation data (user operation)   
      const userOpToSign: UserOperationStruct = {
        sender: state.scAccount.address,
        nonce: state.scAccount.nonce.toHexString(),
        initCode: state.scAccount.initCode,
        callData: callData,
        callGasLimit: BigNumber.from(0).toHexString(),
        verificationGasLimit: BigNumber.from(0).toHexString(),
        preVerificationGas: BigNumber.from(0).toHexString(),
        maxPriorityFeePerGas: BigNumber.from(0).toHexString(),
        maxFeePerGas: BigNumber.from(0).toHexString(),
        paymasterAndData: '0x', // no paymaster
        signature: '0x'
      }

      // get dummy signature
      userOpToSign.signature = await getDummySignature(userOpToSign, entryPointContract.address)

      // get gas fee
      const feeData = await provider.getFeeData()
      const initGas = await estimatCreationGas(state.selectedSnapKeyringAccount.id)
      const estimatGasResult = await estimateUserOperationGas(userOpToSign)
      
      userOpToSign.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas.toHexString(): BigNumber.from(0).toHexString()
      userOpToSign.maxFeePerGas = feeData.maxFeePerGas ? feeData.maxFeePerGas.toHexString() : BigNumber.from(0).toHexString()
      userOpToSign.callGasLimit = estimatGasResult.callGasLimit.toHexString()
      userOpToSign.verificationGasLimit = estimatGasResult.verificationGas.add(initGas).toHexString()
      userOpToSign.preVerificationGas = estimatGasResult.preVerificationGas.add(initGas).toHexString()
    
      // send request to keyring for approval
      await sendRequest(
        state.selectedSnapKeyringAccount.id,
        'eth_sendTransaction',
        [state.selectedSnapKeyringAccount.address, userOpToSign] // [from, transactionData]
      );

      setWithdrawAmount('');
    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
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
  const handleDepositAmountChange = async (e: any) => {
    // Regular expression to match only numbers
    const inputValue = e.target.value;
    const numberRegex = /^\d*\.?\d*$/;
    if (inputValue === '' || numberRegex.test(inputValue)) {
      setDepositAmount(e.target.value);
    }
  }

  const handleWithdrawAmountChange = async (e: any) => {
    // Regular expression to match only numbers
    const inputValue = e.target.value;
    const numberRegex = /^\d*\.?\d*$/;
    if (inputValue === '' || numberRegex.test(inputValue)) {
      setWithdrawAmount(e.target.value);
    }
  }

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
        <CardContainer>
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
              }}
              disabled={!state.isFlask}
              copyDescription
              isAccount
              isSmartAccount
              fullWidth
              showTooltip
            />
          )}

          {state.scAccount.connected && state.installedSnap && (
            <Card
              content={{
                title: 'Deposit',
                descriptionBold: '(sender)',
                description: `${state.selectedSnapKeyringAccount.address}`,
                stats: [
                  {
                    id: `1`,
                    title: 'Balance',
                    value: `${convertToEth(state.selectedAccountBalance)} ETH`,
                  },
                ],
                custom: <CommonInputForm
                  key={"send-deposit"}
                  onSubmitClick={handleDepositSubmit}
                  buttonText="Deposit"
                  inputs={[
                      {
                        id: "1",
                        onInputChange: handleDepositAmountChange,
                        inputValue: depositAmount,
                        inputPlaceholder:"Enter amount"
                      }
                    ]
                  }
                />
              }}
              copyDescription
              isAccount
              disabled={!state.isFlask}
              fullWidth
              showTooltip
            />
          )}

          {state.scAccount.connected && state.installedSnap && (
            <Card
              content={{
                title: 'Withdraw',
                description: `Withdraw deposit from smart account`,
                custom: <CommonInputForm
                  key={"send-withdraw"}
                  onSubmitClick={handleWithdrawSubmit}
                  buttonText="Withdraw"
                  inputs={[
                      {
                        id: "1",
                        onInputChange: handleWithdrawAmountChange,
                        inputValue: withdrawAmount,
                        inputPlaceholder:"Enter amount"
                      },
                    ]
                  }
                />
              }}
              disabled={!state.isFlask}
              fullWidth
              showTooltip
            />
          )}

          {state.selectedSnapKeyringAccount.id && state.installedSnap && (
            <Card
              content={{
                title: 'Pending Request',
                custom: <AccountRequestDisplay />
              }}
              disabled={!state.isFlask}
              fullWidth
            />
          )}
          
          {state.scAccount.connected && state.installedSnap && (
            <Card
              content={{
                title: 'Activity',
                custom: <AccountActivity />,
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
                        inputPlaceholder:"Enter account name"
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
                        inputPlaceholder:"Enter account name"
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
                        inputPlaceholder:"Enter account name"
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
