import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { ClipLoader } from 'react-spinners';
import { CommonInputForm } from './Form';
import { FaRegTimesCircle, FaCheckCircle } from 'react-icons/fa';
import { MetaMaskContext, useAcount } from '../hooks';
import { AccountRequestDisplay } from './Account';
import { convertToEth, convertToWei, estimateGas, trimAccount } from '../utils/eth';
import { BlockieAccountModal } from './Blockie-Icon';
import { BigNumber, ethers } from 'ethers';
import { calcPreVerificationGas, estimatCreationGas, estimateUserOperationGas, getDummySignature, getMMProvider, getUserOpCallData, handleCopyToClipboard, notify, storeTxHash } from '../utils';
import { EntryPoint__factory } from '@account-abstraction/contracts';
import { UserOperation } from '../types';
import { FaCopy } from "react-icons/fa";

const Body = styled.div`
  padding: 2rem 0;
  max-width: 64.8rem;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 64.8rem;
  max-width: 64.8rem;

  ${({ theme }) => theme.mediaQueries.small} {
    width: 34.4rem;
    padding: 1.6rem;
  }
`;

const FlexCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
`;

const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const AccountContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: left;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.card.default};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
  margin-bottom: 2.5rem;
`;

const TextTitle = styled.p`
  color: ${(props) => props.theme.colors.text.default};
  font-weight: bold;
  margin: 0;
  margin-bottom: 2rem;
  font-size: 20px;
`; 

const Status = styled.div`
  font-size: 18px;
  margin-bottom: 10px;
  color: ${(props) => props.theme.colors.text.default};
`;

const SpinnerContainer = styled.div`
  margin: auto;
`;

const Text = styled.p`
  color: ${(props) => props.theme.colors.text.default};
  margin: 0;
  font-size: 14px;
  opacity: 80%;
`; 

const IconContainer = styled.div`
  margin-bottom: 2rem; 
`;

const TextBold = styled.p`
  color: ${(props) => props.theme.colors.text.default};
  font-weight: bold;
  margin: 0;
  margin-bottom: .5rem;
`; 

const AccountCopy = styled.div`
  margin-left: 4rem;
  margin-top: auto;
  margin-bottom: 0;
  margin-right: 5rem;
  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
    cursor: pointer;
  }
`;

enum Stage {
  EnterAmount = 'Enter Amount',
  Review = 'Review',
  Loading = 'Loading',
  Success = 'Success',
  Failed = 'Failed',
}

export enum TransactionType {
  Deposit = 'Deposit',
  Withdraw = 'Withdraw',
}

