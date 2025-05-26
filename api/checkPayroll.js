// api/checkPayroll.js - 修正版
require('dotenv').config(); // ★追加: 環境変数を読み込むため
const { getCachedAccessToken } = require("./getAccessToken"); // ★修正: getAccessTokenからgetCachedAccessTokenをインポート
const getPayrollStatements = require("./getPayrollStatements"); // getPayrollStatementsは以前からインポート

const COMPANY_ID = process.env.FREEE_COMPANY_ID; // freee開発者サイトで連携した会社のID

// ★関数名をcheckPayrollErrorsからcheckPayrollに変更
async function checkPayroll(year, month) {
    if (!COMPANY_ID) {
        throw new Error("会社IDが設定されていません。環境変数 FREEE_COMPANY_ID を設定してください。");
    }
    
    try {
        // ★アクセストークンをデータベースから取得
        const accessTokenData = await getCachedAccessToken();
        if (!accessTokenData || !accessTokenData.access_token) {
            console.error("❌ checkPayroll: アクセストークンが利用できません。freee認証を行ってください。");
            throw new Error("アクセストークンが利用できません。まずfreee認証を行ってください。");
        }

        // ★getPayrollStatements に accessTokenData と COMPANY_ID を渡す
        // getPayrollStatementsの定義は getPayrollStatements.js にあるため、
        // その関数がこれらの引数を受け取るように変更されていることを前提とします。
        // もし getPayrollStatements がまだ accessTokenData と companyId を受け取っていない場合は、
        // そちらも修正が必要です。
        const statements = await getPayrollStatements(accessTokenData, COMPANY_ID, year, month);
        console.log("✅ checkPayroll: freee APIから給与明細データ取得成功:", statements);
        
        const errors = [];
        // ここに給与明細データのチェックロジックを実装
        // freeeのAPIレスポンスの 'payroll_statements' 配列にデータがあるか確認
        if (statements && Array.isArray(statements.payroll_statements)) { // ★修正: .payroll_statements にアクセス
            statements.payroll_statements.forEach(statement => { // ★修正: .payroll_statements にアクセス
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
            });
        } else {
            console.warn("checkPayroll: freee APIからの給与明細データが期待される形式ではありません:", statements);
            errors.push({ employee: "APIレスポンス", item: "形式", amount: "不正" });
        }

        return errors;
    } catch (error) {
        console.error("❌ checkPayroll: 給与明細チェックエラー:", error.message);
        // エラーメッセージをより詳細にする
        throw new Error("給与明細チェックに失敗しました: " + (error.message || "不明なエラー"));
    }
}

// ★module.exports も関数名に合わせて修正
module.exports = { checkPayroll };