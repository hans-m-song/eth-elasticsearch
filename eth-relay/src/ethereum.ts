import Web3 from 'web3';
import {
  BlockTransactionObject,
  Transaction as EthTransaction,
  TransactionReceipt,
} from 'web3-eth';

export type Transaction = {
  gasUsed?: TransactionReceipt['gasUsed'];
} & EthTransaction;

export type Block = Omit<BlockTransactionObject, 'transactions'> & {
  transactions: Transaction[];
};

// https://web3js.readthedocs.io/en/v1.3.4/web3-eth.html

export class EthereumDriver {
  web3: Web3;
  lastBlockId?: number;

  constructor(ethRpcAddr: string, startBlockId?: number) {
    this.web3 = new Web3(ethRpcAddr);
    this.lastBlockId = startBlockId;
  }

  async get(blockId: number): Promise<Block | null> {
    const block = await this.web3.eth.getBlock(blockId, true);
    if (!block) return null;

    const transactions: Transaction[] = await Promise.all(
      block.transactions.map(async ({hash, ...transaction}) => {
        const receipt = await this.web3.eth.getTransactionReceipt(hash);
        const {gasUsed} = receipt || {};
        return {...transaction, hash, gasUsed};
      })
    );

    return {...block, transactions};
  }

  async poll(submit: (data: Block) => Promise<void>): Promise<void> {
    const blockId = await this.web3.eth.getBlockNumber();
    console.log(`poll last: ${this.lastBlockId}, current: ${blockId}`);

    // first time fetch
    if (!this.lastBlockId) {
      console.log(`fetching data for block ${blockId}`);
      const block = await this.get(blockId);
      if (block) {
        await submit(block);
        this.lastBlockId = blockId;
        return;
      }

      return;
    }

    // no new blocks
    if (blockId === this.lastBlockId) {
      this.lastBlockId = blockId;
      return;
    }

    // get new block data in (lastBlockId < id <= blockId)
    const start = this.lastBlockId + 1;
    console.log(`fetching data for blocks ${start} to ${blockId}`);
    for (let id = start; id <= blockId; id++) {
      const block = await this.get(blockId);
      if (block) {
        await submit(block);
        this.lastBlockId = id;
      }
    }
  }
}
