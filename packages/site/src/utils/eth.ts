import { BigNumber, ethers } from 'ethers';

export const connectWallet = async (): Promise<string> => {
  const accounts = await window.ethereum
    .request({ method: 'eth_requestAccounts' })
    .catch((err) => {
      if (err.code === 4001) {
        // EIP-1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
        console.log('Please connect to MetaMask.');
      } else {
        console.error(err);
      }
    });
  return accounts as string[][0];
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

export const trimAccounts = (accounts: string[]): string[] => {
  if (!accounts) {
    return [];
  }

  const trimmedAccounts = accounts.map((account: string) => {
    return trimAccount(account);
  });

  return trimmedAccounts;
};

export const convertToEth = (amount: string): string => {
  return ethers.utils.formatEther(amount).substring(0, 6);
};

export const convertToWei = (amount: string): BigNumber => {
  return ethers.utils.parseUnits(amount);
};

export const isValidAddress = (address: string) => {
  return ethers.utils.isAddress(address);
};
