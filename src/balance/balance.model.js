module.exports = {
  setBalances,
  getBalancePerBusiness,
  getBalancePerGroup,
  getBalancePerUser
};

const Promise = require('promise');

function getBalancePerUser(userIds, admin) {
  return new Promise((resolve, reject) => {
    db.collection('balances')
      .aggregate([
        {
          $sort: {lastUpdate: -1}
        },
        {
          $match: {
            userId: {$in: userIds},
            admin: admin
          }
        },
        {
          $group: {
            _id: {
              type: '$type',
              userId: '$userId'
            },
            lastUpdate: {$first: '$lastUpdate'},
            driverSaving: {
              $sum: '$driverSaving'
            },
            total: {
              $sum: '$total'
            }
          }
        },
        {
          $project: {
            _id: 0,
            userId: '$_id.userId',
            type: '$_id.type',
            lastUpdate: '$lastUpdate',
            savings: '$saving',
            total: '$total'
          }
        }
      ])
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function getBalancePerBusiness(businessIds, userIds, admin) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(businessIds)) {
      businessIds = [businessIds];
    }

    if (!Array.isArray(userIds)) {
      userIds = [userIds];
    }

    db.collection('balances')
      .aggregate([
        {
          $sort: {lastUpdate: -1}
        },
        {
          $match: {
            businessId: {$in: businessIds},
            userId: {$in: userIds},
            admin: admin
          }
        },
        {
          $group: {
            _id: {
              businessId: '$businessId',
              type: '$type',
              userId: '$userId'
            },
            lastUpdate: {$first: '$lastUpdate'},
            driverSaving: {
              $sum: '$driverSaving'
            },
            total: {
              $sum: '$total'
            }
          }
        },
        {
          $project: {
            _id: 0,
            userId: '$_id.userId',
            businessId: '$_id.businessId',
            type: '$_id.type',
            lastUpdate: '$lastUpdate',
            savings: '$saving',
            total: '$total'
          }
        }
      ])
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function getBalancePerGroup(groupId, userIds, admin) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(userIds)) {
      userIds = [userIds];
    }

    db.collection('balances')
      .aggregate([
        {
          $sort: {lastUpdate: -1}
        },
        {
          $match: {
            groupId: groupId,
            userId: {$in: userIds},
            admin: admin
          }
        },
        {
          $group: {
            _id: {
              groupId: '$groupId',
              type: '$type',
              userId: '$userId'
            },
            lastUpdate: {$first: '$lastUpdate'},
            driverSaving: {
              $sum: '$driverSaving'
            },
            total: {
              $sum: '$total'
            }
          }
        },
        {
          $project: {
            _id: 0,
            userId: '$_id.userId',
            type: '$_id.type',
            lastUpdate: '$lastUpdate',
            savings: '$saving',
            total: '$total'
          }
        }
      ])
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function setBalances(userIds, groupId) {
  return new Promise((resolve, reject) => {
    db.collection('transactions')
      .aggregate([
        {
          $project: {
            owner: 1,
            groupId: 1,
            businessId: 1,
            active: 1,
            activeGroup: 1,
            admin: 1,
            type: 1,
            date: 1,
            driverSaving: 1,
            value: 1
          }
        },
        {
          $sort: {date: -1}
        },
        {
          $match: {
            groupId,
            owner: {$in: userIds},
            active: true,
            activeGroup: true
          }
        },
        {
          $group: {
            _id: {
              type: '$type',
              owner: '$owner',
              groupId: '$groupId',
              businessId: '$businessId',
              admin: '$admin'
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
            groupId: '$_id.groupId',
            businessId: '$_id.businessId',
            admin: '$_id.admin',
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

        // elimina los actuales balances
        db.collection('balances')
          .removeMany({
            userId: {
              $in: userIds
            }
          }, (removeErr) => {
            if (removeErr) {
              return reject(removeErr);
            }

            if (result.length) {
              // insert new balances
              db.collection('balances')
                .insertMany(result, (err) => {
                  if (err) {
                    return reject(err);
                  }

                  return resolve(true);
                });
            } else {
              return resolve(true);
            }
          });
      });
  });
}
