const MongoClient = require('mongodb').MongoClient;
const config = require('./config');

// @helpers
const logger = require('./src/helper/logger');
const util = require('./src/helper/util');
const job = require('./src/helper/job');
// @constants
const {typeOfTransaction} = require('./src/transaction/transaction.constant');
// @ models
const cabModel = require('./src/cab/cab.model');
const transactionModel = require('./src/transaction/transaction.model');
const userModel = require('./src/user/user.model');

module.exports = {
    init,
    logger,
    util,
    typeOfTransaction,
    cabModel,
    transactionModel,
    userModel
};

function init(options) {
    let newConfig = config;

    if (options !== null && typeof options === 'object') {
        newConfig = Object.assign(config, options);
    }

    return new Promise((resolve, reject) => {
        MongoClient.connect(newConfig.db, (err, database) => {
            if (err) {
                return reject('Mongo: cannot connect', err);
            }

            global.db = database;
            job.init();

            return resolve('Connected');
        });
    });
}
