import {
  EntryPoint__factory,
  UserOperationStruct,
} from '@account-abstraction/contracts';
import { ethers } from 'ethers';
import { getMMProvider } from './metamask';

export const getDummySignature = async (
  userOp: UserOperationStruct,
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
