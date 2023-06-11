import { useContext } from 'react';
import styled, { useTheme } from 'styled-components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import { connectSnap, getThemePreference, getSnap, getScAccountOwner, getScAccount, sendSupportedEntryPoints } from '../utils';
import { HeaderButtons } from './Buttons';
import { SnapLogo } from './SnapLogo';
import { Toggle } from './Toggle';

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
      await connectSnap();
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
      
      await refreshERC4337State();

      if (window.ethereum) {
        if (!state.isChainIdListener) {
          console.log('creating lisner:', state.isChainIdListener);
          window.ethereum.on('chainChanged', async (chainId) => {
            console.log('Network changed:', chainId);
            await refreshERC4337State();
          });
  
          dispatch({
            type: MetamaskActions.SetChainIdListener,
            payload: true,
          });
        }
      }
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const refreshERC4337State = async () => {
    const [scAccountOwner, scAccount, supportedEntryPoints] = await Promise.all([
      getScAccountOwner(),
      getScAccount(),
      sendSupportedEntryPoints(),
    ]);

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
