export type SmartAccountParams = {
  keyringAccountId: string;
};

export type GetUserOpParams = {
  userOpHash: string;
};

export type SendUserOpParams = {
  target: string;
  data: string;
  keyringAccountId: string;
};

export type SmartAccountActivityParams = {
  keyringAccountId: string;
};
