const sha256 = require("sha256");
const currentNodeUrl = process.argv[3];
const { v4: uuidv4 } = require("uuid");

function Blockchain() {
  this.chain = [];
  this.pendingTransactions = [];

  this.currentNodeUrl = currentNodeUrl;
  this.networkNodes = [];

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
  const newTransaction = {
    amount,
    sender,
    receiver,
    transactionId: uuidv4().split("-").join(""),
  };
  return newTransaction;
};

Blockchain.prototype.addTransactionToPendingTransaction = function (
  transctionObj
) {
  this.pendingTransactions.push(transctionObj);
  return this.getLastBlock()["index"] + 1; // return the index of the block containing new transaction
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

Blockchain.prototype.chainIsValid = function (blockchain) {
  let validChain = true;
  for (var i = 1; i < blockchain.length; i++) {
    const currentBlock = blockchain[i];
    const previousBlock = blockchain[i - 1];
    const blockHash = this.hashBlock(
      previousBlock["hash"],
      {
        transactions: currentBlock["transactions"],
        index: currentBlock["index"],
      },
      currentBlock["nonce"]
    );

    if (blockHash.substr(0, 4) !== "0000") validChain = false;
    if (currentBlock["previousBlockHash"] != previousBlock["hash"])
      validChain = false;
  }
  const genesisBlock = blockchain[0];
  const correctNonce = genesisBlock["nonce"] === 0;
  const correctPreviousHash = genesisBlock["prevBlockHash"] === "0";
  const correctHash = genesisBlock["hash"] === "0";
  const correctTransactions = genesisBlock["transactions"].length === 0;

  if (correctNonce && correctPreviousHash && correctHash && correctTransactions)
    validChain = false;
  return validChain;
};

Blockchain.prototype.getBlock = function (blockHash) {
  let correctBlock = null;
  this.chain.forEach((block) => {
    if (block.hash === blockHash) correctBlock = block;
  });
  return correctBlock;
};

Blockchain.prototype.getTransaction = function (transactionId) {
  let correctTransaction = null;
  let correctBlock = null;
  this.chain.forEach((block) => {
    block.transactions.forEach((transaction) => {
      if (transaction.transactionId === transactionId) {
        correctTransaction = transaction;
        correctBlock = block;
      }
    });
  });
  return { transaction: correctTransaction, block: correctBlock };
};

Blockchain.prototype.getAdressData = function (address) {
  const addressTransactions = [];
  this.chain.forEach((block) => {
    block.transactions.forEach((transaction) => {
      if (transaction.sender === address || transaction.receiver === address) {
        addressTransactions.push(transaction);
      }
    });
  });
  let balance = 0;
  addressTransactions.forEach((transaction) => {
    if (transaction.sender === address) {
      balance = balance - transaction.amount;
    } else if (transaction.receiver === address) {
      balance = balance + transaction.amount;
    }
  });
  return { addressTransactions: addressTransactions, addressBalance: balance };
};

module.exports = Blockchain;

// class Blockchain {
//     constructor(){
//         this.chain = [];
//         this.newTransaction = []
//     }
// }
