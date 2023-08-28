import {
  EntryPoint__factory,
  SimpleAccountFactory__factory,
  SimpleAccount__factory,
} from '@account-abstraction/contracts';
import { BigNumber, ethers } from 'ethers';
import { DEFAULT_ACCOUNT_FACTORY, DEFAULT_ENTRY_POINT } from './4337-contants';

// GENERATE THE INITCODE
const DEFAULT_INIT_CODE = (owner: string) => {
  const simpleAccountFactory = new ethers.Contract(
    DEFAULT_ACCOUNT_FACTORY,
    SimpleAccountFactory__factory.abi,
  );

  return ethers.utils.hexConcat([
    DEFAULT_ACCOUNT_FACTORY,
    simpleAccountFactory.interface.encodeFunctionData('createAccount', [
      owner,
      0,
    ]),
  ])
}

export const getAccountInitCode = async (owner: string): Promise<string> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);
  const smartAccountAddress = await getSmartAccountAddress(owner);
  const smartAccountAddressCode = await provider.getCode(smartAccountAddress)

  if (smartAccountAddressCode.length > 2) {
    return '0x'
  } else {
    return DEFAULT_INIT_CODE(owner)
  }
};

// CALCULATE THE SENDER ADDRESS (aka: the smart account address)
export const getSmartAccountAddress = async (
  owner: string,
): Promise<string> => {
  try {
    const provider = new ethers.providers.Web3Provider(ethereum as any);
    const entryPointContract = new ethers.Contract(
      DEFAULT_ENTRY_POINT,
      EntryPoint__factory.abi,
      provider,
    );

    await entryPointContract.callStatic.getSenderAddress(DEFAULT_INIT_CODE(owner));
  } catch (e: any) {
    if (e.errorArgs === null) {
      throw e;
    }
  
    return e.errorArgs.sender;
  }
  throw new Error('must handle revert');
};

// GENERATE THE CALLDATA
export const getUserOpCallData = async (
  senderAddress: string,
  to: string,
  value: BigNumber,
  data: string,
): Promise<string> => {
  const simpleAccount = new ethers.Contract(
    senderAddress,
    SimpleAccount__factory.abi,
  );
  const valueBn = value ?? BigNumber.from(0);
  return simpleAccount.interface.encodeFunctionData('execute', [
    to,
    valueBn,
    data,
  ]);
};

// GET ACCOUNT CREATION GAS
export const estimateCreationGas = async (
  initCode: string,
): Promise<BigNumber> => {
  if (initCode === '0x') {
    return BigNumber.from(0);
  }
  const deployerAddress = initCode.substring(0, 42);
  const deployerCallData = `0x${initCode.substring(42)}`;
  const provider = new ethers.providers.Web3Provider(ethereum as any);

  const creationGasLimit = await provider.estimateGas({
    to: deployerAddress,
    data: deployerCallData,
  });
  const buffer = creationGasLimit.add(creationGasLimit.mul(10).div(100)); // 10% buffer

  return BigNumber.from(creationGasLimit.toNumber() + buffer.toNumber());
};

// GET THE NONCE
export const getNonce = async (senderAddress: string): Promise<BigNumber> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);

  // check if the contract is already deployed.
  const senderAddressCode = await provider.getCode(senderAddress);
  if (senderAddressCode.length > 2) {
    const accountContract = new ethers.Contract(
      senderAddress,
      SimpleAccount__factory.abi,
      provider,
    );
    return await accountContract.getNonce();
  }
  return BigNumber.from(0);
};

// GET THE DEPOSIT
export const getDeposit = async (accountAddr: string): Promise<BigNumber> => {
  const provider = new ethers.providers.Web3Provider(ethereum as any);
  const contract = new ethers.Contract(
    DEFAULT_ENTRY_POINT,
    EntryPoint__factory.abi,
    provider,
  );
  return contract.balanceOf(accountAddr);
};
