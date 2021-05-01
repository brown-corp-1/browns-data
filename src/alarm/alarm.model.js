module.exports = {
  add,
  find,
  findByBusinessId,
  remove,
  update
};

const Promise = require('promise');

function add(alarm) {
  return new Promise((resolve, reject) => {
    db.collection('alarms')
      .insertOne(
        alarm,
        (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result.insertedId);
        });
  });
}

function update(alarm) {
  return new Promise((resolve, reject) => {
    const newAlarm = {
      name: document.name,
      pages: document.pages,
      lastUpdate: document.lastUpdate,
      active: document.active
    };

    db.collection('alarms')
      .updateOne(
        {
          _id: alarm._id,
          createdBy: alarm.createdBy,
          businessId: alarm.businessId
        },
        {
          $set: newAlarm
        },
        (err) => {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
  });
}

function remove(alarm) {
  return new Promise((resolve, reject) => {
    db.collection('alarms')
      .updateOne(
        {
          _id: alarm._id,
          createdBy: alarm.createdBy,
          businessId: alarm.businessId
        },
        {
          $set: {
            active: false
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

function find(userId) {
  return new Promise((resolve, reject) => {
    db.collection('alarms')
      .find(
        {
          createdBy: userId,
          active: true
        }
      )
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function findByBusinessId(businessId) {
  return new Promise((resolve, reject) => {
    db.collection('alarms')
      .find(
        {
          businessId,
          active: true
        }
      )
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}
