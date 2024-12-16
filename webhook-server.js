const express = require("express");
const bodyParser = require("body-parser");
const ethers = require("ethers");
const crypto = require("crypto");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
const port = 3000;

app.use(bodyParser.json());

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const wallet = new ethers.Wallet(privateKey, provider);
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const contractABI = [
  { "inputs": [{ "internalType": "string", "name": "_data", "type": "string" }], "name": "addContent", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }, { "internalType": "string", "name": "_data", "type": "string" }], "name": "updateContent", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "removeContent", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "getAllContents", "outputs": [
      { "internalType": "string[]", "name": "", "type": "string[]" },
      { "internalType": "address[]", "name": "", "type": "address[]" }
    ], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "getContent", "outputs": [
      { "internalType": "string", "name": "", "type": "string" },
      { "internalType": "address", "name": "", "type": "address" }
    ], "stateMutability": "view", "type": "function" }];
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

const hashData = (data) => crypto.createHash("sha256").update(data).digest("hex");

const uploadToIPFS = async (data) => {
  const formData = new FormData();
  formData.append("file", data);

  try {
    const response = await axios.post("http://127.0.0.1:5001/api/v0/add", formData, {
      headers: { ...formData.getHeaders() },
    });
    return response.data.Hash;
  } catch (error) {
    console.error("Error uploading to IPFS:", error.response ? error.response.data : error.message);
    throw error;
  }
};

app.post("/webhook", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).send("No data received");

    const dataHash = hashData(data);
    const cid = await uploadToIPFS(data);
    const tx = await contract.addContent(cid);
    await tx.wait();

    res.status(200).send({ message: "Data stored on blockchain", ipfsHash: cid, sha256Hash: dataHash });
  } catch (error) {
    console.error("Error handling webhook:", error.message);
    res.status(500).send({ error: error.message });
  }
});

app.get("/contents", async (req, res) => {
  try {
    const [contents, uploaders] = await contract.getAllContents();
    res.status(200).json(contents.map((content, index) => ({ id: index, content, uploader: uploaders[index] })));
  } catch (error) {
    console.error("Error fetching contents:", error.message);
    res.status(500).send({ error: error.message });
  }
});

app.put("/content/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    if (!data) return res.status(400).send({ error: "No content provided" });

    const [contents] = await contract.getAllContents();
    if (!contents[id]) return res.status(404).send({ error: `Content ID ${id} does not exist` });

    const cid = await uploadToIPFS(data);
    const tx = await contract.updateContent(id, cid);
    await tx.wait();

    res.status(200).send({ message: "Content updated on blockchain", ipfsHash: cid });
  } catch (error) {
    console.error("Error updating content:", error.message);
    res.status(500).send({ error: error.message });
  }
});

app.delete("/content/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [contents] = await contract.getAllContents();
    if (!contents[id]) return res.status(404).send({ error: `Content ID ${id} does not exist` });

    const tx = await contract.removeContent(id);
    await tx.wait();

    res.status(200).send({ message: "Content removed from blockchain", id });
  } catch (error) {
    console.error("Error removing content:", error.message);
    res.status(500).send({ error: error.message });
  }
});

app.get("/content/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [contents, uploaders] = await contract.getAllContents();
    if (!contents[id]) return res.status(404).send({ error: `Content ID ${id} does not exist` });

    res.status(200).send({ id, content: contents[id], uploader: uploaders[id] });
  } catch (error) {
    console.error(`Error fetching content ID ${id}:`, error.message);
    res.status(500).send({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Webhook server is running at http://localhost:${port}`);
});
