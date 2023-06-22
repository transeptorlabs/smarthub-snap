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
};
