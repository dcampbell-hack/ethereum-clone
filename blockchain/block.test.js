const State = require('../store/state');
const { keccakHash } = require('../util');
const Block = require('./block');

describe('Block', () => {

    describe('calculateBlockTargetHash()', () => {
        it('calculates the maximum hash when the last block difficulty is 1', () => {
            expect(
                Block
                .calculateBlockTargetHash({ lastBlock: { blockHeaders: { difficulty: 1 }}})
            ).toEqual('f'.repeat(64))
        });

        it('calulates a low hash value when the last block difficulty is high', () => {
            expect(Block.calculateBlockTargetHash({ lastBlock: { blockHeaders: { difficulty: 500  } }}) < '1'
            ).toBe(true)
        })
    });

    describe('minedBlock()', () => {
      let lastBlock, minedBlock;

      beforeEach(() => {
          lastBlock = Block.genesis()
          minedBlock = Block.minedBlock({ 
              lastBlock, 
              beneficiary: 'beneficiary',
              transactionSeries: []
            })
      })

      it('mines a block', () => {
          expect(minedBlock).toBeInstanceOf(Block);
      });

      it('mines a block that meets proof of work requirement', () => {
          const target = Block.calculateBlockTargetHash({ lastBlock });
          const { blockHeaders } = minedBlock;
          const { nonce } = blockHeaders;
          const truncatedBlockHeaders = { ...blockHeaders };
          delete truncatedBlockHeaders.nonce;
          const header = keccakHash(truncatedBlockHeaders);
          const underTargetHash = keccakHash(header + nonce);

          expect(underTargetHash < target).toBe(true)
      })


    })


    describe('adjustDifficulty', () => {
        it('keeps the difficulty above 0', () => {
            expect(
                Block.adjustedDifficulty({
                    lastBlock: { blockHeaders: { difficulty: 0 }},
                    timestamp: Date.now()
                })
            ).toBe(1)
        });

        it('increases the difficulty for a quickly mined block', () => {
            expect(
                Block.adjustedDifficulty({
                    lastBlock: { blockHeaders: { difficulty: 5, timestamp: 1000  }},
                    timestamp: 3000
                })
            ).toBe(6)
        })

        it('decreases the difficulty for a slowly mined block', () => {
            expect(
                Block.adjustedDifficulty({
                    lastBlock: { blockHeaders: { difficulty: 5, timestamp: 1000  }},
                    timestamp: 20000
                })
            ).toBe(4)
        })
    })


    describe('validateBlock()', () => {
        let block, lastBlock, state;
        
        beforeEach(() => {
            lastBlock = Block.genesis();
            block = Block.minedBlock({ 
                lastBlock, 
                beneficiary: 'beneficiary',
                transactionSeries: []
             });
             state = new State();
        });

        it('resolves when the block is the genesis block', () => {
            expect(Block.validateBlock({ block: Block.genesis(), state })).resolves;
        });

        it('resolves if block is valid', () => {
           expect(Block.validateBlock({ lastBlock, block, state })).resolves;
        });

        it('rejects when the parentHash is invalid', () => {
            block.blockHeaders.parentHash = 'foo';
            expect(Block.validateBlock({ lastBlock, block, state }))
            .rejects
            .toMatchObject({
                message: "The parent hash must be a hash of the last block's headers"
            })
        })


        it('rejects when the number is not increased by one', () => {
            block.blockHeaders.number= 500;
            expect(Block.validateBlock({ lastBlock, block, state }))
            .rejects
            .toMatchObject({
                message: "The block must increment the number by 1"
            })
        });

        it('rejects when the difficulty adjusts by more than 1', () => {
            block.blockHeaders.difficulty = 999;
            expect(Block.validateBlock({ lastBlock, block, state }))
            .rejects
            .toMatchObject({
                message: "The difficulty must only adjust by 1"
            })
        });


        it('rejects when proof of work requirement is not met', () => {
           const originalCalculateBlockTargetHash = Block.calculateBlockTargetHash;

             Block.calculateBlockTargetHash = () => '0'.repeat(64);

             expect(Block.validateBlock({lastBlock, block, state }))
             .rejects
             .toMatchObject({
                 message: 'The block does not meet the proof of work requirement'
             })

             Block.calculateBlockTargetHash = originalCalculateBlockTargetHash;
        })

        it('rejects when the transactionSeries is not valid', () => {
            block.transactionSeries = ['foo'];

            expect(Block.validateBlock({ state, lastBlock, block }))
            .rejects 
            .toMatchObject({
                message: /rebuilt transactions root does not match/
            })
        })

    })



    
})