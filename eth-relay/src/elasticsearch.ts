import {Client} from '@elastic/elasticsearch';
import {BulkHelperOptions} from '@elastic/elasticsearch/lib/Helpers';
import {BlockTransactionObject as Block, Transaction} from 'web3-eth';
import {sleep} from './utils';

// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.x/api-reference.html
// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-helpers.html

const ACTION = 'index';
const INDEX = 'eth-relay-transaction';

const pad = (value: number) => (value > 9 ? value : `0${value}`);

const epochToDate = (epoch: string | number) => {
  if (typeof epoch === 'string') {
    return epoch;
  }

  const date = new Date(0);
  date.setUTCSeconds(epoch);

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return `${year}/${pad(month)}/${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(
    second
  )}`;
};

type BulkEntry = Omit<Block, 'nonce' | 'transactions'> &
  Omit<Transaction, 'gasPrice'> & {
    blockNonce: Block['nonce'];
    gasPrice: number;
  };

const onDocument: BulkHelperOptions<BulkEntry>['onDocument'] = ({hash}) => ({
  [ACTION]: {_index: INDEX, _id: hash},
});

const onDrop: BulkHelperOptions<BulkEntry>['onDrop'] = (error) => {
  // ignore duplicate documents
  if (error.status === 409) {
    return;
  }

  console.error('Failed to submit document', error);
};

export class ElasticSearchDriver {
  client: Client;

  constructor(elasticSearchAddr: string) {
    this.client = new Client({node: elasticSearchAddr});
  }

  async ping(retries = 30) {
    console.log('pinging elasticsearch service...');
    await this.client.ping().catch(async () => {
      if (retries < 1) {
        throw new Error('Retries exceeded waiting for elasticsearch');
      }

      await sleep(2000);
      await this.ping(retries - 1);
    });
  }

  async submit({transactions, ...block}: Block) {
    const datasource = transactions.map((transaction) => ({
      ...block,
      // hash of block will get overwritten by hash of transaction
      // but transaction has a blockHash property
      ...transaction,
      gasPrice: Number(transaction.gasPrice),
      timestamp: epochToDate(block.timestamp),
      // since both block and transaction have a nonce property
      blockNonce: block.nonce,
    }));

    console.log(`submitting ${datasource.length} transactions`);

    await this.client.helpers
      .bulk<BulkEntry>({datasource, onDocument, onDrop})
      .catch((error) => {
        console.error('Failed to submit bulk data', error);
      });
  }
}
