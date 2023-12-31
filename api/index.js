const express = require('express');
const bodyParser = require('body-parser')
const request = require('request');
const Account = require('../account');
const Blockchain = require('../blockchain');
const Block = require('../blockchain/block');
const PubSub = require('./pubsub');
const State = require('../store/state')
const Transaction = require('../transaction');
const TransactionQueue = require('../transaction/transacton-queue');

const app = express();
app.use(bodyParser.json());

const state = new State();
const blockchain = new Blockchain({ state });
const transactionQueue = new TransactionQueue()
const pubsub = new PubSub({ blockchain, transactionQueue });
const account = new Account();
const transaction = Transaction.createTransaction({ account });

setTimeout(() => {
  pubsub.broadcastTransaction(transaction);
}, 500)


app.get('/blockchain', (req, res, next) => {
  const { chain } = blockchain;

  res.json({ chain });

});

app.get('/blockchain/mine', (req, res, next) => {
   const lastBlock = blockchain.chain[blockchain.chain.length -1 ];
   const block = Block.minedBlock({ 
     lastBlock,
     beneficiary: account.address,
     transactionSeries: transactionQueue.getTransactionSeries(),
     stateRoot: state.getStateRoot()
    });
    
   blockchain.addBlock({ block, transactionQueue })
   .then(() => {
     pubsub.broadcastBlock(block)
     res.json({ block });
   })
   .catch(next);
});

app.post('/account/transact', (req, res, next) => {
  const { code, gasLimit, to, value } = req.body;
  const transaction = Transaction.createTransaction({
    account: !to ? new Account({ code }) : account, 
    gasLimit,
    to, 
    value
  });

  pubsub.broadcastTransaction(transaction)
  res.status(200).json({ transaction })
});

app.get('/account/balance', (req, res, next) => {
  const { address } = req.query;
  const balance = Account.calculateBalance({ 
    address: address || account.address, 
    state 
  });
   console.log('/account/balance', address, balance, req.query, state )
  res.json({ balance })
})

app.use((err, req, res, next) => {
  console.log('Internal server error: ', err);
  res.status(500).json({ message: err.message })
})

const peer = process.argv.includes('--peer');
const PORT = peer ? Math.floor( 2000 + Math.random() * 1000) : 3000;

if(peer){
   request('http://localhost:3000/blockchain', (error, response, body) => {
      const { chain } = JSON.parse(body);
      blockchain.replaceChain({ chain })
      .then(() => console.log('Syncronized the blockchain with the root node'))
      .catch(error => console.error('Syncronization error:', error.message ))
   })
}

app.listen(PORT, () => {
    console.log(`listening at PORT: ${PORT}`);
})