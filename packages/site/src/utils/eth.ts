import { BigNumber, ethers } from 'ethers';
import { EntryPoint__factory } from '@account-abstraction/contracts';
import { EOA } from '../types';
import { getMMProvider } from './metamask';

export const getAccountBalance = async (account: string): Promise<string> => {
  const ethersProvider = new ethers.providers.Web3Provider(
    getMMProvider() as any,
  );
  const balance = await ethersProvider.getBalance(account);
  return balance.toString();
};

export const getChainId = async (): Promise<string> => {
  const provider = getMMProvider();
  const chainId = await provider
    .request({ method: 'eth_chainId' })
    .catch((err) => {
      throw Error(err);
    });
  return chainId as string;
};

export const connectWallet = async (): Promise<EOA> => {
  const provider = getMMProvider();
  const accounts = await provider
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

  const account: string = (accounts as string[])[0];
  return {
    address: account,
    balance: await getAccountBalance(account),
    connected: true,
  } as EOA;
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

export const getEntryPointContract = (epAddress: string): ethers.Contract => {
  const provider = new ethers.providers.Web3Provider(getMMProvider() as any);
  return new ethers.Contract(
    epAddress,
    EntryPoint__factory.abi,
    provider.getSigner(),
  );
};

export const estimateGas = async (
  from: string,
  to: string,
  data: string | ethers.utils.Bytes,
): Promise<BigNumber> => {
  const provider = new ethers.providers.Web3Provider(getMMProvider() as any);
  const estimate = await provider
    .estimateGas({ from, to, data })
    .catch((err) => {
      const pattern = /\(reason="(.*?)", method="(.*?)", transaction=/u;
      const matches = err.message.match(pattern);
      if (matches && matches.length >= 3) {
        const reason = matches[1];
        const method = matches[2];
        throw new Error(
          `Failed to estimate gas: ${reason}, when snap calling ${method}. `,
        );
      } else {
        throw new Error(
          'Unable to extract information from the error message when estimating gas.',
        );
      }
    });

  const buffer = estimate.add(estimate.mul(50).div(100)); // 50% buffer
  return BigNumber.from(estimate.toNumber() + buffer.toNumber());
};

export const getGasPrice = async (): Promise<BigNumber> => {
  const provider = new ethers.providers.Web3Provider(getMMProvider() as any);
  return await provider.getGasPrice();
};

export const parseChainId = (chainId: string): number => {
  return parseInt(chainId as string, 16)
};
