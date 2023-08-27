import { BigNumber, ethers } from 'ethers';

export const getNetwork = async (): Promise<string> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);
  const chainId = await provider.getNetwork();
  return chainId.name;
};

export const getChainId = async (): Promise<number> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);
  const chainId = await provider.getNetwork();
  return chainId.chainId;
};

export const getBalance = async (addr: string): Promise<BigNumber> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);
  return await provider.getBalance(addr);
};
