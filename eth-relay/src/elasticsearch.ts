import {Client} from '@elastic/elasticsearch';
import {BulkHelperOptions} from '@elastic/elasticsearch/lib/Helpers';

// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.x/api-reference.html
// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-helpers.html

export interface Block {}

export interface BulkEntry {}

const prepare = (block: Block): BulkEntry => block;

const onDocument: BulkHelperOptions<Block>['onDocument'] = (document) => ({
  index: {_index: `eth-relay-${Date.now()}`, ...prepare(document)},
});

const onDrop: BulkHelperOptions<Block>['onDrop'] = (document) =>
  console.error('failed to submit document', document);

export class ElasticSearchDriver {
  client: Client;

  constructor(elasticSearchAddr: string) {
    this.client = new Client({node: elasticSearchAddr});
  }

  async post(data: Block[]) {
    return this.client.helpers.bulk({datasource: data, onDocument, onDrop});
  }
}
