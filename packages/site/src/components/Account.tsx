import { MetaMaskContext, MetamaskActions, useAcount } from '../hooks';
import styled from 'styled-components';
import { connectSnap, convertToEth, filterPendingRequests, getMMProvider, getSignedTxs, getSnap, handleCopyToClipboard, storeTxHash, trimAccount } from '../utils';
import { FaCloudDownloadAlt, FaRegLightbulb } from 'react-icons/fa';
import { InstallFlaskButton, ConnectSnapButton, SimpleButton } from './Buttons';
import { AccountActivity, AccountActivityType, SupportedChainIdMap, UserOperation } from '../types';
import { useContext, useState } from 'react';
import { KeyringAccount, KeyringRequest } from "@metamask/keyring-api";
import { BlockieAccountModal } from './Blockie-Icon';
import { FaCopy, FaArrowAltCircleRight } from "react-icons/fa";
import { CommonInputForm } from './Form';
import { BigNumber, ethers } from 'ethers';
import { JsonTx } from '@ethereumjs/tx';
import { EntryPoint__factory, SimpleAccount__factory } from '@account-abstraction/contracts';
import EthereumLogo from '../assets/icons/eth.svg';
import { ReactComponent as FlaskFox } from '../assets/flask_fox_account.svg';

const Body = styled.div`
  padding: 2rem;
`;

const Body2 = styled.div`
  padding: 2rem 0;
`;

const FlexRowWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

const FlexColWrapperCenter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

const FlexColWrapperLeft = styled.div`
  display: flex;
  flex-direction: column;
  align-items: left;
`

const IconContainer = styled.div`
  margin-right: 1rem; 
`;

const PrimaryText = styled.p`
  color: ${(props) => props.theme.colors.text.default};
  margin: 0; 
  margin-top: 0.5rem;
  font-weight: bold;

  ${({ theme }) => theme.mediaQueries.small} {
    display: none;
  }
`;

const SecondaryText = styled.p`
  color: ${(props) => props.theme.colors.text.default};
  margin: 0; 
  ${({ theme }) => theme.mediaQueries.small} {
    display: none;
  }
`;

const LineBreak = styled.hr`
  color: ${(props) => props.theme.colors.primary};
  border: solid 1px ${(props) => props.theme.colors.border.default};
  width: 100%;
`;

const DropdownList = styled.ul`
  width: 300px;
  list-style: none;
  padding: 0;
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
`;

const DropdownItem = styled.li<{
  selected: boolean;
  onClick: (e: any, account: KeyringAccount) => void;
}>`
  padding: 8px 12px;
  cursor: pointer;
  background-color: ${(props) => (props.selected ? props.theme.colors.primary.default : 'transparent')};
  &:hover {
    background-color: #8093ff;
  }
`;

const FeatureBody = styled.div`
  margin-top: 1rem;
  margin-bottom: 1.5rem;
  width: 300px;

  ${({ theme }) => theme.mediaQueries.small} {
    width: 250px;
  }
`;

const ButtonBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TextBold = styled.p`
  color: ${(props) => props.theme.colors.text.default};
  font-weight: bold;
  margin: 0;
  margin-bottom: .5rem;
`; 

const Text = styled.p`
  color: ${(props) => props.theme.colors.text.default};
  margin: 0;
`;  

const TextSmall = styled.p`
  margin: 0;
  margin-top: 0.5rem;
  font-size: 1.2rem;
`;  

const ConnectedIndicator = styled.div`
  content: ' ';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: green;
`;

