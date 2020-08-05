module.exports = {
  add,
  find,
  remove,
  update
};

const Promise = require('promise');

function add(document) {
  return new Promise((resolve, reject) => {
    db.collection('documents')
      .insertOne(
        document,
        (err, result) => {
          if (err) {
            return reject(err);
          }
          return resolve(result.insertedId);
        });
  });
}

function update(document) {
  return new Promise((resolve, reject) => {
    const newDocument = {
      name: document.name,
      pages: document.pages,
      lastUpdate: document.lastUpdate,
      active: document.active
    };

    db.collection('documents')
      .updateOne(
        {
          _id: document._id,
          createdBy: document.createdBy,
          businessId: document.businessId,
        },
        {
          $set: newDocument
        },
        (err) => {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
  });
}

function remove(document) {
  return new Promise((resolve, reject) => {
    db.collection('documents')
      .updateOne(
        {
          _id: document._id,
          createdBy: document.createdBy,
          businessId: document.businessId,
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

function find(ids) {
  return new Promise((resolve, reject) => {
    db.collection('documents')
      .find(
        {
          businessId: {$in: ids}
        },
        {
          projection: {
            businessId: 1,
            name: 1,
            pages: 1,
            lastUpdate: 1
          }
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
