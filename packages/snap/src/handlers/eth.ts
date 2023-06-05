export const getChainId = async (): Promise<{
  chainIdHex: string;
  chainIdNumber: number;
}> => {
  const chainId = await ethereum.request({ method: 'eth_chainId' });
  const chainIdNumber = parseInt(chainId as string, 16);

  return {
    chainIdHex: chainId as string,
    chainIdNumber,
  };
};
