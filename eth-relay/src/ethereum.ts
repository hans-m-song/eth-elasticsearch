import Web3 from 'web3';
import {BlockTransactionObject as Block} from 'web3-eth';

// https://web3js.readthedocs.io/en/v1.3.4/web3-eth.html

export class EthereumDriver {
  web3: Web3;
  lastBlockId?: number;

  constructor(ethRpcAddr: string, startBlockId?: number) {
    this.web3 = new Web3(ethRpcAddr);
    this.lastBlockId = startBlockId;
  }

  private async get(blockId: number): Promise<Block> {
    return this.web3.eth.getBlock(blockId, true);
  }

  async poll(): Promise<Block[]> {
    const blockId = await this.web3.eth.getBlockNumber();
    console.log(`poll last: ${this.lastBlockId}, current: ${blockId}`);

    // first time fetch
    if (!this.lastBlockId) {
      console.log(`fetching data for block ${blockId}`);
      const block = await this.get(blockId);
      this.lastBlockId = blockId;
      return [block];
    }

    // no new blocks
    if (blockId === this.lastBlockId) {
      this.lastBlockId = blockId;
      return [];
    }

    // get new block data in (lastBlockId < id <= blockId)
    const blocks = [];
    const start = this.lastBlockId + 1;
    console.log(`fetching data for blocks ${start} to ${blockId}`);
    for (let id = start; id <= blockId; id++) {
      const block = await this.get(blockId);
      blocks.push(block);
    }

    this.lastBlockId = blockId;
    return blocks;
  }
}
