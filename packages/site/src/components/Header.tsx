import { useContext } from 'react';
import styled, { useTheme } from 'styled-components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import { connectSnap, getThemePreference, getSnap, getScAccount, sendSupportedEntryPoints } from '../utils';
import { HeaderButtons } from './Buttons';
import { SnapLogo } from './SnapLogo';
import { Toggle } from './Toggle';
import { connectWallet, getAccountBalance } from '../utils/eth';
import { Account } from '../types/erc-4337';
import { ethers } from 'ethers';

const HeaderWrapper = styled.header`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 2.4rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border.default};
`;

const Title = styled.p`
  font-size: ${(props) => props.theme.fontSizes.title};
  font-weight: bold;
  margin: 0;
  margin-left: 1.2rem;
  ${({ theme }) => theme.mediaQueries.small} {
    display: none;
  }
`;

const LogoWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const RightContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Link = styled.a`
  display: flex;
  align-self: flex-start;
  align-items: center;
  justify-content: center;
  font-size: ${(props) => props.theme.fontSizes.large};
  color: ${(props) => props.theme.colors.text.default};
  text-decoration: none;
  font-weight: bold;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: transparent;
    color: ${(props) => props.theme.colors.primary.default};
  }

  ${({ theme }) => theme.mediaQueries.small} {
    width: 100%;
    box-sizing: border-box;
  }
`;

export const Header = ({
  handleToggleClick,
}: {
  handleToggleClick(): void;
}) => {
  const theme = useTheme();
  const [state, dispatch] = useContext(MetaMaskContext);

  const handleConnectClick = async () => {
    try {
      // connect wallet
      let scAccountOwner: Account = {
        address: '',
        balance: '',
        connected: false,
      }
      if (!state.scAccountOwner.connected) {
        scAccountOwner = await connectWallet()
        dispatch({
          type: MetamaskActions.SetScAccountOwner,
          payload: scAccountOwner,
        });
      }

      if (window.ethereum) {
        if (!state.isChainIdListener) {
          console.log('creating lisnters:', state.isChainIdListener);
          window.ethereum.on('chainChanged', async (chainId) => {
            console.log('Network changed:', chainId);
          });

          window.ethereum.on('accountsChanged', async (accounts) => {
            await refreshScOwnerState((accounts as string[])[0]);
          });
  
          dispatch({
            type: MetamaskActions.SetWalletListener,
            payload: true,
          });
        }
      }
 
      // connect snap
      let installedSnap = await getSnap();
      if (!installedSnap) {
        await connectSnap();
        installedSnap = await getSnap();
      }

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
      
      // fetch sc account state
      await refreshScAccountState(scAccountOwner.address);
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const refreshScOwnerState = async (newOwner: string) => {
    const changedScAccountOwner: Account = {
      address: newOwner,
      balance: await getAccountBalance(newOwner),
      connected: true,
    }
    dispatch({
      type: MetamaskActions.SetScAccountOwner,
      payload: changedScAccountOwner,
    });

    // fetch sc account state
    await refreshScAccountState(changedScAccountOwner.address);
  };

  const refreshScAccountState = async (owner: string) => {
    const [scAccount, supportedEntryPoints] = await Promise.all([
      getScAccount(owner),
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
  };

  return (
    <HeaderWrapper>
      <LogoWrapper>
        <SnapLogo color={theme.colors.icon.default} size={36} />
        <Title>ERC-4337 Relayer</Title>
      </LogoWrapper>
      <RightContainer>
        <LogoWrapper>
          <Link
            href="https://github.com/transeptorlabs/erc-4337-snap"
            target="_blank"
          >
            Github
          </Link>

          <Toggle
            onToggle={handleToggleClick}
            defaultChecked={getThemePreference()}
          />
        </LogoWrapper>
        <LogoWrapper>
          <HeaderButtons state={state} onConnectClick={handleConnectClick} />
        </LogoWrapper>
      </RightContainer>
    </HeaderWrapper>
  );
};
