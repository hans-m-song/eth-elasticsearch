import Web3 from 'web3';
import {BlockTransactionObject} from 'web3-eth';

// https://web3js.readthedocs.io/en/v1.3.4/web3-eth.html

export class EthereumDriver {
  web3: Web3;
  lastBlockId?: number;

  constructor(ethRpcAddr: string, startBlockId?: number) {
    this.web3 = new Web3(ethRpcAddr);
    this.lastBlockId = startBlockId;
  }

  private async get(blockId: number): Promise<BlockTransactionObject> {
    return this.web3.eth.getBlock(blockId, true);
  }

  async poll(): Promise<BlockTransactionObject[]> {
    const blockId = await this.web3.eth.getBlockNumber();

    // first time fetch
    if (!this.lastBlockId) {
      console.log(`fetching data for block ${blockId}`);
      const block = await this.get(blockId);
      this.lastBlockId = blockId;
      return [block];
    }

    // no new blocks
    if (blockId === this.lastBlockId) {
      return [];
    }

    // get new block data in (lastBlockId < id <= blockId)
    const blocks = [];
    for (let id = this.lastBlockId + 1; id <= blockId; id++) {
      console.log(`fetching data for block ${blockId}`);
      const block = await this.get(blockId);
      blocks.push(block);
    }
    return blocks;
  }
}
