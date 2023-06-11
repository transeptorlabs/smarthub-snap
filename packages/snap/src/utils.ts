import { BigNumber, ethers } from "ethers";

export const convertToEth = (amount: string): string => {
    return ethers.utils.formatEther(amount);  
};

export const convertToWei = (amount: string): BigNumber => {
    return ethers.utils.parseUnits(amount);
};