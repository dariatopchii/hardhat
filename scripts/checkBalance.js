const { ethers } = require("ethers");

async function checkBalance() {
    // Подключаемся к локальной сети
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

    // Указываем адрес аккаунта
    const address = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    // Получаем баланс
    const balance = await provider.getBalance(address);

    // Форматируем баланс в Ether
    const formattedBalance = ethers.formatEther(balance);

    console.log("Balance:", formattedBalance);
}

checkBalance().catch(console.error);
