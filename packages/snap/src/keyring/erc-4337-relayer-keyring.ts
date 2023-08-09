import { Keyring } from "@metamask/keyring-api";
import { Json } from "@metamask/snaps-controllers";

export class Erc4337RelayerSnapKeyring implements Keyring {
    constructor() {
    }

    listAccounts(): Promise<{
        id: string; name: string; address: string; options: Record<string // Implement the required methods.
            , Json> | null; supportedMethods: ("personal_sign" | "eth_sendTransaction" | "eth_sign" | "eth_signTransaction" | "eth_signTypedData" | "eth_signTypedData_v1" | "eth_signTypedData_v2" | "eth_signTypedData_v3" | "eth_signTypedData_v4")[]; type: "eip155:eoa" | "eip155:erc4337";
    }[]> {
        throw new Error("Method not implemented.");
    }
    getAccount(id: string): Promise<{ id: string; name: string; address: string; options: Record<string, Json> | null; supportedMethods: ("personal_sign" | "eth_sendTransaction" | "eth_sign" | "eth_signTransaction" | "eth_signTypedData" | "eth_signTypedData_v1" | "eth_signTypedData_v2" | "eth_signTypedData_v3" | "eth_signTypedData_v4")[]; type: "eip155:eoa" | "eip155:erc4337"; } | undefined> {
        throw new Error("Method not implemented.");
    }
    createAccount(name: string, options?: Record<string, Json> | null | undefined): Promise<{ id: string; name: string; address: string; options: Record<string, Json> | null; supportedMethods: ("personal_sign" | "eth_sendTransaction" | "eth_sign" | "eth_signTransaction" | "eth_signTypedData" | "eth_signTypedData_v1" | "eth_signTypedData_v2" | "eth_signTypedData_v3" | "eth_signTypedData_v4")[]; type: "eip155:eoa" | "eip155:erc4337"; }> {
        throw new Error("Method not implemented.");
    }
    filterAccountChains(id: string, chains: string[]): Promise<string[]> {
        throw new Error("Method not implemented.");
    }
    updateAccount(account: { id: string; name: string; address: string; options: Record<string, Json> | null; supportedMethods: ("personal_sign" | "eth_sendTransaction" | "eth_sign" | "eth_signTransaction" | "eth_signTypedData" | "eth_signTypedData_v1" | "eth_signTypedData_v2" | "eth_signTypedData_v3" | "eth_signTypedData_v4")[]; type: "eip155:eoa" | "eip155:erc4337"; }): Promise<void> {
        throw new Error("Method not implemented.");
    }
    deleteAccount(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    listRequests(): Promise<{
        account: string; scope: string; request: {
            id: string; jsonrpc: "2.0" // Implement the required methods.
                ; method: string;
        } | { id: string; jsonrpc: "2.0"; method: string; params: Record<string, Json> | Json[]; };
    }[]> {
        throw new Error("Method not implemented.");
    }
    getRequest(id: string): Promise<{ account: string; scope: string; request: { id: string; jsonrpc: "2.0"; method: string; } | { id: string; jsonrpc: "2.0"; method: string; params: Record<string, Json> | Json[]; }; } | undefined> {
        throw new Error("Method not implemented.");
    }
    submitRequest(request: { account: string; scope: string; request: { id: string; jsonrpc: "2.0"; method: string; } | { id: string; jsonrpc: "2.0"; method: string; params: Record<string, Json> | Json[]; }; }): Promise<{ pending: true; } | { pending: false; result: Json; }> {
        throw new Error("Method not implemented.");
    }
    approveRequest(id: string, result?: Json | undefined): Promise<void> {
        throw new Error("Method not implemented.");
    }
    rejectRequest(id: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    // Implement the required methods.
}