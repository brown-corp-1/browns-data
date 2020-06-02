module.exports = {
  active,
  add,
  addUserToGroup,
  find,
  getDefaultGroupId,
  getDefaultGroupIds,
  getDefaultBusinessGroupId,
  remove,
  update
};

const Promise = require('promise');
const {parseToArray} = require('../helper/util');

function add(group) {
  return new Promise((resolve, reject) => {
    db.collection('groups')
      .insertOne(
        group,
        (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result.insertedId);
        });
  });
}

function update(groupId, name) {
  return new Promise((resolve, reject) => {
    db.collection('groups')
      .updateOne(
        {
          _id: groupId
        },
        {
          $set: {
            name
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

function remove(groupId) {
  return _updateGroupActive(groupId, false);
}

function active(groupIds) {
  return _updateGroupActive(groupIds, true);
}

function addUserToGroup(managerId, groupId, userId) {
  return new Promise((resolve, reject) => {
    db.collection('groups')
      .updateOne(
        {
          _id: groupId,
          managerId: managerId
        },
        {
          $addToSet: {
            userIds: userId
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

function find(userId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .aggregate([
        {
          $match: {
            userId
          }
        },
        {
          $lookup: {
            from: 'groups',
            localField: 'groupId',
            foreignField: '_id',
            as: 'group'
          }
        },
        {
          $unwind: {path: '$group', preserveNullAndEmptyArrays: true}
        },
        {
          $sort: {
            'group.name': 1
          }
        },
        {
          $project: {
            _id: '$group._id',
            name: '$group.name',
            managerId: '$group.managerId',
            active: '$active',
            parentActive: '$group.active',
            removedFromManager: '$removedFromManager'
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

function getDefaultGroupId(userId, businessId) {
  return new Promise((resolve, reject) => {
    return db.collection('groups')
      .find(
        {
          managerId: userId,
          active: true
        },
        {
          _id: '$group._id'
        }
      )
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result && result.length ? result[0]._id : null);
      });
  });
}

function getDefaultGroupIds(userId) {
  return new Promise((resolve, reject) => {
    return db.collection('groups')
      .find(
        {
          managerId: userId,
          active: true
        },
        {
          _id: '$group._id'
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

function getDefaultBusinessGroupId(userId, businessId) {
  return new Promise((resolve, reject) => {
    return db.collection('businessGroups')
      .find(
        {
          userId,
          $or: [
            {
              managedIds: {
                $elemMatch: {$eq: businessId}
              }
            },
            {
              businessIds: {
                $elemMatch: {$eq: businessId}
              }
            }
          ]
        },
        {
          $project: {
            groupId: 1
          }
        }
      )
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result && result.length ? result[0].groupId : null);
      });
  });
}

function _updateGroupActive(groupIds, isActive) {
  return new Promise((resolve, reject) => {
    groupIds = parseToArray(groupIds);

    db.collection('groups')
      .updateOne(
        {
          _id: {$in: groupIds}
        },
        {
          $set: {
            active: isActive,
            lastUpdate: new Date()
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
