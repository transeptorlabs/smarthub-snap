import { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { MetamaskActions, MetaMaskContext, useAcount } from '../hooks';
import {
  connectSnap,
  getSnap,
  shouldDisplayReconnectButton,
  getMMProvider,
  convertToEth, 
  convertToWei, 
  estimateGas, 
  isValidAddress, 
  encodeFunctionData,
  getEntryPointContract,
  sendUserOperation,
  clearActivityData,
  getChainId,
  getBundlerUrls,
  parseChainId,
  addBundlerUrl,
} from '../utils';
import {
  ConnectSnapButton,
  InstallFlaskButton,
  ReconnectButton,
  Card,
  TokenInputForm,
  SimpleButton,
  TabMenu,
  BundlerInputForm,
} from '../components';
import { BigNumber, ethers } from 'ethers';
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
  const [formBundlerUrls, setFormBundlerUrls] = useState({} as BundlerUrls);

  const {refreshEOAState, getScAccountState, setWalletListener} = useAcount();

  useEffect(() => {
    let interval: any
    try {  
      interval = setInterval(() => {
        if (state.eoa.connected) {
          refreshEOAState(state.eoa.address);
        }
  
        if (state.scAccount.connected) {
          getScAccountState();
        }
      }, 10000)
  
      return () => {
        clearInterval(interval);
      };

    } catch (e) {
      console.error('[ERROR] refreaher:', e.message);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    } 
  }, [state.eoa, state.scAccount]);

  useEffect(() => {
    try {  
      handleFetchBundlerUrls(); 

      return () => {
      };

    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
    } 
  }, [state.installedSnap]);

  const handleReConnectSnapClick = async () => {
    try {
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

  const handleFetchBundlerUrls = async () => {
    try {
      if (state.installedSnap) {
        const urls = await getBundlerUrls();
        dispatch({
          type: MetamaskActions.SetBundlerUrls,
          payload: urls,
        });

        setFormBundlerUrls(urls);
      }
    } catch (error) {
      dispatch({ type: MetamaskActions.SetError, payload: error });
    }
  };

  const handleDepositSubmit = async (e: any) => {
    e.preventDefault();
    const depositInWei = convertToWei(depositAmount);

    // check the owner account has enough balance
    if (BigNumber.from(state.eoa.balance).lt(depositInWei)) {
      dispatch({ type: MetamaskActions.SetError, payload: new Error('EOA has, insufficient funds.') });
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
    await getScAccountState();
  }

  const handleWithdrawSubmit = async (e: any) => {
    e.preventDefault();
    const withdrawAmountInWei = convertToWei(withdrawAmount);
    if (!isValidAddress(withDrawAddr)) {
      dispatch({ type: MetamaskActions.SetError, payload: new Error('Invalid address') });
      return;
    }

    if (BigNumber.from(state.scAccount.deposit).lt(withdrawAmountInWei)) {
      dispatch({ type: MetamaskActions.SetError, payload: new Error('Smart contract account, insufficient deposit') });
      return;
    }

    try {
      const encodedFunctionData = await encodeFunctionData(
        getEntryPointContract(state.scAccount.entryPoint),
        'withdrawTo',
        [state.eoa.address, withdrawAmountInWei.toString()]
      );

      await sendUserOperation(
        state.scAccount.entryPoint,
        encodedFunctionData,
        state.scAccount.index,
      );

      setWithdrawAmount('');
      setWithDrawAddr('');
      await getScAccountState();
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
    await handleFetchBundlerUrls();
  }

  const handleBundlerUrlSubmit = async (e: any, chainId: string) => {
    e.preventDefault();
    await addBundlerUrl(chainId, formBundlerUrls[chainId]);
    await handleFetchBundlerUrls();
  }

  const handleBundlerUrlChange = async (e: any, chainId: string) => {
    const inputValue = e.target.value;
    setFormBundlerUrls({
      ...formBundlerUrls,
      [chainId]: inputValue,
    })
  }

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
            networkName={SupportedChainIdMap[chainId] ? SupportedChainIdMap[chainId] : 'Unknown'}
            chainId={parseChainId(chainId).toString()}
        />
        ))}
      </div>
    );
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
      {state.activeTab !== AppTab.About && (
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
        </CardContainer>
      )}

      {state.activeTab === AppTab.Install && (
        <CardContainer>
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
              isEoa
            />
          )}

          {state.scAccount.connected && state.installedSnap && (
            <Card
              content={{
                description: `${state.scAccount.address}`,
                descriptionBold: 'Smart Account',
                stats: [
                  {
                    id: `0`,
                    title: 'Entry Point Deposit',
                    value: `${convertToEth(state.scAccount.deposit)} ETH`,
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
              isSC
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

      {/* Build tab */}
      {state.activeTab === AppTab.Build && (
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
              <ErrorMessage>
                <p>This resets your deposit account's activity and bundler Url data inside the snap. Your balances and incoming transactions won't change.</p>
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
