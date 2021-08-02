const express = require("express");
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const { v4: uuidv4 } = require("uuid");

const nodeAddress = uuidv4().split("-").join("");

const Bitcoin = new Blockchain();

const app = express();

const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/blockchain", (req, res) => {
  res.send(Bitcoin);
});

app.post("/transaction", (req, res) => {
  const { amount, sender, receiver } = req.body;
  const BlockIndex = Bitcoin.createNewTransaction(amount, sender, receiver);
  res.json({ note: `Transaction will be added in block:${BlockIndex}` });
});

app.get("/mine", (req, res) => {
  const lastBlock = Bitcoin.getLastBlock();
  const lastBlockHash = lastBlock["hash"];
  const currentBlockData = {
    transactions: Bitcoin.pendingTransactions,
    index: lastBlock["index"] + 1,
  };
  const nonce = Bitcoin.proofOfWork(lastBlockHash, currentBlockData);
  const currentBlockHash = Bitcoin.hashBlock(
    lastBlockHash,
    currentBlockData,
    nonce
  );
  //Reward the miner
  Bitcoin.createNewTransaction(12.5, "00", nodeAddress);
  const newBlock = Bitcoin.createNewBlock(
    nonce,
    lastBlockHash,
    currentBlockHash
  );
  res.json({ note: "New block mined successfully", block: newBlock });
});

app.listen(port, () => {
  console.log(`Listening 👂👂 on port ${port}`);
});
