const getPayrollStatements = require("./getPayrollStatements");

async function checkPayrollErrors(year, month) {
    try {
        const statements = await getPayrollStatements(year, month);  // ✅ 修正: 関数を適切に呼び出す
        console.log("✅ 給与明細データ取得成功:", statements);
        return statements;
    } catch (error) {
        console.error("❌ 給与明細チェックエラー:", error.message);
        throw new Error("給与明細チェックに失敗しました");
    }
}

module.exports = { checkPayrollErrors };