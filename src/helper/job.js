module.exports = {
  init,
  makeBackup,
  makeBackupNew,
  restoreBackup,
  restoreBackupNew
};

const fs = require('fs');
const mailer = require('../mailer/mailer');
const {cleanResetPasswordToken} = require('../user/user.model');
const util = require('./util');
const logger = require('./logger');
const backup = require('mongodb-backup');
const restore = require('mongodb-restore');
const sys = require('sys');
const exec = require('child_process').exec;

function init() {
  createIndexes();

  setInterval(() => {
    if (new Date().getHours() === 6 || new Date().getHours() === 12 || new Date().getHours() === 22) {
      makeBackupNew();
    }
  }, 3600000); // an hour

  setInterval(() => {
    cleanResetPasswordToken();
  }, 60000); // each 10 minutes remove reset password token
}

function createIndexes() {
  try {
    logger.info('creating indexes');
    db.collection('businessGroups').createIndex({userId: 1});
    db.collection('businessGroups').createIndex({groupId: 1});
    db.collection('businessGroups').createIndex({managedIds: 1});
    db.collection('businessGroups').createIndex({businessIds: 1});
    db.collection('businessGroups').createIndex({active: 1});
    db.collection('businessGroups').createIndex({drivenIds: 1});
    db.collection('documents').createIndex({businessId: 1});
    db.collection('balances').createIndex({userId: 1});
    db.collection('balances').createIndex({owner: 1});
    db.collection('balances').createIndex({businessId: 1});
    db.collection('balances').createIndex({type: 1});
    db.collection('transactions').createIndex({normalizedDescription: 1});
    db.collection('transactions').createIndex({owner: 1});
    db.collection('transactions').createIndex({userId: 1});
    db.collection('transactions').createIndex({parentId: 1});
    db.collection('transactions').createIndex({businessId: 1});
    db.collection('transactions').createIndex({type: 1});
    db.collection('transactions').createIndex({date: -1});
    db.collection('transactions').createIndex({driver: 1});
    db.collection('transactions').createIndex({admin: 1});
    db.collection('transactions').createIndex({active: 1});
    db.collection('transactions').createIndex({userId: 1, owner: 1});
    db.collection('transactions').createIndex({userId: 1, businessId: 1, admin: 1, active: 1, activeGroup: 1});
    db.collection('transactions').createIndex({type: 1, userId: 1, owner: 1, businessId: 1});
    db.collection('users').createIndex({email: 1});
    db.collection('users').createIndex({phone: 1});
    db.collection('tokens').createIndex({token: 1});
    db.collection('tokens').createIndex({userId: 1});
    db.collection('emails').createIndex({sent: 1});
    db.collection('alarms').createIndex({createdBy: 1, active: 1});
    db.collection('alarms').createIndex({businessId: 1});
  } catch (e) {
    logger.info('error creating indexes', e);
  }
}

function makeBackupNew(skipEmail, callback) {
  logger.info('making backup');

  const now = new Date();
  const monthFolder = 'backups/' + now.getFullYear() + '/' + (now.getMonth() + 1) + '/';
  const backupName = _getDateFolder(now);
  const dateFolder = monthFolder + backupName;
  const filename = backupName + '.7z';
  const runMongodump = 'mongodump ' + _getConnectionString() + ' -o ' + dateFolder;
  const runZip = '"' + config.brownsData.zipExec + '" a ' + filename + ' ' + config.brownsData.database;

  try {
    logger.info('Running mongodump');

    exec(runMongodump, {cwd: config.brownsData.mongoFolder}, () => {
      logger.info('Backup was generated on ' + config.brownsData.mongoFolder + dateFolder);
      logger.info('Running zip');

      exec(runZip, {cwd: config.brownsData.mongoFolder + dateFolder}, () => {
        logger.info('Zip was done');

        if (!skipEmail) {
          logger.info('Sending email');
          const file = fs.readFileSync(config.brownsData.mongoFolder + dateFolder + '/' + filename);

          if (!skipEmail) {
            mailer.sendBackup([{
              filename: 'backup.bk',
              content: file
            }]);
          }
        }

        logger.info('backup ends');

        if (callback) {
          callback();
        }
      });
    });
  } catch (ex) {
    logger.info(ex);
  }
}

function restoreBackupNew(filename, callback) {
  logger.info('restore backup');

  const dateFolder = 'restore/' + _getDateFolder(new Date());
  const runZip = '"' + config.brownsData.zipExec + '" x "' + filename + '" -o"' + config.brownsData.mongoFolder + dateFolder + '"';
  const runRestore = 'mongorestore ' + _getConnectionString() + ' ' + dateFolder + '/' + config.brownsData.database;

  logger.info('unzipping ', filename, config.brownsData.mongoFolder + '/' + dateFolder);

  if (fs.existsSync(filename)) {
    exec(runZip, () => {
      // make a backup before restore
      makeBackupNew(true, () => {
        logger.info('dropping database');
        db.dropDatabase(() => {
          logger.info('restoring');
          exec(runRestore, {cwd: config.brownsData.mongoFolder}, () => {
            logger.info('restore was done');

            if (callback) {
              callback();
            }
          });
        });
      });
    });
  } else {
    logger.info('file ' + filename + ' doesnt exist');
  }
}

function makeBackup() {
  logger.info('making backup');

  const now = new Date();
  const yearFolder = config.brownsData.backupFolder + '/' + now.getFullYear();
  const monthFolder = yearFolder + '/' + (now.getMonth() + 1) + '/';
  const filename = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + '_' + now.getHours() + '-' + now.getMinutes() + '.bk';

  try {
    util.createFolder(config.brownsData.backupFolder);
    util.createFolder(yearFolder);
    util.createFolder(monthFolder);

    logger.info('generating file ' + filename);

    backup({
      uri: config.brownsData.db,
      root: monthFolder,
      tar: filename,
      callback: () => {
        logger.info('backup file: ', monthFolder + filename);
        const file = fs.readFileSync(monthFolder + '/' + filename);

        mailer.sendBackup([{
          filename: 'backup.bk',
          content: file
        }]);
      }
    });
  } catch (ex) {
    logger.info(ex);
  }
}

function restoreBackup(dir, filename, callback) {
  logger.info('restore backup - BROWN');
  const root = config.brownsData.backupFolder + '/' + dir;

  restore({
    uri: config.brownsData.db,
    root: root,
    tar: filename,
    drop: true,
    callback: (msg) => {
      logger.info('Restore status', msg);

      if (callback) {
        callback();
      }
    }
  });
}

function _getConnectionString() {
  return '--host ' + config.brownsData.host +
    ' --db ' + config.brownsData.database +
    ' --port ' + config.brownsData.port +
    ' -u ' + config.brownsData.user +
    ' -p ' + config.brownsData.pass +
    ' --authenticationDatabase ' + config.brownsData.adminDatabase;
}

function _getDateFolder(now) {
  return now.getFullYear() + '-' +
    (now.getMonth() + 1) + '-' +
    now.getDate() + '_' +
    now.getHours() + '-' +
    now.getMinutes() + '-' +
    now.getSeconds();
}
