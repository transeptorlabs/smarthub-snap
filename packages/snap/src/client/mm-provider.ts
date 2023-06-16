import { BigNumber, ethers } from 'ethers';
import { EntryPoint__factory } from '@account-abstraction/contracts';

const gasBuffer = 10000; // buffer of 10,000 gas

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

export const getDeposit = async (
  accountAddr: string,
  entryPoint: string,
): Promise<BigNumber> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);
  const contract = new ethers.Contract(
    entryPoint,
    EntryPoint__factory.abi,
    provider,
  );
  return contract.balanceOf(accountAddr);
};

export const getFeeData = async (): Promise<ethers.providers.FeeData> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);
  return await provider.getFeeData();
};

export const getGasPrice = async (): Promise<BigNumber> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);
  return await provider.getGasPrice();
};

export const encodeFunctionData = async (
  contract: ethers.Contract,
  functionName: string,
  params: any[],
): Promise<string> => {
  return contract.interface.encodeFunctionData(functionName, params);
};

export const estimateGas = async (
  from: string,
  to: string,
  data: string | ethers.utils.Bytes,
): Promise<BigNumber> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);
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

  return BigNumber.from(estimate.toNumber() + gasBuffer);
};

export const estimateGasCost = async (
  estimateRequired: BigNumber,
  gasPrice: BigNumber,
) => {
  const totalCost = gasPrice.mul(estimateRequired);
  return totalCost;
};
