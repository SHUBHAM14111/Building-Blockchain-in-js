const Blockchain = require("./blockchain");

const Bitcoin = new Blockchain();

const bc1 = {
  chain: [
    {
      index: 1,
      timestamp: 1628083548646,
      transactions: [],
      nonce: 100,
      hash: "0",
      previousBlockHash: "0",
    },
    {
      index: 2,
      timestamp: 1628083605644,
      transactions: [],
      nonce: 18140,
      hash: "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100",
      previousBlockHash: "0",
    },
    {
      index: 3,
      timestamp: 1628083616015,
      transactions: [
        {
          amount: 12.5,
          sender: "00",
          receiver: "2805f14a81854a69a453f35a269a0aa4",
          transactionId: "f6d15397af87415e8f90b839e53ad781",
        },
      ],
      nonce: 38171,
      hash: "000043cb52593fe26ea0cd9210e2f1c71e50305acab339e6a93c434c1d396cae",
      previousBlockHash:
        "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100",
    },
    {
      index: 4,
      timestamp: 1628083805381,
      transactions: [
        {
          amount: 12.5,
          sender: "00",
          receiver: "936b2e55d6db4f8c837aaf95f3883a38",
          transactionId: "22f749e246a54c7f92a76b45ebebf7d3",
        },
        {
          amount: 100,
          sender: "SHUDFJLDJFLDSFD",
          receiver: "KARJDFLJFLSDJF",
          transactionId: "f622356bb5b444e2b87e9deed2d6ff91",
        },
        {
          amount: 200,
          sender: "SHUDFJLDJFLDSFD",
          receiver: "KARJDFLJFLSDJF",
          transactionId: "7899015835394d58b44914c31310a5bb",
        },
        {
          amount: 300,
          sender: "SHUDFJLDJFLDSFD",
          receiver: "KARJDFLJFLSDJF",
          transactionId: "a96d84697b7046f083e801b93d7d19ff",
        },
      ],
      nonce: 146760,
      hash: "0000c21841bdc7ea0b0b2b3e97eeba4ffaf96a35bab3afdf720be9f11a9fd258",
      previousBlockHash:
        "000043cb52593fe26ea0cd9210e2f1c71e50305acab339e6a93c434c1d396cae",
    },
  ],
  pendingTransactions: [
    {
      amount: 12.5,
      sender: "00",
      receiver: "936b2e55d6db4f8c837aaf95f3883a38",
      transactionId: "2f50a41838de4c1ca02091cebf663c23",
    },
  ],
  currentNodeUrl: "http://localhost:3002",
  networkNodes: [
    "http://localhost:3005",
    "http://localhost:3004",
    "http://localhost:3003",
    "http://localhost:3001",
  ],
};

console.log(Bitcoin.chainIsValid(bc1.chain));
