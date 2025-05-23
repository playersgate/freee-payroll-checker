const axios = require("axios");
const express = require('express');
const qs = require('qs');
require('dotenv').config();
const app = express();

const CLIENT_ID = process.env.FREEE_CLIENT_ID;
const CLIENT_SECRET = process.env.FREEE_CLIENT_SECRET;
const REDIRECT_URI = process.env.FREEE_REDIRECT_URI;


async function getAccessToken() {
    try {
        // 認可URLを生成してリダイレクト
        // app.get('/auth', (req, res) => {
        //     const authURL = `https://accounts.secure.freee.co.jp/public_api/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=read write`;
        //     res.redirect(authURL);
        // });
    
        app.get('/auth', (req, res) => {
            const params = new URLSearchParams({
              response_type: "code",
              client_id: CLIENT_ID,
              redirect_uri: REDIRECT_URI,
              scope: "read write",
              state: "freee-payroll-checker" // 任意の文字列（CSRF対策用）
            });
          
            const authURL = `https://accounts.secure.freee.co.jp/public_api/authorize?${params.toString()}`;
            res.redirect(authURL);
          });
          

        // 認可コードを受け取り、トークンを取得
        app.get('/callback', async (req, res) => {
            const code = req.query.code;
            if (!code) {
                console.error("❌ 認可コードがありません");
            }else{
                console.log("code:",code);
            }
        
            try {
                const tokenResponse = await axios.post(
                    'https://api.freee.co.jp/auth/token',
                    qs.stringify({
                    grant_type: 'authorization_code',
                    code,
                    client_id: CLIENT_ID,
                    client_secret: CLIENT_SECRET,
                    redirect_uri: REDIRECT_URI
                    }),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                );
            
            } catch (err) {
                console.error(err.response?.data || err.message);
                res.status(500).send("❌ トークン取得に失敗しました");
            }
        });

        return tokenResponse.data;
    } catch (error) {

        console.error("❌ アクセストークン取得失敗:", error.response?.data || error.message);
        throw new Error("アクセストークン取得に失敗しました");
    }
}

module.exports = getAccessToken;
