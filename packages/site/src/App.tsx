import { FunctionComponent, ReactNode, useContext } from 'react';
import styled from 'styled-components';
import { Footer, Header, AlertBanner, AlertType } from './components';

import { GlobalStyle } from './config/theme';
import { ToggleThemeContext } from './Root';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  max-width: 100vw;
`;

const BannerWrapper = styled.div`
  padding-top: 25px;
  padding-left: 5%;
  padding-right: 5%;
`;

export type AppProps = {
  children: ReactNode;
};

export const App: FunctionComponent<AppProps> = ({ children }) => {
  const toggleTheme = useContext(ToggleThemeContext);
    // Make sure we are on a browser, otherwise we can't use window.ethereum.
    if (typeof window === 'undefined') {
      return null;
    }

  return (
    <>
      <GlobalStyle />
      <Wrapper>
        <Header handleToggleClick={toggleTheme} />
        <BannerWrapper>
          <AlertBanner
            title={
              `This software is in the early stages of development and may contain bugs, vulnerabilities and has not undergone a security audit. DO NOT use it to store real assets.`
            }
            alertType={AlertType.Failure}
          />
        </BannerWrapper>
        {children}
        <Footer />
      </Wrapper>
    </>
  );
};
