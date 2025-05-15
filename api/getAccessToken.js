const axios = require("axios");

// アクセストークンを取得する関数
async function getAccessToken() {
    try {
        // 例：クライアントID/シークレットなどでトークン取得（必要に応じて変更）
        const response = await axios.post("https://api.freee.co.jp/auth/token", {
            grant_type: "refresh_token",
            refresh_token: process.env.FREEE_REFRESH_TOKEN,
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
