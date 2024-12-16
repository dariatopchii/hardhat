async function main() {
    console.log("Starting script...");
    const count = await contentBridge.getContentCount();
    console.log(`Content count: ${count}`);
}
