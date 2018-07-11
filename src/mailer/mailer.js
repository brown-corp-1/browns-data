module.exports = {
    sendBackup: sendBackup
};
// TODO: Move to mailer project
const nodemailer = require('nodemailer');

function sendBackup(backup) {
    const date = new Date();

    _send(config.brownsData.email, 'daily backup - ' + date.getFullYear() + ' - ' + (date.getMonth() + 1) + ' - ' +
        date.getDate(), null, null, backup);
}

function _send(to, subject, data, template, attachments) {
    return new Promise((resolve, reject) => {
        let mailOptions = {
            from: config.messenger.from,
            to: to,
            subject: subject
        };

        if (attachments && attachments.length) {
            mailOptions.attachments = attachments;
        }

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: config.messenger.host,
            port: config.messenger.port,
            secure: true,
            auth: {
                user: config.messenger.auth.user,
                pass: config.messenger.auth.pass
            }
        });

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return reject(error);
            }
            return resolve(info.messageId, info.response);
        });
    });
}
