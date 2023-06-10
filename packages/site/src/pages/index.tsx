import { useContext } from 'react';
import styled from 'styled-components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import {
  connectSnap,
  getSnap,
  sendDepoist,
  sendHello,
  sendScAccount,
  sendScAccountOwner,
  sendSupportedEntryPoints,
  shouldDisplayReconnectButton,
} from '../utils';
import {
  ConnectSnapButton,
  InstallFlaskButton,
  ReconnectButton,
  Card,
  ERC4337Button,
} from '../components';
import { trimAccount } from '../utils/eth';
import { BigNumber } from 'ethers';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 7.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary.default};
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
  color: black;
  border: solid;
  width: 60%;
  ${({ theme }) => theme.mediaQueries.small} {
    width: 80%;
  }
`;

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);

  const handleConnectSnapClick = async () => {
    try {
      await connectSnap();
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
      
      // await sendHello()
      // get erc4337 account details
      const scAccountOwner = await sendScAccountOwner();
      const scAccount = await sendScAccount();
      const supportedEntryPoints = await sendSupportedEntryPoints();
      console.log('scAccountOwner:', scAccountOwner);
      console.log('scAccount:', scAccount);
      console.log('supportedEntryPoints:', supportedEntryPoints);

      dispatch({
        type: MetamaskActions.SetScAccountOwner,
        payload: scAccountOwner,
      });

      dispatch({
        type: MetamaskActions.SetScAccount,
        payload: scAccount,
      });

      dispatch({
        type: MetamaskActions.SetSupportedEntryPoints,
        payload: supportedEntryPoints,
      });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleDepositClick = async () => {
    await sendDepoist(BigNumber.from(1),state.scAccount.address) 
  };

  const handleWithdrawClick = async () => {
    console.log('withdraw clicked')
  };

  return (
    <Container>

      <Heading>
        Welcome to <Span>ERC-4337 Relayer</Span>
      </Heading>
      <LineBreak></LineBreak>
      <Subtitle>Unlock the Full Potential of Account Abstraction</Subtitle>
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

      <LineBreak></LineBreak>
      <Subtitle>Install</Subtitle>

      <CardContainer>
        {state.error && (
          <ErrorMessage>
            <b>An error happened:</b> {state.error.message}
          </ErrorMessage>
        )}
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
                'Manage stake an depoists with supported entrypoint contracts',
              ],
              button: (
                <ConnectSnapButton
                  onClick={handleConnectSnapClick}
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
                  onClick={handleConnectSnapClick}
                  disabled={!state.installedSnap}
                />
              ),
            }}
            disabled={!state.installedSnap}
            fullWidth
          />
        )}
      </CardContainer>

      <LineBreak></LineBreak>
      <Subtitle>ERC-4337</Subtitle>
      <CardContainer>
        {state.scAccountOwner.address && state.installedSnap && (
          <Card
            content={{
              title: 'Connection info',
              description: `Supported Entry Points`,
              listItems: state.supportedEntryPoints,
            }}
            disabled={!state.isFlask}
            fullWidth
          />
        )}

        {state.scAccountOwner.address && state.installedSnap && (
          <Card
            content={{
              title: 'Owner Account',
              description: `${trimAccount(state.scAccountOwner.address)}`,
              listItems: [
                `Balance: ${state.scAccountOwner.balance.toString()} ETH`,
              ],
              button: (
                <div>
                  <ERC4337Button
                    onClick={handleDepositClick}
                    disabled={!state.isFlask}
                    text="Deposit"
                  />

                  <ERC4337Button
                    onClick={handleWithdrawClick}
                    disabled={!state.isFlask}
                    text="Withdraw"

                  />
                </div>
              ),
            }}
            disabled={!state.isFlask}
          />
        )}

        {state.scAccount.address && state.installedSnap && (
          <Card
            content={{
              title: 'Smart Contract Account',
              description: `${trimAccount(state.scAccount.address)}`,
              listItems: [
                `Balance: ${state.scAccount.balance.toString()} ETH`,
                `Nonce: ${state.scAccount.nonce}`,
                `Index: ${state.scAccount.index}`,
                // `Deposit Amount: ${state.scAccountOwner.nonce}`,
              ],
            }}
            disabled={!state.isFlask}
            
          />
        )}
          
        {/* {state.scAccountOwner && state.installedSnap && (
          <Card
            content={{
              title: 'Supported Entry Point Contracts',
              description:
                '',
              button: (
                <SendHelloButton
                  onClick={handleSendSupportedEntryPointsClick}
                  disabled={!state.installedSnap}
                />
              ),
            }}
            disabled={!state.installedSnap}
            fullWidth={
              state.isFlask &&
              Boolean(state.installedSnap) &&
              !shouldDisplayReconnectButton(state.installedSnap)
            }
          />
        )} */}
        <Notice>
          <p>
            Please note that the this snap is only available in MetaMask Flask,
            and is actively being developed by{' '}
            <a href="https://github.com/transeptorlabs" target="_blank">
              Transeptor Labs
            </a>
          </p>
        </Notice>
      </CardContainer>

    </Container>
  );
};

export default Index;
