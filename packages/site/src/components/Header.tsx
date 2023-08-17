import { useContext, useRef, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { MetaMaskContext } from '../hooks';
import { getThemePreference } from '../utils';
import { SnapLogo } from './SnapLogo';
import { Toggle } from './Toggle';
import { SupportedChainIdMap } from '../types';
import { Modal } from './Modal';
import { FaCaretDown, FaCaretUp } from "react-icons/fa";
import { AccountHeaderDisplay, AccountModalDropdown } from './Account';
import { NetworkModalDropdown } from './Network';

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
  padding: 1rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
`

const LogoContainer = styled.div`
  padding: 1.2rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  ${({ theme }) => theme.mediaQueries.small} {
    display: none;
  }
`

export const Header = ({
  handleToggleClick,
}: {
  handleToggleClick(): void;
}) => {
  const theme = useTheme();
  const [state] = useContext(MetaMaskContext);
  const [modalOpenNetwork, setModalOpenNetwork] = useState(false);
  const [modalOpenAccount, setModalOpenAccount] = useState(false);
  const networkRef = useRef<any>(null);
  const accountRef = useRef<any>(null);

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
      <Modal isOpen={modalOpenNetwork} onClose={closeNetworkModal} buttonRef={networkRef} right={5}>
        <NetworkModalDropdown closeModal={closeNetworkModal}/>
      </Modal>

      {/* Account Modal*/}
      <Modal isOpen={modalOpenAccount} onClose={closeAccountModal} buttonRef={accountRef} right={80}>
        <AccountModalDropdown closeModal={closeAccountModal}/>
      </Modal>

      {/* Logo Display*/}
      <FlexRowWrapper>
        <LogoContainer>
          <SnapLogo color={theme.colors.icon.default} size={36} />
          <Title>ERC-4337 Relayer</Title>
        </LogoContainer>
      </FlexRowWrapper>

      <FlexRowWrapper>
        <Toggle onToggle={handleToggleClick} defaultChecked={getThemePreference()}/>
        
        {/* Account Display */}
        <HeaderItemContainer ref={accountRef} onClick={openAccountModal}>
          <AccountHeaderDisplay />
          {modalOpenAccount? <IconContainer><FaCaretUp /></IconContainer> : <IconContainer><FaCaretDown /></IconContainer> }
        </HeaderItemContainer>

        {/* Network Display */}
        {state.isFlask && (
          <HeaderItemContainer ref={networkRef} onClick={openNetworkModal}>
            <FlexRowWrapper>
              {SupportedChainIdMap[state.chainId]  && (
                  <img
                  src={SupportedChainIdMap[state.chainId] ? SupportedChainIdMap[state.chainId].icon : SupportedChainIdMap[''].icon}
                  width={38}
                  height={38}
                  alt={SupportedChainIdMap[state.chainId] ? `${SupportedChainIdMap[state.chainId].name} logo` : 'Network not supported logo'}
                />
              )}
              {modalOpenNetwork ? <IconContainer><FaCaretUp /></IconContainer> : <IconContainer><FaCaretDown /></IconContainer> }
            </FlexRowWrapper>
          </HeaderItemContainer>
        )}
      </FlexRowWrapper>
    </HeaderWrapper>
  );
};
