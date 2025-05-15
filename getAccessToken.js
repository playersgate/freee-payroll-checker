const axios = require("axios");
require("dotenv").config();

async function getAccessToken() {
    const response = await axios.post("https://accounts.secure.freee.co.jp/public_api/token", {
        grant_type: "authorization_code", // ✅ 'client_credentials' ではなく、'authorization_code' を使用
        client_id: process.env.FREEE_CLIENT_ID,
        client_secret: process.env.FREEE_CLIENT_SECRET,
        redirect_uri: "https://your-redirect-url.com",
        code: process.env.FREEE_AUTH_CODE // ✅ アクセスコードを環境変数から取得
    });

    return response.data.access_token;
}

module.exports = { getAccessToken };