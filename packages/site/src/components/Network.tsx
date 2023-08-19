import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { MetaMaskContext, useAcount } from '../hooks';
import { SupportedChainIdMap, getSupportedChainIdsArray } from '../types';
import { switchChainId } from '../utils';

interface DropdownItemProps {
  selected: boolean;
  onClick: () => void;
}

// Styled components
const Body = styled.div`
  padding: 2rem 0;
`;

const DropdownList = styled.ul`
  width: 150px;
  list-style: none;
  padding: 0;
  margin: 0;
`;

const DropdownItem = styled.li<DropdownItemProps>`
  padding: 8px 12px;
  cursor: pointer;
  background-color: ${(props) => (props.selected ? props.theme.colors.primary.default : 'transparent')};
  &:hover {
    background-color: #f2f2f2;
  }
`;

// Ethereum networks data
const ethereumNetworks: {
  name: string;
  icon: any;
  id: string;
}[] = getSupportedChainIdsArray()

export const NetworkModalDropdown = ({
  closeModal,
}: {
  closeModal(): unknown;
}) => {
  const [state] = useContext(MetaMaskContext);
  const [selectedNetwork, setSelectedNetwork] = useState<{name: string; icon: any; id: string}>(SupportedChainIdMap[state.chainId]);
  const {getSmartAccount, getAccountActivity} = useAcount()
  
  const handleNetworkChange = async (network: {name: string; icon: any; id: string}) => {
    const result = await switchChainId(network.id)
    closeModal()
    if (result === true) {
      setSelectedNetwork(network);
      // refresh selected smart account
      if(state.scAccount.connected && state.selectedSnapKeyringAccount.id !== '') {
        await getSmartAccount(state.selectedSnapKeyringAccount.id)
        await getAccountActivity(state.selectedSnapKeyringAccount.id)
      }
    }
  };

  return (
    <Body>
      <DropdownList>
        {ethereumNetworks.map((network) => (
          <DropdownItem
            key={network.id}
            selected={selectedNetwork.id === network.id}
            onClick={() => handleNetworkChange(network)}
          >
            {network.name}
          </DropdownItem>
        ))}
      </DropdownList>
    </Body>
  );
}
