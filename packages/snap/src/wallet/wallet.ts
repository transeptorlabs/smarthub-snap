import { BigNumber, Wallet, ethers } from 'ethers';
import { SimpleAccountAPI } from '@account-abstraction/sdk';
import { getBalance } from '../client';

const gasBuffer = 10000; // buffer of 10,000 gas

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
export const getAbstractAccount = async (
  entryPointAddress: string,
  factoryAddress: string,
  index = 0,
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

export const submitTransaction = async (
  txData: ethers.providers.TransactionRequest,
  signer: Wallet,
): Promise<string> => {
  const res = await signer.sendTransaction(txData);
  const receipt = await res.wait();
  return receipt.transactionHash;
};

export const depositToEntryPoint = async (
  signer: Wallet,
  epAddress: string,
  depositInWei: BigNumber,
  encodedFunctionData: string,
  estimateGasAmount: BigNumber,
  gasPrice: BigNumber,
): Promise<string> => {
  const signerBalance = await getBalance(signer.address);
  const totalAmount = estimateGasAmount.add(BigNumber.from(depositInWei));
  if (signerBalance.lt(totalAmount)) {
    throw new Error('Owner account has, insufficient balance');
  }

  const txData = {
    from: signer.address,
    to: epAddress,
    data: encodedFunctionData,
    value: depositInWei,
    gasPrice,
    gasLimit: estimateGasAmount,
  } as ethers.providers.TransactionRequest;

  return submitTransaction(txData, signer);
};

export const withdrawFromEntryPoint = async (
  signer: Wallet,
  epAddress: string,
  encodedFunctionData: string,
  estimateGasAmount: BigNumber,
  gasPrice: BigNumber,
): Promise<string> => {
  const signerBalance = await getBalance(signer.address);
  if (signerBalance.lt(estimateGasAmount)) {
    throw new Error('Owner account has, insufficient balance');
  }

  const txData = {
    from: signer.address,
    to: epAddress,
    data: encodedFunctionData,
    gasPrice,
    gasLimit: estimateGasAmount,
  } as ethers.providers.TransactionRequest;

  return submitTransaction(txData, signer);
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
