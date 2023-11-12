#!/bin/bash

# Check if .env file exists
if [ ! -f  .env ]; then
  echo "Error: .env file not found. Please make sure the .env file exists."
  exit 1
fi

# Load the environment variables from the .env file
source .env

# first 3 accounts default hardhat accounts
DEFAULT_ADDRESS_1="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
DEFAULT_ADDRESS_2="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
DEFAULT_ADDRESS_3="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
GETH_PORT=8545
TRANSEPTOR_PORT=4337
NETWORK_ID=1337

# Check if the container exists and remove it if it does
if docker ps -a | grep -q geth-relayer-snap; then
  echo -e "Removing existing geth container\n"
  docker rm -f geth-relayer-snap
fi

# ########################################################
# STAGE 0: start geth
# ########################################################
geth_container_id=$(docker run -d --name geth-relayer-snap -p $GETH_PORT:$GETH_PORT ethereum/client-go:latest \
  --verbosity 1 \
  --http.vhosts '*,localhost,host.docker.internal' \
  --http \
  --http.api eth,net,web3,debug \
  --http.corsdomain '*' \
  --http.addr "0.0.0.0" \
  --nodiscover --maxpeers 0 --mine \
  --networkid $NETWORK_ID \
  --dev \
  --allow-insecure-unlock \
  --rpc.allow-unprotected-txs \
  --dev.gaslimit 20000000)

echo -e "Geth started with container ID: $geth_container_id\n"
sleep 3

# Fund default accounts in a loop
echo -e "Funding default accounts\n"
for ACCOUNT in $DEFAULT_ADDRESS_1 $DEFAULT_ADDRESS_2 $DEFAULT_ADDRESS_3; do
  docker exec $geth_container_id geth \
    --exec "eth.sendTransaction({from: eth.accounts[0], to: \"$ACCOUNT\", value: web3.toWei(4337, \"ether\")})" \
    attach http://localhost:$GETH_PORT/
  
  balance=$(docker exec $geth_container_id geth --exec "eth.getBalance(\"$ACCOUNT\")" attach http://localhost:$GETH_PORT/)
  echo -e "Balance of $ACCOUNT: $balance wei\n"
done

# ########################################################
# STAGE 1: Deploy ERC4337 entrypoint and account factory contracts
# ########################################################

cd $PWD/packages/transeptor
if [ ! -d "node_modules" ]; then
  echo "Installing transeptor tools package dependencies"
  cd packages/tools
  npm install --no-package-lock
  cd ../../
fi
cd packages/tools
npm run deploy:scf
npm run deploy:ep
cd ../../../../

# ########################################################
# STAGE 2: Start the bundler
# ########################################################

# Check if the container exists and remove it if it does
if docker ps -a | grep -q transeptor-relayer-snap; then
  echo -e "Removing existing transeptor container\n"
  docker rm -f transeptor-relayer-snap
fi

echo -e "Starting transeptor...\n"

transeptor_container_id=$(docker run -d --name transeptor-relayer-snap -p $TRANSEPTOR_PORT:$TRANSEPTOR_PORT --env-file $PWD/.env transeptorlabs/bundler:latest \
  --port $TRANSEPTOR_PORT \
  --network http://host.docker.internal:$GETH_PORT \
  --txMode base \
  --unsafe \
  --httpApi web3,eth,debug \
  --auto \
  --autoBundleInterval 12000)

echo -e "Transeptor started with container ID: $transeptor_container_id\n"

# Define a function to stop the bundler and geth
stop_all() {
  echo -e "Stopping transeptor...\n"
  docker stop $transeptor_container_id
  docker rm $transeptor_container_id

  echo -e "Stopping geth...\n"
  docker stop $geth_container_id
  docker rm $geth_container_id
  exit 0
}

# ping the bundler to make sure it is up using curl rpc request
sleep 8
curl -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' http://localhost:$TRANSEPTOR_PORT/rpc

if [ $? -ne 0 ]; then
  echo "Bundler failed to start correctly, please run the script again."
  stop_all
  exit 1
fi

echo -e " -> Bundler ready to process requests on http://localhost:$TRANSEPTOR_PORT/rpc\n"

# ########################################################
# STAGE32: (Ctrl+C) to stop the bundler
# ########################################################
trap stop_all SIGINT 

echo -e "Press Ctrl+C to stop the bundler."

# Keep the bundler running in the background
while true; do
  sleep 1
done
