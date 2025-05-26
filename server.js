// server.js
require('dotenv').config(); // 必ず先頭に配置
const express = require("express");
const path = require("path");
const { setupAuthRoutes } = require("./api/getAccessToken"); // setupAuthRoutesをインポート
const { checkPayrollErrors } = require("./api/checkPayroll");

const app = express();
const PORT = process.env.PORT || 10000;

// 静的ファイルの配信 (public ディレクトリを想定)
app.use(express.static(path.join(__dirname, "public")));

// freee認証フローのルートをgetAccessToken.jsから登録
setupAuthRoutes(app); // Expressアプリインスタンスを渡す

// 給与明細チェックエンドポイント
app.get("/check", async (req, res) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({ errors: [{ message: "年と月を指定してください。" }] });
    }

    try {
        // checkPayrollErrors 関数はアクセストークンを内部で取得するようになったため、ここでは渡す必要がない
        const errors = await checkPayrollErrors(year, month);

        if (errors.length === 0) {
            res.json({ message: "エラーは見つかりませんでした。", errors: [] });
        } else {
            res.json({ message: "エラーが見つかりました。", errors: errors });
        }
    } catch (error) {
        console.error("❌ /check ルートでエラーが発生しました:", error.message);
        // エラーレスポンスの形式をフロントエンドに合わせる
        res.status(500).json({
            errors: [{ message: error.message || "予期せぬエラーが発生しました。" }]
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 サーバー起動: http://localhost:${PORT}`);
    console.log(`認証を開始するには、ブラウザで http://localhost:${PORT}/auth にアクセスしてください。`);
});