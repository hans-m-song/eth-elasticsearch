import 'source-map-support/register';
import {constants} from './constants';
import {EthereumDriver} from './ethereum';
import {ElasticSearchDriver} from './elasticsearch';
import {sleep} from './utils';

console.log(
  'eth-relay',
  [
    `ethereum rpc: "${constants.ETH_RPC_ADDR}"`,
    `elasticsearch: "${constants.ELASTICSEARCH_ADDR}"`,
    `interval: ${constants.RELAY_INTERVAL}ms`,
  ].join(', ')
);

(async () => {
  const eth = new EthereumDriver(
    constants.ETH_RPC_ADDR,
    constants.RELAY_START_BLOCK
  );
  const es = new ElasticSearchDriver(constants.ELASTICSEARCH_ADDR);

  await es.ping();

  const run = async () => {
    const data = await eth.poll();
    await es.submit(data);

    await sleep(constants.RELAY_INTERVAL);
    await run();
  };

  await run();
})();
