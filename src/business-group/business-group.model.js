module.exports = {
  activeUser,
  activeUsers,
  activeBusiness,
  activeBusinesses,
  add,
  addBusiness,
  addManagedBusiness,
  findRelatedUsersToBusiness,
  findUsersByGroup,
  findUsers,
  get,
  getAllBusinesses,
  getCurrentDriversPerBusiness,
  getDrivers,
  getCurrentManagers,
  getManagers,
  removeBusiness,
  removeUserFromGroup,
  setAsDriver,
  setAsRelatedUser,
  removeAsDriver,
  removeUserAsDriverInGroup
};

const Promise = require('promise');
const {parseToArray} = require('../helper/util');

function add(userId, groupId, managedBusinessId, businessId, drivenId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .insertOne(
        {
          userId,
          groupId,
          managedIds: managedBusinessId ? [managedBusinessId] : [],
          businessIds: businessId ? [businessId] : [],
          drivenIds: drivenId ? [drivenId] : [],
          active: true
        },
        (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result.insertedId);
        });
  });
}

function addBusiness(id, businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .updateOne(
        {
          _id: id
        },
        {
          $addToSet: {businessIds: businessId}
        },
        (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result.result);
        });
  });
}

function addManagedBusiness(id, businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .updateOne(
        {
          _id: id
        },
        {
          $addToSet: {
            managedIds: businessId
          }
        },
        (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result.result);
        });
  });
}

function get(userId, groupId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .find({
        userId,
        groupId
      })
      .limit(1)
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result.length ? result[0] : null);
      });
  });
}

function getAllBusinesses(userId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .find({
        userId
      })
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function getCurrentDriversPerBusiness(groupId, businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .find(
        {
          groupId,
          drivenIds: {$in: [businessId]}
        },
        {
          projection: {
            _id: 0,
            userId: 1
          }
        })
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function getDrivers(businesses) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .find(
        {
          drivenIds: {$in: businesses}
        },
        {
          projection: {
            _id: 0,
            userId: 1,
            businessId: '$drivenIds.$'
          }
        })
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function getCurrentManagers(groupId, businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .find(
        {
          groupId,
          managedIds: {
            $elemMatch: {$eq: businessId}
          }
        },
        {
          projection: {
            _id: 0,
            userId: 1
          }
        })
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        if (result && result.length) {
          return resolve([result[0].userId]);
        }

        return resolve([]);
      });
  });
}

