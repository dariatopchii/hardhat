const { ethers } = require("ethers");
const fs = require("fs");

async function addContentToBlockchain() {
    // Адрес контракта
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    // Загружаем ABI контракта
    const abiPath = "./artifacts/contracts/ContentBridge.sol/ContentBridge.json";
    if (!fs.existsSync(abiPath)) {
        throw new Error(`ABI file not found at path: ${abiPath}`);
    }
    const abi = JSON.parse(fs.readFileSync(abiPath)).abi;

    // Подключаемся к локальной сети
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    // Указываем адрес первого аккаунта Hardhat
    const signer = provider.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

    // Создаём контракт с `signer`
    const contentBridge = new ethers.Contract(contractAddress, abi, signer);

    // Данные для записи
    const hash = "d2b93f6bd8235eb83d6c6ad71d8af9e3e9f0dc1c2f6d6cf8eac4b5045e3257c9";
    const metadata = "http://localhost:1337/uploads/novorichnyy_olen_0f944deea0.jpg";

    // Вызов метода контракта
    const tx = await contentBridge.connect(signer).addContent(hash, metadata);
    await tx.wait();

    console.log("Content successfully added to the blockchain!");
}

// Запуск
addContentToBlockchain().catch(console.error);
