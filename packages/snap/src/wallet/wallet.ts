import { BigNumber, Wallet, ethers } from 'ethers';
import { SimpleAccountAPI } from '@account-abstraction/sdk';
import { EntryPoint__factory } from '@account-abstraction/contracts'
import { getBalance } from '../client';

const getWallet = async (): Promise<Wallet> => {
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
export const getAbstractAccount = async (
  entryPointAddress: string,
  factoryAddress: string,
  index: number = 0,
): Promise<SimpleAccountAPI> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);
  const aa = new SimpleAccountAPI({
    provider,
    entryPointAddress,
    owner: await getWallet(),
    factoryAddress,
    index, // nonce value used when creating multiple accounts for the same owner
  });
  return aa;
};

export const depositToEntryPoint = async (entryPoint: string, depositInWei: string, address: string): Promise<string> => {
  const signer = await getWallet()
  const signerBalance = await getBalance(signer.address)
  if (signerBalance.lt(depositInWei)) {
    throw new Error('Owner account has, insufficient balance')
  }

  const contract = new ethers.Contract(entryPoint, EntryPoint__factory.abi, signer);
  const tx = await contract.functions['depositTo'](address, {value: depositInWei});

  const receipt = await tx.wait()
    
  return receipt.transactionHash;
};

export const estimateDepositToEntryPoint = async (entryPoint: string, depositInWei: string, address: string): Promise<BigNumber> => {
  const signer = await getWallet()
  const provider = new ethers.providers.Web3Provider(ethereum as any);
 
  const contract = new ethers.Contract(entryPoint, EntryPoint__factory.abi, signer);
  const estimate = await contract.estimateGas['depositTo'](address, {value: depositInWei});
  const gasPrice = await provider.getGasPrice();

  return estimate.mul(gasPrice);
};