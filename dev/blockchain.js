const sha256 = require("sha256");

function Blockchain() {
  this.chain = [];
  this.pendingTransactions = [];

  this.createNewBlock(100, "0", "0"); //creating a genesis block
}

//Function to create a Block in Blockchain
Blockchain.prototype.createNewBlock = function (
  nonce,
  previousBlockHash,
  hash
) {
  const newBlock = {
    index: this.chain.length + 1,
    timestamp: Date.now(),
    transactions: this.pendingTransactions, // all the transactions that are waiting to be placed inside block
    nonce: nonce, //result of proof of work
    hash: hash,
    previousBlockHash: previousBlockHash,
  };
  this.pendingTransactions = [];
  this.chain.push(newBlock);
  return newBlock;
};

//Function to get the lask Block
Blockchain.prototype.getLastBlock = function () {
  return this.chain[this.chain.length - 1];
};

//Function to create new Transaction
Blockchain.prototype.createNewTransaction = function (
  amount,
  sender,
  receiver
) {
  const newTransaction = { amount, sender, receiver };
  this.pendingTransactions.push(newTransaction);
  return this.getLastBlock["index"] + 1; // return the index of the block containing new transaction
};

//Function to hash blockData
Blockchain.prototype.hashBlock = function (
  previousBlockHash,
  currentBlocData,
  nonce
) {
  const dataAsString =
    previousBlockHash + nonce.toString() + JSON.stringify(currentBlocData);
  const hash = sha256(dataAsString);
  return hash;
};

Blockchain.prototype.proofOfWork = function (
  previousBlockHash,
  currentBlocData
) {
  let nonce = 0;
  let hash = this.hashBlock(previousBlockHash, currentBlocData, nonce);
  while (hash.substr(0, 4) != "0000") {
    nonce++;
    hash = this.hashBlock(previousBlockHash, currentBlocData, nonce);
  }
  return nonce;
  //repetedly hash block until it finds correct hash => '0000DFASJDFJSDLJFJLJFLJF'
  //use current block data for hash, but also prevBlockHash
  //continuously changing nonce value until it finds correct hash
  //return the nonce value that creates the correct hash
};

module.exports = Blockchain;

// class Blockchain {
//     constructor(){
//         this.chain = [];
//         this.newTransaction = []
//     }
// }
