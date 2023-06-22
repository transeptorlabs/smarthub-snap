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
  margin-left: 2rem;

  ${({ theme }) => theme.mediaQueries.small} {
    width: 100%;
    margin-bottom: 1rem;
    margin-right: 0;
    margin-left: 0;
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

const FlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;

  ${({ theme }) => theme.mediaQueries.small} {
    flex-direction: column;
  }
`;

const LineBreak = styled.hr`
  color: ${(props) => props.theme.colors.primary};
  border: solid 1px ${(props) => props.theme.colors.border.default};
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    width: 100%;
  }
`;

const BundlerForm = styled.form`
  display: flex;
  flex-direction: row;
  margin-bottom: 1rem;
  justify-content: space-between;


  ${({ theme }) => theme.mediaQueries.small} {
    flex-direction: column;
    align-items: center;
  }
`;

const Info = styled.span`
  color: ${(props) => props.theme.colors.text.default};
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
`;

const BundlerInputField = styled.input`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: auto;
  height: 40px;
  padding: 0;
  margin-right: 2rem;
  margin-left: 2rem;
  width: 60%;

  ${({ theme }) => theme.mediaQueries.small} {
    margin-bottom: 1rem;
    margin-right: 0;
    margin-left: 0;
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

type BundlerInputFormProps = {
  buttonText: string;
  inputPlaceholder: string;
  inputValue: string;
  chainId: string;
  networkName: string;
  onInputChange(e: any): unknown;
  onSubmitClick(e: any): unknown;
};
export const BundlerInputForm = ({
  buttonText,
  chainId,
  inputPlaceholder,
  networkName,
  inputValue,
  onInputChange,
  onSubmitClick,
}: BundlerInputFormProps) => {
  return (
    <div>
      <BundlerForm onSubmit={onSubmitClick}>
        <FlexColumn>
          <Info>Network: {networkName}</Info>
          <Info>ChainId: {chainId}</Info>
        <FlexRow>
          <Info>Bundler Url</Info>
          <BundlerInputField 
            key={`${chainId}-url`}
            type="text" 
            placeholder={inputPlaceholder}
            value={inputValue}
            onChange={onInputChange}
            required
          />
        </FlexRow>
        </FlexColumn>
        <SimpleButton type="submit" text={buttonText}></SimpleButton>
      </BundlerForm>
      <LineBreak></LineBreak>
    </div>
  );
};