import { KeyringRpcMethod } from '@metamask/keyring-api';

export enum InternalMethod {
  // Smart account management
  GetNextRequestId = 'get_next_request_id',
  SmartAccount = 'sc_account',
  GetUserOpsHashes = 'get_user_ops_hashes',
  GetUserOpCallData = 'get_user_op_call_data',
  EstimateCreationGas = 'estimate_creation_gas',
  Notify = 'notify',

  // ERC-4337 methods eth namespace
  SendUserOperation = 'eth_sendUserOperation',
  ChainId = 'eth_chainId',
  GetUserOperationReceipt = 'eth_getUserOperationReceipt',
  SupportedEntryPoints = 'eth_supportedEntryPoints',
  EstimateUserOperationGas = 'eth_estimateUserOperationGas',
  GetUserOperationByHash = 'eth_getUserOperationByHash',
  Web3ClientVersion = 'web3_clientVersion',

  // ERC-4337 methods debug namespace
  BundlerClearState = 'debug_bundler_clearState',
  BundlerDumpMempool = 'debug_bundler_dumpMempool',
  BundlerSendBundleNow = 'debug_bundler_sendBundleNow',
  BundlerSetBundlingMode = 'debug_bundler_setBundlingMode',
  BundlerSetReputation = 'debug_bundler_setReputation',
  BundlerDumpReputation = 'debug_bundler_dumpReputation',

  // Snap State management
  AddBundlerUrl = 'add_bundler_url',
  GetBundlerUrls = 'get_bundler_urls',
  ClearActivityData = 'clear_activity_data',
}

export const PERMISSIONS = new Map<string, string[]>([
  [
    'metamask',
    [
      // Keyring methods
      KeyringRpcMethod.ListAccounts,
      KeyringRpcMethod.DeleteAccount,
      KeyringRpcMethod.UpdateAccount,
      KeyringRpcMethod.ListRequests,
      KeyringRpcMethod.SubmitRequest,
      KeyringRpcMethod.ApproveRequest,
      KeyringRpcMethod.RejectRequest,
    ],
  ],
  [
    'http://localhost:8000',
    [
      // keyring methods
      KeyringRpcMethod.ListAccounts,
      KeyringRpcMethod.CreateAccount,
      KeyringRpcMethod.GetAccount,
      KeyringRpcMethod.UpdateAccount,
      KeyringRpcMethod.DeleteAccount,
      KeyringRpcMethod.ExportAccount,
      KeyringRpcMethod.ListRequests,
      KeyringRpcMethod.ApproveRequest,
      KeyringRpcMethod.RejectRequest,

      // ******************************
      // Custom methods
      // ******************************

      // Smart account management methods
      InternalMethod.GetNextRequestId,
      InternalMethod.SmartAccount,
      InternalMethod.GetUserOpsHashes,
      InternalMethod.GetUserOpCallData,
      InternalMethod.EstimateCreationGas,
      InternalMethod.Notify,

      // ERC-4337 methods eth namespace
      InternalMethod.SendUserOperation,
      InternalMethod.ChainId,
      InternalMethod.GetUserOperationReceipt,
      InternalMethod.SupportedEntryPoints,
      InternalMethod.EstimateUserOperationGas,
      InternalMethod.GetUserOperationByHash,
      InternalMethod.Web3ClientVersion,

      // ERC-4337 methods debug namespace
      InternalMethod.BundlerClearState,
      InternalMethod.BundlerDumpMempool,
      InternalMethod.BundlerSendBundleNow,
      InternalMethod.BundlerSetBundlingMode,
      InternalMethod.BundlerSetReputation,
      InternalMethod.BundlerDumpReputation,

      // Snap State management
      InternalMethod.AddBundlerUrl,
      InternalMethod.GetBundlerUrls,
      InternalMethod.ClearActivityData,
    ],
  ],
  [
    'https://transeptorlabs.github.io',
    [
      // keyring methods
      KeyringRpcMethod.ListAccounts,
      KeyringRpcMethod.CreateAccount,
      KeyringRpcMethod.GetAccount,
      KeyringRpcMethod.UpdateAccount,
      KeyringRpcMethod.DeleteAccount,
      KeyringRpcMethod.ExportAccount,
      KeyringRpcMethod.ListRequests,
      KeyringRpcMethod.ApproveRequest,
      KeyringRpcMethod.RejectRequest,

      // ******************************
      // Custom methods
      // ******************************

      // Smart account management methods
      InternalMethod.GetNextRequestId,
      InternalMethod.SmartAccount,
      InternalMethod.GetUserOpsHashes,
      InternalMethod.GetUserOpCallData,
      InternalMethod.EstimateCreationGas,
      InternalMethod.Notify,

      // ERC-4337 methods eth namespace
      InternalMethod.SendUserOperation,
      InternalMethod.ChainId,
      InternalMethod.GetUserOperationReceipt,
      InternalMethod.SupportedEntryPoints,
      InternalMethod.EstimateUserOperationGas,
      InternalMethod.GetUserOperationByHash,
      InternalMethod.Web3ClientVersion,

      // ERC-4337 methods debug namespace
      InternalMethod.BundlerClearState,
      InternalMethod.BundlerDumpMempool,
      InternalMethod.BundlerSendBundleNow,
      InternalMethod.BundlerSetBundlingMode,
      InternalMethod.BundlerSetReputation,
      InternalMethod.BundlerDumpReputation,

      // Snap State management
      InternalMethod.AddBundlerUrl,
      InternalMethod.GetBundlerUrls,
      InternalMethod.ClearActivityData,
    ],
  ],
]);
