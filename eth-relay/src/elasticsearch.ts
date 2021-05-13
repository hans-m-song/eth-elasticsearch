import {Client} from '@elastic/elasticsearch';
import {BulkHelperOptions} from '@elastic/elasticsearch/lib/Helpers';
import {Block, Transaction} from './ethereum';
import {sleep} from './utils';
import contractSpec from './contracts.json';
const contracts = contractSpec as Record<string, string>;

// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.x/api-reference.html
// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-helpers.html

const ACTION = 'index';
const INDEX = 'eth-relay-transaction';
const WEI_TO_ETH = 1000000000000000000;
const WEI_TO_GWEI = 1000000000;

const round = (value: number) => Number(value.toFixed(6));

const weiToEth = (value: string | number) => Number(value) / WEI_TO_ETH;

const weiToGwei = (value: string | number) => Number(value) / WEI_TO_GWEI;

const pad = (value: number) => (value > 9 ? value : `0${value}`);

const epochToDate = (epoch: string | number) => {
  if (typeof epoch === 'string') {
    return epoch;
  }

  const datetime = new Date(0);
  datetime.setUTCSeconds(epoch);

  const year = datetime.getFullYear();
  const month = datetime.getMonth() + 1;
  const day = datetime.getDate();

  const hour = datetime.getHours();
  const minute = datetime.getMinutes();
  const second = datetime.getSeconds();

  const date = `${year}/${pad(month)}/${pad(day)}`;
  const time = `${pad(hour)}:${pad(minute)}:${pad(second)}`;
  return `${date} ${time}`;
};

type BulkEntry = Omit<Block, 'nonce' | 'transactions'> &
  Omit<Transaction, 'gasPrice' | 'value'> & {
    blockNonce: Block['nonce'];
    gasPrice: number;
    contractNameFrom: string;
    contractNameTo: string;
    ethFee: number;
    value: number;
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

  async submit({transactions, nonce: blockNonce, ...block}: Block) {
    const datasource = transactions.map((transaction) => {
      const gasPrice = weiToGwei(transaction.gasPrice);
      const timestamp = epochToDate(block.timestamp);
      const contractNameFrom = contracts[transaction.from] || 'Unknown';
      const contractNameTo =
        (transaction.to && contracts[transaction.to]) || 'Unknown';
      const gasUsed = weiToGwei(transaction.gasUsed || 0);
      const ethFee = gasPrice * gasUsed;
      const value = weiToEth(transaction.value);
      const gasLimit = weiToGwei(block.gasLimit);

      return {
        ...block,
        // hash of block will get overwritten by hash of transaction
        // but transaction has a blockHash property
        ...transaction,
        gasPrice: round(gasPrice),
        timestamp,
        contractNameFrom,
        contractNameTo,
        ethFee: round(ethFee),
        value: round(value),
        gasLimit: round(gasLimit),
        gasUsed: round(gasUsed),
        // since both block and transaction have a nonce property
        blockNonce,
      };
    });

    console.log(`submitting ${datasource.length} transactions`);

    await this.client.helpers
      .bulk<BulkEntry>({datasource, onDocument, onDrop})
      .catch((error) => {
        console.error('Failed to submit bulk data', error);
      });
  }
}