export const AccountHeaderDisplay = () => {
    const [state] = useContext(MetaMaskContext);
    if (!state.isFlask) {
      return (
        <FlexRowWrapper>
          <IconContainer>
            <FlaskFox />
          </IconContainer>
          <p>Install Flask</p>
        </FlexRowWrapper>
      );
    }
  
    if (!state.installedSnap) {
      return (
        <FlexRowWrapper>
          <IconContainer>
            <FaCloudDownloadAlt  style={{ width: '3rem', height: '3rem' }} />
          </IconContainer>
          <FlexColWrapperLeft>
          <PrimaryText>MetaMask @ {SupportedChainIdMap[state.chainId] ? SupportedChainIdMap[state.chainId].name : 'Not Supported'}</PrimaryText>
            <SecondaryText>Connect ERC-4337 Relayer</SecondaryText>
          </FlexColWrapperLeft>
        </FlexRowWrapper>
      );
    }
  
    return (
      <FlexRowWrapper>
      <IconContainer>
        <FlaskFox />
        {/* <ConnectedIndicator /> */}
      </IconContainer>
      <FlexColWrapperLeft>
        <SecondaryText>MetaMask @ {SupportedChainIdMap[state.chainId] ? SupportedChainIdMap[state.chainId].name : 'Not Supported'}</SecondaryText>
        <PrimaryText> 
          {state.selectedSnapKeyringAccount.address === '' ? 
            'No account selected' :
            state.selectedSnapKeyringAccount.options.name as string
          }
        </PrimaryText>
      </FlexColWrapperLeft>
    </FlexRowWrapper>
    );
};

export const AccountModalDropdown = ({
  closeModal,
}: {
  closeModal(): unknown;
}) => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [selectedAccount, setSelectedAccount] = useState<KeyringAccount>(state.selectedSnapKeyringAccount);
  const {selectKeyringSnapAccount, getSmartAccount, createAccount, getAccountActivity} = useAcount();
  const [accountName, setAccountName] = useState('');

  const featureList: {feature: string; description: string }[] = [
    {
      feature: "Smart account capabilities",
      description: `Access and control smart accounts with MetaMask. Enjoy smart contract functionality with ease and convenience.`
    },
    {
      feature: "Manage Smart Account",
      description: `Manage ERC-4337 accounts(create, sign, send, transfer funds).`
    },
    {
      feature: "Entrypoint and Paymaster Configuration",
      description: `Manage stake and deposit with supported entrypoint contracts`
    },
  ];

  const handleConnectClick = async (event: any) => {
    try {
      event.preventDefault();
      await connectSnap();
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
      closeModal();
    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
      dispatch({ type: MetamaskActions.SetClearAccount, payload: true});
    }
  };

  const handleAccountChange = async (event: any, account: KeyringAccount) => {
    event.preventDefault();
    closeModal();
    setSelectedAccount(account);
    await selectKeyringSnapAccount(account);
    await getSmartAccount(account.id);
    await getAccountActivity(account.id);
  }

  const handleCreateAccount = async (event: any) => {
    event.preventDefault();
    const newAccount = await createAccount(accountName)
    await selectKeyringSnapAccount(newAccount);
    await getSmartAccount(newAccount.id);
    setAccountName('')
    closeModal();
  };

  const handleAccountNameChange = async (e: any) => {
    setAccountName(e.target.value);
  }

  if (!state.isFlask) {
    return (
      <Body>
        <FlexColWrapperCenter>
          <TextBold>Install</TextBold>
          <FeatureBody>
            <Text>Discover the full potential of our Snap powered by MetaMask! To get started, make sure to install MetaMask for a seamless and enhanced Snap experience.</Text>
          </FeatureBody>
          <LineBreak></LineBreak>
          <ButtonBody>
            <InstallFlaskButton/>
          </ButtonBody>
        </FlexColWrapperCenter>
      </Body>
    );
  }

  if (!state.installedSnap) {
    return (
      <Body>
        <FlexColWrapperCenter>
            <TextBold>Connect</TextBold>
            <FlexColWrapperLeft>
              {featureList.map((props, idx) => (
                <FeatureBody key={idx}>
                  <FlexRowWrapper>
                    <IconContainer>
                      <FaRegLightbulb style={{ width: '2rem', height: '2rem' }} />
                    </IconContainer>
                    <TextBold>{props.feature}</TextBold>
                  </FlexRowWrapper>
                  <Text>{props.description}</Text>
                </FeatureBody>
              ))}
            </FlexColWrapperLeft>
            <LineBreak></LineBreak>
            <ButtonBody>
              <ConnectSnapButton onClick={handleConnectClick}/>
              <TextSmall>Manage smart accounts with MetaMask</TextSmall>
            </ButtonBody>
          </FlexColWrapperCenter>
      </Body>
    );
  }

  return (
    <Body2>
      <FlexColWrapperCenter>
        <TextBold>Select a Smart Account</TextBold>
      </FlexColWrapperCenter>

      {state.snapKeyring.accounts.length === 0 && 
        (
          <Body>
            <CommonInputForm
              key={"create"}
              buttonText="Create"
              onSubmitClick={handleCreateAccount}
              inputs={[
                {
                  id: "1",
                  onInputChange: handleAccountNameChange,
                  inputValue: accountName,
                  inputPlaceholder:"Enter account name",
                  type: 'text'
                  
                }
              ]}
              />
          </Body>
        )
      } 
      <DropdownList>
      {state.snapKeyring.accounts.map((account: KeyringAccount) => (
        <DropdownItem
          key={account.id}
          selected={selectedAccount.id === account.id}
          onClick={(e: any) => handleAccountChange(e, account)}
        >
          <FlexRowWrapper>
            <BlockieAccountModal/>
            <FlexColWrapperLeft>
                <FlexRowWrapper>
                  <TextBold>{account.options.name as string}</TextBold>
                </FlexRowWrapper>

            </FlexColWrapperLeft>
          </FlexRowWrapper>
       
        </DropdownItem>
      ))}
    </DropdownList>
    </Body2>
  );
};

