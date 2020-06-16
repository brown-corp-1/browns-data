module.exports = {
  addPlayStorePayment
};

const Promise = require('promise');

function addPlayStorePayment(userId, plan, playStorePurchase) {
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
