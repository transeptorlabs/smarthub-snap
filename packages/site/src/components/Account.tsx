import { MetaMaskContext, MetamaskActions, MetamaskState, useAcount } from '../hooks';
import styled from 'styled-components';
import { connectSnap, getSnap, trimAccount } from '../utils';
import { FaCloudDownloadAlt, FaRegLightbulb } from 'react-icons/fa';
import { InstallFlaskButton, InstallSnapButton } from './Buttons';
import { SupportedChainIdMap } from '../types';
import { useContext, useState } from 'react';
import { KeyringAccount } from "@metamask/keyring-api";
import { ReactComponent as FlaskFox } from '../assets/flask_fox_account.svg';
import { BlockieAccountModal } from './blockie';
import { FaCopy, FaInfoCircle } from "react-icons/fa";

const Body = styled.div`
  padding: 2rem;
`;

const Body2 = styled.div`
  padding: 2rem 0;
`;

const FlexRowWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const FlexColWrapperCenter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const FlexColWrapperLeft = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
`

const IconContainer = styled.div`
  margin-right: 1rem; 
`;

const IconContainerLeft = styled.div`
  margin-left: 6rem; 
`;

const IconContainerLeftShort = styled.div`
  margin-left: 1rem; 
`;

const PrimaryText = styled.p`
  color: ${(props) => props.theme.colors.text.default};
  margin: 0; 
  margin-bottom: 0.5rem;
  font-weight: bold;

  ${({ theme }) => theme.mediaQueries.small} {
    display: none;
  }
`;

const SecondaryText = styled.p`
  color: ${(props) => props.theme.colors.text.default};
  margin: 0; 
  ${({ theme }) => theme.mediaQueries.small} {
    display: none;
  }
`;

const LineBreak = styled.hr`
  color: ${(props) => props.theme.colors.primary};
  border: solid 1px ${(props) => props.theme.colors.border.default};
  width: 100%;
`;

const DropdownList = styled.ul`
  width: 300px;
  list-style: none;
  padding: 0;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
`;

const DropdownItem = styled.li<{
  selected: boolean;
  onClick: (e: any, account: KeyringAccount) => void;
}>`
  padding: 8px 12px;
  cursor: pointer;
  background-color: ${(props) => (props.selected ? props.theme.colors.primary.default : 'transparent')};
  &:hover {
    background-color: #8093ff;
  }
`;

const FeatureBody = styled.div`
  margin-top: 1rem;
  margin-bottom: 1.5rem;
  width: 300px;

  ${({ theme }) => theme.mediaQueries.small} {
    width: 250px;
  }
`;

const ButtonBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TextBold = styled.p`
  color: ${(props) => props.theme.colors.text.default};
  font-weight: bold;
  margin: 0;
  margin-bottom: .5rem;
`; 

const Text = styled.p`
  color: ${(props) => props.theme.colors.text.default};
  margin: 0;
`;  

const TextSmall = styled.p`
  margin: 0;
  margin-top: 0.5rem;
  font-size: 1.2rem;
`;  

const ConnectedIndicator = styled.div`
  content: ' ';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: green;
