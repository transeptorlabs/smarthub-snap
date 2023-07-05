# ERC-4337 Relayer Snap

![Node Version](https://img.shields.io/badge/node-16.x-green)
![Github workflow build status(main)](https://img.shields.io/github/actions/workflow/status/transeptorlabs/erc-4337-relayer/build-test.yml?branch=main)

This is the core repository for the development of the ERC-4337 Relayer
MetaMask Snap.

> :warning: **This repository is currently under active development.**

https://github.com/transeptorlabs/erc-4337-relayer/assets/34751375/be238592-9953-4a23-82f8-fd95777202d4

## Why

ERC-4337: Account abstraction introduces new core components to make managing crypto simple. It has potential, but it can be difficult for developers and users to use all its core components. We have a solution that simplifies interacting with those core components.

## What

ERC-4337 Relayer is a snap that makes it easy for developers and MetaMask wallet users to use ERC-4337 without dealing with its complexity.

## How

The snap adds extra features to MetaMask by including RPC methods that work with ERC-4337 core components. Please take a look at the [ERC-4337 Relayer Snap Architecture page](https://transeptorlabs.io/snap/concepts/architecture).

## Snaps is pre-release software

To interact with (your) Snaps, you will need to install [MetaMask Flask](https://metamask.io/flask/), a canary distribution for developers that provides access to upcoming features.

## Contributing

We welcome contributions to enhance our ERC-4337 Relayer Snap. If you would like to contribute, please follow these guidelines [here](https://github.com/transeptorlabs/erc-4337-snap/blob/main/CONTRIBUTING.md).

## Getting Started

The snap requires a connection to ERC4337 Bundler. We will use Transeptor Bundler running alongside a geth client to set up the local ERC-4337 environment.

### Running ERC 4337 Bundler node locally
The first things you need to do are cloning this repository and installing its
dependencies:

```sh
git clone https://github.com/transeptorlabs/account-abstraction-boilerplate.git
cd account-abstraction-boilerplate
npm install
```

Once installed, let's run an ETH client on your local network:

```sh
npm run node
```

Next, on a new terminal, go to the repository's root folder and run this to
deploy Account Abstraction and your contract:

```sh
npm run deploy:all
```

Next, we can use use `.env.sample` to create .env file with your `MNEMONIC` and `BENEFICIARY`.

- `MNEMONIC`: and is set to the default seend phrase of hardhat accounts. The first account of the hardhat accounts is used as the bundler signer.
- `BENEFICIARY`: is set to the second account of the hardhat accounts.

Then, we can fund the bundler signer account with some ETH:
```sh
npm run fund 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

Finally, we can run the ERC-4337 Bundler(Transeptor)

```sh
npm run bundler
```

The Bundler will start running on [http://localhost:3000/rpc](http://localhost:3000/rpc). You will
need to have [Metamask Flask](https://metamask.io/flask/) installed and listening to
`localhost 8545`.

#### Troubleshooting

- `Invalid nonce` errors: if you are seeing this error on the `npx hardhat node`
  console, try resetting your Metamask account. This will reset the account's
  transaction history and also the nonce. Open Metamask, click on your account
  followed by `Settings > Advanced > Clear activity tab data`.



### Start up snap and React app

Make sure you follow the steps in `Running ERC 4337 Bundler locally` before starting the snap

```shell
yarn install && yarn start
```

Set `SNAP_ORIGIN=prod:http://localhost:8080` in local `.env` file

#### Testing and Linting

Run `yarn test` to run the tests once.

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and fix any automatically fixable issues.

#### Notes

- Babel is used for transpiling TypeScript to JavaScript, so when building with the CLI,
  `transpilationMode` must be set to `localOnly` (default) or `localAndDeps`.
