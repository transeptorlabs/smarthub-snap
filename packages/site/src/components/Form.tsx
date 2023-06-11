import { ComponentProps } from 'react';
import styled from 'styled-components';
import { SimpleButton } from './Buttons';

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

const InputContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  ${({ theme }) => theme.mediaQueries.small} {
    flex-direction: column;
    width: 100%;
  }
`;

type FormProps = {
  buttonText: string;
  inputs: {
    id: string;
    inputPlaceholder: string;
    inputValue: string;
    onInputChange(e: any): unknown;
  }[];
  onSubmitClick(e: any): unknown;
};

export const TokenInputForm = ({
  buttonText,
  inputs,
  onSubmitClick,
}: FormProps) => {
  return (
    <Form onSubmit={onSubmitClick}>
      <InputContainer>
        {
          inputs.map((item: {id: string, inputPlaceholder: string, inputValue: string, onInputChange(e: any): unknown }) => (
            <InputField 
              key={item.id}
              type="text" 
              placeholder={item.inputPlaceholder}
              value={item.inputValue}
              onChange={item.onInputChange}
              required
            />
          ))
        }
      </InputContainer>
      <SimpleButton type="submit" text={buttonText}></SimpleButton>
    </Form>
  );
};