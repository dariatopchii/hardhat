const { ethers } = require("hardhat");

async function main() {
    // Адреса и ABI
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Адрес вашего контракта
    const adminAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Ваш адрес администратора
    const abi = require("../artifacts/contracts/ContentBridge.sol/ContentBridge.json").abi;

    // Подключаемся к провайдеру
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    // Создаем экземпляр контракта
    const contentBridge = new ethers.Contract(contractAddress, abi, provider);

    // Проверяем роль ADMIN_ROLE
    const adminRole = ethers.id("ADMIN_ROLE"); // Используем `ethers.id` вместо `keccak256`

    try {
        const isAdmin = await contentBridge.hasRole(adminRole, adminAddress);
        console.log(`Is ${adminAddress} admin?`, isAdmin);
    } catch (error) {
        console.error("Error checking role:", error.message);
    }
}

// Запускаем скрипт
main().catch((error) => {
    console.error("Error in script execution:", error.message);
    process.exitCode = 1;
});
