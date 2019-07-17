module.exports = {
  get,
  add,
  updateDate
};

const Promise = require('promise');

function get(token) {
  return new Promise((resolve, reject) => {
    db.collection('tokens')
      .find({
        token
      })
      .limit(1)
      .toArray((err, result) => {
        if (err || !result.length) {
          return reject(err);
        }

        return resolve(result[0]);
      });
  });
}

function add(tokenData) {
  return new Promise((resolve, reject) => {
    db.collection('tokens')
      .insertOne(tokenData, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result.result);
      });
  });
}

function updateDate(token) {
  return new Promise((resolve, reject) => {
    db.collection('tokens')
      .updateOne(
        {
          token
        },
        {
          $set: {
            lastUpdate: new Date()
          }
        }, (err, result) => {
          if (err) { return reject(err); }

          return resolve(result);
        });
  });
}
