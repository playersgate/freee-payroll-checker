payroll-checker/
│── .env                  # API認証情報（Client ID & Secret）
│── server.js             # Expressサーバー（API処理）
│── api/
│   ├── getAccessToken.js      # アクセストークン取得
│   ├── getPayrollStatements.js  # 給与明細データ取得
│   ├── checkPayroll.js        # エラーチェック（立替経費の誤入力検出）
│── public/
│   ├── index.html        # フロントエンド（TeamsのWebsiteタブ用UI）
│   ├── style.css         # スタイル
│   ├── script.js         # フロントロジック（カレンダー選択 & API連携）