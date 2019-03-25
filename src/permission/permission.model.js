module.exports = {
  isManager,
  hasGroups,
  hasBusiness,
  hasBusinessAnyMode,
  canGetTransaction,
  canRemoveTransaction,
  canReadBusiness
};

const _ = require('lodash');
const Promise = require('promise');
const projection = {
  projection: {
    _id: 1
  }
};

function isManager(userId, groupId) {
  return new Promise((resolve, reject) => {
    db.collection('groups')
      .find(
        {
          _id: groupId,
          managerId: userId
        },
        projection
      )
      .limit(1)
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(!!result.length);
      });
  });
}

function hasGroups(userId, groupIds) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(groupIds)) {
      groupIds = [groupIds];
    }

    db.collection('businessGroups')
      .find(
        {
          userId,
          groupId: {$in: groupIds}
        },
        projection
      )
      .limit(1)
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(!!result.length);
      });
  });
}

function hasBusiness(userId, businessId, admin) {
  return new Promise((resolve, reject) => {
    let filters = {
      userId
    };

    if (admin) {
      filters.managedIds = {$in: [businessId]};
    } else {
      filters.businessIds = {$in: [businessId]};
    }

    db.collection('businessGroups')
      .find(
        filters,
        projection
      )
      .limit(1)
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(!!result.length);
      });
  });
}

function hasBusinessAnyMode(userId, businessIds) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(businessIds)) {
      businessIds = [businessIds];
    }

    db.collection('businessGroups')
      .find(
        {
          userId,
          $or: [
            {
              managedIds: {$in: businessIds}
            },
            {

              businessIds: {$in: businessIds}
            }
          ]
        },
        {
          _id: 0,
          managedIds: 1,
          businessId: 1
        }
      )
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        const resultSize = _.intersectionWith(_.flatten(
          _.concat(
            _.map(result, 'managedIds'),
            _.map(result, 'businessIds')
          )), businessIds, _.isEqual).length;

        return resolve(resultSize === businessIds.length);
      });
  });
}

function canReadBusiness(userId, businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .find(
        {
          userId,
          $or: [
            {
              managedIds: {
                $in: [businessId]
              }
            },
            {
              businessIds: {
                $in: [businessId]
              }
            }]
        },
        projection
      )
      .limit(1)
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(!!result.length);
      });
  });
}

function canGetTransaction(userId, transactionId, admin) {
  return new Promise((resolve, reject) => {
    let filters = {
      _id: transactionId,
      owner: userId
    };

    if (admin !== undefined) {
      filters.admin = admin;
    }

    db.collection('transactions')
      .find(
        filters,
        projection
      )
      .limit(1)
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(!!result.length);
      });
  });
}

function canRemoveTransaction(userId, transactionIds, admin) {
  return new Promise((resolve, reject) => {
    let filters = {
      _id: {$in: transactionIds},
      owner: userId,
      parentId: {$exists: false}
    };

    if (admin !== undefined) {
      filters.admin = admin;
    }

    db.collection('transactions')
      .find(
        filters,
        projection
      )
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result.length === transactionIds.length);
      });
  });
}