const PendingRequestContainer = styled.div`
  display: flex;
  flex-direction: column;
  width:: 100%;
  margin: 0;
  padding-left: 2.4rem;  
  padding-right: 2.4rem;  
  padding-bottom: 2.4rem;  
  align-self: stretch;
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 1.2rem;
    margin-bottom: 1.2rem;
    padding: 0;
  }
`;

const PendingRequestItem = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const RequestContractDetails = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.card.default};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: 10px;
  box-shadow: ${({ theme }) => theme.shadows.default};
  margin-bottom: 2.5rem;
  width: fit-content;
`;

const EthTransactionContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const EthTransactionItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.card.default};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
  margin-bottom: 2.5rem;
`

const EthTransferIconContainer = styled.div`
display: flex;
flex-direction: column;
align-items: center;
margin-bottom: 2.5rem;
`

const EthLogoContainer = styled.div`
  margin-right: auto;
  margin-left: auto;
`;

export const AccountRequestDisplay = ({
  approveRequestClick,
  rejectRequestClick
}: {
  approveRequestClick(e: any, requestId: string): unknown;
  rejectRequestClick(e: any, requestId: string): unknown;
}) => {
  const [state] = useContext(MetaMaskContext);

  const renderRequestDetails = (request: KeyringRequest) => {
    switch (request.request.method) {
      case "eth_signTransaction":
        if ('params' in request.request) {
          const [from, tx] = request.request.params as [string, JsonTx, string]

          // decode user intent call data
          const entryPointContract = new ethers.Contract(tx.to as string, EntryPoint__factory.abi)
          const userIntentDecodedCallData = entryPointContract.interface.decodeFunctionData('depositTo', tx.data as string);

          const amount = BigNumber.from(tx.value);
          const maxGas = BigNumber.from(tx.gasLimit);
          const gasFee = BigNumber.from(tx.maxFeePerGas).add(BigNumber.from(tx.maxPriorityFeePerGas));
          const maxFee = gasFee.mul(maxGas);
          const total = gasFee.add(BigNumber.from(tx.value));
          const maxAmount = maxFee.add(BigNumber.from(tx.value));
  
          return (
            <>
            <RequestContractDetails>
              <Text>{trimAccount(tx.to as string)}: DEPOSIT TO</Text>
            </RequestContractDetails>

            <EthTransactionContainer>
              <EthTransactionItemContainer>
                <EthLogoContainer>
                  <img
                      src={EthereumLogo}
                      width={38}
                      height={38}
                      alt='Etherum logo'
                    />
                </EthLogoContainer>
                <p>(owner EOA)</p>
                <TextBold>{trimAccount(from)}</TextBold>
              </EthTransactionItemContainer>

              <EthTransferIconContainer>
                <FaArrowAltCircleRight size={25} />
                <TextBold>{convertToEth(amount.toString())} ETH</TextBold>
              </EthTransferIconContainer>
      
              <EthTransactionItemContainer>
                <EthLogoContainer>
                  <img
                      src={EthereumLogo}
                      width={38}
                      height={38}
                      alt='Etherum logo'
                    />
                </EthLogoContainer>
                <p>(smart account)</p>
                <TextBold>{trimAccount(userIntentDecodedCallData.account)}</TextBold>
              </EthTransactionItemContainer>
            </EthTransactionContainer>
    
            <PendingRequestItem>
              <p>Gas Fee(estimated)</p>
              <p>{convertToEth(gasFee.toString())} ETH</p>
            </PendingRequestItem>

            <PendingRequestItem>
              <p>Max fee</p>
              <p>{convertToEth(maxFee.toString())} ETH</p>
            </PendingRequestItem>
            
            <LineBreak></LineBreak>

            <PendingRequestItem>
              <TextBold>Total</TextBold>
              <TextBold>{convertToEth(total.toString())} ETH</TextBold>
            </PendingRequestItem>

            <PendingRequestItem>
              <p>Max(Amount + max fee)</p>
              <p>{convertToEth(maxAmount.toString())} ETH</p>
            </PendingRequestItem>
            </>
          );
        } else {
          throw new Error('Invalid request');
        }
      case "eth_sendTransaction":
        if ('params' in request.request) {
          const [from, userOp] = request.request.params as [string, UserOperation]

          // decode userOp execute call data
          const simpleAccount = new ethers.Contract(
            userOp.sender,
            SimpleAccount__factory.abi,
          );
          const decodedCallData = simpleAccount.interface.decodeFunctionData('execute', userOp.callData);

          // decode userOp intent call data
          const entryPointContract = new ethers.Contract(decodedCallData.dest, EntryPoint__factory.abi)
          const userIntentDecodedCallData = entryPointContract.interface.decodeFunctionData('withdrawTo', decodedCallData.func);

          // get gas totals
          const amount = BigNumber.from(decodedCallData.value).add(userIntentDecodedCallData.withdrawAmount);
          const maxGas = BigNumber.from(userOp.callGasLimit).add(BigNumber.from(userOp.verificationGasLimit));
          const gasFee = BigNumber.from(userOp.maxFeePerGas).add(BigNumber.from(userOp.maxPriorityFeePerGas)).add(BigNumber.from(userOp.preVerificationGas));
          const maxFee = gasFee.mul(maxGas);
          const total = gasFee.add(BigNumber.from(decodedCallData.value));
          const maxAmount = maxFee.add(BigNumber.from(decodedCallData.value));
          
          return (
            <>

              <RequestContractDetails>
                <Text>{trimAccount(decodedCallData.dest as string)}: WITHDRAW TO</Text>
              </RequestContractDetails> 

              <EthTransactionContainer>
                <EthTransactionItemContainer>
                  <EthLogoContainer>
                    <img
                        src={EthereumLogo}
                        width={38}
                        height={38}
                        alt='Etherum logo'
                      />
                  </EthLogoContainer>
                  <p>(smart account)</p>
                  <TextBold>{trimAccount(userOp.sender)}</TextBold>
                </EthTransactionItemContainer>

                <EthTransferIconContainer>
                  <FaArrowAltCircleRight size={25} />
                  <TextBold>{convertToEth(amount.toString())} ETH</TextBold>
                </EthTransferIconContainer>
        
                <EthTransactionItemContainer>
                  <EthLogoContainer>
                    <img
                        src={EthereumLogo}
                        width={38}
                        height={38}
                        alt='Etherum logo'
                      />
                  </EthLogoContainer>
                  <p>(owner EOA)</p>
                  <TextBold>{trimAccount(userIntentDecodedCallData.withdrawAddress)}</TextBold>
                </EthTransactionItemContainer>
              </EthTransactionContainer>

                <PendingRequestItem>
                <p>Gas Fee(estimated):</p>
                <p>{convertToEth(gasFee.toString())} ETH</p>
              </PendingRequestItem>
  
              <PendingRequestItem>
                <p>Max fee:</p>
                <p>{convertToEth(maxFee.toString())} ETH</p>
              </PendingRequestItem>
              
              <LineBreak></LineBreak>
  
              <PendingRequestItem>
                <TextBold>Total</TextBold>
                <TextBold>{convertToEth(total.toString())} ETH</TextBold>
              </PendingRequestItem>
  
              <PendingRequestItem>
                <p>Max(Amount + max fee)</p>
                <p>{convertToEth(maxAmount.toString())} ETH</p>
              </PendingRequestItem>
            </>
          );
        } else {
          throw new Error('Invalid request');
        }
      default:
        return (
          <>
          </>
      );
    }
  };

  return (
    <>
      {state.snapKeyring.pendingRequests && (
        filterPendingRequests(state.snapKeyring.pendingRequests, state.selectedSnapKeyringAccount.id).map((item: KeyringRequest) => (
          <PendingRequestContainer key={`${item.id}-${item.account}`}>
            {renderRequestDetails(item)}
            <PendingRequestItem>
              <SimpleButton text={'Reject'} onClick={(e: any) => {rejectRequestClick(e, item.id)}}></SimpleButton>
              <SimpleButton text={'Confirm'} onClick={(e: any) => {approveRequestClick(e, item.id)}}></SimpleButton>
            </PendingRequestItem>  
          </PendingRequestContainer>
        ))
      )}
    </>
  )
}

