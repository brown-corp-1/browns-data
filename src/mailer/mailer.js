module.exports = {
    sendBackup: sendBackup
};
// TODO: Move to mailer project
const nodemailer = require('nodemailer');
const config = require('../../config');

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

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 465,
            secure: true,
            auth: {
                user: 'apikey',
                pass: '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'
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
