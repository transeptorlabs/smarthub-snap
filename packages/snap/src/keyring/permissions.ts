export enum SnapKeyringMethod {
  ListAccounts = 'keyring_listAccounts',
  CreateAccount = 'keyring_createAccount',
  GetAccount = 'keyring_getAccount',
  UpdateAccount = 'keyring_updateAccount',
  DeleteAccount = 'keyring_deleteAccount',
  ExportAccount = 'keyring_exportAccount',
}

export enum RequestMethods {
  GetRequest = 'keyring_getRequest',
  SubmitRequest = 'keyring_submitRequest',
  ListRequests = 'keyring_listRequests',
  DeleteRequest = 'keyring_deleteRequest',
  ApproveRequest = 'keyring_approveRequest',
  RejectRequest = 'keyring_rejectRequest',
}

export enum InternalMethod {
  // Smart account management
  SmartAccount = 'sc_account',
  ConfirmedUserOps = 'confirmed_UserOperation',
  PendingUserOps = 'pending_UserOperation',
  DepositReadyTx = 'deposit_ready_tx',
  StoreDepositTxHash = 'store_deposit_tx_hash',
  ConfirmedDepositTxHashes = 'confirmed_deposit_tx_hashes',

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

// Not used yet
export enum SigningMethods {
  SignTransaction = 'sign_transaction',
  SignTypedData = 'eth_signTypedData',
  SignPersonalMessage = 'personal_sign',
  EthSign = 'eth_sign',
}

export const PERMISSIONS = new Map<string, string[]>([
  [
    'metamask',
    [
      // Snap keyring methods
      SnapKeyringMethod.ListAccounts,
      SnapKeyringMethod.CreateAccount,
      SnapKeyringMethod.DeleteAccount,
      SnapKeyringMethod.UpdateAccount,

      // Snap request methods
      RequestMethods.ListRequests,
      RequestMethods.SubmitRequest,
      RequestMethods.ApproveRequest,
      RequestMethods.RejectRequest,
    ],
  ],
  [
    'http://localhost:8000',
    [
      // Snap keyring methods
      SnapKeyringMethod.ListAccounts,
      SnapKeyringMethod.CreateAccount,
      SnapKeyringMethod.GetAccount,
      SnapKeyringMethod.UpdateAccount,
      SnapKeyringMethod.DeleteAccount,
      SnapKeyringMethod.ExportAccount,

      // Snap request methods
      RequestMethods.ListRequests,
      RequestMethods.SubmitRequest,
      RequestMethods.ApproveRequest,
      RequestMethods.DeleteRequest,
      RequestMethods.RejectRequest,

      // Smart account management methods
      InternalMethod.SmartAccount,
      InternalMethod.ConfirmedUserOps,
      InternalMethod.PendingUserOps,
      InternalMethod.DepositReadyTx,
      InternalMethod.StoreDepositTxHash,
      InternalMethod.ConfirmedDepositTxHashes,

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
    'https://snap.transeptorlabs.io',
    [
      // Snap keyring methods
      SnapKeyringMethod.ListAccounts,
      SnapKeyringMethod.CreateAccount,
      SnapKeyringMethod.GetAccount,
      SnapKeyringMethod.UpdateAccount,
      SnapKeyringMethod.DeleteAccount,
      SnapKeyringMethod.ExportAccount,

      // Snap request methods
      RequestMethods.SubmitRequest,
      RequestMethods.ListRequests,
      RequestMethods.ApproveRequest,
      RequestMethods.DeleteRequest,
      RequestMethods.RejectRequest,

      // Smart account management methods
      InternalMethod.SmartAccount,
      InternalMethod.ConfirmedUserOps,
      InternalMethod.PendingUserOps,
      InternalMethod.DepositReadyTx,
      InternalMethod.StoreDepositTxHash,
      InternalMethod.ConfirmedDepositTxHashes,

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
