import { ComponentProps } from 'react';
import styled from 'styled-components';
import { SimpleButton } from './Buttons';
import { MetamaskState } from '../hooks';

const Form = styled.form`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  margin-bottom: 1rem;

  ${({ theme }) => theme.mediaQueries.small} {
    flex-direction: column;
    align-items: center;
  }
`;

const InputField = styled.input`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  height: 40px;
  padding: 0;
  margin-right: 2rem;
  ${({ theme }) => theme.mediaQueries.small} {
    width: 100%;
    margin-bottom: 1rem;
    margin-right: 0;
  }
`;

export const TokenInputForm = ({
  state,
  inputValue,
  inputPlaceholder,
  buttonText,
  onDepositSubmit,
  onInputChange,
}: {
  state: MetamaskState;
  inputValue: string;
  inputPlaceholder: string;
  buttonText: string;
  onDepositSubmit(e: any): unknown;
  onInputChange(e: any): unknown;
}) => {
  return (
    <Form onSubmit={onDepositSubmit}>
      <InputField 
        type="text" 
        placeholder={inputPlaceholder}
        value={inputValue}
        onChange={onInputChange}
        required
      />
      <SimpleButton type="submit" text={buttonText}></SimpleButton>
    </Form>
  );
};