import { MetaMaskContext, MetamaskActions, useAcount } from '../hooks';
import styled from 'styled-components';
import { connectSnap, convertToEth, filterPendingRequests, getDepositReadyTx, getMMProvider, getSnap, handleCopyToClipboard, storeDepositTxHash, trimAccount } from '../utils';
import { FaCloudDownloadAlt, FaRegLightbulb } from 'react-icons/fa';
import { InstallFlaskButton, ConnectSnapButton, SimpleButton } from './Buttons';
import { SupportedChainIdMap, UserOperationReceipt } from '../types';
import { useContext, useState } from 'react';
import { KeyringAccount, KeyringRequest } from "@metamask/keyring-api";
import { ReactComponent as FlaskFox } from '../assets/flask_fox_account.svg';
import { BlockieAccountModal } from './Blockie-Icon';
import { FaCopy } from "react-icons/fa";
import { CommonInputForm } from './Form';
import { BigNumber, ethers } from 'ethers';
import { JsonTx } from '@ethereumjs/tx';

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

const PendingRequestContainer = styled.div`
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

const PendingRequestItem = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  ${({ theme }) => theme.mediaQueries.small} {
    flex-direction: column;
    padding: 2.4rem;  
  }
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
            state.selectedSnapKeyringAccount.name
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
  const {selectKeyringSnapAccount, getSmartAccount, createAccount} = useAcount();
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
    setSelectedAccount(account);
    await selectKeyringSnapAccount(account);
    await getSmartAccount(account.id);
    closeModal();
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
                  inputPlaceholder:"Enter account name"
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
                  <TextBold>{account.name}</TextBold>
                </FlexRowWrapper>

            </FlexColWrapperLeft>
          </FlexRowWrapper>
       
        </DropdownItem>
      ))}
    </DropdownList>
    </Body2>
  );
};

export const AccountRequestDisplay = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const { approveRequest, rejectRequest, getSmartAccount, getAccountActivity, updateAccountBalance, getKeyringSnapAccounts } = useAcount();

  const handleApproveRequest = async (event: any, id: string) => {
    try {
      event.preventDefault();
      await approveRequest(id);

      // send entrypoint deposit txs
      const signedDepositTxs = await getDepositReadyTx()
      if (signedDepositTxs[id]) {
        console.log('signedDepositTxs(ready):', signedDepositTxs[id]);
        const provider = new ethers.providers.Web3Provider(getMMProvider() as any);
        const res = await provider.sendTransaction(signedDepositTxs[id])
        await res.wait();

        console.log('Transaction sent. Transaction hash:', res.hash);

        await storeDepositTxHash(res.hash, id);
        await getSmartAccount(state.selectedSnapKeyringAccount.id);
        await getAccountActivity(state.selectedSnapKeyringAccount.id);
        await updateAccountBalance(state.selectedSnapKeyringAccount.address);
      }
 
    } catch (e) {
      await getKeyringSnapAccounts();
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleRejectRequest = async (event: any, id: string) => {
    try {
      event.preventDefault();
      console.log('reject request click:', id)
      await rejectRequest(id);
    } catch (e) {
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const renderRequestDetails = (request: KeyringRequest) => {
    switch (request.request.method) {
      case "eth_signTransaction":
        if ('params' in request.request) {
          const [from, tx] = request.request.params as [string, JsonTx, string]
            const amount = BigNumber.from(tx.value);
            const maxGas = BigNumber.from(tx.gasLimit);
            const gasFee = BigNumber.from(tx.maxFeePerGas).add(BigNumber.from(tx.maxPriorityFeePerGas));
            const maxFee = gasFee.mul(maxGas);
            const total = gasFee.add(BigNumber.from(tx.value));
            const maxAmount = maxFee.add(BigNumber.from(tx.value));
  
            return (
              <>
              <PendingRequestItem>
                <p>From:</p>
                <p>{trimAccount(from)}</p>
              </PendingRequestItem>
  
              <PendingRequestItem>
                <p>To:</p>
                <p>{trimAccount(tx.to as string)}</p>
              </PendingRequestItem>
  
              <PendingRequestItem>
                <p>Entry point contract:</p>
                <p>depositTo</p>
              </PendingRequestItem>
  
              <PendingRequestItem>
                <p>Amount:</p>
                <p>{convertToEth(amount.toString())} ETH</p>
              </PendingRequestItem>
  
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
      case "eth_sendTransaction":
        if ('params' in request.request) {
          const [from, tx] = request.request.params as [string, JsonTx, string]
          const gasFee = BigNumber.from(tx.maxFeePerGas).add(BigNumber.from(tx.maxPriorityFeePerGas));
          
          return (
            <>
            <PendingRequestItem>
              <p>From:</p>
              <p>{trimAccount(from)}</p>
            </PendingRequestItem>

            <PendingRequestItem>
              <p>To:</p>
              <p>{trimAccount(tx.to as string)}</p>
            </PendingRequestItem>

            <PendingRequestItem>
              <p>Entry point contract:</p>
              <p>withdrawTo</p>
            </PendingRequestItem>

            <PendingRequestItem>
              <p>Gas Fee(estimated):</p>
              <p>{convertToEth(gasFee.toString())} ETH</p>
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
          <PendingRequestContainer key={`${item.request.id}-${item.account}`}>
            <PendingRequestItem>
              <TextBold>Type</TextBold>
              <TextBold>{item.request.method === 'eth_signTransaction' ? 'Send ETH transaction' : 'Send User Operation'}</TextBold>
            </PendingRequestItem> 
            
            {renderRequestDetails(item)}
            <PendingRequestItem>
              <SimpleButton text={'Reject'} onClick={(e: any) => {handleRejectRequest(e, item.request.id)}}></SimpleButton>
              <SimpleButton text={'Confirm'} onClick={(e: any) => {handleApproveRequest(e, item.request.id)}}></SimpleButton>
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

export const AccountActivity = () => {
  const [state] = useContext(MetaMaskContext);

  return (
    <>
      {/* Pending userOps */}
      {state.smartAccountActivity && (
        state.smartAccountActivity.pendingUserOpHashes.map((item: string) => (
          <ActivityItemContainer key={`${item}`}>
            <ActivityItem>
              <p>Status:</p>
              <p><ActivityPending>Pending</ActivityPending></p>
            </ActivityItem>

            <ActivityItem>
              <p>UserOp hash:</p>
              <FlexRowNoMargin>
                <p>{trimAccount(item)}</p>
                <ActivityCopy onClick={e => handleCopyToClipboard(e, item)}>
                  <FaCopy />
                </ActivityCopy>
              </FlexRowNoMargin>
            </ActivityItem> 
        
          </ActivityItemContainer>
        ))
      )}

      {/* Confirmed userOps */}
      {state.smartAccountActivity && (
        state.smartAccountActivity.userOperationReceipts.map((item: UserOperationReceipt) => (
          <ActivityItemContainer key={`${item.sender}-${item.nonce.toString()}-${item.receipt.transactionHash}`}>
            <ActivityItem>
              <p>Status:</p>
              <p>{item.success? <ActivitySuccess>Confirmed</ActivitySuccess>: <ActivityFailed>Failed</ActivityFailed>}</p>
            </ActivityItem>

            {!item.success && item.reason && (
              <ActivityItem>
                <p>Revert:</p>
                <p>{item.reason}</p>
              </ActivityItem>
            )}
           
            <ActivityItem>
              <p>Sender:</p>
              <FlexRowNoMargin>
                <p>eth:{trimAccount(item.sender)}</p>
                <ActivityCopy onClick={e => handleCopyToClipboard(e, item.sender)}>
                  <FaCopy />
                </ActivityCopy>
              </FlexRowNoMargin>
            </ActivityItem>

            <ActivityItem>
              <p>To:</p>
              <FlexRowNoMargin>
                <p>eth:{trimAccount(item.receipt.to)}</p>
                <ActivityCopy onClick={e => handleCopyToClipboard(e, item.receipt.to)}>
                  <FaCopy />
                </ActivityCopy>
              </FlexRowNoMargin>
            </ActivityItem>
           
            <ActivityItem>
              <p>Nonce:</p>
              <p>{BigNumber.from(item.nonce).toNumber()}</p>
            </ActivityItem>

            <ActivityItem>
              <p>Gas Used(units):</p>
              <p>{BigNumber.from(item.actualGasUsed).toNumber()}</p>
            </ActivityItem>

            <ActivityItem>
              <p>Gas Cost(Wei):</p>
              <p>{BigNumber.from(item.actualGasCost).toNumber()}</p>
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

            <ActivityItem>
              <p>Transaction hash:</p>
              <FlexRowNoMargin>
                <p>{trimAccount(item.receipt.transactionHash)}</p>
                <ActivityCopy onClick={e => handleCopyToClipboard(e, item.receipt.transactionHash)}>
                  <FaCopy />
                </ActivityCopy>
              </FlexRowNoMargin>
            </ActivityItem>     
          </ActivityItemContainer>
        ))
      )}

      {/* Pending eoa tx */}

      {/* Confirmed eoa tx */}
      {state.smartAccountActivity.confirmedDepositTxHashes.length > 0 && (
        state.smartAccountActivity.confirmedDepositTxHashes.map((item: string) => (
          <ActivityItemContainer key={`${item}`}>
            <ActivityItem>
              <TextBold>Type:</TextBold>
              <TextBold>Send ETH transaction(Deposit)</TextBold>
            </ActivityItem>

            <ActivityItem>
              <p>Status:</p>
              <p>{<ActivitySuccess>Confirmed</ActivitySuccess>}</p>
            </ActivityItem>

            <ActivityItem>
              <p>Transaction hash:</p>
              <FlexRowNoMargin>
                <p>{trimAccount(item)}</p>
                <ActivityCopy onClick={e => handleCopyToClipboard(e, item)}>
                  <FaCopy />
                </ActivityCopy>
              </FlexRowNoMargin>
            </ActivityItem>     
          </ActivityItemContainer>
        ))
      )}
    </>
  )
}
