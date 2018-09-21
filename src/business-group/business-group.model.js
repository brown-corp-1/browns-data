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
  get,
  getCurrentDriversPerBusiness,
  getCurrentManagers,
  removeBusiness,
  removeUserFromGroup,
  setAsDriver,
  setAsRelatedUser,
  removeAsDriver,
  removeUserAsDriverInGroup
};

const Promise = require('promise');

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

function removeBusiness(userId, groupId, businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .updateOne({
        groupId,
        userId
      }, {
        $addToSet: {deletedBusinessIds: businessId}
      }, (err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}

function activeBusiness(userId, groupId, businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .updateOne({
        groupId,
        userId
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

function removeUserFromGroup(userId, groupId, fromManager) {
  return new Promise((resolve, reject) => {
    let removingType;

    if (fromManager) {
      removingType = {removedFromManager: true};
    } else {
      removingType = {active: false};
    }

    db.collection('businessGroups')
      .updateOne({
        groupId,
        userId
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

function activeUser(userId, groupId, activeByManager) {
  let updates = {
    $set: {active: true}
  };

  if (activeByManager) {
    updates.$unset = {removedFromManager: 1};
  }

  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .updateOne(
        {
          groupId,
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

function removeAsDriver(groupId, userId, businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .updateOne(
        {
          userId: userId,
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

function removeUserAsDriverInGroup(userId, groupId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .updateOne(
        {
          userId,
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
