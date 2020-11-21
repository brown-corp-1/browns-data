module.exports = {
  active,
  add,
  get,
  getBusinessWithOwners,
  getBusinessesWithOwners,
  getOwners,
  getOwnersId,
  getBusinessesByOwner,
  getBusinessesInformation,
  remove,
  update,
  updateLastUpdate,
  updateImage
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

function update(businessId, type, name, owners, drivers) {
  return new Promise((resolve, reject) => {
    let newBusiness = {
      type,
      name,
      owners,
      drivers,
      lastUpdate: new Date()
    };

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

function updateLastUpdate(businessId) {
  return new Promise((resolve, reject) => {
    db.collection('businesses')
      .updateOne(
        {
          _id: businessId
        },
        {
          $set: {
            lastUpdate: new Date()
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

function updateImage(businessId, photo) {
  return new Promise((resolve, reject) => {
    let newBusiness = {
      lastUpdate: new Date()
    };

    if (photo && photo.length) {
      newBusiness.photo = photo[0];
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

function remove(businessIds) {
  return new Promise((resolve, reject) => {
    db.collection('businesses')
      .updateMany(
        {
          _id: {$in: businessIds}
        },
        {
          $set: {
            active: false,
            lastUpdate: new Date()
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

function active(businessIds) {
  return new Promise((resolve, reject) => {
    db.collection('businesses')
      .updateMany(
        {
          _id: {$in: businessIds}
        },
        {
          $set: {
            active: true,
            lastUpdate: new Date()
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
          owners: 1,
          lastUpdate: 1
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
            owners: 1,
            type: 1,
            lastUpdate: 1
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
            drivers: 1,
            photo: 1,
            active: 1,
            type: 1,
            lastUpdate: 1
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
            },
            lastUpdate: 1
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

function getOwnersId(id) {
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
            owners: 1
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
          photo: 1,
          type: 1,
          lastUpdate: 1
        })
      .toArray((err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result);
      });
  });
}
