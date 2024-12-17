// Import necessary modules
require('dotenv').config(); // Load environment variables from .env
const express = require('express');
const bodyParser = require('body-parser');
const ethers = require('ethers');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs'); // For reading ABI file
const path = require('path'); // For handling file paths

// Initialize Express app
const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(bodyParser.json());

// Load sensitive variables from .env
const privateKey = process.env.PRIVATE_KEY;
const contractAddress = process.env.CONTRACT_ADDRESS;
const abiPath = process.env.CONTRACT_ABI_PATH;

// Validate environment variables
if (!privateKey || !contractAddress || !abiPath) {
  console.error('Error: PRIVATE_KEY, CONTRACT_ADDRESS, or CONTRACT_ABI_PATH is not set in .env');
  process.exit(1);
}

// Load ABI from JSON file
let contractABI;
try {
  const abiData = fs.readFileSync(path.resolve(abiPath), 'utf8');
  const parsedABI = JSON.parse(abiData);
  contractABI = parsedABI.abi; // Extract `abi` from the JSON file
} catch (error) {
  console.error(`Error reading ABI file at ${abiPath}:`, error.message);
  process.exit(1);
}

// Configure Ethereum provider and contract
const providerUrl = process.env.PROVIDER_URL;
if (!providerUrl) {
  console.error('Error: PROVIDER_URL is not set in .env');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(providerUrl);

const wallet = new ethers.Wallet(privateKey, provider);
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
 

// Функція для валідації payload
const validatePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return false;

  const { event, entry } = payload;
  if (!event || !entry || typeof entry !== 'object') return false;

  // Обов'язкові поля для entry
  const requiredFields = ['id', 'documentId', 'hash', 'metadata'];
  return requiredFields.every((field) => field in entry);
};

// Кеш для IPFS
const cache = new Map();

// Отримання даних з IPFS з використанням кешу
const getCachedContentFromIPFS = async (cid) => {
  if (cache.has(cid)) {
    console.log(`Cache hit for CID: ${cid}`);
    return cache.get(cid);
  }

  console.log(`Cache miss for CID: ${cid}. Fetching from IPFS...`);
  try {
    const response = await axios.get(`http://127.0.0.1:5001/api/v0/cat?arg=${cid}`);
    const content = response.data;

    // Зберігаємо контент у кеш
    cache.set(cid, content);
    return content;
  } catch (error) {
    console.error('Error fetching content from IPFS:', error);
    throw error;
  }
};

// Очищення кешу для CID
const clearCacheForCID = (cid) => {
  if (cache.has(cid)) {
    console.log(`Clearing cache for CID: ${cid}`);
    cache.delete(cid);
  }
};

// Додатковий ендпоінт для Strapi вебхуків
app.post('/strapi-webhook', async (req, res) => {
  try {
    const payload = req.body;

    // Валідація структури payload
    if (!validatePayload(payload)) {
      console.error('Invalid webhook payload:', payload);
      return res.status(400).send({ error: 'Invalid payload structure' });
    }

    const { event, entry } = payload;

    console.log('=== Incoming Webhook ===');
    console.log(`Event: ${event}`);
    console.log('Entry:', entry);

    if (event === 'entry.create') {
      try {
        const data = JSON.stringify(entry);
        console.log(`Adding content to IPFS...`);

        // Завантаження даних до IPFS
        const cid = await uploadToIPFS(data);
        cache.set(cid, data); // Кешуємо контент

        console.log(`Adding content to blockchain with Strapi ID ${entry.id}...`);
        const tx = await contract.addContent(entry.id, cid);
        await tx.wait();

        console.log(`Content added to blockchain: CID=${cid}, TX=${tx.hash}`);
        res.status(200).send({ message: 'Content added successfully', ipfsHash: cid });
      } catch (error) {
        console.error('Error adding content to blockchain:', error);
        res.status(500).send({ error: 'Failed to add content to blockchain', details: error.message });
      }
    } else if (event === 'entry.update') {
      try {
        const data = JSON.stringify(entry);
        console.log(`Updating content with Strapi ID ${entry.id} in IPFS...`);

        // Завантаження оновлених даних до IPFS
        const cid = await uploadToIPFS(data);
        cache.set(cid, data); // Оновлюємо кеш

        console.log(`Updating content in blockchain with Strapi ID ${entry.id}...`);
        const tx = await contract.updateContent(entry.id, cid);
        await tx.wait();

        console.log(`Content updated in blockchain: CID=${cid}, TX=${tx.hash}`);
        res.status(200).send({ message: 'Content updated successfully', ipfsHash: cid });
      } catch (error) {
        console.error('Error updating content in blockchain:', error);
        res.status(500).send({
          error: 'Failed to update content in blockchain',
          details: error.reason || error.message || 'Unknown error',
        });
      }
    } else if (event === 'entry.delete') {
      try {
        console.log(`Removing content with Strapi ID ${entry.id} from blockchain...`);

        // Видаляємо кешовані дані для цього CID
        const cachedContent = [...cache.entries()].find(([_, value]) => JSON.parse(value).id === entry.id);
        if (cachedContent) clearCacheForCID(cachedContent[0]);

        // Видалення запису в контракті
        const tx = await contract.removeContent(entry.id);
        console.log(`Transaction sent: ${tx.hash}`);
        await tx.wait();

        console.log(`Content removed from blockchain: Strapi ID=${entry.id}, TX=${tx.hash}`);
        res.status(200).send({ message: 'Content removed successfully', id: entry.id });
      } catch (error) {
        console.error('Error removing content from blockchain:', error);
        res.status(500).send({
          error: 'Failed to remove content from blockchain',
          details: error.reason || error.message || 'Unknown error',
        });
      }
    } else {
      console.warn(`Unknown Strapi event: ${event}`);
      res.status(400).send({ error: `Unknown event type: ${event}` });
    }
  } catch (error) {
    console.error('Unexpected error processing Strapi webhook:', error);
    res.status(500).send({ error: 'Unexpected server error', details: error.message });
  }
});

// Endpoint to read content using cache
app.get('/content/:cid', async (req, res) => {
  const { cid } = req.params;

  try {
    const content = await getCachedContentFromIPFS(cid);
    res.status(200).send({ cid, content });
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch content', details: error.message });
  }
});


// Start the server
app.listen(port, () => {
  console.log("Webhook server is running at http://localhost:3000");
});
