import 'source-map-support/register';
import {constants} from './constants';
import Web3 from 'web3';

const {ETH_RPC_ADDR, ELASTICSEARCH_ADDR} = constants;

console.log(
  `eth-relay listening to "${ETH_RPC_ADDR}" and sending to "${ELASTICSEARCH_ADDR}"`
);

const web3 = new Web3(ETH_RPC_ADDR);

const latestBlock = async (lastBlockId: string) => {};

(async () => {
  const blockid = await web3.eth.getBlockNumber();
  console.log(blockid);
})();
