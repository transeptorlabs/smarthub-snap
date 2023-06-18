import { ReactNode } from 'react';
import styled from 'styled-components';
import { FaCopy } from "react-icons/fa";
import { trimAccount } from '../utils/eth';
import { UserOperationReceipt } from '../types';
import { BigNumber } from 'ethers';

type CardProps = {
  content: {
    title?: string;
    description?: string;
    button?: ReactNode;
    listItems?: string[];
    stats?: {
      id: string;
      title: string;
      value: string;
    }[];
    form?: ReactNode[];
    userOperationReceipts?: UserOperationReceipt[]
  };
  disabled?: boolean;
  fullWidth?: boolean;
  copyDescription?: boolean;
  isAccount?: boolean;
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
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const DescriptionContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

const Description = styled.div`
  margin-top: 2.4rem;
  margin-bottom: 1.4rem;
  display: inherit;
  ${({ theme }) => theme.mediaQueries.small} {
    display: none;
  }
`;

const DescriptionMobile = styled.div`
  margin-top: 2.4rem;
  margin-bottom: 1.4rem;
  display: none;
  ${({ theme }) => theme.mediaQueries.small} {
    display: inherit;
  }
`;

const DescriptionCopy = styled.div`
  margin-left: 1rem;
  margin-top: 2.4rem;
  margin-bottom: 1.4rem;
  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
    cursor: pointer;
  }
`;

const FormContainer = styled.div`
`;

const StatsContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FlexContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  ${({ theme }) => theme.mediaQueries.small} {
    flex-direction: column;
  }
`;

const ActivityItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  width:: 100%;
  background-color: ${({ theme }) => theme.colors.card.default};
  margin-top: 2.4rem;
  margin-bottom: 2.4rem;
  padding: 2.4rem;  
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
  align-self: stretch;
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 1.2rem;
    margin-bottom: 1.2rem;
    padding: 0;
  }
`;

const ActivityItem = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  ${({ theme }) => theme.mediaQueries.small} {
    flex-direction: column;
    padding: 2.4rem;  
  }
`;

export const Card = ({ content, disabled = false, fullWidth, copyDescription, isAccount }: CardProps) => {
  const { title, description, button, listItems, form, stats, userOperationReceipts} = content;

  const handleCopyToClipboard = (event: any) => {
    event.preventDefault();
    if (description) {
      navigator.clipboard.writeText(description);    
    }
  }

  return (
    <CardWrapper fullWidth={fullWidth} disabled={disabled}>
      {title && (
        <Title>{title}</Title>
      )}

      {description && (
        <DescriptionContainer>
          <Description>{isAccount ? `eth: ${description}` : description }</Description>
          <DescriptionMobile>{isAccount ? `eth: ${trimAccount(description)}` : description }</DescriptionMobile>
          
          {copyDescription && (
            <DescriptionCopy onClick={handleCopyToClipboard}>
              <FaCopy />
            </DescriptionCopy>
          )}
        </DescriptionContainer>
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
        <FormContainer>
          {form &&
            form.map((item: ReactNode) => (
              item
          ))}
        </FormContainer>
      </FlexContainer>

      {userOperationReceipts && (
        userOperationReceipts.map((item: UserOperationReceipt) => (
          <ActivityItemContainer key={`${item.sender}-${item.nonce.toString()}-${item.receipt.transactionHash}`}>
            <ActivityItem>
              <p>Status:</p>
              <p>{item.success? <span>Confirmed</span>: <span>Failed</span>}</p>
            </ActivityItem>

            {!item.success && item.reason && (
              <ActivityItem>
                <p>Revert:</p>
                <p>{item.reason}</p>
              </ActivityItem>
            )}
           
            <ActivityItem>
              <p>Sender:</p>
              <p>eth:{trimAccount(item.sender)}</p>
            </ActivityItem>

            <ActivityItem>
              <p>To:</p>
              <p>eth:{trimAccount(item.receipt.to)}</p>
            </ActivityItem>

            <ActivityItem>
              <p>Nonce:</p>
              <p>{BigNumber.from(item.nonce).toNumber()}</p>
            </ActivityItem>

            <ActivityItem>
              <p>Gas Used(units):</p>
              <p>{BigNumber.from(item.actualGasUsed).toNumber()}</p>
            </ActivityItem>

            <ActivityItem>
              <p>Gas Cost(Wei):</p>
              <p>{BigNumber.from(item.actualGasCost).toNumber()}</p>
            </ActivityItem>

            
            <ActivityItem>
              <p>Transaction hash:</p>
              <p>{trimAccount(item.receipt.transactionHash)}</p>
            </ActivityItem>
          </ActivityItemContainer>
        ))
      )}
    </CardWrapper>
  );
};
