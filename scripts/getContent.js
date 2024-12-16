const hre = require("hardhat");
const fs = require("fs");

async function getContentFromBlockchain(contentId) {
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Замените адрес, если контракт переустановлен
    const abiPath = "./artifacts/contracts/ContentBridge.sol/ContentBridge.json";

    if (!fs.existsSync(abiPath)) {
        throw new Error(`ABI file not found at path: ${abiPath}`);
    }
    const abi = JSON.parse(fs.readFileSync(abiPath)).abi;

    const [signer] = await hre.ethers.getSigners(); // Используем Hardhat signer
    const contentBridge = new hre.ethers.Contract(contractAddress, abi, signer);

    try {
        console.log("Starting script...");
        const count = await contentBridge.getContentCount();
        console.log(`Content count: ${count}`);
        console.log(`Fetching content with ID: ${contentId}`);
        const content = await contentBridge.getContent(contentId);
        console.log("Content details:");
        console.log(`Hash: ${content[0]}`);
        console.log(`Metadata: ${content[1]}`);
        console.log(`Uploader: ${content[2]}`);
    } catch (error) {
        console.error("Error fetching content:", error.message);
    }
}

async function main() {
    const contentId = 10; // Укажите ID контента, который хотите получить
    await getContentFromBlockchain(contentId);
}

main().catch((error) => {
    console.error("Error in execution:", error.message);
});
