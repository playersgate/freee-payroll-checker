const express = require("express");
const { checkPayrollErrors } = require("./api/checkPayroll");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static("public"));

app.get("/check", async (req, res) => {
    const { year, month } = req.query;
    const errors = await checkPayrollErrors(year, month);

    res.json({ errors });
});

app.listen(PORT, () => {
    console.log(`🚀 サーバー起動: http://localhost:${PORT}`);
});