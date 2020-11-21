module.exports = {
  addPlayStorePurchase,
  removePremium
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
