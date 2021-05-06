module.exports = {
  addMany,
  getUnsent,
  updateUnsent
};

const Promise = require('promise');
const mongo = require('mongodb');

function addMany(emails) {
  return new Promise((resolve, reject) => {
    db.collection('emails')
      .insertMany(emails, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
  });
}

function getUnsent() {
  return new Promise((resolve, reject) => {
    db.collection('emails')
      .find(
        {
          sent: false
        },
        {
          owner: 1,
          admin: 1,
          type: 1,
          emailType: 1,
          alarmId: 1,
          notification: 1,
          businessId: 1,
          date: 1,
          value: 1,
          driver: 1,
          description: 1,
          driverSaving: 1,
          lstImages: 1,
          target: 1,
          from: 1,
          balance: 1,
          state: 1,
          oldValue: 1,
          localBalance: 1,
          groupBalance: 1,
          culture: 1,
          currencyCode: 1,
          timeOffset: 1
        })
      .limit(500)
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function updateUnsent(id) {
  return new Promise((resolve, reject) => {
    db.collection('emails')
      .updateOne(
        {
          _id: new mongo.ObjectID(id)
        },
        {
          $set: {
            sent: true
          }
        },
        (err) => {
          if (err) {
            return reject(err);
          }
          resolve(true);
        }
      );
  });
}
