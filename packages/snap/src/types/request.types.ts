export type SmartAccountParams = {
  scOwnerAddress: string;
};

export type SendUserOpParams = {
  target: string;
  data: string;
  scOwnerAddress: string;
};

export type SmartAccountActivityParams = {
  scOwnerAddress: string;
  scIndex: number;
};
