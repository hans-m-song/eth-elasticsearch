# Prerequisites

- docker

## configuration

.env file with the following

- `ELK_VERSION`: kibana and elasticsearch docker image tag version (e.g. `7.3.1`)
- `ETH_RPC_ADDR`: JSON RPC provider (e.g. `https://mainnet.infura.io/v3/...`)
- `ELASTICSEARCH_ADDR`: elasticsearch local address (should probably be `http://localhost:9200`)
- `RELAY_INTERVAL`: milisecond interval to fetch data (default 5000ms)
- `RELAY_START_BLOCK`: block number to start with (e.g. 12373709, default behaviour is to start from newest block)

## running

`docker-compose up`
