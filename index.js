const MongoClient = require('mongodb').MongoClient;

// @helpers
const logger = require('./src/helper/logger');
const util = require('./src/helper/util');
const job = require('./src/helper/job');

// @constants
const businessConstants = require('./src/business/business.constant');
const {typeOfTransaction} = require('./src/transaction/transaction.constant');
const {emailState, emailType} = require('./src/email/email.constant');
const {groupConstants} = require('./src/group/group.constant');
const userConstants = require('./src/user/user.constant');
const paymentConstants = require('./src/payment/payment.constant');

// @models
const balanceModel = require('./src/balance/balance.model');
const tokenModel = require('./src/token/token.model');
const businessModel = require('./src/business/business.model');
const documentModel = require('./src/document/document.model');
const emailModel = require('./src/email/email.model');
const transactionModel = require('./src/transaction/transaction.model');
const userModel = require('./src/user/user.model');
const groupModel = require('./src/group/group.model');
const businessGroupModel = require('./src/business-group/business-group.model');
const permissionModel = require('./src/permission/permission.model');
const paymentModel = require('./src/payment/payment.model');

module.exports = {
  init,
  logger,
  util,
  typeOfTransaction,
  tokenModel,
  balanceModel,
  documentModel,
  businessConstants,
  paymentConstants,
  userConstants,
  businessModel,
  transactionModel,
  userModel,
  emailModel,
  emailType,
  groupModel,
  businessGroupModel,
  emailState,
  groupConstants,
  permissionModel,
  paymentModel,
  job
};

function init(config) {
  global.config = config;

  return new Promise((resolve, reject) => {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      poolSize: 10
    };

    MongoClient.connect(config.brownsData.db, options, (err, client) => {
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
