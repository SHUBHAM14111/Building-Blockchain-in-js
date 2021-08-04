const express = require("express");
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const { v4: uuidv4 } = require("uuid");
const rp = require("request-promise");

const nodeAddress = uuidv4().split("-").join("");
const port = process.argv[2];

const Bitcoin = new Blockchain();

const app = express();

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

//regiter and broaadcast node to entire network
app.post("/register-and-broadcast-node", (req, res) => {
  const newNodeUrl = req.body.newNodeUrl;
  if (Bitcoin.networkNodes.indexOf(newNodeUrl) == -1)
    Bitcoin.networkNodes.push(newNodeUrl);
  const regNodesPromises = [];
  Bitcoin.networkNodes.forEach((networkNodeUrl) => {
    ///regiser-node...
    const requestOptions = {
      uri: networkNodeUrl + "/register-node",
      method: "POST",
      body: { newNodeUrl: newNodeUrl },
      json: true,
    };
    regNodesPromises.push(rp(requestOptions));
  });

  Promise.all(regNodesPromises)
    .then((data) => {
      const bulkRegistrationOptions = {
        uri: newNodeUrl + "/register-nodes-bulk",
        method: "POST",
        body: {
          allNetworkNodes: [...Bitcoin.networkNodes, Bitcoin.currentNodeUrl],
        },
        json: true,
      };
      return rp(bulkRegistrationOptions);
    })
    .then((data) => {
      res.json({ note: "New node registered with network successfully." });
    });
});

//register a node with network
app.post("/register-node", (req, res) => {
  const { newNodeUrl } = req.body;
  const nodeNotAlreadyPresent = Bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
  const notCurrentNode = Bitcoin.currentNodeUrl !== newNodeUrl;
  if (nodeNotAlreadyPresent && notCurrentNode)
    Bitcoin.networkNodes.push(newNodeUrl);
  res.json({ note: "New node registered successfully" });
});

//register multiple nodes at once
app.post("/register-nodes-bulk", (req, res) => {
  const { allNetworkNodes } = req.body;
  allNetworkNodes.forEach((networkNodeUrl) => {
    const nodeNotAlreadyPresent =
      Bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
    const notCurrentNode = Bitcoin.currentNodeUrl !== networkNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode)
      Bitcoin.networkNodes.push(networkNodeUrl);
  });
  res.json({ note: "nodes registered successfully" });
});

app.listen(port, () => {
  console.log(`Listening 👂👂 on port ${port}`);
});
