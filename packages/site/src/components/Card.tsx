import { ReactNode, useContext } from 'react';
import styled from 'styled-components';
import { FaCopy, FaInfoCircle, FaExternalLinkAlt } from "react-icons/fa";
import { trimAccount } from '../utils/eth';
import { BlockieEoa } from './Blockie-Icon';
import { handleCopyToClipboard } from '../utils';
import { SupportedChainIdMap } from '../types';
import { MetaMaskContext } from '../hooks';

type CardProps = {
  content: {
    title?: string;
    description?: string;
    descriptionBold?: string;
    button?: ReactNode;
    listItems?: string[];
    blockieColor?: string;
    stats?: {
      id: string;
      title: string;
      value: string;
    }[];
    custom?: ReactNode
  };
  disabled?: boolean;
  fullWidth?: boolean;
  copyDescription?: boolean;
  isAccount?: boolean;
  isSmartAccount?: boolean;
  showTooltip?: boolean;
};

const CardWrapper = styled.div<{ fullWidth?: boolean; disabled: boolean }>`
  display: flex;
  flex-direction: column;
  width: ${({ fullWidth }) => (fullWidth ? '100%' : '250px')};
  background-color: ${({ theme }) => theme.colors.card.default};
  margin-top: 2.4rem;
  margin-bottom: 2.4rem;
  padding: 2.4rem;
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
  filter: opacity(${({ disabled }) => (disabled ? '.4' : '1')});
  align-self: stretch;
  ${({ theme }) => theme.mediaQueries.small} {
    width: 100%;
    margin-top: 1.2rem;
    margin-bottom: 1.2rem;
    padding: 1.6rem;
  }
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.large};
  margin: 0;
  margin-bottom: 1.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  margin-bottom: 1.2rem;
`;

const Description = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0;
  display: inherit;
  ${({ theme }) => theme.mediaQueries.small} {
    display: none;
  }
`;

const DescriptionText = styled.p`
  margin: 0;
`;

const DescriptionTextBold = styled.p` 
  margin: 0;
  font-weight: bold;
`;

const DescriptionMobile = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0;
  display: none;
  ${({ theme }) => theme.mediaQueries.small} {
    display: inherit;
  }
`;

const DescriptionCopy = styled.div`
  margin-left: 2rem;
  margin-top: auto;
  margin-bottom: 0;
  margin-right: 1rem;
  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
    cursor: pointer;
  }
`;

const BlockExplorerLink = styled.a`
  margin-left: 2rem;
  margin-top: auto;
  margin-bottom: 0;
  margin-right: 1rem;
  color: ${(props) => props.theme.colors.primary.default};  

  &:hover {
    color: ${(props) => props.theme.colors.text.default};
    cursor: pointer;
  }
`;

const ToolTip = styled.div`
  margin-left: 1rem;
`;

const StatsContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 50%;
`;

const FlexContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  ${({ theme }) => theme.mediaQueries.small} {
    flex-direction: column;
  }
`;


export const Card = ({ content, disabled = false, fullWidth, copyDescription, isAccount, isSmartAccount, showTooltip}: CardProps) => {
  const [state] = useContext(MetaMaskContext);
  const { title, description, descriptionBold, button, listItems, stats, custom} = content;

  return (
    <CardWrapper fullWidth={fullWidth} disabled={disabled}>
      {title && (
        <FlexRow>
          <Title>{title}</Title>
          {showTooltip && (
            <ToolTip>
              <FaInfoCircle />
            </ToolTip>
          )}
        </FlexRow>
      )}

      <FlexRow>
        {isSmartAccount && (
          <BlockieEoa></BlockieEoa>
          )
        }
      </FlexRow>
   
      {description && (   
        <FlexRow>
          <Description>
            {descriptionBold && (
              <DescriptionTextBold>
                {descriptionBold}
              </DescriptionTextBold>
              )
            }
            <DescriptionText>
              {isAccount ? `eth: ${description}` : description }
            </DescriptionText>
          </Description>

          <DescriptionMobile>
            {descriptionBold && (
              <DescriptionTextBold>
                {descriptionBold}
              </DescriptionTextBold>
              )
            }
            <DescriptionText>
              {isAccount ? `eth: ${trimAccount(description)}` : description }
            </DescriptionText>
          </DescriptionMobile>
          
          {copyDescription && (
            <DescriptionCopy onClick={e => handleCopyToClipboard(e, description)}>
              <FaCopy />
            </DescriptionCopy>
          )}

          {isAccount && (
            <BlockExplorerLink href={`${SupportedChainIdMap[state.chainId].blockExplorer}/address/${description}`} target="_blank" rel="noopener noreferrer">
              <FaExternalLinkAlt />
            </BlockExplorerLink>
          )}
        </FlexRow>
      )}

      {listItems && (
        <ul>
          {
            listItems.map((item: string) => (
            <li key={item}>{item}</li>
          ))
          }
        </ul>
      )}
      
      {button}

      <FlexContainer>
        {stats &&
          <StatsContainer>
            {
              stats.map((item: { id: string, title: string; value: string; }) => (
                <Stat key={item.id}>
                  <p>{item.title}</p>
                  <p>{item.value}</p>
                </Stat>
              ))
            }
          </StatsContainer>
        }
      </FlexContainer>

      {custom}
    </CardWrapper>
  );
};
