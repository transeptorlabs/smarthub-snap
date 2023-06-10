import { BigNumber, Wallet, ethers } from 'ethers';
import { SimpleAccountAPI } from '@account-abstraction/sdk';
import { getBalance } from '../client';

const entryPointABI = [
  {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "depositTo",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    }
];

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

export const entryPointDeposit = async (entryPoint: string, amount: string, address: string) => {
  const signer = await getWallet()

  const signerBalance = await getBalance(signer.address)
  const funderBalance = await getBalance(address)
  if (signerBalance.lt(funderBalance)) {
    throw new Error('Insufficient balance')
  }

  const contract = new ethers.Contract(entryPoint, entryPointABI, signer);
  await signer.sendTransaction({
    to: entryPoint,
    value: BigNumber.from(amount),
    data: contract.interface.encodeFunctionData('depositTo', [address])
  }).then(async tx => await tx.wait())
    
  return true;
};