const FlexRowNoMargin = styled.div`
  display: flex;
  flex-direction: row;
`;

const ActivityItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  width:: 100%;
  background-color: ${({ theme }) => theme.colors.card.default};
  margin-top: 0;
  margin-bottom: 2.4rem;
  padding: 2.4rem;  
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radii.default};
  box-shadow: ${({ theme }) => theme.shadows.default};
  align-self: stretch;
  ${({ theme }) => theme.mediaQueries.small} {
    margin-top: 1.2rem;
    margin-bottom: 1.2rem;
    padding: 0;
  }
`;

const ActivityItem = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  ${({ theme }) => theme.mediaQueries.small} {
    flex-direction: column;
    padding: 2.4rem;  
  }
`;

const ActivityCopy = styled.div`
  margin-left: 1rem;
  margin-top: auto;
  margin-bottom: auto;
  &:hover {
    color: ${({ theme }) => theme.colors.primary.main};
    cursor: pointer;
  }
`;

const ActivitySuccess = styled.span`
  color: ${({ theme }) => theme.colors.success.alternative};
`

const ActivityPending = styled.span`
  color: ${({ theme }) => theme.colors.pending.alternative};
`

const ActivityFailed = styled.span`
  color: ${({ theme }) => theme.colors.error.alternative};
`

