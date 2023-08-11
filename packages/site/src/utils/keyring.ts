import { KeyringAccount, KeyringRequest, KeyringSnapRpcClient } from "@metamask/keyring-api";
import { getMMProvider } from "./metamask";
import { defaultSnapOrigin } from "../config";

export type KeyringState = {
    pendingRequests: KeyringRequest[];
    accounts: KeyringAccount[];
};

export const getKeyringClient = (): KeyringSnapRpcClient => {
    return new KeyringSnapRpcClient(defaultSnapOrigin, getMMProvider());
};