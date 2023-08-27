import { BigNumber, ethers } from 'ethers';
import { EntryPoint__factory } from '@account-abstraction/contracts';

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

export const isDeployed = async (addr: string): Promise<boolean> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);
  return await provider.getCode(addr).then((code) => code !== '0x');
};

export const getBalance = async (addr: string): Promise<BigNumber> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);
  return await provider.getBalance(addr);
};

