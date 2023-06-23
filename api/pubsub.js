const PubNub = require('pubnub');
const Transaction = require('../transaction');

const credentials = {
    publishKey: 'pub-c-510f4918-39fb-41c4-9843-96a5bfe54a1e',
    subscribeKey: 'sub-c-371b18f0-68ad-11ec-a2db-9eb9413efc82',
    secretKey: 'sec-c-ODZhNWU3NTUtZjk2Ni00MzhmLWI0OTMtZGVlODc3NWNlNmE3'
}

const CHANNELS_MAP = {
    TEST: 'TEST',
    BLOCK: 'BLOCK',
    TRANSACTION: 'TRANSACTION'
}

class PubSub {
    constructor({ blockchain, transactionQueue }){
       this.pubnub = new PubNub(credentials);
       this.blockchain = blockchain;
       this.transactionQueue = transactionQueue;
       this.subscribeToChannels();
       this.listen();
    }

    subscribeToChannels(){
       this.pubnub.subscribe({
           channels: Object.values(CHANNELS_MAP)
       });
    }

    publish({  channel, message }){
        this.pubnub.publish({ channel, message })
    }

    listen(){
        this.pubnub.addListener({
          message: messageObject => {
             const { channel, message } = messageObject;
             console.log('Message recieved. Channel: ', channel);

             const parsedMessage = JSON.parse(message);

             switch(channel){
                 case CHANNELS_MAP.BLOCK:
                     console.log('block message', message);
                     this.blockchain.addBlock({ block: parsedMessage, transactionQueue: this.transactionQueue })
                     .then(() => console.log('New block accepted', parsedMessage))
                     .catch(error => console.error('New block rejected', error.message ))
                     break;
                case CHANNELS_MAP.TRANSACTION:
                    console.log(`Recieved transaction: ${parsedMessage.id}`);
                    console.log('this.transactionQueue.getTransactionSeries()', this.transactionQueue.getTransactionSeries())
                    this.transactionQueue.add(new Transaction(parsedMessage));
                    break;
                default:
                    return;
             }
          }
        });
    }


    broadcastBlock(block){
        this.publish({
            channel: CHANNELS_MAP.BLOCK,
            message: JSON.stringify(block)
        })
    }


    broadcastTransaction(transaction){
       this.publish({
           channel: CHANNELS_MAP.TRANSACTION,
           message: JSON.stringify(transaction)
       })
    }

}

module.exports = PubSub;

