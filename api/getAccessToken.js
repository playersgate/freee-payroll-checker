// api/getAccessToken.js
require('dotenv').config();
const axios = require('axios');
const qs = require('qs');
const { URLSearchParams } = require('url');
const { Client } = require('pg'); // ★追加: pgをインポート

// express, app, PORT の定義はserver.jsに移動するので、ここから削除
// const express = require('express');
// const app = express();
// const PORT = process.env.PORT || 10000;

const CLIENT_ID = process.env.FREEE_CLIENT_ID;
const CLIENT_SECRET = process.env.FREEE_CLIENT_SECRET;
const REDIRECT_URI = process.env.FREEE_REDIRECT_URI; // 例: https://freee-payroll-checker.onrender.com/callback
const DATABASE_URL = process.env.DATABASE_URL; // ★追加: RenderのDB接続URL

// DBクライアントの初期化
const dbClient = new Client({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Renderなど、SSL証明書が自己署名の場合に必要
    }
});

// DB接続
dbClient.connect()
    .then(() => console.log('✅ PostgreSQLに接続しました。'))
    .catch(err => console.error('❌ PostgreSQL接続エラー:', err.stack));


// let cachedAccessToken = null; // ★削除: メモリキャッシュは不要になります
let currentState = null;     // CSRF対策用のstateを保存

/**
 * freeeのOAuth2.0認可コードフローのルーティングをExpressアプリに登録します。
 * この関数はExpressアプリインスタンスを受け取り、認証に必要なルーティングを設定します。
 *
 * @param {object} app - Expressアプリケーションインスタンス
 */
function setupAuthRoutes(app) {
    console.log("getAccessToken: freee認証フローのルーティングを設定します...");

    // freee認証フローの開始 (ステップ1: ユーザーをfreeeの認証ページにリダイレクト)
    app.get('/auth', (req, res) => {
        console.log("getAccessToken: ユーザーが /auth にアクセスしました。認証ページにリダイレクトします。");
        currentState = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        const params = new URLSearchParams({
            response_type: "code",
            client_id: CLIENT_ID, //アプリのclient_id
            redirect_uri: REDIRECT_URI, //アプリのコールバックURL
            scope: "read write payroll", // 給与明細アクセスに必要なスコープを追加
            state: currentState //ランダムな文字列
        });

        const authURL = `https://accounts.secure.freee.co.jp/public_api/authorize?${params.toString()}`;
        console.log("getAccessToken: 認証URL:", authURL);
        res.redirect(authURL);
    });

    // freeeからのコールバック処理 (ステップ2: 認可コードを受け取り、ステップ3: トークンを交換)
    app.get('/callback', async (req, res) => {
        console.log("getAccessToken: freeeから /callback が呼び出されました。");
        const code = req.query.code;
        const state = req.query.state;

        // CSRF対策: stateの検証
        if (!state || state !== currentState) {
            console.error("❌ getAccessToken: /callback: stateが一致しません。CSRF攻撃の可能性があります。");
            return res.status(403).send("不正なリクエストです。");
        }

        if (!code) {
            console.error("❌ getAccessToken: /callback: 認可コードがありません。");
            return res.status(400).send("認可コードが提供されていません。");
        }

        console.log("getAccessToken: 受け取った認可コード:", code);

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
console.log('Freee API token raw response:', JSON.stringify(response.data, null, 2));
            const tokenData = tokenResponse.data; // ★トークンデータを取得
            console.log("✅ getAccessToken: アクセストークン取得成功！");

            // ★DBにトークンを保存するロジック
            // 簡単にするため、毎回既存データを削除して挿入
            // COMPANY_IDを保存する場合は、別途その情報を取得して含める
            await dbClient.query('TRUNCATE TABLE freee_tokens RESTART IDENTITY;'); // 全データ削除
            const insertQuery = `
                INSERT INTO freee_tokens(access_token, refresh_token, expires_in, token_type, scope)
                VALUES($1, $2, $3, $4, $5);
            `;
            await dbClient.query(insertQuery, [
                tokenData.access_token,
                tokenData.refresh_token,
                tokenData.expires_in,
                tokenData.token_type,
                tokenData.scope
            ]);
            console.log("✅ アクセストークンをデータベースに保存しました。");

            res.redirect('/check'); // アクセストークン取得後、直接 /check にリダイレクト

        } catch (err) {
            console.error("❌ getAccessToken: アクセストークン取得中にエラーが発生しました:", err.response?.data || err.message);
            res.status(500).send(`
                <h1>アクセストークン取得失敗</h1>
                <p>エラーが発生しました。詳細をサーバーログで確認してください。</p>
                <pre>${JSON.stringify(err.response?.data || { message: err.message }, null, 2)}</pre>
            `);
        }
    });
}

/**
 * データベースから現在利用可能なアクセストークンを返します。
 * @returns {Promise<object|null>} - アクセストークンオブジェクト（access_token, refresh_tokenなどを含む）、またはnull
 */
async function getCachedAccessToken() { // ★asyncキーワードを追加
    try {
        // 最新のトークンをデータベースから取得
        const result = await dbClient.query('SELECT * FROM freee_tokens ORDER BY created_at DESC LIMIT 1;');
        if (result.rows.length > 0) {
            const token = result.rows[0];
            // ここでトークンの有効期限チェックも行うべきだが、まずはシンプルに取得
            console.log("getCachedAccessToken: データベースからトークンを取得しました。");
            return token;
        }
        console.log("getCachedAccessToken: データベースにトークンが見つかりません。");
        return null;
    } catch (error) {
        console.error("❌ getCachedAccessToken: データベースからのトークン取得中にエラー:", error.message);
        return null;
    }
}

// ★外部から利用できるようにエクスポート
module.exports = { setupAuthRoutes, getCachedAccessToken };
