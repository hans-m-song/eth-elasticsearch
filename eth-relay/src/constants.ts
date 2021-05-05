import * as dotenv from 'dotenv';

dotenv.config({path: '../.env'});

const {
  ETH_RPC_ADDR,
  ELASTICSEARCH_ADDR,
  RELAY_INTERVAL,
  RELAY_START_BLOCK,
} = process.env;

if (!ETH_RPC_ADDR) {
  throw new Error('ETH_RPC_ADDR is required');
}

if (!ELASTICSEARCH_ADDR) {
  throw new Error('ELASTICSEARCH_ADDR is required');
}

export const constants = {
  ETH_RPC_ADDR,
  ELASTICSEARCH_ADDR,
  RELAY_INTERVAL: Number(RELAY_INTERVAL) || 5000,
  RELAY_START_BLOCK: Number(RELAY_START_BLOCK) || undefined,
};
