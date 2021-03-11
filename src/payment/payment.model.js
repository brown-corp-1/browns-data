module.exports = {
  addPlayStorePurchase,
  removePremium,
  getPlan
};

const Promise = require('promise');

function addPlayStorePurchase(userId, plan, playStorePurchase) {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .updateOne(
        {
          _id: userId
        },
        {
          $set: {
            plan,
            playStorePurchase
          },
          $addToSet: {
            plans: plan
          }
        },
        (err) => {
          if (err) {
            return reject(err);
          }

          return resolve(true);
        });
  });
}

function removePremium(userId) {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .updateOne(
        {
          _id: userId
        },
        {
          $unset: {
            plan: 1
          }
        },
        (err) => {
          if (err) {
            return reject(err);
          }

          return resolve(true);
        });
  });
}

function getPlan(userId) {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .find(
        {
          _id: userId
        },
        {
          projection: {
            _id: 1,
            plan: 1
          }
        })
      .limit(1)
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result[0].plan);
      });
  });
}
