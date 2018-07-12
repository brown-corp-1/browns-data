const MongoClient = require('mongodb').MongoClient;

// @helpers
const logger = require('./src/helper/logger');
const util = require('./src/helper/util');
const job = require('./src/helper/job');

// @constants
const {typeOfTransaction} = require('./src/transaction/transaction.constant');
const {emailState, emailType} = require('./src/email/email.constant');
const {groupConstants} = require('./src/group/group.constant');

// @models
const businessModel = require('./src/business/business.model');
const emailModel = require('./src/email/email.model');
const transactionModel = require('./src/transaction/transaction.model');
const userModel = require('./src/user/user.model');
const groupModel = require('./src/group/group.model');
const businessGroupModel = require('./src/business-group/business-group.model');

module.exports = {
    init,
    logger,
    util,
    typeOfTransaction,
    businessModel,
    transactionModel,
    userModel,
    emailModel,
    emailType,
    groupModel,
    businessGroupModel,
    emailState,
    groupConstants,
    job
};

function init(config) {
    global.config = config;

    return new Promise((resolve, reject) => {
        MongoClient.connect(config.brownsData.db, {useNewUrlParser: true }, (err, client) => {
            if (err) {
                return reject('Mongo: cannot connect: ', err);
            }

            global.db = client.db('cabsManager');

            if (config.brownsData.makeBackup) {
                job.init();
            }

            return resolve('Connected');
        });
    });
}
