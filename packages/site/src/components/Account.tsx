import { MetamaskState } from '../hooks';
import { ReactComponent as FlaskFox } from '../assets/flask_fox_account.svg';
import styled from 'styled-components';
import { trimAccount } from '../utils';
import { FaCloudDownloadAlt, FaRegLightbulb } from 'react-icons/fa';
import { InstallFlaskButton, InstallSnapButton } from './Buttons';

const FlexRowWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const FlexColWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
`

const IconContainer = styled.div`
  margin-right: 1rem; 
`;

const PrimaryText = styled.p`
  margin: 0; 
  margin-bottom: 0.5rem;
  font-weight: bold;
`;

const SecondaryText = styled.p`
  margin: 0; 
`;

const LineBreak = styled.hr`
  color: ${(props) => props.theme.colors.primary};
  border: solid 1px ${(props) => props.theme.colors.border.default};
  width: 100%;
`;

const InstalBodyTop = styled.div`
`;

const InstallBodyBottom = styled.div`
  align-items: center;

`;

const Text = styled.p`
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

export const AccountHeaderDisplay = ({
    state,
  }: {
    state: MetamaskState;
  }) => {
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
          <FlexColWrapper>
            <PrimaryText>Enable smart account capabilities</PrimaryText>
            <SecondaryText>Install ERC-4337 Relayer</SecondaryText>
          </FlexColWrapper>
        </FlexRowWrapper>
      );
    }
  
    return (
      <FlexRowWrapper>
      <IconContainer>
        <FlaskFox />
        <ConnectedIndicator />
      </IconContainer>
      <FlexColWrapper>
        <PrimaryText>MetaMask @ ERC-4337 Relayer</PrimaryText>
        <SecondaryText> 
          {state.selectedSnapKeyringAccount.address === '' ? 
            'No account selected' :
            '(owner) ' + trimAccount(state.selectedSnapKeyringAccount.address)
          }
          </SecondaryText>
      </FlexColWrapper>
    </FlexRowWrapper>
    );
};

export const AccountModalDisplay = ({
  state,
  onConnectClick,
}: {
  state: MetamaskState;
  onConnectClick(): unknown;
}) => {
  if (!state.isFlask) {
    return (
      <FlexColWrapper>
        <InstallFlaskButton/>
      </FlexColWrapper>
    );
  }

  if (!state.installedSnap) {
    return (
      <FlexColWrapper>
        <InstalBodyTop>
          <Text>Install ERC-4337 Relayer</Text>
          <div>
            <div>
              
            </div>
          </div>
        </InstalBodyTop>
        <LineBreak></LineBreak>
        <InstallBodyBottom>
          <InstallSnapButton onClick={onConnectClick} />
          <TextSmall>Manage smart accounts using MetaMask</TextSmall>
        </InstallBodyBottom>
      </FlexColWrapper>
    );
  }

  return (
    <FlexColWrapper>
      <Text>Selcect an account</Text>
    </FlexColWrapper>
  );
};