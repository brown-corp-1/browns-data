module.exports = {
  add,
  cleanResetPasswordToken,
  exist,
  existResetToken,
  get,
  getByEmail,
  getInvite,
  getUsersInformation,
  login,
  resetPassword,
  setSpotlight,
  update,
  updateLoginInfo,
  updatePassword
};

const Promise = require('promise');
const ObjectID = require('mongodb').ObjectID;

function get(userId) {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .find(
        {
          _id: userId
        },
        {
          password: 0
        })
      .limit(1)
      .toArray((err, result) => {
        if (err) { return reject(err); }
        return resolve(result[0]);
      });
  });
}

function getByEmail(email) {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .find(
        {
          email: email
        },
        {
          projection: {
            googlePhoto: 1,
            password: 1,
            resetPassword: 1
          }
        })
      .limit(1)
      .toArray((err, result) => {
        if (err) { return reject(err); }

        if (result.length) {
          result[0].password = !!result[0].password;

          return resolve(result[0]);
        }

        return resolve(null);
      });
  });
}

function exist(email) {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .find(
        {
          email: email
        },
        {}
      )
      .limit(1)
      .toArray((err, result) => {
        if (err) { return reject(err); }
        return resolve(result.length);
      });
  });
}

function login(userId, password) {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .find({
        email: userId,
        password: password
      })
      .project({
        firstName: 1,
        lastName: 1,
        photo: 1,
        googlePhoto: 1,
        spotlights: 1
      })
      .limit(1)
      .toArray((err, result) => {
        if (err) { return reject(err); }
        return resolve(result[0]);
      });
  });
}

function add(user) {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .insertOne(
        user,
        (err, result) => {
          if (err) { return reject(err); }
          return resolve(result.insertedId);
        });
  });
}

function getInvite(userId) {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .find(
        {
          _id: userId
        },
        {
          firstName: 1,
          lastName: 1,
          email: 1,
          password: 1,
          spotlights: 1
        })
      .limit(1)
      .toArray((err, result) => {
        if (err) { return reject(err); }

        if (result.length) {
          result[0].password = !!result[0].password;
        }

        return resolve(result);
      });
  });
}

function getUsersInformation(ids) {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .find(
        {
          _id: {$in: ids}
        })
      .project(
        {
          firstName: 1,
          lastName: 1,
          photo: 1,
          email: 1,
          resetPassword: 1,
          notificationToken: 1
        })
      .toArray((err, result) => {
        if (err) { return reject(err); }

        return resolve(result);
      });
  });
}

function update(userId, firstName, lastName, password, photo, photos, googlePhoto) {
  return new Promise((resolve, reject) => {
    let data = {
      firstName,
      lastName
    };

    if (password) {
      data.password = password;
    }

    if (photo) {
      data.photo = photo;
    }

    if (googlePhoto) {
      data.googlePhoto = googlePhoto;
    }

    db.collection('users')
      .updateOne(
        {
          _id: userId
        },
        {
          $set: data,
          $addToSet: {
            photos: {
              $each: photos
            }
          }
        },
        (err) => {
          if (err) { return reject(err); }

          return resolve(true);
        });
  });
}

function setSpotlight(userId, spotlightKey) {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .updateOne(
        {
          _id: userId
        },
        {
          $addToSet: {
            spotlights: spotlightKey
          }
        },
        (err) => {
          if (err) { return reject(err); }

          return resolve(true);
        });
  });
}

function resetPassword(email) {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .updateOne(
        {
          email: email
        },
        {
          $set: {
            resetPassword: {
              token: new ObjectID(),
              date: new Date()
            }
          }
        },
        (err) => {
          if (err) { return reject(err); }

          return resolve(true);
        });
  });
}

function updatePassword(resetToken, password) {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .updateOne(
        {
          'resetPassword.token': resetToken
        },
        {
          $set: {
            password
          },
          $unset: {
            resetPassword: 1
          }
        },
        (err, result) => {
          if (err) { return reject(err); }

          return resolve(result);
        });
  });
}

function existResetToken(resetToken) {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .find(
        {
          'resetPassword.token': resetToken
        })
      .project({
        email: 1
      })
      .limit(1)
      .toArray((err, result) => {
        if (err) { return reject(err); }

        return resolve(result && result.length ? result[0] : null);
      });
  });
}

function cleanResetPasswordToken() {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .updateOne(
        {
          'resetPassword.date': {$lt: new Date(new Date() - 600000)}
        },
        {
          $unset: {
            resetPassword: 1
          }
        },
        (err, result) => {
          if (err) { return reject(err); }

          return resolve(result);
        });
  });
}

function updateLoginInfo(userId, notificationToken) {
  return new Promise((resolve, reject) => {
    let data = {
      lastLogin: new Date()
    };

    if (notificationToken) {
      data.notificationToken = notificationToken;
    }

    db.collection('users')
      .updateOne(
        {
          _id: userId
        },
        {
          $set: data
        },
        (err, result) => {
          if (err) { return reject(err); }

          return resolve(result);
        });
  });
}
