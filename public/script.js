function checkPayroll() {
    const year = document.getElementById("year").value;
    const month = document.getElementById("month").value;
    const status = document.getElementById("status");
    const errorList = document.getElementById("errorList");
    const errorItems = document.getElementById("errorItems");

    // ✅ 実行中ステータスを表示
    status.textContent = "🔄 実行中...";
    status.style.display = "block";

    fetch(`/check?year=${year}&month=${month}`)
        .then(response => response.json())
        .then(data => {
            errorItems.innerHTML = ""; // 一度クリア

            if (data.errors.length > 0) {
                data.errors.forEach(error => {
                    const li = document.createElement("li");
                    li.textContent = `${error.employee} - ${error.item}: ${error.amount}`;
                    errorItems.appendChild(li);
                });

                errorList.style.display = "block";
            } else {
                errorList.style.display = "none";
                alert("✅ 給与明細データは正常です！");
            }

            // ✅ チェック終了ステータスを表示
            status.textContent = "✅ チェック終了";
        })
        .catch(error => {
            console.error("チェックエラー:", error);
            status.textContent = "❌ エラー発生";
        });
}