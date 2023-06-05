import { ethers } from 'ethers';

export class HttpRpcClient {
  public readonly bundlerUrl: string;

  public readonly entryPointAddress: string;

  private readonly chainId: number;

  private readonly provider: ethers.providers.JsonRpcProvider;

  constructor(bundlerUrl: string, entryPointAddress: string, chainId: string) {
    this.bundlerUrl = bundlerUrl;
    this.entryPointAddress = entryPointAddress;
    this.chainId = parseInt(chainId, 10);

    this.provider = new ethers.providers.JsonRpcProvider(this.bundlerUrl, {
      name: 'Connected Transeptor Bundler Node',
      chainId: this.chainId,
    });
  }
}
