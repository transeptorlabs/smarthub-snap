import { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { MetaMaskContext, MetamaskActions } from '../hooks';

type CheckedProps = {
  readonly checked: boolean;
};

const ToggleWrapper = styled.div`
  touch-action: pan-x;
  display: inline-block;
  position: relative;
  cursor: pointer;
  cursor: not-allowed; /* Use 'not-allowed' cursor to indicate it's disabled */
  background-color: transparent;
  border: 0;
  padding: 0;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -webkit-tap-highlight-color: transparent;
  ${({ theme }) => theme.mediaQueries.small} {
    margin-bottom: 2.4rem;
  }
`;

const ToggleInput = styled.input`
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
`;

const IconContainer = styled.div`
  position: absolute;
  width: 22px;
  height: 22px;
  top: 0;
  bottom: 0;
  margin-top: auto;
  margin-bottom: auto;
  line-height: 0;
  opacity: 0;
  transition: opacity 0.25s ease;
  & > * {
    align-items: center;
    display: flex;
    height: 20px;
    justify-content: center;
    position: relative;
    width: 12px;
  }
`;

const CheckedContainer = styled(IconContainer)<CheckedProps>`
  opacity: ${({ checked }) => (checked ? 1 : 0)};
  left: 10px;
`;

const UncheckedContainer = styled(IconContainer)<CheckedProps>`
  opacity: ${({ checked }) => (checked ? 0 : 1)};
  right: 10px;
`;

const ToggleContainer = styled.div<CheckedProps>`
  width: 62px;
  height: 26px;
  padding: 0;
  border-radius: 36px;
  background-color: ${({ checked, theme }) => (checked ? 'green' : theme.colors.background.alternative)};
  transition: all 0.2s ease;
`;
const ToggleCircle = styled.div<CheckedProps>`
  transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1) 0ms;
  position: absolute;
  top: 4px;
  left: ${({ checked }) => (checked ? '36px' : '4px')};
  width: 18px;
  height: 18px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.14);
  border-radius: 50%;
  background-color: #ffffff;
  box-sizing: border-box;
  transition: all 0.25s ease;
`;

export const ConnectToggle = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {  

      if (state.connectedAccounts.length === 0) {
        setChecked(false);
        dispatch({ type: MetamaskActions.SetIsSelectedSnapKeyringAccount, payload: false });
        return;
      }
      
      for (const account of state.connectedAccounts) {
        if (account.toLowerCase() === state.selectedSnapKeyringAccount.address.toLowerCase()) {
          setChecked(true);
          dispatch({ type: MetamaskActions.SetIsSelectedSnapKeyringAccount, payload: true });
          break;
        }
        setChecked(false);
        dispatch({ type: MetamaskActions.SetIsSelectedSnapKeyringAccount, payload: false });
      }

    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
    } 
  }, [state.connectedAccounts, state.selectedSnapKeyringAccount]);

  return (
    <ToggleWrapper>
      <ToggleContainer checked={checked} >
        <CheckedContainer checked={checked} >
          <span>✔</span>
        </CheckedContainer>
        <UncheckedContainer checked={checked}>
        </UncheckedContainer>
      </ToggleContainer>
      <ToggleCircle checked={checked} />
      <ToggleInput type="checkbox" aria-label="Toggle Button" />
    </ToggleWrapper>
  );
};
