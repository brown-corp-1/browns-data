module.exports = {
    init,
    makeBackup,
    restoreBackup
};

const fs = require('fs');
const mailer = require('../mailer/mailer');
const {cleanResetPasswordToken} = require('../user/user.model');
const util = require('./util');
const logger = require('./logger');
const backup = require('mongodb-backup');
const restore = require('mongodb-restore');

function init() {
    setInterval(() => {
        if (new Date().getHours() === 6) {
            makeBackup();
        }
    }, 3600000); // an hour

    setInterval(() => {
        cleanResetPasswordToken();
    }, 60000); // each 10 minutes remove reset password token
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
