import { BigNumber, ethers } from 'ethers';
import { getMMProvider } from './metamask';

export const connectedAccounts = async() => {
  await getMMProvider().request({
    method: "wallet_requestPermissions",
    params: [
      {
        "eth_accounts": {}
      }
    ]
  });

  const accounts = await getMMProvider().request({ method: 'eth_requestAccounts' })
    .catch((err) => {
      if (err.code === 4001) {
        // EIP-1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
        console.log('Please connect to MetaMask.');
      } else {
        console.error(err);
      }
    }) as string[];


  return accounts;
}

export const listConnectedAccounts = async() => {
  return await getMMProvider().request({ method: 'eth_requestAccounts' })
    .catch((err) => {
      if (err.code === 4001) {
        // EIP-1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
        console.log('Please connect to MetaMask.');
      } else {
        console.error(err);
      }
    }) as string[];
}

export const isAccountConnected = async(address: string): Promise<boolean> => {
  const accounts = await getMMProvider().request({ method: 'eth_requestAccounts' })
  .catch((err) => {
    if (err.code === 4001) {
      // EIP-1193 userRejectedRequest error
      // If this happens, the user rejected the connection request.
      console.log('Please connect to MetaMask.');
    } else {
      console.error(err);
    }
  }) as string[];

  let found = false;
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].toLowerCase() === address.toLowerCase()) {
      found = true;
      break;
    }
  }
  return found;
}

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

export const switchChainId = async (chainId: string): Promise<boolean> => {
  try {
    await getMMProvider().request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await getMMProvider().request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId,
              chainName: '...',
              rpcUrls: ['https://...'] /* ... */,
            },
          ],
        });
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    }
    return false;
  }
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
  return ethers.utils.formatEther(amount).substring(0, 12);
};

export const convertToWei = (amount: string): BigNumber => {
  return ethers.utils.parseUnits(amount);
};

export const isValidAddress = (address: string) => {
  return ethers.utils.isAddress(address);
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

export const parseChainId = (chainId: string): number => {
  return parseInt(chainId as string, 16);
};
