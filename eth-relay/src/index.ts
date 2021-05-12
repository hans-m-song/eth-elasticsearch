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
    constants.RELAY_BLOCK_START
  );

  const es = new ElasticSearchDriver(constants.ELASTICSEARCH_ADDR);

  await es.ping();

  // get blocks within range
  if (constants.RELAY_BLOCK_START && constants.RELAY_BLOCK_END) {
    console.log(
      `fetching blocks from ${constants.RELAY_BLOCK_START} to ${constants.RELAY_BLOCK_END}`
    );

    for (
      let blockId = constants.RELAY_BLOCK_START;
      blockId <= constants.RELAY_BLOCK_END;
      blockId++
    ) {
      const block = await eth.get(blockId);
      if (block) {
        await es.submit(block);
      }
    }

    return;
  }

  // loop forever or until end
  while (true) {
    if (
      eth.lastBlockId &&
      constants.RELAY_BLOCK_END &&
      eth.lastBlockId >= constants.RELAY_BLOCK_END
    ) {
      break;
    }

    await eth.poll((data) => es.submit(data));

    await sleep(constants.RELAY_INTERVAL);
  }
})();
