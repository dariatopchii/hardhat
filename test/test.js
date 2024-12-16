const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ContentBridge Contract", function () {
    let ContentBridge, contentBridge, admin, other;

    beforeEach(async function () {
        [admin, other] = await ethers.getSigners(); // Админ и обычный пользователь
        ContentBridge = await ethers.getContractFactory("ContentBridge");
        contentBridge = await ContentBridge.deploy();
        await contentBridge.waitForDeployment();
    });

    it("Should deploy with admin role", async function () {
        const adminRole = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
        const isAdmin = await contentBridge.hasRole(adminRole, admin.address);
        expect(isAdmin).to.be.true;
    });

    it("Should add content successfully", async function () {
        const data = JSON.stringify({ hash: "example_hash", metadata: "example_metadata" });
        await contentBridge.connect(admin).addContent(data);

        const [retrievedData, uploader] = await contentBridge.getContent(0);
        expect(retrievedData).to.equal(data);
        expect(uploader).to.equal(admin.address);
    });

    it("Should not allow non-admin to add content", async function () {
        const data = JSON.stringify({ hash: "example_hash", metadata: "example_metadata" });
        await expect(contentBridge.connect(other).addContent(data)).to.be.revertedWith(
            "Access denied: Requires ADMIN_ROLE"
        );
    });

    it("Should update content successfully", async function () {
        const data = JSON.stringify({ hash: "example_hash", metadata: "example_metadata" });
        const updatedData = JSON.stringify({ hash: "updated_hash", metadata: "updated_metadata" });

        await contentBridge.connect(admin).addContent(data);
        await contentBridge.connect(admin).updateContent(0, updatedData);

        const [retrievedData] = await contentBridge.getContent(0);
        expect(retrievedData).to.equal(updatedData);
    });

    it("Should not update non-existent content", async function () {
        const updatedData = JSON.stringify({ hash: "updated_hash", metadata: "updated_metadata" });
        await expect(contentBridge.connect(admin).updateContent(999, updatedData)).to.be.revertedWith(
            "Content ID does not exist"
        );
    });

    it("Should remove content successfully", async function () {
        const data = JSON.stringify({ hash: "example_hash", metadata: "example_metadata" });
        await contentBridge.connect(admin).addContent(data);

        await contentBridge.connect(admin).removeContent(0);
        await expect(contentBridge.getContent(0)).to.be.revertedWith("Content ID does not exist");
    });

    it("Should not remove non-existent content", async function () {
        await expect(contentBridge.connect(admin).removeContent(999)).to.be.revertedWith(
            "Content ID does not exist"
        );
    });

    it("Should retrieve all contents successfully", async function () {
        const data1 = JSON.stringify({ hash: "hash1", metadata: "metadata1" });
        const data2 = JSON.stringify({ hash: "hash2", metadata: "metadata2" });

        await contentBridge.connect(admin).addContent(data1);
        await contentBridge.connect(admin).addContent(data2);

        const [allData, allUploaders] = await contentBridge.getAllContents();
        expect(allData).to.have.length(2);
        expect(allData[0]).to.equal(data1);
        expect(allData[1]).to.equal(data2);
        expect(allUploaders[0]).to.equal(admin.address);
        expect(allUploaders[1]).to.equal(admin.address);
    });

    it("Should not allow adding empty content", async function () {
        await expect(contentBridge.connect(admin).addContent("")).to.be.revertedWith("Invalid content");
    });
    
    it("Should not allow updating with empty content", async function () {
        const data = JSON.stringify({ hash: "example_hash", metadata: "example_metadata" });
        await contentBridge.connect(admin).addContent(data);
    
        await expect(contentBridge.connect(admin).updateContent(0, "")).to.be.revertedWith("Invalid content");
    });
    
});
