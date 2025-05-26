// api/getAccessToken.js
require('dotenv').config();
const axios = require('axios');
const qs = require('qs');
const { URLSearchParams } = require('url');

const CLIENT_ID = process.env.FREEE_CLIENT_ID;
const CLIENT_SECRET = process.env.FREEE_CLIENT_SECRET;
const REDIRECT_URI = process.env.FREEE_REDIRECT_URI; // 例: http://localhost:10000/callback

let cachedAccessToken = null; // アクセストークンを格納する変数
let currentState = null;     // CSRF対策用のstateを保存

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
            state: currentState, //ランダムな文字列
            prompt:select_company //https://developer.freee.co.jp/guideline/select-company
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

            // トークンデータをそのままキャッシュ
            cachedAccessToken = tokenResponse.data;
            console.log("✅ getAccessToken: アクセストークン取得成功！");

            res.send(`
                <h1>freee認証成功！</h1>
                <p>freee APIへのアクセス準備ができました。</p>
                <p><a href="/">給与明細チェックページに戻る</a></p>
            `);

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
 * 現在キャッシュされているアクセストークンを返します。
 * @returns {object|null} - アクセストークンオブジェクト（access_token, refresh_tokenなどを含む）、またはnull
 */
function getCachedAccessToken() {
    return cachedAccessToken;
}

module.exports = { setupAuthRoutes, getCachedAccessToken };