import { ethers } from 'ethers';
import { EntryPoint__factory } from '@account-abstraction/contracts';

type BundlerRPCError = {
  jsonrpc: string;
  id: number | string;
  error: {
    code: number;
    message: string;
  };
};
export class HttpRpcClient {
  private readonly provider: ethers.providers.JsonRpcProvider;

  private readonly bundlerUrl: string;

  private readonly DEFAULT_ENTRY_POINT =
    '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

  private readonly DEFAULT_ACCOUNT_FACTORY =
    '0x9406Cc6185a346906296840746125a0E44976454';

  constructor(bundlerUrls: { [chainId: string]: string }, chainId: string) {
    const bundlerUrl = bundlerUrls[chainId];
    if (!bundlerUrl) {
      throw new Error(
        `Bundler url not configure for chain Id ${parseInt(chainId as string, 16)}. Please configure it in the snap's settings.`,
      );
    }
    this.bundlerUrl = bundlerUrl;
    this.provider = new ethers.providers.JsonRpcProvider(this.bundlerUrl, {
      name: 'Connected Transeptor Bundler Node',
      chainId: parseInt(chainId as string, 16),
    });
  }

  public getEntryPointAddr(): string {
    return this.DEFAULT_ENTRY_POINT;
  }

  public getAccountFactoryAddr(): string {
    return this.DEFAULT_ACCOUNT_FACTORY;
  }

  public getEntryPointContract(): ethers.Contract {
    const provider = new ethers.providers.Web3Provider(ethereum as any);
    return new ethers.Contract(
      this.DEFAULT_ENTRY_POINT,
      EntryPoint__factory.abi,
      provider,
    );
  }

  public getBundlerUrl(): string {
    return this.bundlerUrl;
  }

  public async send(
    method: string,
    params: any[],
  ): Promise<{ sucess: boolean; data: any }> {
    try {
      const result = await this.provider.send(method, params);
      return {
        sucess: true,
        data: result,
      };
    } catch (e) {
      const errorBody = JSON.parse(e.body) as BundlerRPCError;
      return {
        sucess: false,
        data: errorBody.error.message,
      };
    }
  }
}
