import { useContext } from 'react';
import styled, { useTheme } from 'styled-components';
import { MetamaskActions, MetaMaskContext, useAcount } from '../hooks';
import { connectSnap, getThemePreference, getSnap, connectErc4337Relayer } from '../utils';
import { HeaderButtons } from './Buttons';
import { SnapLogo } from './SnapLogo';
import { Toggle } from './Toggle';
import { getChainId } from '../utils/eth';

const HeaderWrapper = styled.header`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 2.4rem;
  border-bottom: 1px solid ${(props) => props.theme.colors.border.default};
`;

const Title = styled.p`
  color: ${(props) => props.theme.colors.primary.default};  
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
  const {getEoa, getScAccountState, getAccountActivity, setWalletListener} = useAcount();

  const handleConnectClick = async () => {
    try {
      let installedSnap = await getSnap();
      if (!installedSnap) {
        // installing snap
        await connectSnap();
        installedSnap = await getSnap();
        dispatch({
          type: MetamaskActions.SetInstalled,
          payload: installedSnap,
        });
        return
      } else {
        // snap already installed
        dispatch({
          type: MetamaskActions.SetInstalled,
          payload: installedSnap,
        });
      }
      
      const ownerEoa = await getEoa();
      const smartAccount = await getScAccountState(ownerEoa.address);
      await Promise.all([
        getAccountActivity(ownerEoa.address, Number(smartAccount.index)),
        setWalletListener(),
      ]);
    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
      dispatch({ type: MetamaskActions.SetClearAccount, payload: true});
      dispatch({ type: MetamaskActions.SetClearSmartAccountActivity, payload: true});
    }
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
