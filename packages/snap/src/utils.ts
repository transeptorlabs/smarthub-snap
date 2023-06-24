import { BigNumber, ethers } from 'ethers';

export const convertToEth = (amount: string): string => {
  return ethers.utils.formatEther(amount);
};

export const convertToWei = (amount: string): BigNumber => {
  return ethers.utils.parseUnits(amount);
};

export const trimAccount = (account: string): string => {
  if (!account) {
    return '';
  }
  const trimmedAddress = `${account.substring(0, 6)}.......${account.substring(
    account.length - 4,
  )}`;
  return trimmedAddress;
};