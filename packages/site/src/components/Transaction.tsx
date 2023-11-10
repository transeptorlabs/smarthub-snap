import React, { useContext, useState } from 'react';
import styled from 'styled-components';
import { ClipLoader } from 'react-spinners';
import { CommonInputForm } from './Form';
import { FaRegTimesCircle, FaCheckCircle } from 'react-icons/fa';
import { MetaMaskContext, useAcount } from '../hooks';
import { AccountRequestDisplay } from './Account';
import { convertToEth, convertToWei, estimateGas, parseChainId, trimAccount } from '../utils/eth';
import { BlockieAccountModal } from './Blockie-Icon';
import { BigNumber, ethers } from 'ethers';
import { calcPreVerificationGas, estimatCreationGas, estimateUserOperationGas, getDummySignature, getMMProvider, getSignedTxs, getUserOpCallData, handleCopyToClipboard, notify, storeTxHash } from '../utils';
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
    Sent = 'Sent',
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
  const [amount, setAmount] = useState<string>('');
  const [failMessage, setFailMessage] = useState<string>('User denied the transaction signature.');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const { sendRequest, approveRequest, rejectRequest, getSmartAccount, getAccountActivity, updateAccountBalance, getKeyringSnapAccounts } = useAcount();

  const handleDepositSubmit = async () => {
    const depositInWei = convertToWei(amount);
  
    // check the owner account has enough balance
    if (BigNumber.from(depositInWei).gte(state.selectedAccountBalance)) {
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

    // set transation data (eth transaction type 2)
    const transactionData = await entryPointContract.populateTransaction.depositTo(state.scAccount.address, {
    type: 2,
    nonce: await provider.getTransactionCount(state.selectedSnapKeyringAccount.address, 'latest'),
    gasLimit: estimateGasAmount.toNumber(),
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? BigNumber.from(0),
    maxFeePerGas: feeData.maxFeePerGas ?? BigNumber.from(0),
    value: depositInWei.toString(),
    })
    transactionData.chainId = parseChainId(state.chainId)

    // send request to keyring for approval
    await sendRequest(
    state.selectedSnapKeyringAccount.id,
    'eth_signTransaction',
    [state.selectedSnapKeyringAccount.address, transactionData] // [from, transactionData]
    );
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
    await sendRequest(
        state.selectedSnapKeyringAccount.id,
        'eth_sendTransaction',
        [state.selectedSnapKeyringAccount.address, userOpToSign] // [from, transactionData]
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    try {
        e.preventDefault();

        setStatus(Stage.Loading);
    
        if (transactionType === TransactionType.Deposit) {
            await handleDepositSubmit()
        } else if (transactionType === TransactionType.Withdraw) {
            await handleWithdrawSubmit()
        } else {
            throw new Error('Invalid transaction type');
        }
    
        setStatus(Stage.Review);
    } catch (e) {
        setAmount('');
        setFailMessage(e.message)
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

  const handleApproveClick = async (event: any, requestId: string) => {
    try {
      event.preventDefault();
      setStatus(Stage.Loading);

      // sign request
      await approveRequest(requestId);

      // send tx
      const signedTxs = await getSignedTxs()

      if (signedTxs[requestId]) {
        const provider = new ethers.providers.Web3Provider(getMMProvider() as any);
        const res = await provider.sendTransaction(signedTxs[requestId])
        await res.wait();

        await storeTxHash(
          state.selectedSnapKeyringAccount.id,
          res.hash,
          requestId,
          state.chainId,
        );
        notify('Transaction confirmed (txHash)', 'View activity for details.', res.hash)
      }

      setStatus(Stage.Sent);
      setSuccessMessage(`${amount} ETH successfully sent.`);

      await getAccountActivity(state.selectedSnapKeyringAccount.id);
      await getSmartAccount(state.selectedSnapKeyringAccount.id);
      await updateAccountBalance(state.selectedSnapKeyringAccount.address);
    } catch (e) {
        setFailMessage(e.message)
        setStatus(Stage.Failed);
        await getKeyringSnapAccounts();
    }
  };

  const handleRejectClick = async (event: any, requestId: string) => {
    try {
      event.preventDefault();
      setStatus(Stage.Loading);
      await rejectRequest(requestId);
      setAmount('');
      setStatus(Stage.EnterAmount);
    } catch (e) {
      setFailMessage(e.message)
      setStatus(Stage.Failed);
    }
  };

  const renderStage = () => {
    switch (status) {
        case Stage.EnterAmount:
            return (
                <FlexCol>
                    {transactionType === TransactionType.Deposit ? 
                        (
                          <FlexCol>
                              <AccountContainer>
                                  <BlockieAccountModal/>
                                  <FlexCol>
                                      <TextBold>(owner EOA)</TextBold>
                                      <FlexRow>
                                        <Text>{trimAccount(state.selectedSnapKeyringAccount.address)}</Text>
                                        <AccountCopy onClick={e => handleCopyToClipboard(e, state.selectedSnapKeyringAccount.address)}>
                                          <FaCopy />
                                        </AccountCopy>
                                      </FlexRow>
                                  </FlexCol>
                              </AccountContainer>
                              <Text>Available to deposit {convertToEth(state.selectedAccountBalance)} ETH</Text>
                          </FlexCol>
                        ) 
                        : 
                        (
                            <FlexCol>
                                <AccountContainer>
                                    <BlockieAccountModal/>
                                    <FlexCol>
                                        <TextBold>(smart account)</TextBold>
                                        <FlexRow>
                                        <Text>{trimAccount(state.scAccount.address)}</Text>
                                        <AccountCopy onClick={e => handleCopyToClipboard(e, state.scAccount.address)}>
                                          <FaCopy />
                                        </AccountCopy>
                                      </FlexRow>
                                    </FlexCol>
                                </AccountContainer>
                                <Text>Available to withdraw {convertToEth(state.scAccount.deposit)} ETH</Text>
                            </FlexCol>
                        )
                    }
                    <CommonInputForm
                        key={"send-amount"}
                        onSubmitClick={handleSubmit}
                        buttonText="Review"
                        inputs={
                            [
                                {
                                    id: "1",
                                    onInputChange: handleAmountChange,
                                    inputValue: amount,
                                    inputPlaceholder:"ETH Amount",
                                    type: 'number'
                                },
                            ]
                        }
                    />

                </FlexCol>
            );
        case Stage.Review:
            return (
                <AccountRequestDisplay approveRequestClick={handleApproveClick} rejectRequestClick={handleRejectClick} />
            )
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
                        <FaRegTimesCircle size={80} color='#d73a49' />
                    </IconContainer>
                    <Status>Transaction Failed</Status>
                    <Text>{failMessage}</Text>
                </Container>
            )
        case Stage.Sent:
            return (
                <Container>
                    <IconContainer>
                        <FaCheckCircle size={80} color='#32a852' />
                    </IconContainer>
                    <Status>{transactionType === TransactionType.Deposit ? 'Deposit' : 'Withdraw'} successfully sent</Status>
                    <Text>{successMessage}</Text>
                </Container>
            )
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