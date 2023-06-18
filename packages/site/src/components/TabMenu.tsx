import React, { useContext } from 'react';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import styled from 'styled-components';
import { AppTab } from '../types';

const TabMenuContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const TabMenuItem = styled.p<{ active: boolean;}>`
  color: ${(props) => (props.active ? props.theme.colors.primary.default : props.theme.colors.primary)};
  font-weight: ${(props) => (props.active ? 'bold' : 'normal')};
  cursor: pointer;
  margin-left: 1rem;
  margin-right: 1rem;
`;

export const TabMenu = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const activeTab = state.activeTab;

  const handleTabClick = (tab: AppTab) => {
    dispatch({
      type: MetamaskActions.SetActiveTab,
      payload: tab,
    });
  };

  return (
    <TabMenuContainer>
      <TabMenuItem active={activeTab === AppTab.About} onClick={() => handleTabClick(AppTab.About)}>
        {AppTab.About}
      </TabMenuItem>
      <TabMenuItem active={activeTab === AppTab.Install} onClick={() => handleTabClick(AppTab.Install)}>
        {AppTab.Install}
      </TabMenuItem>
      <TabMenuItem active={activeTab === AppTab.Account} onClick={() => handleTabClick(AppTab.Account)}>
        {AppTab.Account}
      </TabMenuItem>
      <TabMenuItem active={activeTab === AppTab.Settings} onClick={() => handleTabClick(AppTab.Settings)}>
        {AppTab.Settings}
      </TabMenuItem>
    </TabMenuContainer>
  );
};