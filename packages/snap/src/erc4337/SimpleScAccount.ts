import { BigNumber, BigNumberish } from 'ethers'
import {
  SimpleAccount,
  SimpleAccount__factory, SimpleAccountFactory,
  SimpleAccountFactory__factory,
  UserOperationStruct
} from '@account-abstraction/contracts'

import { arrayify, hexConcat } from 'ethers/lib/utils'
import { BaseApiParams, BaseAccountAPI } from '@account-abstraction/sdk/dist/src/BaseAccountAPI'
import { TransactionDetailsForUserOp } from '@account-abstraction/sdk/dist/src/TransactionDetailsForUserOp'
/**
 * constructor params, added no top of base params:
 * @param ownerAddress the address of account owner
 * @param factoryAddress address of contract "factory" to deploy new contracts (not needed if account already deployed)
 * @param index nonce value used when creating multiple accounts for the same owner
 * @param provider (extended from BaseAccountAPI) ethers provider
 * @param entryPointAddress (extended from BaseAccountAPI) address of the entrypoint contract
 */
export interface SimpleScAccountParams extends BaseApiParams {
  ownerAddress: string
  factoryAddress?: string
  index?: BigNumberish
}

/**
 * An implementation of the @account-abstraction/sdk BaseAccountAPI using the SimpleAccount contract.
 * - contract deployer gets "entrypoint", "owner" addresses and "index" nonce
 * - owner signs requests using normal "Ethereum Signed Message" (ether's signer.signMessage())
 * - nonce method is "nonce()"
 * - execute method is "execFromEntryPoint()"
 */
export class SimpleScAccount extends BaseAccountAPI {
  public readonly index: BigNumberish
  public readonly ownerAddress: string
  private readonly factoryAddress?: string
  private accountContract?: SimpleAccount // our account contract
  private factory?: SimpleAccountFactory

  constructor (params: SimpleScAccountParams) {
    super(params)
    this.factoryAddress = params.factoryAddress
    this.ownerAddress = params.ownerAddress
    this.index = BigNumber.from(params.index ?? 0)
  }

  public async getAccountContract (): Promise<SimpleAccount> {
    if (this.accountContract == null) {
      this.accountContract = SimpleAccount__factory.connect(await this.getAccountAddress(), this.provider)
    }
    return this.accountContract
  }

  public async getSimpleAccountFactoryContract (): Promise<SimpleAccountFactory> {
    if (this.factory == null) {
      if (this.factoryAddress != null && this.factoryAddress !== '') {
        this.factory = SimpleAccountFactory__factory.connect(this.factoryAddress, this.provider)
      } else {
        throw new Error('no factory to get initCode')
      }
    }
    return this.factory
  }

  /**
   * return the value to put into the "initCode" field, if the account is not yet deployed.
   * this value holds the "factory" address, followed by this account's information
   */
  public async getAccountInitCode (): Promise<string> {
    if (this.factory == null) {
      if (this.factoryAddress != null && this.factoryAddress !== '') {
        this.factory = SimpleAccountFactory__factory.connect(this.factoryAddress, this.provider)
      } else {
        throw new Error('no factory to get initCode')
      }
    }
    return hexConcat([
      this.factory.address,
      this.factory.interface.encodeFunctionData('createAccount', [ this.ownerAddress, this.index])
    ])
  }

  public async getNonce (): Promise<BigNumber> {
    if (await this.checkAccountPhantom()) {
      return BigNumber.from(0)
    }
    const accountContract = await this.getAccountContract()
    return await accountContract.getNonce()
  }

  /**
   * encode a method call from entryPoint to our contract
   * @param target
   * @param value
   * @param data
   */
  public async encodeExecute (target: string, value: BigNumberish, data: string): Promise<string> {
    const accountContract = await this.getAccountContract()
    return accountContract.interface.encodeFunctionData(
      'execute',
      [
        target,
        value,
        data
      ])
  }

  public async signUserOpHash (userOpHash: string): Promise<string> {
    throw new Error(`UserOp signing not supported. Use createUserOpToSign intead and sign with MetaMask provider: ${userOpHash}`) 
  }

  /**
   * helper method: create a user operation and userOpHash to sign.
   * @param info transaction details for the userOp
   */
  public async createUserOpToSign(info: TransactionDetailsForUserOp): Promise<{userOpHash: Uint8Array, userOp:UserOperationStruct}> {
    const userOp = await this.createUnsignedUserOp(info)
    const userOpHash = await this.getUserOpHash(userOp)
    return {
      userOpHash: arrayify(userOpHash),
      userOp
    }
  }
}