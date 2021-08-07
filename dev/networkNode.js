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
  const newTransaction = req.body;
  const BlockIndex = Bitcoin.addTransactionToPendingTransaction(newTransaction);
  res.json({ note: `Transaction will be added in block:${BlockIndex}` });
});

app.post("/transaction/broadcast", (req, res) => {
  const { amount, sender, receiver } = req.body;
  const newTransaction = Bitcoin.createNewTransaction(amount, sender, receiver);
  Bitcoin.addTransactionToPendingTransaction(newTransaction);

  const requesPromisies = [];

  Bitcoin.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + "/transaction",
      method: "POST",
      body: newTransaction,
      json: true,
    };
    requesPromisies.push(rp(requestOptions));
  });
  Promise.all(requesPromisies).then((data) => {
    res.json({ note: `Transaction created and broadcast successfully` });
  });
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
  const newBlock = Bitcoin.createNewBlock(
    nonce,
    lastBlockHash,
    currentBlockHash
  );
  const requestPromisies = [];
  Bitcoin.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + "/receive-new-block",
      method: "POST",
      body: { newBlock },
      json: true,
    };
    requestPromisies.push(rp(requestOptions));
  });
  Promise.all(requestPromisies)
    .then((data) => {
      const requestOptions = {
        uri: Bitcoin.currentNodeUrl + "/transaction/broadcast",
        method: "POST",
        body: { amount: 12.5, sender: "00", receiver: nodeAddress },
        json: true,
      };
      return rp(requestOptions);
    })
    .then((data) => {
      res.json({
        note: "New block mined and brodcast successfully",
        block: newBlock,
      });
    });
});

app.post("/receive-new-block", (req, res) => {
  const { newBlock } = req.body;
  const lastBlock = Bitcoin.getLastBlock();
  const correctHash = lastBlock.hash === newBlock.previousBlockHash;
  const correctIndex = lastBlock["index"] + 1 === newBlock["index"];
  if (correctHash && correctIndex) {
    Bitcoin.chain.push(newBlock);
    Bitcoin.pendingTransactions = [];
    res.json({ note: "New block received and accepted", newBlock });
  } else {
    res.json({ note: "New block rejected", newBlock });
  }
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

app.get("/consensus", (req, res) => {
  //Based on longest chain rule
  const requesPromisies = [];
  Bitcoin.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + "/blockchain",
      method: "GET",
      json: true,
    };
    requesPromisies.push(rp(requestOptions));
  });
  Promise.all(requesPromisies).then((blockchians) => {
    const currentChainLength = Bitcoin.chain.length;
    let maxChainLength = currentChainLength;
    let newLongestChain = null;
    let newPendingTransactions = null;

    blockchians.forEach((blockchain) => {
      if (blockchain.chain.length > maxChainLength) {
        maxChainLength = blockchain.chain.length;
        newLongestChain = blockchain.chain;
        newPendingTransactions = blockchain.pendingTransactions;
      }
    });
    if (
      !newLongestChain ||
      (newLongestChain && !Bitcoin.chainIsValid(newLongestChain))
    ) {
      res.json({
        note: "the current chain has not been replaced.",
        chain: Bitcoin.chain,
      });
    } else if (newLongestChain && Bitcoin.chainIsValid(newLongestChain)) {
      Bitcoin.chain = newLongestChain;
      Bitcoin.pendingTransactions = newPendingTransactions;
      res.json({
        note: "the current chain has been replaced.",
        chain: Bitcoin.chain,
      });
    }
  });
});

app.get("/block/:blockHash", (req, res) => {
  const blockHash = req.params.blockHash;
  const correctBlock = Bitcoin.getBlock(blockHash);
  res.json({ block: correctBlock });
});

app.get("/transaction/:transactionId", (req, res) => {
  const transactionId = req.params.transactionId;
  const transactionData = Bitcoin.getTransaction(transactionId);
  res.json({
    transaction: transactionData.transaction,
    block: transactionData.block,
  });
});

app.get("/address/:address", (req, res) => {
  const address = req.params.address;
  const addressData = Bitcoin.getAdressData(address);
  res.json({ addressData });
});

app.get("/block-explorer", (req, res) => {
  res.sendFile("./block-explorer/index.html", { root: __dirname });
});
app.listen(port, () => {
  console.log(`Listening 👂👂 on port ${port}`);
});
