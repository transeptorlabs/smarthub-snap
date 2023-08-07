import { Wallet, ethers } from 'ethers';
import { SimpleAccountAPI } from '@account-abstraction/sdk';
import {
  deriveBIP44AddressKey,
  JsonBIP44CoinTypeNode,
} from '@metamask/key-tree';
import { remove0x } from '@metamask/utils';

// Get a private key for the ETH coin type. Ethereum uses the following derivation path: m/44'/60'/account'/change/index - ex: m/44'/60'/0'/0/0 -  account 0 in MetaMask wallet
const getPrivateKey = async (addressIndex: number) => {
  const coinTypeNode = (await snap.request({
    method: 'snap_getBip44Entropy',
    params: {
      coinType: 60,
    },
  })) as JsonBIP44CoinTypeNode;

  return remove0x(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    (
      await deriveBIP44AddressKey(coinTypeNode, {
        account: 0,
        change: 0,
        address_index: addressIndex, // change this to get different private keys
      })
    ).privateKey!,
  );
};

const getWallet = async (addressIndex: number): Promise<Wallet> => {
  const privKey = await getPrivateKey(addressIndex);
  const provider = new ethers.providers.Web3Provider(ethereum as any);
  return new Wallet(privKey).connect(provider);
};

export const getEoaAccount = async (addressIndex: number): Promise<string> => {
  const privKey = await getPrivateKey(addressIndex);
  return new Wallet(privKey).getAddress();
};

export const findAccountIndex = async (ethAddress: string): Promise<number> => {
  const maxIndex = 20;
  let found = false;
  let foundIndex = -1;
  for (let i = 0; i < maxIndex; i++) {
    const account = await getEoaAccount(i);
    if (account.toLowerCase() === ethAddress.toLowerCase()) {
      found = true;
      foundIndex = i;
    }
  }

  if (!found) {
    throw new Error('Account not found');
  }
  return foundIndex;
};

export const signMessageWithEoa = async (
  message: string | ethers.utils.Bytes,
  addressIndex: number,
): Promise<string> => {
  const ethWallet = await getWallet(addressIndex);
  return await ethWallet.signMessage(message);
};

export const getSimpleScAccount = async (
  entryPointAddress: string,
  factoryAddress: string,
  index: number,
  smartIndex = 0,
): Promise<SimpleAccountAPI> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);
  const owner = await getWallet(index);
  const aa = new SimpleAccountAPI({
    provider,
    entryPointAddress,
    owner,
    factoryAddress,
    index: smartIndex, // nonce value used when creating multiple accounts for the same owner
  });
  return aa;
};
