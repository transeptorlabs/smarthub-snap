import { useContext, useRef, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import { connectSnap, getThemePreference, getSnap, connectErc4337Relayer } from '../utils';
import { HeaderButtons } from './Buttons';
import { SnapLogo } from './SnapLogo';
import { Toggle } from './Toggle';
import { SupportedChainIdMap } from '../types';
import { Modal } from './Modal';

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

const ContainerWrapper = styled.div`
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

const Network = styled.div`
  margin-left: auto;
  color: ${(props) => props.theme.colors.text.default};
  background-color: ${({ theme }) => theme.colors.card.default};
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.shadows.default};
  width: fit-content;
  height: fit-content;
`

export const Header = ({
  handleToggleClick,
}: {
  handleToggleClick(): void;
}) => {
  const theme = useTheme();
  const [state, dispatch] = useContext(MetaMaskContext);
  const [modalOpenNetwork, setModalOpenNetwork] = useState(false);
  const networkRef = useRef<any>(null);

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

  return (
    <HeaderWrapper >
      {/* Network Modal*/}
      <Modal isOpen={modalOpenNetwork} onClose={closeNetworkModal} title="Styled Modal Example" buttonRef={networkRef} right={20}>
        <p>This is a modal 2 content.</p>
      </Modal>

      <ContainerWrapper>
        <SnapLogo color={theme.colors.icon.default} size={36} />
        <Title>ERC-4337 Relayer</Title>
      </ContainerWrapper>
      <RightContainer>
        <ContainerWrapper >
          <Toggle onToggle={handleToggleClick} defaultChecked={getThemePreference()}/>
          <HeaderButtons state={state} onConnectClick={handleConnectClick} />
          <Network ref={networkRef} onClick={openNetworkModal}>{SupportedChainIdMap[state.chainId] ? SupportedChainIdMap[state.chainId] : 'Not Supported'}</Network>
        </ContainerWrapper>
      </RightContainer>
    </HeaderWrapper>
  );
};
