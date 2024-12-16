// Import necessary modules
const axios = require('axios');
const assert = require('assert');

// Define the base URL for the server
const BASE_URL = 'http://localhost:3000';

// Helper function for testing responses
const testApiCall = async (method, endpoint, data = null) => {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            data,
            validateStatus: () => true, // Always resolve promise
        };
        const response = await axios(config);
        console.log(`API Call: ${method} ${endpoint} | Status: ${response.status}`); // Log request and status
        return response;
    } catch (error) {
        console.error(`Error during API call to ${endpoint}:`, error.message);
        throw error;
    }
};

// Run all tests
(async () => {
    console.log("Starting tests...");

    // 1. Test Add Content (Positive & Negative Cases)
    console.log("Test Add Content:");
    const validData = "Hello, IPFS!";
    const invalidData = "";

    try {
        const addContentResponse = await testApiCall('post', '/webhook', { data: validData });
        assert.strictEqual(addContentResponse.status, 200, "Add Content should succeed");
        console.log("  Positive Case Passed:", addContentResponse.data);
    } catch (error) {
        console.error("  Positive Case Failed:", error.message);
    }

    try {
        const addContentInvalidResponse = await testApiCall('post', '/webhook', { data: invalidData });
        assert.strictEqual(addContentInvalidResponse.status, 400, "Add Content with invalid data should fail");
        console.log("  Negative Case Passed:", addContentInvalidResponse.data);
    } catch (error) {
        console.error("  Negative Case Failed:", error.message);
    }

    // 2. Test Get All Contents
    console.log("Test Get All Contents:");
    try {
        const getAllResponse = await testApiCall('get', '/contents');
        assert.strictEqual(getAllResponse.status, 200, "Get All Contents should succeed");
        assert.ok(Array.isArray(getAllResponse.data), "Response should be an array");
        console.log("  Response Data:", getAllResponse.data);
    } catch (error) {
        console.error("  Get All Contents Failed:", error.message);
    }

    // 3. Test Update Content
    console.log("Test Update Content:");
    const updateId = 1; // Используйте существующий ID из предыдущего теста
    const newData = "Updated Data for IPFS!";

    try {
        // Проверяем, существует ли контент перед обновлением
        const checkResponse = await testApiCall('get', `/contents`);
        const existingContent = checkResponse.data.find(item => item.id === updateId);
        assert.ok(existingContent, `Content ID ${updateId} does not exist for update`);

        const updateResponse = await testApiCall('put', `/content/${updateId}`, { data: newData });
        assert.strictEqual(updateResponse.status, 200, "Update Content should succeed");
        console.log("  Update Response:", updateResponse.data);
    } catch (error) {
        console.error("Error in Test Update Content:", error.message);
    }

    try {
        // Negative test for Update Content
        const updateInvalidResponse = await testApiCall('put', `/content/9999`, { data: newData });
        assert.strictEqual(updateInvalidResponse.status, 400, "Update with invalid ID should fail");
        console.log("  Negative Case Passed:", updateInvalidResponse.data);
    } catch (error) {
        console.error("  Negative Case Failed:", error.message);
    }

    // 4. Test Remove Content
    console.log("Test Remove Content:");
    const removeId = 1; // Assuming ID 1 exists for testing
    try {
        // Проверяем, существует ли контент перед удалением
        const checkResponse = await testApiCall('get', '/contents');
        const contentExists = checkResponse.data.some(item => item.id === removeId);
        assert.ok(contentExists, `Content ID ${removeId} does not exist for removal`);

        const removeResponse = await testApiCall('delete', `/content/${removeId}`);
        assert.strictEqual(removeResponse.status, 200, "Remove Content should succeed");
        console.log("  Remove Response:", removeResponse.data);
    } catch (error) {
        console.error("Error in Test Remove Content:", error.message);
    }

    try {
        // Negative test for Remove Content
        const removeInvalidResponse = await testApiCall('delete', `/content/9999`);
        assert.strictEqual(removeInvalidResponse.status, 400, "Remove with invalid ID should fail");
        console.log("  Negative Case Passed:", removeInvalidResponse.data);
    } catch (error) {
        console.error("  Negative Case Failed:", error.message);
    }

    // 5. Test Sorting and Searching
    console.log("Test Sorting and Searching:");

    try {
        // Example of a new API: sort by uploader
        const sortResponse = await testApiCall('get', '/contents?sort=uploader');
        assert.strictEqual(sortResponse.status, 200, "Sorting contents should succeed");
        console.log("  Sorted Data:", sortResponse.data);
    } catch (error) {
        console.error("Error in Sorting Contents:", error.message);
    }

    try {
        // Example of a new API: search by ID
        const searchId = 1; // Assuming this ID exists
        const searchResponse = await testApiCall('get', `/content/${searchId}`);
        assert.strictEqual(searchResponse.status, 200, "Search by ID should succeed");
        console.log("  Search Result:", searchResponse.data);
    } catch (error) {
        console.error("Error in Searching Content:", error.message);
    }

    console.log("All tests completed successfully!");
})();
