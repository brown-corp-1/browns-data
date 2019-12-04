module.exports = {
  add,
  addMany,
  get,
  getLastDistance,
  getRecord,
  getByData,
  getBalance,
  getUserBalancePerMonth,
  getUserBalancePerDay,
  getTree,
  update,
  remove,
  removeChildren
};

const Promise = require('promise');
const util = require('../helper/util');

const businessLookup = {
  from: 'businesses',
  localField: 'businessId',
  foreignField: '_id',
  as: 'business'
};

const fields = {
  _id: 1,
  owner: 1,
  admin: 1,
  type: 1,
  date: 1,
  creationDate: 1,
  lastUpdate: 1,
  value: 1,
  distance: 1,
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
          $project: fields
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
          $project: fields
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

function getLastDistance(businessId, date, creationDate) {
  return new Promise((resolve, reject) => {
    db.collection('transactions')
      .aggregate([
        {
          $sort: {
            date: -1,
            creationDate: -1
          }
        },
        {
          $match: {
            businessId,
            admin: true,
            active: true,
            distance: {
              $gt: 0
            },
            date: {
              $lte: new Date(date.getTime())
            }
          }
        },
        {
          $project: {
            distance: 1,
            date: 1
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

function getByData(userId, type, businessId, date, creationDate) {
  return new Promise((resolve, reject) => {
    db.collection('transactions')
      .aggregate([
        {
          $match: {
            userId,
            type,
            businessId,
            date,
            creationDate,
            active: true
          }
        },
        {
          $lookup: businessLookup
        },
        {
          $unwind: {path: '$business', preserveNullAndEmptyArrays: true}
        },
        {
          $project: fields
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
    transaction.normalizedDescription = _normalizedDescription(transaction);

    db.collection('transactions')
      .insertOne(transaction, (err, result) => {
        if (err) {
          return reject(err);
        }
        return resolve(result);
      });
  });
}

function remove(transactionIds) {
  transactionIds = util.parseToArray(transactionIds);

  const queryCondition = {
    $or: [
      {
        _id: {$in: transactionIds}
      },
      {
        parentId: {$in: transactionIds}
      }
    ]
  };

  return new Promise((resolve, reject) => {
    db.collection('transactions')
      .updateMany(
        queryCondition,
        {
          $set: {
            lastUpdate: new Date(),
            active: false
          }
        }, (err, result) => {
          if (err) {
            return reject(err);
          }

          return resolve(result);
        });
  });
}

function removeChildren(transactionIds) {
  transactionIds = util.parseToArray(transactionIds);

  const queryCondition = {
    $or: [
      {
        parentId: {$in: transactionIds}
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
        }, (err, result) => {
          if (err) {
            return reject(err);
          }

          return resolve(result);
        });
  });
}

function update(transaction) {
  return new Promise((resolve, reject) => {
    transaction.normalizedDescription = _normalizedDescription(transaction);

    db.collection('transactions')
      .replaceOne(
        {
          _id: transaction._id
        },
        transaction
        , (err, result) => {
          if (err) {
            return reject(err);
          }

          return resolve(result);
        });
  });
}

function getTree(transactionIds) {
  transactionIds = util.parseToArray(transactionIds);

  const queryCondition = {
    active: true,
    $or: [
      {
        _id: {$in: transactionIds}
      },
      {
        parentId: {$in: transactionIds}
      }
    ]
  };

  return new Promise((resolve, reject) => {
    // return transactions tree
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
}

function addMany(transactions) {
  return new Promise((resolve, reject) => {
    if (transactions && transactions.length) {
      transactions.map((transaction) => {
        transaction.normalizedDescription = _normalizedDescription(transaction);
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
    const userTimezoneOffset = startDate.getTimezoneOffset() * 60000;
    match.date = {$gte: new Date(startDate.getTime() - userTimezoneOffset)};
  }

  if (endDate) {
    const userTimezoneOffset = endDate.getTimezoneOffset() * 60000;
    match.date = match.date || {};
    match.date.$lte = new Date(endDate.getTime() - userTimezoneOffset + (1000 * 60 * 60 * 24) - 1);
  }

  if (description) {
    match.normalizedDescription = {$regex: util.removeAccents(description), $options: '$i'};
  }

  return match;
}

function _normalizedDescription(transaction) {
  return `${util.removeAccents(transaction.description || '')}|${transaction.distance}|${transaction.value}`;
}
