import { Wallet, ethers } from 'ethers';
import { SimpleAccountAPI } from '@account-abstraction/sdk';

const getWallet = async (): Promise<Wallet> => {
  const privKey = await snap.request({
    method: 'snap_getEntropy',
    params: {
      version: 1,
      salt: 'transeptor-ecr4337-wallet',
    },
  });
  return new Wallet(privKey);
};

export const getAccountOwner = async (): Promise<string> => {
  const ethWallet = await getWallet();
  return ethWallet.address;
};

export const signMessage = async (
  message: string | ethers.utils.Bytes,
): Promise<string> => {
  const ethWallet = await getWallet();
  return await ethWallet.signMessage(message);
};

export const getAbstractAccount = async (entryPointAddress: string, factoryAddress: string): Promise<SimpleAccountAPI> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);
  const aa = new SimpleAccountAPI({
    provider,
    entryPointAddress,
    owner: await getWallet(),
    factoryAddress
  });
  return aa;
};

