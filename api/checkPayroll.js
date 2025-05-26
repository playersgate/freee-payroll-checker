// api/checkPayroll.js
const getPayrollStatements = require("./getPayrollStatements");

async function checkPayrollErrors(year, month) {
    try {
        const statements = await getPayrollStatements(year, month);
        console.log("✅ checkPayroll: 給与明細データ取得成功:", statements);
        
        const errors = [];
        // ここに給与明細データのチェックロジックを実装
        // 例: 仮のチェックロジック - `statement.total_salary` が0以下の場合をエラーとする
        if (statements && Array.isArray(statements)) {
            statements.forEach(statement => {
                const employeeName = statement.employee_name || `従業員ID: ${statement.id}`;
                if (statement.total_salary !== undefined && statement.total_salary <= 0) {
                    errors.push({
                        employee: employeeName,
                        item: "合計支給金額",
                        amount: statement.total_salary,
                        message: "合計支給金額が0以下です。"
                    });
                }
                // その他、給与明細の項目に応じたチェックを追加
                // 例: 交通費が過剰、控除額が異常など
            });
        }

        return errors;
    } catch (error) {
        console.error("❌ checkPayroll: 給与明細チェックエラー:", error.message);
        throw new Error("給与明細チェックに失敗しました");
    }
}

module.exports = { checkPayrollErrors };