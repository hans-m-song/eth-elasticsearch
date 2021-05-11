import {Client} from '@elastic/elasticsearch';
import {BulkHelperOptions} from '@elastic/elasticsearch/lib/Helpers';
import {BlockTransactionObject as Block, Transaction} from 'web3-eth';
import {sleep} from './utils';

// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.x/api-reference.html
// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-helpers.html

type BulkEntry = Omit<Block, 'nonce' | 'transactions'> &
  Transaction & {blockNonce: Block['nonce']};

const onDocument: BulkHelperOptions<BulkEntry>['onDocument'] = ({hash}) => ({
  create: {_index: `eth-relay.transaction`, _id: hash},
});

const onDrop: BulkHelperOptions<BulkEntry>['onDrop'] = (error) => {
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

    const datasource = data.flatMap(({transactions, ...block}) =>
      transactions.map((transaction) => ({
        ...block,
        // hash of block will get overwritten by hash of transaction
        // but transaction has a blockHash property
        ...transaction,
        // since both block and transaction have a nonce property
        blockNonce: block.nonce,
      }))
    );

    console.log(
      `submitting ${datasource.length} transactions for ${data.length} blocks`
    );

    return this.client.helpers
      .bulk<BulkEntry>({datasource, onDocument, onDrop})
      .catch((error) => {
        console.error(error);
      });
  }
}
