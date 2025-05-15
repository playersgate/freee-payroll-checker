const axios = require("axios");
const getAccessToken = require("./getAccessToken");  // ✅ 修正: インポート方法を修正

async function getPayrollStatements(year, month) {
    try {
        const accessToken = await getAccessToken();  // ✅ 修正: 関数を適切に呼び出し
        console.log("✅ 取得したアクセストークン:", accessToken);

        const response = await axios.get(`https://api.freee.co.jp/hr/api/v1/payroll_statements?year=${year}&month=${month}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        return response.data.payroll_statements;
    } catch (error) {
        console.error("❌ 給与明細取得エラー:", error.response?.data || error.message);
        throw new Error("給与明細取得に失敗しました");
    }
}

// ✅ 修正: 関数を適切にエクスポート
module.exports = getPayrollStatements;