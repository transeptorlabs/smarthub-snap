import { useContext, useState } from 'react';
import styled from 'styled-components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import {
  connectSnap,
  getSnap,
  getScAccount,
  sendSupportedEntryPoints,
  shouldDisplayReconnectButton,
  getMMProvider,
  connectWallet, 
  convertToEth, 
  convertToWei, 
  estimateGas, 
  getAccountBalance,
  isValidAddress, 
  encodeFunctionData,
  getEntryPointContract,
  sendUserOperation,
  clearActivityData,
  getChainId,
} from '../utils';
import {
  ConnectSnapButton,
  InstallFlaskButton,
  ReconnectButton,
  Card,
  TokenInputForm,
  SimpleButton,
  TabMenu,
} from '../components';
import { BigNumber, ethers } from 'ethers';
import { EOA } from '../types/erc-4337';
import { AppTab } from '../types';

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

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 0;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
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

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [depositAmount, setDepositAmount] = useState('');
  const [withDrawAddr, setWithDrawAddr] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const handleReConnectSnapClick = async () => {
    try {
      // connect wallet
      let eoa: EOA = {
        address: '',
        balance: '',
        connected: false,
      }
      if (!state.eoa.connected) {
        eoa = await connectWallet()
        dispatch({
          type: MetamaskActions.SetEOA,
          payload: eoa,
        });
      }

      // get chainId
     const chainId = await getChainId();
     dispatch({
       type: MetamaskActions.SetChainId,
       payload: chainId,
     });

      // set listener
      if (!state.isChainIdListener) {
        const provider = getMMProvider()
        if (provider) {
          provider.on('chainChanged', async (chainId) => {
            dispatch({
              type: MetamaskActions.SetChainId,
              payload: chainId,
            });
          });

          provider.on('accountsChanged', async (accounts) => {
            await refreshEOAState((accounts as string[])[0]);
          });
  
          dispatch({
            type: MetamaskActions.SetWalletListener,
            payload: true,
          });
        }
      }

      // reconnect snap
      await connectSnap();
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });

      // fetch sc account state
      await refreshScAccountState();
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const refreshEOAState = async (newOwner: string) => {
    const changedeoa: EOA = {
      address: newOwner,
      balance: await getAccountBalance(newOwner),
      connected: true,
    }
    dispatch({
      type: MetamaskActions.SetEOA,
      payload: changedeoa,
    });

    // fetch sc account state
    await refreshScAccountState();
  };

  const refreshScAccountState = async () => {
    const [scAccount, supportedEntryPoints] = await Promise.all([
      getScAccount(),
      sendSupportedEntryPoints(),
    ]);
    console.log('scAccount(page)', scAccount);

    dispatch({
      type: MetamaskActions.SetScAccount,
      payload: scAccount,
    });

    dispatch({
      type: MetamaskActions.SetSupportedEntryPoints,
      payload: supportedEntryPoints,
    });
  };

  const handleDepositSubmit = async (e: any) => {
    e.preventDefault();
    const depositInWei = convertToWei(depositAmount);

    // check the owner account has enough balance
    if (BigNumber.from(state.eoa.balance).lt(depositInWei)) {
      dispatch({ type: MetamaskActions.SetError, payload: new Error('Owner accout has, insufficient funds') });
      return;
    }
    
    const entryPointContract = getEntryPointContract(state.scAccount.entryPoint);

    // estimate gas
    const encodedFunctionData = await encodeFunctionData(
      getEntryPointContract(state.scAccount.entryPoint),
      'depositTo',
      [state.scAccount.address]
    );
    const estimateGasAmount = await estimateGas(
      state.eoa.address,
      state.scAccount.entryPoint,
      encodedFunctionData,
    );

    const provider = new ethers.providers.Web3Provider(getMMProvider() as any);

    const overrides = {
      value: depositInWei.toString(),
      gasPrice: await provider.getGasPrice(),
      gasLimit: estimateGasAmount.toNumber(),
    };
    const result = await entryPointContract.depositTo(state.scAccount.address, overrides).catch((error: any) => dispatch({ type: MetamaskActions.SetError, payload: error }));
    if (!result) {
      return;
    }
    const rep = await result.wait();
    
    // refresh account balances
    setDepositAmount('');
    await refreshEOAState(state.eoa.address);
    await refreshScAccountState();
  }

  const handleWithdrawSubmit = async (e: any) => {
    e.preventDefault();
    const withdrawAmountInWei = convertToWei(withdrawAmount);
    if (!isValidAddress(withDrawAddr)) {
      dispatch({ type: MetamaskActions.SetError, payload: new Error('Invalid address') });
      return;
    }

    if (BigNumber.from(state.scAccount.depoist).lt(withdrawAmountInWei)) {
      dispatch({ type: MetamaskActions.SetError, payload: new Error('Smart contract account, insufficient deposit') });
      return;
    }

    try {
      const encodedFunctionData = await encodeFunctionData(
        getEntryPointContract(state.scAccount.entryPoint),
        'withdrawTo',
        [state.eoa.address, withdrawAmountInWei.toString()]
      );

      const userOpHash = await sendUserOperation(
        state.scAccount.entryPoint,
        encodedFunctionData,
        state.scAccount.index,
      )

      dispatch({
        type: MetamaskActions.SetUserOpHash,
        payload: userOpHash,
      });

      setWithdrawAmount('');
      setWithDrawAddr('');
      await refreshScAccountState();
    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  }

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

  const handleWithdrawAddrChange = async (e: any) => {
    const inputValue = e.target.value;
    const charRegex = /^[A-Za-z0-9.]*$/;
    if (inputValue === '' || charRegex.test(inputValue)) {
      setWithDrawAddr(e.target.value);
    }
  }

  const handleClearActivity = async (e: any) => {
    e.preventDefault();
    await clearActivityData();
    await refreshScAccountState();
  }

  return (
    <Container>
      <TabMenu></TabMenu>
      <LineBreak></LineBreak>

      {/* Error message */}
      {state.error && (
        <ErrorMessage>
          <b>An error happened:</b> {state.error.message}
        </ErrorMessage>
      )}

      {/* About tab */}
      {state.activeTab === AppTab.About && (
        <CardContainer>
          <Card
            content={{
              title: 'Why',
              description: `ERC-4337: Account abstraction introduces new core components to make managing crypto simple. It has potential, but it can be difficult for developers and users to use all its core components. We have a solution that simplifies interacting with those core components.`,
            }}
            fullWidth
          />
          <Card
            content={{
              title: 'What',
              description: `ERC-4337 Relayer is a snap that makes it easy for developers and MetaMask wallet users to use ERC-4337 without dealing with its complexity.`,
            }}
            fullWidth
          />
          <Card
            content={{
              title: 'How',
              description:
                'The snap adds extra features to MetaMask by including RPC methods that work with ERC-4337 core components.',
            }}
            fullWidth
          />
        </CardContainer>
      )}
      
      {/* Install tab */}
      {state.activeTab === AppTab.Install && (
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
                title: 'Enable ERC-4337: Account Abstraction capabilities',
                description: 'Features include:',
                listItems: [
                  'Relay user operations inside of MetaMask',
                  'Manage ERC-4337 accounts(create, sign, send, transfer funds)',
                  'Wraps all eth ERC-4337 namespace rpc methods',
                  'Manage stake an deposit with supported entrypoint contracts',
                ],
                button: (
                  <ConnectSnapButton
                    onClick={handleReConnectSnapClick}
                    disabled={!state.isFlask}
                  />
                ),
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
                title: 'Reconnect snap',
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
        </CardContainer>
      )}

      {/* Account tab */}
      {state.activeTab === AppTab.Account && (
        <CardContainer>
          {state.eoa.connected && (
            <Card
              content={{
                descriptionBold: 'Connected EOA',
                description: `${state.eoa.address}`,
                stats: [
                  {
                    id: `1`,
                    title: 'Balance',
                    value: `${convertToEth(state.eoa.balance)} ETH`,
                  },
                ],
                form: [
                  <TokenInputForm
                    key={"deposit"}
                    buttonText="Add Deposit"
                    onSubmitClick={handleDepositSubmit}
                    inputs={[
                      {
                        id: "1",
                        onInputChange: handleDepositAmountChange,
                        inputValue: depositAmount,
                        inputPlaceholder:"Enter amount"
                      }
                    ]}
              
                  />,
                ],
              }}
              disabled={!state.isFlask}
              copyDescription
              isAccount
              fullWidth
            />
          )}

          {state.scAccount.connected && state.installedSnap && (
            <Card
              content={{
                description: `${state.scAccount.address}`,
                descriptionBold: 'Transeptor Deposit Account',
                stats: [
                  {
                    id: `0`,
                    title: 'Deposit',
                    value: `${convertToEth(state.scAccount.depoist)} ETH`,
                  },
                ],
                form: [
                  <TokenInputForm
                  key={"withdraw"}
                  onSubmitClick={handleWithdrawSubmit}
                  buttonText="Withdraw Deposit"
                  inputs={[
                      {
                        id: "1",
                        onInputChange: handleWithdrawAddrChange,
                        inputValue: withDrawAddr,
                        inputPlaceholder:"Enter address"
                      },
                      {
                        id: "2",
                        onInputChange: handleWithdrawAmountChange,
                        inputValue: withdrawAmount,
                        inputPlaceholder:"Enter amount"
                      }
                    ]
                  }
                />
                ]
              }}
              disabled={!state.isFlask}
              copyDescription
              isAccount
              fullWidth
            />
          )}

          {state.scAccount.connected && state.installedSnap && (
            <Card
              content={{
                title: 'Activity',
                userOperationReceipts: state.scAccount.userOperationReceipts,
              }}
              disabled={!state.isFlask}
              fullWidth
            />
          )}
        </CardContainer>
      )}

      {/* Playground tab */}
      {state.activeTab === AppTab.Playground && (
        <CardContainer>
          {state.scAccount.connected && state.installedSnap && (
              <Card
                content={{
                  title: 'User Operations Builder',
                  description: 'Coming soon...',
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
          {state.installedSnap && state.scAccount.connected && (
              <ErrorMessage>
                <p>This resets your depoist account's activity data inside the snap. Your balances and incoming transactions won't change.</p>
              <SimpleButton text={'Clear activity data'} onClick={handleClearActivity}></SimpleButton>
            </ErrorMessage>
          )}
        </CardContainer>
      )}

      <Notice>
          <p>
            Please note that the this snap is only available in MetaMask Flask,
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
