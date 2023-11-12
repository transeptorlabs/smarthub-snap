# SmartHub

This repository contains Transeptor Labs SmartHub Snap.

SmartHub is a snap that makes it easy for developers and MetaMask wallet users to use ERC-4337 without dealing with its complexity. Our snap adds extra features to MetaMask by including RPC methods that work with ERC-4337 core components. Allowing users to easily create and manage their smart accounts.

## What is a snap

[MetaMask Snaps](https://metamask.io/snaps/) allows anyone to safely expand the capabilities of MetaMask. A snap is a program that isolated environment that can customize the wallet experience.

## Custom Methods

SmartHub snap adds extra features to MetaMask by including custom RPC methods that work with ERC-4337 core components. Allowing users to easily create and manage their smart accounts. Dapps can invoke these methods using the `wallet_invokeSnap` RPC method. The Snap must be installed and the caller must have the permission to communicate with the Snap, or the request is rejected.

### ERC-4337 account management

Custom RPC method that allows dapps to manage smart accounts.

#### notify

Notifies users with a custom copyable message via `snap_dialog` alert UI.

```TS
await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: 'npm:@transeptor-labs/smarthub-snap',
      request: {
        method: 'notify',
        params: [
          {
            heading: 'alert UI title',
            message: 'your message',
            copyable: 'copyable text',
          },
        ],
      },
    },
});
```

#### get_next_request_id

Get the next keyring request ID.

```TS
const result = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: 'npm:@transeptor-labs/smarthub-snap',
      request: {
        method: 'get_next_request_id',
        params: [],
      },
    },
});
console.log(result);
```

#### sc_account

Returns information about the smart account with the given keyring Account Id.

```TS
type SmartContractAccount = {
  initCode: string;
  address: string;
  owner: {
    address: string;
    balance: string;
  }
  balance: string;
  nonce: BigNumber;
  index: BigNumber;
  entryPoint: string;
  factoryAddress: string;
  deposit: string;
  connected: boolean;
};

const result: SmartContractAccount = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: 'npm:@transeptor-labs/smarthub-snap',
      request: {
        method: 'sc_account',
        params: [{ 'keyringAccountId' }],
      },
    },
});
console.log(result);
```

#### get_user_ops_hashes

Returns a list of confirmed operations hashes for the given keyring Account Id.

```TS
const result: string[] = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: 'npm:@transeptor-labs/smarthub-snap',
      request: {
        method: 'get_user_ops_hashes',
        params: [
          {
            keyringAccountId: 'keyringAccountId',
          },
        ],
      },
    },
});

console.log(result);
```

#### clear_activity_data

Clears all the smart account activity data from the snap storage.

```TS
await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: 'npm:@transeptor-labs/smarthub-snap',
      request: {
        method: 'clear_activity_data',
        params: [],
      },
    },
});
```

#### add_bundler_url

Add a new bundler url to the snap storage.

```TS
await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: 'npm:@transeptor-labs/smarthub-snap',
      request: {
        method: 'add_bundler_url',
        params: ['chainId', 'url'],
      },
    },
});
```

#### get_bundler_urls

Returns a list of all the bundler urls in the snap storage.

```TS
type BundlerUrls = { [chainId: string]: string };

const result: BundlerUrls = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: 'npm:@transeptor-labs/smarthub-snap',
      request: {
        method: 'get_bundler_urls',
        params: [],
      },
    },
});

console.log(result);
```

### Build ERC-4337

Custom RPC method that helps dapps build ERC-4337 user operations.

#### get_user_op_call_data

Generates the call data for the given user operation.

```TS
const result: string = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: 'npm:@transeptor-labs/smarthub-snap',
      request: {
        method: 'get_user_op_call_data',
        params: [
            {
                keyringAccountId: 'keyringAccountId',
                to: 'to address',
                value: BigNumber.from('0'),
                data: 'encoded data',
          },
        ],
      },
    },
});

console.log(result);
```

#### estimate_creation_gas

Estimates the gas cost for creating a new counter factual smart account.

```TS
const result: string = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: 'npm:@transeptor-labs/smarthub-snap',
      request: {
        method: 'estimate_creation_gas',
        params: [
           {
            keyringAccountId: 'keyringAccountId',
          }
        ],
      },
    },
});
const parsedResult = JSON.parse(result as string);
console.log(BigNumber.from(parsedResult) as BigNumber);
```

### ERC-4337 eth and debug methods

Wraps all the eth and debug methods for [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337).

Methods supported by the snap:

- eth_supportedEntryPoints
- eth_estimateUserOperationGas
- eth_getUserOperationByHash
- eth_getUserOperationReceipt
- web3_clientVersion
- debug_bundler_clearState
- debug_bundler_dumpMempool
- debug_bundler_sendBundleNow
- debug_bundler_setBundlingMode
- debug_bundler_setReputation
- debug_bundler_dumpReputation

To invoke any of these methods use the `wallet_invokeSnap` RPC method.

This example shows how to invoke the `eth_supportedEntryPoints` method, but the same applies to all the other methods.

```TS
await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: 'npm:@transeptor-labs/smarthub-snap',
      request: {
        method: 'eth_supportedEntryPoints', // replace with your desired ERC-4337 method
        params: [], // add the required params for the method
      },
    },
});
```

## Keyring methods

Used MetaMask keyring to create and manage accounts that are natively supported within the extension, appearing in MetaMask's UI, and can be used with dapps. Dapps can invoke these methods using the `KeyringSnapRpcClient` instance.

### Create Account

Creates a new ERC-4337 smart account and adds it to the keyring. Returns the new account's address.

```TS
import { KeyringSnapRpcClient } from '@metamask/keyring-api';

const client: KeyringSnapRpcClient = new KeyringSnapRpcClient('npm:@transeptor-labs/smarthub-snap', window.ethereum);

const newAccount = await client.createAccount({
    name: 'my new account',
});
```

### Delete Account

Deletes the smart account with the given ID from the keyring.

```TS
import { KeyringSnapRpcClient } from '@metamask/keyring-api';

const client: KeyringSnapRpcClient = new KeyringSnapRpcClient('npm:@transeptor-labs/smarthub-snap', window.ethereum);
await client.deleteAccount(keyringAccountId);
```

### List Accounts

Returns a list of all the smart accounts in the keyring.

```TS
import { KeyringSnapRpcClient } from '@metamask/keyring-api';

const client: KeyringSnapRpcClient = new KeyringSnapRpcClient('npm:@transeptor-labs/smarthub-snap', window.ethereum);
const accounts = await client.listAccounts();
```

### List Request

Returns a list of all the smart account pending requests in the keyring.

```TS
import { KeyringSnapRpcClient } from '@metamask/keyring-api';

const client: KeyringSnapRpcClient = new KeyringSnapRpcClient('npm:@transeptor-labs/smarthub-snap', window.ethereum);
const pendingRequests = await client.listRequests();
```

### Approve Request

Approves a smart account pending request in the keyring.

```TS
import { KeyringSnapRpcClient } from '@metamask/keyring-api';

const client: KeyringSnapRpcClient = new KeyringSnapRpcClient('npm:@transeptor-labs/smarthub-snap', window.ethereum);

await client.approveRequest('requestId');
```

### Reject Request

Rejects a smart account pending request in the keyring.

```TS
import { KeyringSnapRpcClient } from '@metamask/keyring-api';

const client: KeyringSnapRpcClient = new KeyringSnapRpcClient('npm:@transeptor-labs/smarthub-snap', window.ethereum);

await client.rejectRequest(requestId);
```

### Send Request Async

Sends a request to the keyring that will be handled asynchronously waiting for the user to approve or reject it.

```TS
import { KeyringSnapRpcClient } from '@metamask/keyring-api';

const client: KeyringSnapRpcClient = new KeyringSnapRpcClient('npm:@transeptor-labs/smarthub-snap', window.ethereum);

const result = await snapRpcClient.submitRequest({
    id: '0',
    account: 'youKeyringAccountId',
    scope: 'async',
    request: {
    method: 'personal_sign',
    params: [],
    },
});
```

### Send Request Sync

Sends a request to the keyring that will be handled synchronously(immediately) returning the result of the request.

```TS
import { KeyringSnapRpcClient } from '@metamask/keyring-api';

const client: KeyringSnapRpcClient = new KeyringSnapRpcClient('npm:@transeptor-labs/smarthub-snap', window.ethereum);

const result: = await snapRpcClient.submitRequest({
    id: '0',
    account: 'youKeyringAccountId',
    scope: 'sync',
    request: {
    method: 'personal_sign',
    params: [],
    },
});
```
