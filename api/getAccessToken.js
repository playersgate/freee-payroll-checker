require('dotenv').config();
const express = require('express');
const axios = require('axios');
const qs = require('qs');
const { URLSearchParams } = require('url');

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.FREEE_CLIENT_ID;
const CLIENT_SECRET = process.env.FREEE_CLIENT_SECRET;
const REDIRECT_URI = process.env.FREEE_REDIRECT_URI; // 例: http://localhost:3000/callback

// アクセストークンを格納する変数 (グローバルまたはセッション管理が必要)
let cachedAccessToken = null;

/**
 * freeeのOAuth2.0認可コードフロー全体を管理し、アクセストークンを取得します。
 * この関数は引数なしで呼び出され、内部でExpressのルーティングを管理し、
 * ユーザーのブラウザリダイレクトとコールバック処理を待ち受けます。
 *
 * @returns {Promise<object>} - アクセストークンデータ
 */
async function getAccessToken() {
    console.log("getAccessToken() が呼び出されました。freee認証フローを開始します...");

    // 既にトークンがあればそれを返す（再認証不要な場合）
    if (cachedAccessToken) {
        console.log("既存のアクセストークンを返します。");
        return cachedAccessToken;
    }

    return new Promise((resolve, reject) => {
        let authState = null; // CSRF対策用のstateを保存

        // ステップ1: ユーザーをfreeeの認証ページにリダイレクトするExpressルート
        // このルートは、getAccessTokenが呼び出された後、ユーザーがブラウザで /auth にアクセスしたときに機能します
        app.get('/auth', (req, res) => {
            console.log("ユーザーが /auth にアクセスしました。認証ページにリダイレクトします。");
            authState = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

            const params = new URLSearchParams({
                response_type: "code",
                client_id: CLIENT_ID,
                redirect_uri: REDIRECT_URI,
                scope: "read write",
                state: authState
            });

            const authURL = `https://accounts.secure.freee.co.jp/public_api/authorize?${params.toString()}`;
            console.log("認証URL:", authURL);
            res.redirect(authURL);
        });

        // ステップ2 & 3: freeeからのコールバックを受け取り、トークンを交換するExpressルート
        // このルートは、freee認証完了後にユーザーがブラウザで /callback にリダイレクトされたときに機能します
        app.get('/callback', async (req, res) => {
            console.log("freeeから /callback が呼び出されました。");
            const code = req.query.code;
            const state = req.query.state;

            // CSRF対策: stateの検証
            if (!state || state !== authState) {
                console.error("❌ /callback: stateが一致しません。CSRF攻撃の可能性があります。");
                res.status(403).send("不正なリクエストです。");
                return reject(new Error("CSRF対策: state不一致"));
            }

            if (!code) {
                console.error("❌ /callback: 認可コードがありません。");
                res.status(400).send("認可コードが提供されていません。");
                return reject(new Error("認可コードがありません"));
            }

            console.log("受け取った認可コード:", code);

            try {
                const tokenResponse = await axios.post(
                    'https://api.freee.co.jp/oauth/token',
                    qs.stringify({
                        grant_type: 'authorization_code',
                        code,
                        client_id: CLIENT_ID,
                        client_secret: CLIENT_SECRET,
                        redirect_uri: REDIRECT_URI
                    }),
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                );

                cachedAccessToken = tokenResponse.data; // トークンをキャッシュ
                console.log("✅ アクセストークン取得成功:", cachedAccessToken);

                res.send(`
                    <h1>アクセストークン取得成功！</h1>
                    <p>freee APIへのアクセス準備ができました。</p>
                    <pre>${JSON.stringify(cachedAccessToken, null, 2)}</pre>
                `);

                // Promiseを解決し、トークンデータを返す
                resolve(cachedAccessToken);

            } catch (err) {
                console.error("❌ アクセストークン取得中にエラーが発生しました:", err.response?.data || err.message);
                res.status(500).send(`
                    <h1>アクセストークン取得失敗</h1>
                    <p>エラーが発生しました。詳細をサーバーログで確認してください。</p>
                    <pre>${JSON.stringify(err.response?.data || { message: err.message }, null, 2)}</pre>
                `);
                reject(new Error(`アクセストークン取得に失敗しました: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`));
            }
        });

        // サーバーが起動し、ルーティングが設定されたことを通知
        // ユーザーが認証フローを開始するために /auth にアクセスするのを待つ
        console.log(`サーバーがポート ${PORT} で起動しました。`);
        console.log(`認証を開始するには、ブラウザで http://localhost:${PORT}/auth にアクセスしてください。`);
    });
}

module.exports = getAccessToken;
