const express = require("express");
const { ethers } = require("ethers");
const { v4: uuidv4 } = require("uuid"); // For unique request IDs

const app = express();
const PORT = 3000;

// Middleware for JSON parsing
app.use(express.json());

// Blockchain setup
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const abi = require("./artifacts/contracts/ContentBridge.sol/ContentBridge.json").abi;

let signer;
let contentBridge;

// Helper function for timestamps
const getTimestamp = () => new Date().toISOString();

// Initialize contract and signer
async function initContractAndSigner() {
    const adminPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Hardhat Account #0 private key
    signer = new ethers.Wallet(adminPrivateKey, provider); // Initialize the signer

    // Initialize contract
    contentBridge = new ethers.Contract(contractAddress, abi, signer);
    console.log(`[${getTimestamp()}] [INFO] Signer initialized: ${signer.address}`);
}

// New route to fetch all content from the blockchain
app.get("/contents", async (req, res) => {
    try {
        if (!contentBridge || !signer) {
            await initContractAndSigner();
        }

        console.log(`[${getTimestamp()}] [INFO] Fetching all contents from the blockchain.`);
        const contents = await contentBridge.getAllContents();
        console.log(`[${getTimestamp()}] [INFO] Fetched contents: ${JSON.stringify(contents)}`);
        
        res.status(200).send(contents);
    } catch (error) {
        console.error(`[${getTimestamp()}] [ERROR] Failed to fetch contents from blockchain.`, {
            message: error.message,
            stack: error.stack,
        });
        res.status(500).send({ error: "Failed to fetch contents from blockchain" });
    }
});


// Middleware to log incoming requests
app.use((req, res, next) => {
    req.requestId = uuidv4(); // Unique request ID for logging
    console.log(
        `[${getTimestamp()}] [INFO] Request ID: ${req.requestId}, Method: ${req.method}, Path: ${req.path}, Body: ${JSON.stringify(
            req.body
        )}`
    );
    next();
});

// Webhook endpoint to add content
app.post("/webhook", async (req, res) => {
    const requestId = req.requestId;
    const { hash, metadata } = req.body;

    // Validate input
    if (!hash || !metadata) {
        console.error(
            `[${getTimestamp()}] [ERROR] [${requestId}] Invalid input: Hash and Metadata are required.`
        );
        return res.status(400).send({ error: "Hash and Metadata are required" });
    }

    try {
        console.log(`[${getTimestamp()}] [INFO] [${requestId}] Webhook received. Hash: ${hash}, Metadata: ${metadata}`);

        if (!contentBridge || !signer) {
            console.log(`[${getTimestamp()}] [INFO] [${requestId}] Initializing contract and signer.`);
            await initContractAndSigner();
        }

        console.log(`[${getTimestamp()}] [INFO] [${requestId}] Sending transaction to blockchain.`);
        const tx = await contentBridge.addContent(hash, metadata);
        console.log(`[${getTimestamp()}] [INFO] [${requestId}] Transaction sent. Tx Hash: ${tx.hash}`);

        await tx.wait();
        console.log(
            `[${getTimestamp()}] [SUCCESS] [${requestId}] Content added to blockchain. Hash: ${hash}, Metadata: ${metadata}`
        );

        res.status(200).send({ message: "Content added to blockchain" });
    } catch (error) {
        console.error(`[${getTimestamp()}] [ERROR] [${requestId}] Failed to add content to blockchain.`, {
            message: error.message,
            stack: error.stack,
        });
        res.status(500).send({ error: "Failed to add content to blockchain" });
    }
});


// Error handler
app.use((err, req, res, next) => {
    console.error(`[${getTimestamp()}] [ERROR] [${req.requestId}] Uncaught error:`, err);
    res.status(500).send({ error: "Internal Server Error" });
});

// Start the server
app.listen(PORT, () => {
    console.log(`[${getTimestamp()}] [INFO] Server running on http://localhost:${PORT}`);
});
