module.exports = {
  get,
  add,
  remove,
  addMany,
  getRecord,
  getBalance,
  getUserBalancePerMonth,
  getUserBalancePerDay
};

const Promise = require('promise');
const util = require('../helper/util');

const businessLookup = {
  from: 'businesses',
  localField: 'businessId',
  foreignField: '_id',
  as: 'business'
};

function get(businessId, userId, admin, pageNumber, pageSize, transactionTypes, startDate, endDate, description) {
  return new Promise((resolve, reject) => {
    db.collection('transactions')
      .aggregate([
        {
          $match: _getFilters(businessId, userId, admin, transactionTypes, startDate, endDate, description)
        },
        {
          $unwind: {path: '$business', preserveNullAndEmptyArrays: true}
        },
        {
          $sort: {date: -1, creationDate: -1}
        },
        {
          $project: {
            type: 1,
            date: 1,
            value: 1,
            description: 1,
            driverSaving: 1,
            business: {
              _id: '$business._id',
              name: '$business.name'
            },
            driver: 1,
            target: 1,
            from: 1
          }
        }
      ])
      .skip(pageSize * (pageNumber - 1))
      .limit(pageSize)
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function getRecord(transactionId) {
  return new Promise((resolve, reject) => {
    db.collection('transactions')
      .aggregate([
        {
          $match: {
            _id: transactionId
          }
        },
        {
          $lookup: businessLookup
        },
        {
          $unwind: {path: '$business', preserveNullAndEmptyArrays: true}
        },
        {
          $project: {
            _id: 1,
            owner: 1,
            admin: 1,
            type: 1,
            date: 1,
            value: 1,
            parentId: 1,
            lstImages: 1,
            description: 1,
            driverSaving: 1,
            business: {
              _id: '$business._id',
              name: '$business.name'
            },
            groupId: 1,
            driver: 1,
            target: 1,
            from: 1,
            active: 1
          }
        }
      ])
      .limit(1)
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result[0]);
      });
  });
}

function add(transaction) {
  return new Promise((resolve, reject) => {
    transaction.normalizedDescription = util.removeAccents(transaction.description || '');

    db.collection('transactions')
      .insertOne(transaction, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
  });
}

function remove(transactionId) {
  const queryCondition = {
    $or: [
      {
        _id: transactionId
      },
      {
        parentId: transactionId
      }
    ]
  };

  return new Promise((resolve, reject) => {
    db.collection('transactions')
      .updateMany(
        queryCondition,
        {
          $set: {
            active: false
          }
        }, (err) => {
          if (err) {
            return reject(err);
          }

          // return deleted transactions
          db.collection('transactions')
            .find(
              queryCondition,
              {
                projection: {
                  userId: 1,
                  owner: 1,
                  admin: 1,
                  type: 1,
                  businessId: 1,
                  groupId: 1,
                  date: 1,
                  value: 1,
                  driver: 1,
                  description: 1,
                  driverSaving: 1,
                  lstImages: 1,
                  target: 1,
                  from: 1
                }
              })
            .toArray((findErr, result) => {
              if (findErr) {
                return reject(findErr);
              }

              return resolve(result);
            });
        });
  });
}

function addMany(transactions) {
  return new Promise((resolve, reject) => {
    if (transactions && transactions.length) {
      transactions.map((transaction) => {
        transaction.normalizedDescription = util.removeAccents(transaction.description);
      });

      db.collection('transactions')
        .insertMany(transactions, (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
    } else {
      return resolve({ok: 1, ops: []});
    }
  });
}

function getBalance(businessId, userId, admin, transactionTypes, startDate, endDate, description) {
  return new Promise((resolve, reject) => {
    db.collection('transactions')
      .aggregate([
        {
          $sort: {date: -1}
        },
        {
          $match: _getFilters(businessId, userId, admin, transactionTypes, startDate, endDate, description)
        },
        {
          $group: {
            _id: {
              businessId: '$businessId',
              type: '$type',
              owner: '$owner'
            },
            lastUpdate: {$first: '$date'},
            driverSaving: {
              $sum: '$driverSaving'
            },
            total: {
              $sum: '$value'
            }
          }
        },
        {
          $project: {
            _id: 0,
            userId: '$_id.owner',
            type: '$_id.type',
            lastUpdate: '$lastUpdate',
            savings: '$driverSaving',
            total: '$total'
          }
        }
      ])
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(util.arrayBalanceToObject(result));
      });
  });
}

function getUserBalancePerMonth(businessId, userId, admin) {
  return new Promise((resolve, reject) => {
    db.collection('transactions')
      .aggregate([
        {
          $match: {
            businessId,
            owner: userId,
            admin,
            active: true
          }
        },
        {
          $group: {
            _id: {
              type: '$type',
              month: {
                $month: '$date'
              },
              year: {
                $year: '$date'
              }
            },
            driverSaving: {
              $sum: '$driverSaving'
            },
            total: {
              $sum: '$value'
            }
          }
        },
        {
          $project: {
            _id: 0,
            type: '$_id.type',
            month: '$_id.month',
            year: '$_id.year',
            savings: '$driverSaving',
            total: '$total'
          }
        }
      ])
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(util.consolidateMontlyBalances(result));
      });
  });
}

function getUserBalancePerDay(businessId, userId, admin) {
  return new Promise((resolve, reject) => {
    db.collection('transactions')
      .aggregate([
        {
          $match: {
            businessId,
            owner: userId,
            admin,
            active: true
          }
        },
        {
          $group: {
            _id: {
              type: '$type',
              month: {
                $month: '$date'
              },
              year: {
                $year: '$date'
              },
              day: {
                $dayOfMonth: '$date'
              }
            },
            driverSaving: {
              $sum: '$driverSaving'
            },
            total: {
              $sum: '$value'
            }
          }
        },
        {
          $project: {
            _id: 0,
            type: '$_id.type',
            day: '$_id.day',
            month: '$_id.month',
            year: '$_id.year',
            savings: '$driverSaving',
            total: '$total'
          }
        }
      ])
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(util.consolidateDailyBalances(result));
      });
  });
}

function _getFilters(businessId, userId, admin, transactionTypes, startDate, endDate, description) {
  let match = {
    businessId,
    owner: userId,
    admin,
    active: true
  };

  if (transactionTypes && transactionTypes.length) {
    match.type = {$in: transactionTypes};
  }

  if (startDate) {
    match.date = {$gte: startDate};
  }

  if (endDate) {
    match.date = match.date || {};
    match.date.$lte = new Date(endDate.getTime() + 1000 * 59 * 59 * 23);
  }

  if (description) {
    match.normalizedDescription = {$regex: util.removeAccents(description), $options: '$i'};
  }

  return match;
}
