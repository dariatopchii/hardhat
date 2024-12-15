const axios = require("axios"); // Импорт axios
const hre = require("hardhat");
const fs = require("fs");

async function fetchStrapiData() {
    try {
        console.log("Fetching data from Strapi...");
        const response = await axios.get("http://127.0.0.1:1337/api/media-contents");
        console.log("Data received:", response.data);
        return response.data.data; // Возвращаем массив данных
    } catch (error) {
        console.error("Error fetching data:", error.message);
        throw error;
    }
}

async function addContentToBlockchain(content) {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const abiPath = "./artifacts/contracts/ContentBridge.sol/ContentBridge.json";

    if (!fs.existsSync(abiPath)) {
        throw new Error(`ABI file not found at path: ${abiPath}`);
    }
    const abi = JSON.parse(fs.readFileSync(abiPath)).abi;

    const [signer] = await hre.ethers.getSigners(); // Используем Hardhat signer
    const contentBridge = new hre.ethers.Contract(contractAddress, abi, signer);

    console.log(`Adding content to blockchain: hash=${content.hash}, metadata=${content.metadata}`);
    const tx = await contentBridge.addContent(content.hash, content.metadata);
    await tx.wait();
    console.log(`Content successfully added: ID=${content.id}`);
}

async function main() {
    try {
        const strapiData = await fetchStrapiData();
        console.log(`Fetched ${strapiData.length} items from Strapi`);

        for (const content of strapiData) {
            await addContentToBlockchain(content);
        }

        console.log("All content successfully added to the blockchain!");
    } catch (error) {
        console.error("Error in main execution:", error.message);
    }
}

main();
