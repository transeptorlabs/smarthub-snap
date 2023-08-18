export type SmartAccountParams = {
  keyringAccountId: string;
  chainId: string;
};

export type GetUserOpParams = {
  userOpHash: string;
  chainId: string;
};

export type SendUserOpParams = {
  target: string;
  data: string;
  keyringAccountId: string;
  chainId: string;
};

export type SmartAccountActivityParams = {
  keyringAccountId: string;
  chainId: string;
};

export type BaseParams = {
  chainId: string;
};
