const axios = require("axios");

async function fetchStrapiData() {
    try {
        console.log("Fetching data from Strapi...");
        const response = await axios.get("http://127.0.0.1:1337/api/media-contents");
        console.log("HTTP Status Code:", response.status); // Логируем статус ответа
        console.log("Full Response Data:", response.data); // Логируем полный ответ
        return response.data.data; // Возвращаем массив данных
    } catch (error) {
        console.error("Error fetching data:", error.message);
        if (error.response) {
            console.error("Error Response:", error.response.data);
        }
        throw error;
    }
}

fetchStrapiData();
