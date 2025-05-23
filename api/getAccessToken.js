const axios = require("axios");

async function getAccessToken() {
    try {
        const response = await axios.post("https://api.freee.co.jp/auth/token", {
            grant_type: "refresh_token",
            refresh_token: process.env.FREEE_REFRESH_TOKEN,
            client_id: process.env.FREEE_CLIENT_ID,
            client_secret: process.env.FREEE_CLIENT_SECRET
        });
        console.error("FREEE_REFRESH_TOKEN:",process.env.FREEE_REFRESH_TOKEN);
        console.error("FREEE_CLIENT_ID:",process.env.FREEE_CLIENT_ID);
        console.error("FREEE_CLIENT_SECRET:",process.env.FREEE_CLIENT_SECRET);
        return response.data.access_token;
    } catch (error) {
        console.error("❌ アクセストークン取得失敗:", error.response?.data || error.message);
        throw new Error("アクセストークン取得に失敗しました");
    }
}

module.exports = getAccessToken;
