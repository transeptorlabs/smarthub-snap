# ERC-4337 Relayer Snap

![Node Version](https://img.shields.io/badge/node-16.x-green)
![Github workflow build status(main)](https://img.shields.io/github/actions/workflow/status/transeptorlabs/erc-4337-snap/build.yml?branch=main)

This is the core repository for the development of the ERC-4337 Relayer
MetaMask Snap.

> :warning: **This repository is currently under active development.**

https://github.com/transeptorlabs/erc-4337-snap/assets/34751375/bbfc11e3-2b55-4178-8328-8e121afc1871

## Why

ERC-4337: Account abstraction introduces new core components to make managing crypto simple. It has potential, but it can be difficult for developers and users to use all its core components. We have a solution that simplifies interacting with those core components.

## What

ERC-4337 Relayer is a snap that makes it easy for developers and MetaMask wallet users to use ERC-4337 without dealing with its complexity.

## How

The snap adds extra features to MetaMask by including RPC methods that work with ERC-4337 core components.

## Snaps is pre-release software

To interact with (your) Snaps, you will need to install [MetaMask Flask](https://metamask.io/flask/), a canary distribution for developers that provides access to upcoming features.

## Getting Started

The snap requires a connection to ERC4337 Bundler. We will use Transeptor Bundler running alongside a geth client to set up the local ERC-4337 environment.

### Running ERC 4337 Bundler locally

1. Clone the Transeptor bundler repo [here](https://github.com/transeptorlabs/transeptor-bundler) to the local machine.
2. Open up your terminal a change directory to clone Transeptor bundler repo
3. Add environment variables to `.env`- `MNEMONIC=<your_seed_phrase>` and `BENEFICIARY=<address_to_receive_funds>`
4. Start local GETH client `npm run geth:start` (will start at http://localhost:8545/)
5. Deploy the entry point contract and fund the bundler signer account using `npm run deploy:local` script
6. Start up bundler `npm run transeptor:start`

### Start up snap and React app

Make sure you follow the steps in `Running ERC 4337 Bundler locally` before starting the snap

```shell
yarn install && yarn start
```

## Contributing

We welcome contributions to enhance our ERC-4337 Relayer Snap. If you would like to contribute, please follow these guidelines [here](https://github.com/transeptorlabs/erc-4337-snap/blob/main/CONTRIBUTING.md).

### Testing and Linting

Run `yarn test` to run the tests once.

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and fix any automatically fixable issues.

## Notes

- Babel is used for transpiling TypeScript to JavaScript, so when building with the CLI,
  `transpilationMode` must be set to `localOnly` (default) or `localAndDeps`.
