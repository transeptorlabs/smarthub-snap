import EthereumLogo from '../assets/icons/eth.svg';
import PolygonLogo from '../assets/icons/polygon.svg';
import ArbitrumLogo from '../assets/icons/arbitrum.svg';
import OptimismLogo from '../assets/icons/optimism.svg';
import PrivateLogo from '../assets/icons/private-chain.svg';

export enum AppTab {
  SmartAccount = 'Smart Account',
  Management = 'Management',
  Settings = 'Settings',
}

export const SupportedChainIdMap: { [chainId: string]: {name: string, icon: any, id: string} } = {
  '0x1': {name: 'Ethereum', icon: EthereumLogo, id: '0x1'},
  '0x5': { name: 'Goerli' , icon: PrivateLogo,  id: '0x5'},
  '0x539': { name: 'Private' , icon: PrivateLogo, id: '0x539'},
  '0x89': { name: 'Polygon', icon: PolygonLogo,   id: '0x89'},
  '0x13881': { name: 'Polygon Mumbai', icon: PolygonLogo, id: '0x13881'},
  '0xa4b1': { name: 'Arbitrum', icon: ArbitrumLogo, id: '0xa4b1'},
  '0xa': { name: 'Optimism', icon: OptimismLogo, id: '0xa'},
};

export const getSupportedChainIdsArray = () => {
  return Object.entries(SupportedChainIdMap).map(([, { name, icon, id }]) => ({
    name,
    icon,
    id,
  }));
};

export type BundlerUrls = { [chainId: string]: string };

export type SmartAccountParams = {
  scOwnerAddress: string;
};

export type SendUserOpParams = {
  target: string;
  data: string;
  scOwnerAddress: string;
};
