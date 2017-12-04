module.exports = {
    sendBackup: sendBackup
};
//TODO: Move to mailer project
const nodemailer = require('nodemailer');
const fs = require('fs');
const config = require('../../config');

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // secure:true for port 465, secure:false for port 587
    auth: {
        user: 'brown.corp.contact@gmail.com',
        pass: '10Million$'
    }
});

function sendBackup(backup) {
    const date = new Date();

    _send('fabiandariomorenor@gmail.com', 'daily backup - ' + date.getFullYear() + ' - ' + (date.getMonth() + 1) + ' - ' +
        date.getDate(), null, null, backup);
}

function _send(to, subject, data, template, attachments) {
    return new Promise((resolve, reject) => {
        let mailOptions = {
            from: '"Brown Corp" <brown.corp.contact@gmail.com>',
            to: to,
            subject: subject
        };

        if (attachments && attachments.length) {
            mailOptions.attachments = attachments;
        }

        if (!config.debug) {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return reject(error);
                }
                return resolve(info.messageId, info.response);
            });
        }
    });
}
