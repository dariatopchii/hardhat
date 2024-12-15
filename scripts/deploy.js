async function main() {
    // Получаем фабрику контракта
    const ContentBridge = await hre.ethers.getContractFactory("ContentBridge");
    // Разворачиваем контракт
    const contentBridge = await ContentBridge.deploy();

    // Ждём завершения развертывания
    await contentBridge.waitForDeployment();

    console.log("ContentBridge deployed to:", await contentBridge.getAddress());
}

// Выполняем основной скрипт
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
