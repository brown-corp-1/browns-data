module.exports = {
  active,
  add,
  get,
  getBusinessWithOwners,
  getBusinessesWithOwners,
  getOwners,
  getBusinessesByOwner,
  getBusinessesInformation,
  remove,
  update
};

const Promise = require('promise');

function add(business) {
  return new Promise((resolve, reject) => {
    db.collection('businesses')
      .insertOne(
        business,
        (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result.insertedId);
        });
  });
}

function update(businessId, name, owners, photo) {
  return new Promise((resolve, reject) => {
    let newBusiness = {
      name,
      owners
    };

    if (photo) {
      newBusiness.photo = photo;
    }

    db.collection('businesses')
      .updateOne(
        {
          _id: businessId
        },
        {
          $set: newBusiness
        },
        (err) => {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
  });
}

function remove(businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businesses')
      .updateOne(
        {
          _id: businessId
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

function active(businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businesses')
      .updateOne(
        {
          _id: businessId
        },
        {
          $set: {
            active: true
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

function get(id) {
  return new Promise((resolve, reject) => {
    db.collection('businesses')
      .find(
        {
          _id: id,
          active: true
        },
        {
          name: 1,
          owners: 1
        })
      .toArray((err, result) => {
        if (err || !result.length) {
          return reject(err);
        }

        return resolve(result[0]);
      });
  });
}

function getBusinessWithOwners(id) {
  return new Promise((resolve, reject) => {
    db.collection('businesses')
      .aggregate([
        {
          $match: {
            _id: id
          }
        },
        {
          $project: {
            name: 1,
            photo: 1,
            owners: 1
          }
        }
      ])
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result[0]);
      });
  });
}

function getBusinessesWithOwners(businessIds) {
  return new Promise((resolve, reject) => {
    db.collection('businesses')
      .aggregate([
        {
          $match: {
            _id: {$in: businessIds}
          }
        },
        {
          $sort: {name: 1}
        },
        {
          $project: {
            name: 1,
            owners: 1,
            active: 1
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

function getBusinessesByOwner(userId) {
  return new Promise((resolve, reject) => {
    db.collection('businesses')
      .aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'owners',
            foreignField: '_id',
            as: 'owners'
          }
        },
        {
          $match: {
            owners: {$in: [userId]},
            active: true
          }
        },
        {
          $project: {
            name: 1,
            owners: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              photo: 1
            }
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

function getOwners(id) {
  return new Promise((resolve, reject) => {
    db.collection('businesses')
      .aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'owners',
            foreignField: '_id',
            as: 'owners'
          }
        },
        {
          $match: {
            _id: id
          }
        },
        {
          $project: {
            owners: {
              _id: 1,
              firstName: 1,
              lastName: 1,
              photo: 1
            }
          }
        }
      ])
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        if (result && result.length && result[0].owners) {
          return resolve(result[0].owners);
        }

        return [];
      });
  });
}

function getBusinessesInformation(ids) {
  return new Promise((resolve, reject) => {
    db.collection('businesses')
      .find(
        {
          _id: {$in: ids}
        },
        {
          name: 1,
          photo: 1
        })
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}
