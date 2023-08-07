export enum AppTab {
  About = 'About',
  Install = 'Install',
  Account = 'Account',
  Build = 'Build',
  Settings = 'Settings',
}

export const SupportedChainIdMap: { [chainId: string]: string } = {
  '0x1': 'Ethereum',
  '0x5': 'Goerli',
  '0x539': 'Private',
  '0x89': 'Polygon mainnet',
  '0x13881': 'Polygon mumbai',
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