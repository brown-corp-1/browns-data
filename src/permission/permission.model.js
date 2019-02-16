module.exports = {
  isManager,
  hasGroup,
  hasBusiness,
  hasBusinessAnyMode,
  canGetTransaction,
  canReadBusiness
};

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

function hasGroup(userId, groupId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .find(
        {
          userId,
          groupId
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

function hasBusinessAnyMode(userId, businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businessGroups')
      .find(
        {
          userId,
          $or: [
            {
              managedIds: {$in: [businessId]}
            },
            {

              businessIds: {$in: [businessId]}
            }
          ]
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
