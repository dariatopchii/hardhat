require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 1337, // Используем локальную сеть Hardhat
    },
    localhost: {
      url: "http://127.0.0.1:8545", // Локальная сеть Ganache
      chainId: 1337,
    },
  },
  paths: {
    sources: "./contracts", // Путь к контрактам
    tests: "./test", // Путь к тестам
    cache: "./cache", // Путь к кешу
    artifacts: "./artifacts", // Путь к артефактам
  },
};
