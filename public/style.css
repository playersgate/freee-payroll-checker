const axios = require("axios");
require("dotenv").config();

async function getAccessToken() {
    const response = await axios.post("https://accounts.secure.freee.co.jp/public_api/token", {
        grant_type: "client_credentials",
        client_id: process.env.FREEE_CLIENT_ID,
        client_secret: process.env.FREEE_CLIENT_SECRET
    });

    return response.data.access_token;
}

module.exports = { getAccessToken };