export const AccountActivityDisplay = () => {
  const [state] = useContext(MetaMaskContext);

  const renderAccountActivityItem = (item: AccountActivity) => {
    switch (item.type) {
      case AccountActivityType.SmartContract:
        if (item.userOperationReceipt === null) {
          return (
            <>
              <ActivityItem>
                <p>Status:</p>
                <p><ActivityPending>Pending</ActivityPending></p>
              </ActivityItem>
    
              <ActivityItem>
                <p>UserOp hash:</p>
                <FlexRowNoMargin>
                  <p>{trimAccount(item.userOpHash)}</p>
                  <ActivityCopy onClick={e => handleCopyToClipboard(e, item.userOpHash)}>
                    <FaCopy />
                  </ActivityCopy>
                </FlexRowNoMargin>
              </ActivityItem>         
            </>
          )
        } else {
          const sender = item.userOperationReceipt.sender;
          const receipt = item.userOperationReceipt.receipt;

          return (
            <>
              <ActivityItem>
                <p>Status:</p>
                <p>{item.userOperationReceipt.success? <ActivitySuccess>Confirmed</ActivitySuccess>: <ActivityFailed>Failed</ActivityFailed>}</p>
              </ActivityItem>
    
              {!item.userOperationReceipt.success && item.userOperationReceipt.reason && (
                <ActivityItem>
                  <p>Revert:</p>
                  <p>{item.userOperationReceipt.reason}</p>
                </ActivityItem>
              )}
            
              <ActivityItem>
                <p>Sender:</p>
                <FlexRowNoMargin>
                  <p>eth:{trimAccount(item.userOperationReceipt.sender)}</p>
                  <ActivityCopy onClick={e => handleCopyToClipboard(e, sender)}>
                    <FaCopy />
                  </ActivityCopy>
                </FlexRowNoMargin>
              </ActivityItem>
    
              <ActivityItem>
                <p>To:</p>
                <FlexRowNoMargin>
                  <p>eth:{trimAccount(item.userOperationReceipt.receipt.to)}</p>
                  <ActivityCopy onClick={e => handleCopyToClipboard(e, receipt.to)}>
                    <FaCopy />
                  </ActivityCopy>
                </FlexRowNoMargin>
              </ActivityItem>
            
              <ActivityItem>
                <p>Nonce:</p>
                <p>{BigNumber.from(item.userOperationReceipt.nonce).toNumber()}</p>
              </ActivityItem>
    
              <ActivityItem>
                <p>Actual Gas Used(units):</p>
                <p>{BigNumber.from(item.userOperationReceipt.actualGasUsed).toNumber()}</p>
              </ActivityItem>
    
              <ActivityItem>
                <p>Actual Gas Cost:</p>
                <p>{convertToEth(BigNumber.from(item.userOperationReceipt.actualGasCost).toString())} ETH</p>
              </ActivityItem>
    
              <ActivityItem>
                <p>UserOp hash:</p>
                <FlexRowNoMargin>
                  <p>{trimAccount(item.userOperationReceipt.userOpHash)}</p>
                  <ActivityCopy onClick={e => handleCopyToClipboard(e, item.userOpHash)}>
                    <FaCopy />
                  </ActivityCopy>
                </FlexRowNoMargin>
              </ActivityItem>  
    
              <ActivityItem>
                <p>Transaction hash:</p>
                <FlexRowNoMargin>
                  <p>{trimAccount(receipt.transactionHash)}</p>
                  <ActivityCopy onClick={e => handleCopyToClipboard(e, receipt.transactionHash)}>
                    <FaCopy />
                  </ActivityCopy>
                </FlexRowNoMargin>
              </ActivityItem>     
            </>
          )
        }

      case AccountActivityType.EOA:
        const txHash = item.txHash ? item.txHash : '';
        return (
          <>
            <ActivityItem>
              <p>Status:</p>
              <p>{<ActivitySuccess>Confirmed</ActivitySuccess>}</p>
            </ActivityItem>

            <ActivityItem>
              <p>Transaction hash:</p>
              <FlexRowNoMargin>
                <p>{trimAccount(txHash)}</p>
                <ActivityCopy onClick={e => handleCopyToClipboard(e, txHash)}>
                  <FaCopy />
                </ActivityCopy>
              </FlexRowNoMargin>
            </ActivityItem>     
          </>
        )
      default:
        return (
          <>
          </>
        );
    }
  }

  return (
    <>
      {state.accountActivity.length > 0 && (
        state.accountActivity.map((item: AccountActivity, index: number) => (
          <ActivityItemContainer key={index}>
            <ActivityItem>
              <TextBold>Type:</TextBold>
              <TextBold>{item.type === AccountActivityType.SmartContract ? 'Withdraw': 'Deposit'}</TextBold>
            </ActivityItem>
            {renderAccountActivityItem(item)}
          </ActivityItemContainer>
        ))
      )}
    </>
  )
}
