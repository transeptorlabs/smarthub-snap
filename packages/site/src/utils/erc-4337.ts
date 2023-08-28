import { EntryPoint__factory } from '@account-abstraction/contracts';
import { ethers } from 'ethers';
import { getMMProvider } from './metamask';
import { UserOperation } from '../types';

export const getDummySignature = async (
  userOp: UserOperation,
  entryPointAddress: string,
): Promise<string> => {
  const provider = new ethers.providers.Web3Provider(getMMProvider() as any);
  const entryPointContract = new ethers.Contract(
    entryPointAddress,
    EntryPoint__factory.abi,
    provider,
  );
  const randomWallet = ethers.Wallet.createRandom();
  const dummySignature = randomWallet.signMessage(
    await entryPointContract.getUserOpHash(userOp),
  );
  return dummySignature;
};
