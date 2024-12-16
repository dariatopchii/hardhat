const { expect } = require("chai");
const axios = require("axios");

// Define the base URL for the server
const BASE_URL = "http://localhost:3000";

// Helper function for testing API calls
const apiCall = async (method, endpoint, data = null) => {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${endpoint}`,
      data,
      validateStatus: () => true,
    });
    console.log(`API Call: ${method} ${endpoint} | Status: ${response.status}`);
    return response;
  } catch (error) {
    console.error(`API Call Failed: ${method} ${endpoint} | Error: ${error.message}`);
    throw error;
  }
};

describe("Server Integration Tests", function () {
  let allContents = [];

  it("Should add content successfully", async function () {
    const validData = "Hello, IPFS!";
    const response = await apiCall("post", "/webhook", { data: validData });
    expect(response.status).to.equal(200);
    expect(response.data).to.have.property("ipfsHash");
    expect(response.data).to.have.property("sha256Hash");
    console.log("Add Content Response:", response.data);
  });

  it("Should fail to add empty content", async function () {
    const response = await apiCall("post", "/webhook", { data: "" });
    expect(response.status).to.equal(400);
    console.log("Add Empty Content Response:", response.data);
  });

  it("Should retrieve all contents", async function () {
    const response = await apiCall("get", "/contents");
    expect(response.status).to.equal(200);
    expect(response.data).to.be.an("array");
    allContents = response.data;
    console.log("Get All Contents Response:", allContents);
  });

  it("Should update content successfully", async function () {
    if (allContents.length === 0) this.skip();

    const updateId = allContents[0].id;
    const newData = "Updated Data for IPFS!";
    const response = await apiCall("put", `/content/${updateId}`, { data: newData });
    expect(response.status).to.equal(200);
    expect(response.data).to.have.property("ipfsHash");
    console.log("Update Content Response:", response.data);
  });

  it("Should fail to update non-existent content", async function () {
    const response = await apiCall("put", "/content/9999", { data: "Invalid Update" });
    expect(response.status).to.equal(404); // Изменён с 400 на 404
    console.log("Update Non-Existent Content Response:", response.data);
  });
  
  it("Should fail to remove non-existent content", async function () {
    const response = await apiCall("delete", "/content/9999");
    expect(response.status).to.equal(404); // Изменён с 400 на 404
    console.log("Remove Non-Existent Content Response:", response.data);
  });
  
  it("Should remove content successfully", async function () {
    if (allContents.length === 0) this.skip();

    const removeId = allContents[0].id;
    const response = await apiCall("delete", `/content/${removeId}`);
    expect(response.status).to.equal(200);
    console.log("Remove Content Response:", response.data);
  });

  it("Should sort contents by uploader", async function () {
    const response = await apiCall("get", "/contents?sort=uploader");
    expect(response.status).to.equal(200);
    expect(response.data).to.be.an("array");
    console.log("Sorted Contents Response:", response.data);
  });

  it("Should search content by ID", async function () {
    if (allContents.length === 0) this.skip();

    const searchId = allContents[0].id;
    const response = await apiCall("get", `/content/${searchId}`);
    expect(response.status).to.equal(200);
    console.log("Search Content Response:", response.data);
  });

  it("Should fail to search non-existent content", async function () {
    const response = await apiCall("get", "/content/9999");
    expect(response.status).to.equal(404);
    console.log("Search Non-Existent Content Response:", response.data);
  });
});
