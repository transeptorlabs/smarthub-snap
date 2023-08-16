import { useContext, useRef, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import { connectSnap, getThemePreference, getSnap } from '../utils';
import { SnapLogo } from './SnapLogo';
import { Toggle } from './Toggle';
import { SupportedChainIdMap } from '../types';
import { Modal } from './Modal';
import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import { AccountHeaderDisplay, AccountModalDisplay } from './Account';

const HeaderWrapper = styled.header`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
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

const FlexRowWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const IconContainer = styled.div`
  margin-left: 1rem; 
`;

const HeaderItemContainer = styled.div`
  border-left: 1px solid ${({ theme }) => theme.colors.border.default};
  padding: 1.2rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
`

const Network = styled.div`
  color: ${(props) => props.theme.colors.text.default};
  background-color: ${({ theme }) => theme.colors.card.default};
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.shadows.default};
  width: fit-content;
  height: fit-content;
`

const LogoContainer = styled.div`
  padding: 1.2rem;
  display: flex;
  flex-direction: row;
  align-items: center;
`

export const Header = ({
  handleToggleClick,
}: {
  handleToggleClick(): void;
}) => {
  const theme = useTheme();
  const [state, dispatch] = useContext(MetaMaskContext);
  const [modalOpenNetwork, setModalOpenNetwork] = useState(false);
  const [modalOpenAccount, setModalOpenAccount] = useState(false);
  const networkRef = useRef<any>(null);
  const accountRef = useRef<any>(null);
  
  const handleConnectClick = async () => {
    try {
      if (!state.installedSnap) {
        // installing snap
        await connectSnap();
        const installedSnap = await getSnap();
        dispatch({
          type: MetamaskActions.SetInstalled,
          payload: installedSnap,
        });
      } else {
        // snap already installed
        const installedSnap = await getSnap();
        dispatch({
          type: MetamaskActions.SetInstalled,
          payload: installedSnap,
        });
      }
      closeAccountModal();
    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
      dispatch({ type: MetamaskActions.SetClearAccount, payload: true});
      dispatch({ type: MetamaskActions.SetClearSmartAccountActivity, payload: true});
    }
  };

  const openNetworkModal = () => {
    setModalOpenNetwork(true);
  };

  const closeNetworkModal = () => {
    setModalOpenNetwork(false);
  };

  const openAccountModal = () => {
    setModalOpenAccount(true);
  };

  const closeAccountModal = () => {
    setModalOpenAccount(false);
  };

  return (
    <HeaderWrapper >
      {/* Network Modal*/}
      <Modal isOpen={modalOpenNetwork} onClose={closeNetworkModal} buttonRef={networkRef} right={20}>
        <p>This is a modal 1 content.</p>
      </Modal>

      {/* Account Modal*/}
      <Modal isOpen={modalOpenAccount} onClose={closeAccountModal} buttonRef={accountRef} right={150}>
        <AccountModalDisplay state={state} onConnectClick={handleConnectClick}/>
      </Modal>

      <FlexRowWrapper>
        <LogoContainer>
          <SnapLogo color={theme.colors.icon.default} size={36} />
          <Title>ERC-4337 Relayer</Title>
        </LogoContainer>
      </FlexRowWrapper>

      <FlexRowWrapper>
        <Toggle onToggle={handleToggleClick} defaultChecked={getThemePreference()}/>
        
        <HeaderItemContainer ref={accountRef} onClick={openAccountModal}>
          <AccountHeaderDisplay state={state} />
          {modalOpenAccount? <IconContainer><FaCaretUp /></IconContainer> : <IconContainer><FaCaretDown /></IconContainer> }
        </HeaderItemContainer>

        <HeaderItemContainer ref={networkRef} onClick={openNetworkModal}>
          <Network>{SupportedChainIdMap[state.chainId] ? SupportedChainIdMap[state.chainId] : 'Not Supported'}</Network>
          {modalOpenNetwork ? <IconContainer><FaCaretUp /></IconContainer> : <IconContainer><FaCaretDown /></IconContainer> }
        </HeaderItemContainer>

      </FlexRowWrapper>
    </HeaderWrapper>
  );
};
