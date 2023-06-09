export const connectWallet = async (): Promise<string> => {
  const accounts = await window.ethereum
    .request({ method: 'eth_requestAccounts' })
    .catch((err) => {
      if (err.code === 4001) {
        // EIP-1193 userRejectedRequest error
        // If this happens, the user rejected the connection request.
        console.log('Please connect to MetaMask.');
      } else {
        console.error(err);
      }
    });
  return accounts as string[][0];
};

export const trimAccount = (account: string): string | null => {
  if (!account) {
    return null;
  }
  const trimmedAddress = `${account.substring(0, 6)}.......${account.substring(
    account.length - 4,
  )}`;
  return trimmedAddress;
};
