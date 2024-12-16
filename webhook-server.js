// Import necessary modules
const express = require('express');
const bodyParser = require('body-parser');
const ethers = require('ethers');
const crypto = require('crypto');
const axios = require('axios'); // Replacing ipfs-http-client with axios

// Initialize Express app
const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(bodyParser.json());

// Configure Ethereum provider and contract
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Replace with your private key
const wallet = new ethers.Wallet(privateKey, provider);
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Replace with your deployed contract address
const contractABI =  [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "AccessControlBadConfirmation",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "internalType": "bytes32",
          "name": "neededRole",
          "type": "bytes32"
        }
      ],
      "name": "AccessControlUnauthorizedAccount",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "data",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "uploader",
          "type": "address"
        }
      ],
      "name": "ContentAdded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        }
      ],
      "name": "ContentRemoved",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "id",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "data",
          "type": "string"
        }
      ],
      "name": "ContentUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "previousAdminRole",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "newAdminRole",
          "type": "bytes32"
        }
      ],
      "name": "RoleAdminChanged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "RoleGranted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "sender",
          "type": "address"
        }
      ],
      "name": "RoleRevoked",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "ADMIN_ROLE",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "DEFAULT_ADMIN_ROLE",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_data",
          "type": "string"
        }
      ],
      "name": "addContent",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "contentCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "contents",
      "outputs": [
        {
          "internalType": "string",
          "name": "data",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "uploader",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "exists",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllContents",
      "outputs": [
        {
          "internalType": "string[]",
          "name": "",
          "type": "string[]"
        },
        {
          "internalType": "address[]",
          "name": "",
          "type": "address[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "getContent",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getContentCount",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        }
      ],
      "name": "getRoleAdmin",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "grantRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "hasRole",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "removeContent",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "callerConfirmation",
          "type": "address"
        }
      ],
      "name": "renounceRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "role",
          "type": "bytes32"
        },
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "revokeRole",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes4",
          "name": "interfaceId",
          "type": "bytes4"
        }
      ],
      "name": "supportsInterface",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "_data",
          "type": "string"
        }
      ],
      "name": "updateContent",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// Function to hash data using SHA256
const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Function to upload data to IPFS
// Function to upload data to IPFS
const uploadToIPFS = async (data) => {
    const FormData = require('form-data'); // Explicitly require form-data
    const formData = new FormData();
    formData.append('file', data); // 'file' is the key for uploading to IPFS
  
    try {
      const response = await axios.post('http://127.0.0.1:5001/api/v0/add', formData, {
        headers: {
          ...formData.getHeaders(), // Properly set headers for FormData
        },
      });
      return response.data.Hash; // Return CID
    } catch (error) {
      console.error('Error uploading to IPFS:', error.response ? error.response.data : error.message);
      throw error;
    }
  };
  
// Webhook endpoint to receive data
app.post('/webhook', async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).send('No data received');
    }

    console.log('Received data:', data);

    // Step 1: Hash the data
    const dataHash = hashData(data);
    console.log('SHA256 Hash:', dataHash);

    // Step 2: Upload data to IPFS
    const cid = await uploadToIPFS(data);
    console.log('Data uploaded to IPFS, CID:', cid);

    // Step 3: Store IPFS hash (CID) in the blockchain
    const tx = await contract.addContent(cid); // Use 'addContent' method
    await tx.wait();

    console.log('Transaction successful:', tx.hash);
    res.status(200).send({ message: 'Data stored on blockchain', ipfsHash: cid, sha256Hash: dataHash });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).send('Internal server error');
  }
});

// Endpoint to get all contents
app.get('/contents', async (req, res) => {
  try {
    const [contents, uploaders] = await contract.getAllContents();
    const result = contents.map((content, index) => ({
      id: index,
      content: content,
      uploader: uploaders[index]
    }));
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching contents:', error);
    res.status(500).send('Internal server error');
  }
});

// Endpoint to update content by ID
app.put('/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    if (!data) return res.status(400).send('No content provided');

    // Upload to IPFS
    const cid = await uploadToIPFS(data);
    console.log('Updated Data CID:', cid);

    const tx = await contract.updateContent(id, cid);
    await tx.wait();

    res.status(200).send({ message: 'Content updated on blockchain', ipfsHash: cid });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).send('Internal server error');
  }
});

// Endpoint to remove content by ID
app.delete('/content/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const tx = await contract.removeContent(id);
    await tx.wait();

    res.status(200).send({ message: 'Content removed from blockchain', id });
  } catch (error) {
    console.error('Error removing content:', error);
    res.status(500).send('Internal server error');
  }
});

// Start the server
app.listen(port, () => {
  console.log("Webhook server is running at http://localhost:3000");
});