function getManagers(businesses) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .find(
        {
          managedIds: {
            $elemMatch: {$in: businesses}
          }
        },
        {
          projection: {
            _id: 0,
            userId: 1,
            businessId: '$managedIds.$'
          }
        })
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function findUsersByGroup(groupId, includeRemovedFromManager) {
  return new Promise((resolve, reject) => {
    let match = {
      groupId
    };

    if (!includeRemovedFromManager) {
      match.removedFromManager = {$exists: false};
    }

    db.collection('businessGroups')
      .aggregate([
        {
          $match: match
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: {path: '$user', preserveNullAndEmptyArrays: true}
        },
        {
          $project: {
            _id: '$user._id',
            firstName: '$user.firstName',
            lastName: '$user.lastName',
            photo: '$user.photo',
            businesses: '$businessIds',
            currentBusiness: '$currentBusinessId',
            drivenIds: '$drivenIds',
            removedFromManager: '$removedFromManager'
          }
        },
        {
          $sort: {firstName: 1, lastName: 1}
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

function findUsers(userId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .aggregate([
        {
          $match: {
            userId
          }
        },
        {
          $project: {
            groupId: '$groupId'
          }
        }
      ])
      .toArray((groupErr, groupsResults) => {
        if (groupErr) {
          return reject(groupErr);
        }

        db.collection('businessGroups')
          .aggregate([
            {
              $match: {
                groupId: {$in: groupsResults.map(r => r.groupId)}
              }
            },
            {
              $project: {
                userId: 1,
                removedFromManager: 1,
                businessIds: 1,
                currentBusiness: 1
              }
            }
          ])
          .toArray((err, businessGroups) => {
            if (err) {
              return reject(err);
            }

            db.collection('users')
              .aggregate([
                {
                  $match: {
                    _id: {$in: businessGroups.map(r => r.userId)}
                  }
                },
                {
                  $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    photo: 1,
                    phone: 1,
                    email: 1
                  }
                },
                {
                  $sort: {firstName: 1, lastName: 1}
                }
              ])
              .toArray((err, users) => {
                if (err) {
                  return reject(err);
                }

                users.forEach((user) => {
                  user.removedFromManager = user.removedFromManager || false;
                  user.businesses = user.businesses || [];
                  user.currentBusinesses = user.currentBusinesses || [];

                  businessGroups.forEach((businessGroup) => {
                    if (businessGroup.userId.toString() === user._id.toString()) {
                      user.removedFromManager = businessGroup.removedFromManager || user.removedFromManager;

                      if (businessGroup.businessIds && businessGroup.businessIds.length) {
                        user.businesses = user.businesses.concat(businessGroup.businessIds);
                      }

                      if (businessGroup.currentBusiness) {
                        user.currentBusinesses.push(currentBusiness);
                      }
                    }
                  });
                })

                return resolve(users);
              });
          });
      });
  });
}

function removeBusiness(userId, groupId, businessIds) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .updateOne({
        groupId,
        userId
      }, {
        $addToSet: {deletedBusinessIds: {$each: businessIds}}
      }, (err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function activeBusiness(userId, groupId, businessIds) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .updateOne({
        groupId,
        userId
      }, {
        $pull: {deletedBusinessIds: {$in: businessIds}}
      }, (err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function activeBusinesses(users, groupId, businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .updateMany({
        groupId,
        userId: {$in: users}
      }, {
        $pull: {deletedBusinessIds: {$in: [businessId]}}
      }, (err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function removeUserFromGroup(userIds, groupId, fromManager) {
  return new Promise((resolve, reject) => {
    let removingType;

    if (fromManager) {
      removingType = {removedFromManager: true};
    } else {
      removingType = {active: false};
    }

    userIds = parseToArray(userIds);

    db.collection('businessGroups')
      .updateMany({
        groupId,
        userId: {$in: userIds}
      }, {
        $set: removingType
      }, (err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function activeUser(userId, groupIds, activeByManager) {
  let updates = {
    $set: {active: true}
  };

  if (activeByManager) {
    updates.$unset = {removedFromManager: 1};
  }

  groupIds = parseToArray(groupIds);

  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .updateMany(
        {
          groupId: {$in: groupIds},
          userId
        },
        updates,
        (err, result) => {
          if (err) {
            return reject(err);
          }

          return resolve(result);
        });
  });
}

function activeUsers(users, groupId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .updateMany({
        groupId,
        userId: {$in: users}
      }, {
        $set: {active: true},
        $unset: {removedFromManager: 1}
      }, (err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function findRelatedUsersToBusiness(groupId, businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .aggregate([
        {
          $match: {
            groupId,
            businessIds: {$in: [businessId]}
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: {path: '$user', preserveNullAndEmptyArrays: true}
        },
        {
          $project: {
            _id: '$user._id',
            firstName: '$user.firstName',
            lastName: '$user.lastName',
            photo: '$user.photo',
            removedFromManager: '$removedFromManager'
          }
        }
      ])
      .sort({firstName: 1, lastName: 1})
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function setAsDriver(groupId, userId, businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .updateOne(
        {
          userId: userId,
          groupId: groupId
        },
        {
          $set: {
            currentBusinessId: businessId
          },
          $addToSet: {
            drivenIds: businessId,
            businessIds: businessId
          }
        },
        (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
  });
}

function setAsRelatedUser(groupId, userId, businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .updateOne(
        {
          userId: userId,
          groupId: groupId
        },
        {
          $addToSet: {
            businessIds: businessId
          }
        },
        (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
  });
}

function removeAsDriver(groupId, userIds, businessId) {
  return new Promise((resolve, reject) => {
    userIds = parseToArray(userIds);

    db.collection('businessGroups')
      .updateMany(
        {
          userId: {$in: userIds},
          groupId: groupId
        },
        {
          $unset: {
            currentBusinessId: 1
          },
          $pull: {
            drivenIds: {$in: [businessId]}
          }
        },
        (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
  });
}

function removeUserAsDriverInGroup(userIds, groupId) {
  return new Promise((resolve, reject) => {
    userIds = parseToArray(userIds);

    db.collection('businessGroups')
      .updateOne(
        {
          userId: {$in: userIds},
          groupId
        },
        {
          $unset: {
            currentBusinessId: 1,
            drivenIds: 1
          }
        },
        (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result);
        });
  });
}