export const EthereumTransactionModalComponent = ({
    transactionType,
  }: {
    transactionType: TransactionType;
  }) => {
  const [state] = useContext(MetaMaskContext);
  const [status, setStatus] = useState<Stage>(Stage.EnterAmount);
  const [failMessage, setFailMessage] = useState<string>('User denied the transaction signature.');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const [amount, setAmount] = useState<string>('');

  const {
    sendRequestSync,
    getSmartAccount,
    getAccountActivity,
    getKeyringSnapAccounts,
  } = useAcount();

  const handleDepositSubmit = async () => {
    const depositInWei = convertToWei(amount);
  
    // check the owner account has enough balance
    if (BigNumber.from(depositInWei).gte(state.scAccount.owner.balance)) {
      throw new Error('Owner account has, insufficient funds.')
    }
    
    const provider = new ethers.providers.Web3Provider(getMMProvider() as any);
    const entryPointContract = new ethers.Contract(state.scAccount.entryPoint, EntryPoint__factory.abi)

    // estimate gas 
    const feeData = await provider.getFeeData()
    const encodedFunctionData = entryPointContract.interface.encodeFunctionData('depositTo', [state.scAccount.address]);
    const estimateGasAmount = await estimateGas(
      state.selectedSnapKeyringAccount.address,
      state.scAccount.entryPoint,
      encodedFunctionData,
    );

    // check the selected account is connected
    console.log(state)
    if (!state.isSelectedSnapKeyringAccountConnected) {
      throw new Error('The selected account is not connected. Please connect the account using Settings page.')
    }

    // send transaction
    const res = await getMMProvider().request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: state.selectedSnapKeyringAccount.address,
          to: entryPointContract.address,
          value: depositInWei.toHexString(),
          gasLimit: estimateGasAmount.toHexString(),
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toHexString() ?? BigNumber.from(0).toHexString(),
          maxFeePerGas: feeData.maxFeePerGas?.toHexString() ?? BigNumber.from(0).toHexString(),
          data: encodedFunctionData,
        }
      ],
    }) as string

    // show success message
    await getSmartAccount(state.selectedSnapKeyringAccount.id);
    await storeTxHash(
      state.selectedSnapKeyringAccount.id,
      res,
      state.chainId,
    );
    setAmount('');
    setSuccessMessage(`${amount} ETH successfully depoisted to entry point contract.`);
    setStatus(Stage.Success);
    // notify('Deposit Transaction sent (txHash)', 'View activity for details.', res)
  }

  const handleWithdrawSubmit = async () => {
    const withdrawAmountInWei = convertToWei(amount);

    // check the smart account has enough deposit
    if (BigNumber.from(withdrawAmountInWei).gte(state.scAccount.deposit)) {
      throw new Error('Smart contract account, insufficient deposit')
    }

    const provider = new ethers.providers.Web3Provider(getMMProvider() as any);
    const entryPointContract = new ethers.Contract(state.scAccount.entryPoint, EntryPoint__factory.abi)

    // get call data
    const callData = await getUserOpCallData(
      state.selectedSnapKeyringAccount.id,
      entryPointContract.address,
      BigNumber.from(0),
      entryPointContract.interface.encodeFunctionData('withdrawTo', [state.selectedSnapKeyringAccount.address, withdrawAmountInWei.toString()]) // users intent(contract they want to interact with)
    )

    // set transation data (user operation)   
    const userOpToSign: UserOperation = {
        sender: state.scAccount.address,
        nonce: state.scAccount.nonce.toHexString(),
        initCode: state.scAccount.initCode,
        callData: callData,
        callGasLimit: BigNumber.from(0).toHexString(),
        verificationGasLimit: BigNumber.from(0).toHexString(),
        preVerificationGas: BigNumber.from(0).toHexString(),
        maxPriorityFeePerGas: BigNumber.from(0).toHexString(),
        maxFeePerGas: BigNumber.from(0).toHexString(),
        paymasterAndData: '0x', // no paymaster
        signature: '0x'
    }

    // get dummy signature
    userOpToSign.signature = await getDummySignature(userOpToSign, entryPointContract.address)

    // get gas fee
    const feeData = await provider.getFeeData()
    const initGas = await estimatCreationGas(state.selectedSnapKeyringAccount.id)
    const estimatGasResult = await estimateUserOperationGas(userOpToSign)

    userOpToSign.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas.toHexString(): BigNumber.from(0).toHexString()
    userOpToSign.maxFeePerGas = feeData.maxFeePerGas ? feeData.maxFeePerGas.toHexString() : BigNumber.from(0).toHexString()
    userOpToSign.callGasLimit = estimatGasResult.callGasLimit.toHexString()

    if (initGas.eq(0)) {
      userOpToSign.verificationGasLimit = BigNumber.from(100000).toHexString()
      userOpToSign.preVerificationGas = estimatGasResult.preVerificationGas.add(initGas).toHexString()

      // add gas buffer
      const preVerificationGasWithBuffer = calcPreVerificationGas(userOpToSign)
      userOpToSign.preVerificationGas = BigNumber.from(preVerificationGasWithBuffer).toHexString()
    } else {
      userOpToSign.verificationGasLimit = estimatGasResult.verificationGas.add(initGas).toHexString()
      userOpToSign.preVerificationGas = estimatGasResult.preVerificationGas.add(initGas).toHexString()
    }

    // send request to keyring for approval
    await sendRequestSync(
      state.selectedSnapKeyringAccount.id,
      'eth_sendTransaction',
      [state.selectedSnapKeyringAccount.address, 'eip4337', userOpToSign] // [from, type, transactionData]
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();

      setStatus(Stage.Loading);

      if (transactionType === TransactionType.Deposit) {
        await handleDepositSubmit();
      } else if (transactionType === TransactionType.Withdraw) {
        await handleWithdrawSubmit();
      } else {
        throw new Error('Invalid transaction type');
      }

    } catch (e) {
      console.error(e.message)
      setAmount('');
      setFailMessage(e.message);
      setStatus(Stage.Failed);
    }
  };

  const handleAmountChange = async (e: any) => {
    // Regular expression to match only numbers
    const inputValue = e.target.value;
    const numberRegex = /^\d*\.?\d*$/;
    if (inputValue === '' || numberRegex.test(inputValue)) {
        setAmount(e.target.value);
    }
  }

  const handleConfirmUserOpClick = async (event: any) => {
    try {
      event.preventDefault();
      setStatus(Stage.Loading);
     //  TODO: Send userOp

      setStatus(Stage.Success);
      setSuccessMessage(`${amount} ETH successfully depoisted to entry point contract.`);
      // TODO: Add activity
      // await getAccountActivity(state.selectedSnapKeyringAccount.id);
      await getSmartAccount(state.selectedSnapKeyringAccount.id);
    } catch (e) {
      setFailMessage(e.message)
      setAmount('');
      setStatus(Stage.Failed);
    }
  };

  const handleRejectUserOpClick = async (event: any) => {
    try {
      event.preventDefault();
      setStatus(Stage.Loading);
      setAmount('')
      setStatus(Stage.EnterAmount);
    } catch (e) {
      setAmount('')
      setFailMessage(e.message)
      setStatus(Stage.Failed);
    }
  };

  const renderStage = () => {
    switch (status) {
      case Stage.EnterAmount:
        return (
          <FlexCol>
            {transactionType === TransactionType.Deposit ? (
              <FlexCol>
                <AccountContainer>
                  <BlockieAccountModal />
                  <FlexCol>
                    <TextBold>(owner)</TextBold>
                    <FlexRow>
                      <Text>
                        {trimAccount(state.selectedSnapKeyringAccount.address)}
                      </Text>
                      <AccountCopy
                        onClick={(e) =>
                          handleCopyToClipboard(
                            e,
                            state.selectedSnapKeyringAccount.address,
                          )
                        }
                      >
                        <FaCopy />
                      </AccountCopy>
                    </FlexRow>
                    <Text>Balance:{' '}{convertToEth(state.scAccount.owner.balance)} ETH
                </Text>
                  </FlexCol>
                </AccountContainer>
             
              </FlexCol>
            ) : (
              <FlexCol>
                <AccountContainer>
                  <BlockieAccountModal />
                  <FlexCol>
                    <TextBold>(smart account)</TextBold>
                    <FlexRow>
                      <Text>{trimAccount(state.scAccount.address)}</Text>
                      <AccountCopy
                        onClick={(e) =>
                          handleCopyToClipboard(e, state.scAccount.address)
                        }
                      >
                        <FaCopy />
                      </AccountCopy>
                    </FlexRow>
                    <Text>Total deposit: {convertToEth(state.scAccount.deposit)}{' '}ETH</Text>
                  </FlexCol>
                </AccountContainer>
              </FlexCol>
            )}
            <CommonInputForm
              key={'send-amount'}
              onSubmitClick={handleSubmit}
              buttonText="Review"
              inputs={[
                {
                  id: '1',
                  onInputChange: handleAmountChange,
                  inputValue: amount,
                  inputPlaceholder: 'ETH Amount',
                  type: 'number',
                },
              ]}
            />
          </FlexCol>
        );
      case Stage.Loading:
        return (
          <SpinnerContainer>
            <ClipLoader color="#8093ff" size={50} />
          </SpinnerContainer>
        );
      case Stage.Failed:
        return (
          <Container>
            <IconContainer>
              <FaRegTimesCircle size={80} color="#d73a49" />
            </IconContainer>
            <Status>Transaction Failed</Status>
            <Text>{failMessage}</Text>
          </Container>
        );
      case Stage.Success:
        return (
          <Container>
            <IconContainer>
              <FaCheckCircle size={80} color="#32a852" />
            </IconContainer>
            <Status>
              {transactionType === TransactionType.Deposit
                ? 'Deposit'
                : 'Withdraw'}{' '}
              successfully sent
            </Status>
            <Text>{successMessage}</Text>
          </Container>
        );
    }
  };

  return (
    <Body>
      <Container>
        {status !== Stage.Loading && (
          <TextTitle>{status}: {transactionType}</TextTitle>
        )}
        {renderStage()}
      </Container>
    </Body>
  );
};