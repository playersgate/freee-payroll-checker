const axios = require("axios");
require("dotenv").config();

async function getAccessToken() {
    try {
        const response = await axios.post("https://accounts.secure.freee.co.jp/public_api/token", {
            grant_type: "authorization_code",  // ✅ 修正ポイント
            client_id: process.env.FREEE_CLIENT_ID,
            client_secret: process.env.FREEE_CLIENT_SECRET,
            redirect_uri: process.env.FREEE_REDIRECT_URI,  // ✅ 正しいコールバックURL
            code: process.env.FREEE_AUTH_CODE
        });

        console.log("✅ アクセストークン取得成功:", response.data.access_token);
        return response.data.access_token;
    } catch (error) {
        console.error("❌ アクセストークン取得に失敗:", error.response?.data || error.message);
    }
}

getAccessToken();