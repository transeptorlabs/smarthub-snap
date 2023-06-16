import { BigNumberish, Wallet, ethers } from 'ethers';
import { SimpleAccountAPI } from '@account-abstraction/sdk';

export const getWallet = async (): Promise<Wallet> => {
  const privKey = await snap.request({
    method: 'snap_getEntropy',
    params: {
      version: 1,
      salt: 'transeptor-ecr4337-wallet',
    },
  });

  const provider = new ethers.providers.Web3Provider(ethereum as any);
  return new Wallet(privKey).connect(provider);
};

export const getOwnerAddr = async (): Promise<string> => {
  const ethWallet = await getWallet();
  return ethWallet.address;
};

export const signMessage = async (
  message: string | ethers.utils.Bytes,
): Promise<string> => {
  const ethWallet = await getWallet();
  return await ethWallet.signMessage(message);
};

// TODO: Allow use to have multiple accounts(use snap_manageState to keep track on index for each account)
export const getSimpleScAccount = async (
  entryPointAddress: string,
  factoryAddress: string,
  index: BigNumberish = '0',
): Promise<SimpleAccountAPI> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);
  const owner = await getWallet();
  const aa = new SimpleAccountAPI({
    provider,
    entryPointAddress,
    owner,
    factoryAddress,
    index, // nonce value used when creating multiple accounts for the same owner
  });
  return aa;
};
