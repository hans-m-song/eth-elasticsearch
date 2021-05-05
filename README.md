# Prerequisites

- node and npm
- docker

## configuration

.env file with the following

- `ELK_VERSION`: kibana and elasticsearch docker image tag version (e.g. `7.3.1`)
- `ETH_RPC_ADDR`: JSON RPC provider (e.g. `https://mainnet.infura.io/v3/...`)
- `ELASTICSEARCH_ADDR`: elasticsearch local address (e.g. `http://localhost:9200`)

## running

`docker-compose up`
