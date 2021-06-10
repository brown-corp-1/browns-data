module.exports = {
  add,
  addNotification,
  find,
  findByBusinessId,
  findBusinessAlarms,
  getAlarmsInformation,
  remove,
  removeNotifications,
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
      name: alarm.name,
      value: alarm.value,
      startOdometer: alarm.startOdometer,
      odometerPeriod: alarm.odometerPeriod,
      isRecurring: alarm.isRecurring,
      nextOdometerNotification: alarm.nextOdometerNotification
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

function removeNotifications(alarm, value) {
  return new Promise((resolve, reject) => {
    db.collection('alarms')
      .updateOne(
        {
          _id: alarm._id,
          createdBy: alarm.createdBy,
          businessId: alarm.businessId
        },
        {
          $pull:
            {
              notifications: {
                value: {
                  $gte: value
                }
              }
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

function addNotification(alarm, notification) {
  return new Promise((resolve, reject) => {
    db.collection('alarms')
      .updateOne(
        {
          _id: alarm._id,
          createdBy: alarm.createdBy,
          businessId: alarm.businessId
        },
        {
          $addToSet: {
            notifications: notification
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

function findBusinessAlarms(businessId) {
  return new Promise((resolve, reject) => {
    let match = {
      active: true
    };

    if (businessId) {
      match._id = businessId;
    }

    db.collection('businesses')
      .aggregate(
        [
          {
            $match: match
          },
          {
            $lookup:
              {
                from: 'alarms',
                let: {businessId: '$_id'},
                pipeline: [
                  {
                    $match:
                      {
                        $expr:
                          {
                            $and:
                              [
                                {$eq: ['$businessId', '$$businessId']},
                                {$eq: ['$active', true]}
                              ]
                          }
                      }
                  }
                ],
                as: 'alarm'
              }
          },
          {
            $unwind: {path: '$alarm', preserveNullAndEmptyArrays: false}
          }
        ]
      )
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
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

function getAlarmsInformation(ids) {
  return new Promise((resolve, reject) => {
    db.collection('alarms')
      .find(
        {
          _id: {$in: ids}
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