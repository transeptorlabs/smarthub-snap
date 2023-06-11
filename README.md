# Transeptor ERC-4337 Snap

![Node Version](https://img.shields.io/badge/node-16.x-green)
![Github workflow build status(main)](https://img.shields.io/github/actions/workflow/status/transeptorlabs/erc-4337-snap/build.yml?branch=main)

This is the core repository for the development of ERC-4337 Relayer
MetaMask Snap.

> :warning: **This repository is currently under active development.**

## Why

ERC-4337: Account abstraction introduces new core components to make managing crypto simple. It has potential, but it can be difficult for developers and users to use all its core components. We have a solution that simplifies interacting with those core components.

## What

ERC-4337 Relayer is a snap that makes it easy for developers and MetaMask wallet users to use ERC-4337 without dealing with its complexity.

## How

The snap adds extra features to MetaMask by including RPC methods that work with ERC-4337 core components.

## Snaps is pre-release software

To interact with (your) Snaps, you will need to install [MetaMask Flask](https://metamask.io/flask/), a canary distribution for developers that provides access to upcoming features.

## Getting Started

```shell
yarn install && yarn start
```

## Contributing

### Testing and Linting

Run `yarn test` to run the tests once.

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and fix any automatically fixable issues.

## Notes

- Babel is used for transpiling TypeScript to JavaScript, so when building with the CLI,
  `transpilationMode` must be set to `localOnly` (default) or `localAndDeps`.
