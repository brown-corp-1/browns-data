const MongoClient = require('mongodb').MongoClient;
const config = require('./config');

// @helpers
const logger = require('./src/helper/logger');
const util = require('./src/helper/util');
const job = require('./src/helper/job');
// @constants
const {typeOfTransaction} = require('./src/transaction/transaction.constant');
const {emailState} = require('./src/email/email.constant');
// @models
const businessModel = require('./src/business/business.model');
const emailModel = require('./src/email/email.model');
const transactionModel = require('./src/transaction/transaction.model');
const userModel = require('./src/user/user.model');
const groupModel = require('./src/group/group.model');

module.exports = {
    init,
    logger,
    util,
    typeOfTransaction,
    businessModel,
    transactionModel,
    userModel,
    emailModel,
    groupModel,
    emailState,
    job
};

function init(options) {
    let newConfig = config;

    if (options !== null && typeof options === 'object') {
        newConfig = Object.assign(config, options);
    }

    return new Promise((resolve, reject) => {
        MongoClient.connect(newConfig.db, (err, database) => {
            if (err) {
                return reject('Mongo: cannot connect: ', err);
            }

            global.db = database;

            if (newConfig.makeBackup) {
                job.init();
            }

            return resolve('Connected');
        });
    });
}
