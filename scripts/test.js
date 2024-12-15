const axios = require("axios");

(async function testConnection() {
    try {
        const response = await axios.get("http://127.0.0.1:1337/api/media-contents");
        console.log("Strapi response:", response.data);
    } catch (error) {
        console.error("Error details:", {
            message: error.message,
            config: error.config,
            code: error.code,
            address: error.address,
            port: error.port,
        });
    }
})();
