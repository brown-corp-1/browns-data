module.exports = {
    createFolder,
    arrrayBalanceToObject,
    balancesToUsers
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

    return balance;
}

function balancesToUsers(userIds, result) {
    let balances = {};

    userIds.forEach((userId) => {
        const userBalances = result.filter((balance) => balance.userId === userId);

        if (userBalances && userBalances.length) {
            const deposits = userBalances.find((balance) => balance.type === typeOfTransaction.QUOTA) || {};
            const expenses = userBalances.find((balance) => balance.type === typeOfTransaction.EXPENSE) || {};
            const cashOut = userBalances.find((balance) => balance.type === typeOfTransaction.CASH_OUT) || {};
            const cashIn = userBalances.find((balance) => balance.type === typeOfTransaction.CASH_IN) || {};
            let userBalance = {
                deposits: deposits && deposits.total ? deposits.total : 0,
                expenses: expenses && expenses.total ? expenses.total : 0,
                cashOut: cashOut && cashOut.total ? cashOut.total : 0,
                cashIn: cashIn && cashIn.total ? cashIn.total : 0,
                savings: deposits && deposits.savings ? deposits.savings : 0,
                lastUpdate: new Date(Math.max(deposits.lastUpdate || 0, expenses.lastUpdate || 0, cashOut.lastUpdate || 0, cashIn.lastUpdate || 0))
            };

            userBalance.total = userBalance.deposits + userBalance.cashIn + userBalance.savings -
                userBalance.cashOut - userBalance.expenses;

            balances[userId] = userBalance;
        } else {
            balances[userId] = {
                deposits: 0,
                expenses: 0,
                cashOut: 0,
                cashIn: 0,
                savings: 0,
                total: 0,
                lastUpdate: new Date()
            };
        }
    });

    return balances;
}