`;

export const AccountHeaderDisplay = () => {
    const [state] = useContext(MetaMaskContext);
    if (!state.isFlask) {
      return (
        <FlexRowWrapper>
          <IconContainer>
            <FlaskFox />
          </IconContainer>
          <p>Install Flask</p>
        </FlexRowWrapper>
      );
    }
  
    if (!state.installedSnap) {
      return (
        <FlexRowWrapper>
          <IconContainer>
            <FaCloudDownloadAlt  style={{ width: '3rem', height: '3rem' }} />
          </IconContainer>
          <FlexColWrapperLeft>
          <PrimaryText>MetaMask @ {SupportedChainIdMap[state.chainId] ? SupportedChainIdMap[state.chainId].name : 'Not Supported'}</PrimaryText>
            <SecondaryText>Install ERC-4337 Relayer</SecondaryText>
          </FlexColWrapperLeft>
        </FlexRowWrapper>
      );
    }
  
    return (
      <FlexRowWrapper>
      <IconContainer>
        <FlaskFox />
        {/* <ConnectedIndicator /> */}
      </IconContainer>
      <FlexColWrapperLeft>
        <PrimaryText>MetaMask @ {SupportedChainIdMap[state.chainId] ? SupportedChainIdMap[state.chainId].name : 'Not Supported'}</PrimaryText>
        <SecondaryText> 
          {state.selectedSnapKeyringAccount.address === '' ? 
            'No account selected' :
            '(owner) ' + trimAccount(state.selectedSnapKeyringAccount.address)
          }
        </SecondaryText>
      </FlexColWrapperLeft>
    </FlexRowWrapper>
    );
};

export const AccountModalDropdown  = ({
  closeModal,
}: {
  closeModal(): unknown;
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [selectedAccount, setSelectedAccount] = useState<KeyringAccount>(state.selectedSnapKeyringAccount);
  const {selectKeyringSnapAccount, getSmartAccount} = useAcount();

  const featureList: {feature: string; description: string }[] = [
    {
      feature: "Smart account capabilities",
      description: `Access and control smart accounts with MetaMask. Enjoy smart contract functionality with ease and convenience.`
    },
    {
      feature: "Feature B",
      description: `Short description of what it is, how it works and why it’s exciting to end-users`
    },
    {
      feature: "Feature C",
      description: `Short description of what it is, how it works and why it’s exciting to end-users`
    },
  ];

  const handleInstallClick = async (event: any) => {
    try {
      event.preventDefault();

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
      closeModal();
    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
      dispatch({ type: MetamaskActions.SetClearAccount, payload: true});
      dispatch({ type: MetamaskActions.SetClearSmartAccountActivity, payload: true});
    }
  };

  const handleAccountChange = async (event: any, account: KeyringAccount) => {
    event.preventDefault();
    setSelectedAccount(account);
    await selectKeyringSnapAccount(account);
    await getSmartAccount(account.id);
    closeModal();
  }

  if (!state.isFlask) {
    return (
      <Body>
        <FlexColWrapperCenter>
          <TextBold>Install</TextBold>
          <FeatureBody>
            <Text>Discover the full potential of our Snap powered by MetaMask! To get started, make sure to install MetaMask for a seamless and enhanced Snap experience.</Text>
          </FeatureBody>
          <LineBreak></LineBreak>
          <ButtonBody>
            <InstallFlaskButton/>
          </ButtonBody>
        </FlexColWrapperCenter>
      </Body>
    );
  }

  if (!state.installedSnap) {
    return (
      <Body>
        <FlexColWrapperCenter>
            <TextBold>Install</TextBold>
            <FlexColWrapperLeft>
              {featureList.map((props, idx) => (
                <FeatureBody key={idx}>
                  <FlexRowWrapper>
                    <IconContainer>
                      <FaRegLightbulb style={{ width: '2rem', height: '2rem' }} />
                    </IconContainer>
                    <TextBold>{props.feature}</TextBold>
                  </FlexRowWrapper>
                  <Text>{props.description}</Text>
                </FeatureBody>
              ))}
            </FlexColWrapperLeft>
            <LineBreak></LineBreak>
            <ButtonBody>
              <InstallSnapButton onClick={handleInstallClick}/>
              <TextSmall>Manage smart accounts with MetaMask</TextSmall>
            </ButtonBody>
          </FlexColWrapperCenter>
      </Body>
    );
  }

  return (
    <Body2>
      <FlexColWrapperCenter>
        <TextBold>Select a Smart Account</TextBold>
      </FlexColWrapperCenter>
      <DropdownList>
      {state.snapKeyring.accounts.map((account: KeyringAccount) => (
        <DropdownItem
          key={account.id}
          selected={selectedAccount.id === account.id}
          onClick={(e: any) => handleAccountChange(e, account)}
        >
          <FlexRowWrapper>
            <BlockieAccountModal/>
            <FlexColWrapperLeft>
                <FlexRowWrapper>
                  <TextBold>eth:{trimAccount(account.address)}</TextBold>
                    <IconContainerLeft>
                      <FaCopy />
                    </IconContainerLeft>
                </FlexRowWrapper>
                <FlexRowWrapper>
                  <Text>(owner):{trimAccount(account.address)}</Text>
                </FlexRowWrapper>

            </FlexColWrapperLeft>
          </FlexRowWrapper>
       
        </DropdownItem>
      ))}
    </DropdownList>
    </Body2>
  );
};