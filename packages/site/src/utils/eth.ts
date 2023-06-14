import { BigNumber, ethers } from 'ethers';
import { Account } from '../types/erc-4337';

export const connectWallet = async (): Promise<Account> => {
  const accounts = await window.ethereum
    .request({ method: 'eth_requestAccounts' })
    .catch((err) => {
      if (err.code === 4001) {
        // EIP-1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
        console.log('Please connect to MetaMask.');
      } else {
        throw Error(err);
      }
    });
  
  const account: string = (accounts as string[])[0]
  return {
    address: account,
    balance: await getAccountBalance(account),
    connected: true,
  } as Account;
};

export const getAccountBalance = async (account: string): Promise<string> => {
  const ethersProvider = new ethers.providers.Web3Provider(window.ethereum as any);
  const balance = await ethersProvider.getBalance(account);
  return balance.toString()
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

export const encodeFunctionData = async (
  contract: ethers.Contract,
  functionName: string,
  params: any[],
): Promise<string> => {
  return contract.interface.encodeFunctionData(functionName, params);
};
