import 'source-map-support/register';
import {constants} from './constants';
import Web3 from 'web3';
import {EthereumDriver} from './ethereum';
import {ElasticSearchDriver} from './elasticsearch';

const {ETH_RPC_ADDR, ELASTICSEARCH_ADDR} = constants;

console.log(
  `eth-relay listening to "${ETH_RPC_ADDR}" and sending to "${ELASTICSEARCH_ADDR}"`
);

(async () => {
  const eth = new EthereumDriver(ETH_RPC_ADDR);
  const es = new ElasticSearchDriver(ELASTICSEARCH_ADDR);
  console.log(await eth.poll());
  console.log(await es.post([]));
})();
