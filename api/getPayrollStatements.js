const axios = require("axios");
const { getAccessToken } = require("./getAccessToken");

async function getPayrollStatements(year, month) {
    const accessToken = await getAccessToken();

    const response = await axios.get(`https://api.freee.co.jp/hr/api/v1/payroll_statements?year=${year}&month=${month}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    return response.data.payroll_statements;
}

module.exports = { getPayrollStatements };