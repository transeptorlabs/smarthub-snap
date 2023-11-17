# SmartHub

![Node Version](https://img.shields.io/badge/node-16.x-green)
[![codecov](https://img.shields.io/codecov/c/github/transeptorlabs/smarthub-snap.svg?style=flat-square)](https://app.codecov.io/gh/transeptorlabs/smarthub-snap)
![Github workflow build status(main)](https://img.shields.io/github/actions/workflow/status/transeptorlabs/smarthub-snap/main.yml?branch=main)

## Overview

- **Why**: ERC-4337(aka: Account abstraction) introduces new core components to make managing crypto simple. It has potential, but it can be difficult for developers and users to use all its core components. We have a solution that simplifies interacting with those core components.
- **What**: SmartHub is a snap that makes it easy for developers and MetaMask wallet users to use ERC-4337 without dealing with its complexity.
- **How**: The snap adds extra features to MetaMask by including RPC methods that work with ERC-4337 core components. Please take a look at the [SmartHub Snap Architecture page](https://transeptorlabs.io/snap/concepts/architecture).

This is the core repository for the development of the SmartHub
MetaMask Snap. Roadmap [here](https://hackmd.io/@V00D00-child/SJOnAnxF2#Roadmap)

> :warning: **This repository is currently under active development, and contracts/snap is not audited.**

### Features

- In dapp transaction flow. You don't need to confirm transactions/user operations in the browser extension window. Enjoy a web2-like experience with full in-dapp confirm/reject transaction flow.
- Access and control smart accounts with MetaMask. Enjoy smart contract functionality with ease and convenience.
- Manage ERC-4337 accounts deposit/withdraw and with supported entrypoint contract(paymaster support coming soon).
- No lock-in; bring your own bundler; use the settings tab to choose which bundler URL to send user operations to.
- Sign/send regular Ethereum transactions with the owner EOA of the smart account.
- Get wallet notifications when transactions/user operations and confirmed onchain.

## Requirements

To interact with the Snaps, you must install [MetaMask Flask](https://metamask.io/flask/), a canary distribution for developers that provides access to upcoming features.

- MetaMask Flask
- Docker
- yarn
- npm

## Set up

The snap requires a connection to ERC4337 Bundler. We will use Transeptor Bundler running alongside a geth client to set up the local ERC-4337 environment. Follow the steps below to set up the local environment:

1. Create a `.env` file and copy values in `.env.sample` to a the `.env` file.
2. `git submodule update --init`
3. Run `make bundler` to start the bundler.

The Bundler will start running on [http://localhost:3000/rpc](http://localhost:3000/rpc). You will
need to have [Metamask Flask](https://metamask.io/flask/) installed and listening to
`localhost:8545` network.

## Start up snap and React app

Make sure you follow the steps in `Set up` before starting the snap

```shell
nvm use
```

```shell
yarn set version 3.2.1
```

```shell
yarn install
```

Set `SNAP_ORIGIN=prod:http://localhost:8080` in local `.env` file

```shell
yarn start
```

Site will be running on [http://localhost:8000](http://localhost:8000)

## Testing and Linting

Run `yarn test` to run the tests once.

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and fix any automatically fixable issues.

## Troubleshooting

- `Invalid nonce` errors: if you are seeing this error on the `npx hardhat node`
  console, try resetting your Metamask account. This will reset the account's
  transaction history and also the nonce. Open Metamask, click on your account
  followed by `Settings > Advanced > Clear activity tab data`.

## Contributing

We welcome contributions to enhance our SmartHub Snap. If you would like to contribute, please follow these guidelines [here](https://github.com/transeptorlabs/smarthub-snap/blob/main/CONTRIBUTING.md).
