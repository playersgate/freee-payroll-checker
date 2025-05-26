// api/getPayrollStatements.js - 修正版 (以前に提案済みの内容)
const axios = require("axios");
// getAccessTokenはもう直接呼び出さないので、getCachedAccessTokenをここからはインポートしない
// const getAccessToken = require("./getAccessToken"); 

async function getPayrollStatements(accessTokenData, companyId, year, month) { // ★修正: accessTokenDataとcompanyIdを引数に追加
    if (!accessTokenData || !accessTokenData.access_token) {
        console.error("❌ getPayrollStatements: アクセストークンが提供されていません。");
        throw new Error("アクセストークンが提供されていません。");
    }
    if (!companyId) {
        console.error("❌ getPayrollStatements: 会社IDが提供されていません。");
        throw new Error("会社IDが提供されていません。");
    }

    try {
        const apiBaseUrl = 'https://api.freee.co.jp/api/1'; // freeeのAPIベースURL
        const payrollStatementsEndpoint = `${apiBaseUrl}/payroll_statements`; // 給与明細のエンドポイント

        const config = {
            headers: {
                'Authorization': `Bearer ${accessTokenData.access_token}`, // ★accessTokenData.access_tokenを使用
                'Content-Type': 'application/json',
                'X-Api-Version': '2020-05-15' // 必要に応じてAPIバージョンを指定
            },
            params: {
                company_id: companyId, // ★companyIdを渡す
                year: year,
                month: month
            }
        };

        console.log("getPayrollStatements: freee APIリクエスト開始...");
        console.log("getPayrollStatements: リクエストURL:", payrollStatementsEndpoint);
        console.log("getPayrollStatements: リクエストパラメータ:", config.params);
        console.log("getPayrollStatements: リクエストヘッダー (Authorization以外):", { ...config.headers, 'Authorization': '[REDACTED]' });


        const response = await axios.get(payrollStatementsEndpoint, config);

        console.log("✅ getPayrollStatements: freee APIレスポンス受信。ステータス:", response.status);
        // console.log("✅ getPayrollStatements: freee APIレスポンスデータ:", JSON.stringify(response.data, null, 2));

        // freeeの給与明細APIのレスポンスは、通常 { "payroll_statements": [...] } の形式なので、
        // そのまま response.data を返すのが適切です。
        return response.data; // ★response.dataをそのまま返す

    } catch (error) {
        console.error("❌ getPayrollStatements: 給与明細取得エラー:", error.response?.data || error.message);
        if (error.response) {
            console.error("❌ getPayrollStatements: ステータスコード:", error.response.status);
            console.error("❌ getPayrollStatements: エラーデータ:", JSON.stringify(error.response.data, null, 2));
        }
        throw new Error("給与明細取得に失敗しました: " + (error.response?.data?.message || error.message));
    }
}

module.exports = getPayrollStatements; // 関数を直接エクスポート