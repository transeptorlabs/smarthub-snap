import { ReactNode } from 'react';
import styled from 'styled-components';
import { FaCopy } from "react-icons/fa";
import { trimAccount } from '../utils/eth';

type CardProps = {
  content: {
    title?: string;
    description: string;
    button?: ReactNode;
    listItems?: string[];
    form?: ReactNode[] ;
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

export const Card = ({ content, disabled = false, fullWidth, copyDescription, isAccount }: CardProps) => {
  const { title, description, button, listItems, form } = content;

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

      <DescriptionContainer>
        <Description>{isAccount ? `eth: ${description}` : description }</Description>
        <DescriptionMobile>{isAccount ? `eth: ${trimAccount(description)}` : description }</DescriptionMobile>
        
        
        {copyDescription && (
          <DescriptionCopy onClick={handleCopyToClipboard}>
            <FaCopy />
          </DescriptionCopy>
        )}
      </DescriptionContainer>

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

      <FormContainer>
        {form &&
          form.map((item: ReactNode, ) => (
            item
        ))}
      </FormContainer>
    
    </CardWrapper>
  );
};
