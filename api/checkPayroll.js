const { getPayrollStatements } = require("./getPayrollStatements");

async function checkPayrollErrors(year, month) {
    const statements = await getPayrollStatements(year, month);
    const errors = [];

    statements.forEach(statement => {
        const employeeName = statement.employee_name;
        const deductions = statement.deductions;
        const deductionItems = ["立替経費（その他）", "立替経費（福利厚生費）", "立替経費（通信費）", "立替経費（交通費）"];

        deductionItems.forEach(item => {
            if (deductions[item] > 0) {
                errors.push({ employee: employeeName, item: item, amount: deductions[item] });
            }
        });
    });

    return errors;
}

module.exports = { checkPayrollErrors };