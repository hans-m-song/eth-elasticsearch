import {Client} from '@elastic/elasticsearch';
import {BulkHelperOptions} from '@elastic/elasticsearch/lib/Helpers';
import {BlockTransactionObject as Block} from 'web3-eth';
import {sleep} from './utils';

// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.x/api-reference.html
// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-helpers.html

const onDocument: BulkHelperOptions<Block>['onDocument'] = (document) => ({
  create: {_index: `eth-relay.block`, _type: 'block', _id: document.hash},
});

const onDrop: BulkHelperOptions<Block>['onDrop'] = (error) => {
  // ignore duplicate documents
  if (error.status === 409) {
    return;
  }

  console.error('failed to submit document', error);
};

export class ElasticSearchDriver {
  client: Client;

  constructor(elasticSearchAddr: string) {
    this.client = new Client({node: elasticSearchAddr});
  }

  async ping(retries = 10) {
    await this.client.ping().catch(async () => {
      if (retries < 1) {
        throw new Error('retries exceeded waiting for elasticsearch');
      }

      await sleep(2000);
      await this.ping(retries - 1);
    });
  }

  async submit(data: Block[]) {
    if (data.length < 1) return;
    console.log(`submitting ${data.length} blocks`);
    return this.client.helpers.bulk({datasource: data, onDocument, onDrop});
  }
}
