// api/getPayrollStatements.js
const axios = require("axios");
const { getCachedAccessToken } = require("./getAccessToken"); // getCachedAccessTokenをインポート

require("dotenv").config(); // .env ファイルをロード

async function getPayrollStatements(year, month) {
    try {
        const accessTokenData = getCachedAccessToken(); // キャッシュされたトークンオブジェクトを取得
        if (!accessTokenData || !accessTokenData.access_token) {
            console.error("❌ getPayrollStatements: アクセストークンが利用できません。");
            throw new Error("アクセストークンが利用できません。まずfreee認証を行ってください。");
        }
        const accessToken = accessTokenData.access_token; // access_tokenプロパティを取得
        console.log("✅ getPayrollStatements: 取得したアクセストークン (部分表示):", accessToken.substring(0, 10) + '...'); // ログは短く表示

        const companyId = process.env.FREEE_COMPANY_ID; // .envにCOMPANY_IDを追加することを推奨
        if (!companyId) {
             throw new Error("サーバー設定エラー: FREEE_COMPANY_ID が設定されていません。");
        }

        const response = await axios.get(`https://api.freee.co.jp/api/1/payroll_statements`, { // freee会計APIのエンドポイント
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Accept': 'application/json'
            },
            params: {
                company_id: companyId,
                target_year: year,
                target_month: month
                // 必要に応じて他のパラメータを追加
            }
        });

        return response.data.payroll_statements;
    } catch (error) {
        console.error("❌ getPayrollStatements: 給与明細取得エラー:", error.response?.data || error.message);
        throw new Error("給与明細取得に失敗しました");
    }
}

module.exports = getPayrollStatements;