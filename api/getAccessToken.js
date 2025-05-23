const axios = require("axios");

async function getAccessToken() {
    try {
        const response = await axios.post("https://accounts.secure.freee.co.jp/public_api/token", {
            grant_type: "authorization_code",
            code: process.env.FREEE_AUTH_CODE,
            redirect_uri:process.env.FREEE_REDIRECT_URI,
            client_id: process.env.FREEE_CLIENT_ID,
            client_secret: process.env.FREEE_CLIENT_SECRET
        });
        return response.data.access_token;
    } catch (error) {
        console.error("❌ アクセストークン取得失敗:", error.response?.data || error.message);
        throw new Error("アクセストークン取得に失敗しました");
    }
}

module.exports = getAccessToken;
