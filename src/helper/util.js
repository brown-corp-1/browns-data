module.exports = {
    createFolder,
    arrrayBalanceToObject
};

const fs = require('fs');
const {typeOfTransaction} = require('../transaction/transaction.constant');

function createFolder(folder) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
}

function arrrayBalanceToObject(balanceArray) {
    const deposits = balanceArray.find((balance) => balance.type === typeOfTransaction.QUOTA) || {};
    const expenses = balanceArray.find((balance) => balance.type === typeOfTransaction.EXPENSE) || {};
    const cashOut = balanceArray.find((balance) => balance.type === typeOfTransaction.CASH_OUT) || {};
    const cashIn = balanceArray.find((balance) => balance.type === typeOfTransaction.CASH_IN) || {};
    let balance = {
        deposits: deposits && deposits.total ? deposits.total : 0,
        expenses: expenses && expenses.total ? expenses.total : 0,
        cashOut: cashOut && cashOut.total ? cashOut.total : 0,
        cashIn: cashIn && cashIn.total ? cashIn.total : 0,
        savings: deposits && deposits.savings ? deposits.savings : 0,
        lastUpdate: new Date(Math.max(deposits.lastUpdate || 0, expenses.lastUpdate || 0, cashOut.lastUpdate || 0, cashIn.lastUpdate || 0))
    };
    balance.total = balance.deposits + balance.cashIn + balance.savings - balance.cashOut - balance.expenses;
}