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

// このMapは、複数のユーザーが同時に認証フローを開始した場合に、それぞれの認証コードを一時的に保存するために使用します。
// 実際のアプリケーションでは、より堅牢なセッション管理やデータベースを使用します。
const pendingAuthorizations = new Map();

/**
 * freeeのOAuth2.0認可コードフロー全体を管理し、アクセストークンを取得します。
 * この関数はExpressのルーティング内で呼び出されることを前提としています。
 * @param {object} req - Expressのリクエストオブジェクト
 * @param {object} res - Expressのレスポンスオブジェクト
 * @returns {Promise<object|void>} - アクセストークンデータ、またはレスポンスが送信された場合はvoid
 */
async function getAccessToken(req, res) {
    const requestPath = req.path;
    console.log(`getAccessToken: requestPath = ${requestPath}`);

    if (requestPath === '/auth') {
        // ステップ1: ユーザーをfreeeの認証ページにリダイレクト
        const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15); // CSRF対策用のランダムなstate
        pendingAuthorizations.set(state, res); // stateとレスポンスオブジェクトを関連付けておく（擬似的）

        const params = new URLSearchParams({
            response_type: "code",
            client_id: CLIENT_ID,
            redirect_uri: REDIRECT_URI,
            scope: "read write",
            state: state // CSRF対策用
        });

        const authURL = `https://accounts.secure.freee.co.jp/public_api/authorize?${params.toString()}`;
        console.log("ステップ1: 認証URLにリダイレクト:", authURL);
        return res.redirect(authURL);

    } else if (requestPath === '/callback') {
        // ステップ2: freeeからのコールバックを受け取り、認可コードを処理
        const code = req.query.code;
        const state = req.query.state;

        if (!code) {
            console.error("❌ ステップ2: 認可コードがありません。");
            return res.status(400).send("認可コードが提供されていません。");
        }

        // CSRF対策: stateの検証 (ここでは簡易的なもの)
        // 実際のアプリケーションでは、セッションに保存したstateと比較します。
        // ここでは、pendingAuthorizations Mapにstateが存在するかで確認します。
        if (!pendingAuthorizations.has(state)) {
            console.error("❌ ステップ2: stateが一致しません。CSRF攻撃の可能性があります。");
            return res.status(403).send("不正なリクエストです。");
        }

        // 成功したらstateを削除（再利用防止）
        const originalRes = pendingAuthorizations.get(state);
        pendingAuthorizations.delete(state);

        console.log("ステップ2: 認可コードを受け取りました:", code);

        try {
            // ステップ3: 認可コードを使ってアクセストークンを交換
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

            const accessTokenData = tokenResponse.data;
            console.log("✅ ステップ3: アクセストークン取得成功:", accessTokenData);

            // アクセストークンデータをユーザーに表示（またはセッションに保存など）
            originalRes.send(`
                <h1>アクセストークン取得成功！</h1>
                <p>freee APIへのアクセス準備ができました。</p>
                <pre>${JSON.stringify(accessTokenData, null, 2)}</pre>
            `);
            return accessTokenData; // 関数が値を返す場合

        } catch (err) {
            console.error("❌ ステップ3: アクセストークン取得中にエラーが発生しました:", err.response?.data || err.message);
            originalRes.status(500).send(`
                <h1>アクセストークン取得失敗</h1>
                <p>エラーが発生しました。詳細をサーバーログで確認してください。</p>
                <pre>${JSON.stringify(err.response?.data || { message: err.message }, null, 2)}</pre>
            `);
            throw new Error(`アクセストークン取得に失敗しました: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
        }
    } else {
        // 想定外のパスの場合
        console.warn(`getAccessToken: 未知のパスへのアクセス: ${requestPath}`);
        res.status(404).send("Not Found");
    }
}
