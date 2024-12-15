const { ethers } = require("hardhat");

async function main() {
    // Получение аккаунтов
    const [admin, user] = await ethers.getSigners();

    console.log("Deploying contract...");
    const ContentBridge = await ethers.getContractFactory("ContentBridge");
    const contentBridge = await ContentBridge.deploy();
    await contentBridge.waitForDeployment(); // Ждём завершения развертывания

    const contractAddress = await contentBridge.getAddress();
    console.log("ContentBridge deployed to:", contractAddress);

    console.log("Adding content as admin...");
    let tx = await contentBridge.addContent("hash123", "Test metadata");
    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log("Content added.");

    console.log("Verifying content...");
    const isVerified = await contentBridge.verifyContent(0, "hash123");
    console.log("Content verification result:", isVerified);

    console.log("Attempting to remove content...");
    tx = await contentBridge.removeContent(0);
    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log("Content removed.");

    console.log("Attempting unauthorized access...");
    try {
        await contentBridge.connect(user).addContent("unauthorizedHash", "Unauthorized metadata");
    } catch (error) {
        console.error("Unauthorized action error:", error.message);
    }
}

main().catch((error) => {
    console.error("Error in script:", error.message);
    process.exitCode = 1;
});
