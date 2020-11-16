module.exports = {
  setBalances,
  setBalancesV2,
  getBalanceMinePerBusiness,
  getBalanceHaveToOthersPerBusiness,
  getBalanceOthersHavePerBusiness,
  getBalancePerBusiness,
  getBalancePerGroup,
  getGroupBalancePerUser,
  getBalancePerUser,
  getBalanceMinePerUser,
  getBalanceHaveToOthersPerUser,
  getBalanceOthersHavePerUser,
  getBalanceMinePerUserBusiness,
  getBalanceHaveToOthersPerUserBusiness,
  getBalanceOthersHavePerUserBusiness,
  getTypeFilter,
  getTypeFilterV2
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
              $sum: '$savings'
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
            savings: '$driverSaving',
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

function getBalanceMinePerUser(userIds) {
  return new Promise((resolve, reject) => {
    db.collection('balances')
      .aggregate([
        {
          $sort: {lastUpdate: -1}
        },
        {
          $match: {
            userId: {$in: userIds},
            owner: {$in: userIds}
          }
        },
        {
          $addFields: {
            isMine: {$eq: ['$userId', '$owner']}
          }
        },
        {
          $match:
            {
              isMine: true
            }
        },
        {
          $group: {
            _id: {
              type: '$type',
              userId: '$userId',
              owner: '$owner'
            },
            lastUpdate: {$first: '$lastUpdate'},
            driverSaving: {
              $sum: '$savings'
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
            owner: '$_id.owner',
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

        return resolve(result);
      });
  });
}

function getBalanceHaveToOthersPerUser(userIds) {
  return new Promise((resolve, reject) => {
    db.collection('balances')
      .aggregate([
        {
          $sort: {lastUpdate: -1}
        },
        {
          $match: {
            userId: {$in: userIds}
          }
        },
        {
          $addFields: {
            isHaveToOthers: {$ne: ['$userId', '$owner']}
          }
        },
        {
          $match:
            {
              isHaveToOthers: true
            }
        },
        {
          $group: {
            _id: {
              type: '$type',
              userId: '$userId',
              owner: '$owner'
            },
            lastUpdate: {$first: '$lastUpdate'},
            driverSaving: {
              $sum: '$savings'
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
            owner: '$_id.owner',
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

        return resolve(result);
      });
  });
}

function getBalanceOthersHavePerUser(userIds) {
  return new Promise((resolve, reject) => {
    db.collection('balances')
      .aggregate([
        {
          $sort: {lastUpdate: -1}
        },
        {
          $match: {
            owner: {$in: userIds}
          }
        },
        {
          $addFields: {
            isOthersHave: {$ne: ['$userId', '$owner']}
          }
        },
        {
          $match:
            {
              isOthersHave: true
            }
        },
        {
          $group: {
            _id: {
              type: '$type',
              userId: '$userId',
              owner: '$owner'
            },
            lastUpdate: {$first: '$lastUpdate'},
            driverSaving: {
              $sum: '$savings'
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
            owner: '$_id.owner',
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

        return resolve(result);
      });
  });
}

function getBalanceMinePerBusiness(businessIds, userIds) {
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
            owner: {$in: userIds}
          }
        },
        {
          $addFields: {
            isMine: {$eq: ['$userId', '$owner']}
          }
        },
        {
          $match:
            {
              isMine: true
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
              $sum: '$savings'
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
            savings: '$driverSaving',
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

function getBalanceMinePerUserBusiness(userId, userIds) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(userIds)) {
      userIds = [userIds];
    }

    const ids = userIds.map((user) => user._id);

    db.collection('balances')
      .aggregate([
        {
          $sort: {lastUpdate: -1}
        },
        {
          $match: {
            userId,
            owner: {$in: ids}
          }
        },
        {
          $addFields: {
            isMine: {$eq: ['$userId', '$owner']}
          }
        },
        {
          $match: {
            isMine: true
          }
        },
        {
          $group: {
            _id: {
              businessId: '$businessId',
              type: '$type',
              userId: '$owner'
            },
            lastUpdate: {$first: '$lastUpdate'},
            driverSaving: {
              $sum: '$savings'
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
            savings: '$driverSaving',
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

function getBalanceHaveToOthersPerBusiness(businessIds, userIds) {
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
            userId: {$in: userIds}
          }
        },
        {
          $addFields: {
            isHaveToOthers: {$ne: ['$userId', '$owner']}
          }
        },
        {
          $match: {
            isHaveToOthers: true
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
              $sum: '$savings'
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
            savings: '$driverSaving',
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

function getBalanceHaveToOthersPerUserBusiness(userId, userIds) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(userIds)) {
      userIds = [userIds];
    }

    const ids = userIds.map((user) => user._id);

    db.collection('balances')
      .aggregate([
        {
          $sort: {lastUpdate: -1}
        },
        {
          $match: {
            userId,
            owner: {$in: ids}
          }
        },
        {
          $addFields: {
            isHaveToOthers: {$ne: ['$userId', '$owner']}
          }
        },
        {
          $match: {
            isHaveToOthers: true
          }
        },
        {
          $group: {
            _id: {
              businessId: '$businessId',
              type: '$type',
              userId: '$owner'
            },
            lastUpdate: {$first: '$lastUpdate'},
            driverSaving: {
              $sum: '$savings'
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
            savings: '$driverSaving',
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

function getBalanceOthersHavePerBusiness(businessIds, userIds) {
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
            owner: {$in: userIds}
          }
        },
        {
          $addFields: {
            isOthersHave: {$ne: ['$userId', '$owner']}
          }
        },
        {
          $match:
            {
              isOthersHave: true
            }
        },
        {
          $group: {
            _id: {
              businessId: '$businessId',
              type: '$type',
              userId: '$owner'
            },
            lastUpdate: {$first: '$lastUpdate'},
            driverSaving: {
              $sum: '$savings'
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
            owner: '$_id.owner',
            businessId: '$_id.businessId',
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

        return resolve(result);
      });
  });
}

function getBalanceOthersHavePerUserBusiness(userId, userIds) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(userIds)) {
      userIds = [userIds];
    }

    const ids = userIds.map((user) => user._id);

    db.collection('balances')
      .aggregate([
        {
          $sort: {lastUpdate: -1}
        },
        {
          $match: {
            userId: {$in: ids},
            owner: userId
          }
        },
        {
          $addFields: {
            isOthersHave: {$ne: ['$userId', '$owner']}
          }
        },
        {
          $match: {
            isOthersHave: true
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
              $sum: '$savings'
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
            savings: '$driverSaving',
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
              $sum: '$savings'
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
            savings: '$driverSaving',
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
              $sum: '$savings'
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
            savings: '$driverSaving',
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

function getGroupBalancePerUser(groupIds, userId) {
  return new Promise((resolve, reject) => {
    db.collection('balances')
      .aggregate([
        {
          $sort: {lastUpdate: -1}
        },
        {
          $match: {
            groupId: {$in: groupIds},
            userId: userId
          }
        },
        {
          $group: {
            _id: {
              groupId: '$groupId',
              type: '$type',
              userId: '$userId',
              admin: '$admin'
            },
            lastUpdate: {$first: '$lastUpdate'},
            driverSaving: {
              $sum: '$savings'
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
            groupId: '$_id.groupId',
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

        return resolve(result);
      });
  });
}

function getTypeFilter(businessId, userId, admin) {
  return new Promise((resolve, reject) => {
    db.collection('transactions')
      .aggregate([
        {
          $project: {
            owner: 1,
            businessId: 1,
            active: 1,
            activeGroup: 1,
            admin: 1,
            type: 1
          }
        },
        {
          $match: {
            businessId,
            owner: userId,
            admin,
            active: true,
            activeGroup: true
          }
        },
        {
          $group: {
            _id: {
              type: '$type'
            }
          }
        },
        {
          $project: {
            _id: 0,
            type: '$_id.type'
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

function getTypeFilterV2(business, userId) {
  return new Promise((resolve, reject) => {
    const businessId = business._id;
    let match = {
      businessId
    };

    if (business.isAdmin) {
      match.userId = userId;
      match.admin = true;
    } else {
      match.owner = userId;
      match.admin = false;
    }

    db.collection('transactions')
      .aggregate([
        {
          $match: match
        },
        {
          $group: {
            _id: {
              type: '$type'
            }
          }
        },
        {
          $project: {
            _id: 0,
            type: '$_id.type'
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

/**
 * @Deprecated
 * @param userIds
 * @param groupId
 * @returns {Promise|Promise}
 */
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

        // remove currrent balances
        db.collection('balances')
          .removeMany({
            userId: {
              $in: userIds
            },
            groupId
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

function setBalancesV2(businessId) {
  return new Promise((resolve, reject) => {
    db.collection('transactions')
      .aggregate([
        {
          $match: {
            businessId,
            admin: false,
            active: true,
          }
        },
        {
          $project: {
            userId: 1,
            owner: 1,
            businessId: 1,
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
          $group: {
            _id: {
              type: '$type',
              userId: '$userId',
              owner: '$owner',
              businessId: '$businessId'
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
            userId: '$_id.userId',
            owner: '$_id.owner',
            businessId: '$_id.businessId',
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

        // remove current balances
        db.collection('balances')
          .removeMany({
            businessId
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
