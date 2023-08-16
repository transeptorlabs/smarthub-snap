import EthereumLogo from '../assets/icons/eth.svg';
import PolygonLogo from '../assets/icons/polygon.svg';
import ArbitrumLogo from '../assets/icons/arbitrum.svg';
import OptimismLogo from '../assets/icons/optimism.svg';
import PrivateLogo from '../assets/icons/private-chain.svg';

export enum AppTab {
  Install = 'Install',
  Account = 'Account',
  Build = 'Build',
  Settings = 'Settings',
}

export const SupportedChainIdMap: { [chainId: string]: {name: string, icon: any} } = {
  '': { name: 'Not connected', icon: PrivateLogo },
  '0x1': {name: 'Ethereum', icon: EthereumLogo },
  '0x5': { name: 'Goerli testnet' , icon: PrivateLogo},
  '0x539': { name: 'Private' , icon: PrivateLogo},
  '0x89': { name: 'Polygon', icon: PolygonLogo},
  '0x13881': { name: 'Polygon Mumbai', icon: PolygonLogo},
  '0xa4b1': { name: 'Arbitrum', icon: ArbitrumLogo},
  '0xa': { name: 'Optimism', icon: OptimismLogo},
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
