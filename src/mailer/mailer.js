module.exports = {
    sendBackup: sendBackup
};
// TODO: Move to mailer project
const nodemailer = require('nodemailer');
const config = require('../../config');

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth
});

function sendBackup(backup) {
    const date = new Date();

    _send('fabiandariomorenor@gmail.com', 'daily backup - ' + date.getFullYear() + ' - ' + (date.getMonth() + 1) + ' - ' +
        date.getDate(), null, null, backup);
}

function _send(to, subject, data, template, attachments) {
    return new Promise((resolve, reject) => {
        let mailOptions = {
            from: config.from,
            to: to,
            subject: subject
        };

        if (attachments && attachments.length) {
            mailOptions.attachments = attachments;
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return reject(error);
            }
            return resolve(info.messageId, info.response);
        });
    });
}
