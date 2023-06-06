import { ethers } from 'ethers';

interface HttpRpcClientOptions {
  bundlerUrl?: string;
  entryPointAddress?: string;
  chainId: number;
}

export class HttpRpcClient {
  public readonly options: HttpRpcClientOptions = {
    bundlerUrl: '',
    entryPointAddress: '',
    chainId: 0,
  }
  private readonly provider: ethers.providers.JsonRpcProvider;
  private readonly DEFAULT_BUNDLER_URL = 'http://localhost:3000/rpc';
  private readonly DEFAULT_ENTRY_POINT = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

  constructor(options: HttpRpcClientOptions) {
    this.options.bundlerUrl = options.bundlerUrl? options.bundlerUrl : this.DEFAULT_BUNDLER_URL;
    this.options.entryPointAddress = options.entryPointAddress ? options.entryPointAddress : this.DEFAULT_ENTRY_POINT;
    this.options.chainId = options.chainId;

    this.provider = new ethers.providers.JsonRpcProvider(this.options.bundlerUrl, {
      name: 'Connected Transeptor Bundler Node',
      chainId: this.options.chainId,
    });
  }

  public async send(method: string, params: any[]): Promise<any> {
    const result = await this.provider.send(method, params);
    return result;
  }
}
