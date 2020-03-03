module.exports = {
  add,
  cleanResetPasswordToken,
  exist,
  existResetToken,
  get,
  getByEmail,
  getByEmailOrPhone,
  getByFacebookId,
  getByGoogleId,
  getInvite,
  getUsersInformation,
  login,
  resetPassword,
  setSpotlight,
  update,
  updateCredentials,
  updateImages,
  updateLoginInfo,
  unassignNotificationToken,
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
          projection: {
            firstName: 1,
            lastName: 1,
            email: 1,
            phone: 1,
            photo: 1,
            spotlights: 1,
            hasLoggedIn: 1
          }
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
    if (!email) {
      reject();
    }

    db.collection('users')
      .find(
        {
          email
        },
        {
          projection: {
            googlePhoto: 1,
            facebookPhoto: 1,
            password: 1,
            resetPassword: 1,
            hasLoggedIn: 1
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

function getByEmailOrPhone(email, phone) {
  return new Promise((resolve, reject) => {
    let match = {
      $or: []
    };

    if (!email && !phone) {
      return reject();
    }

    if (email) {
      match.$or.push({email});
    }

    if (phone) {
      match.$or.push({phone});
    }

    db.collection('users')
      .find(
        match,
        {
          projection: {
            googlePhoto: 1,
            facebookPhoto: 1,
            password: 1,
            resetPassword: 1,
            hasLoggedIn: 1
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

function getByFacebookId(facebookId) {
  return new Promise((resolve, reject) => {
    if (!facebookId) {
      reject();
    }

    db.collection('users')
      .find(
        {
          facebookId
        },
        {
          projection: {
            facebookPhoto: 1,
            resetPassword: 1,
            hasLoggedIn: 1
          }
        })
      .limit(1)
      .toArray((err, result) => {
        if (err) { return reject(err); }

        if (result.length) {
          return resolve(result[0]);
        }

        return resolve(null);
      });
  });
}

function getByGoogleId(googleId) {
  return new Promise((resolve, reject) => {
    if (!googleId) {
      reject();
    }

    db.collection('users')
      .find(
        {
          googleId
        },
        {
          projection: {
            googlePhoto: 1,
            resetPassword: 1,
            hasLoggedIn: 1
          }
        })
      .limit(1)
      .toArray((err, result) => {
        if (err) { return reject(err); }

        if (result.length) {
          return resolve(result[0]);
        }

        return resolve(null);
      });
  });
}

function exist(email, phone) {
  return new Promise((resolve, reject) => {
    let match = {
      $or: []
    };

    if (!email && !phone) {
      return reject();
    }

    if (email) {
      match.$or.push({email});
    }

    if (phone) {
      match.$or.push({phone});
    }

    db.collection('users')
      .find(
        match,
        {
          _id: 1
        }
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
        $or: [
          {email: userId},
          {phone: userId}
        ],
        password: password
      })
      .project({
        firstName: 1,
        lastName: 1,
        email: 1,
        phone: 1,
        photo: 1,
        spotlights: 1,
        hasLoggedIn: 1
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
          spotlights: 1,
          facebookId: 1,
          googleId: 1
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
          phone: 1,
          resetPassword: 1,
          notificationToken: 1
        })
      .toArray((err, result) => {
        if (err) { return reject(err); }

        return resolve(result);
      });
  });
}

function update(userId, firstName, lastName, password, photo, photos, googlePhoto, facebookPhoto, googleId, facebookId) {
  return new Promise((resolve, reject) => {
    let data = {};
    let arrayData = {
      photos: {
        $each: photos
      }
    };

    if (firstName || lastName) {
      data.firstName = firstName;
      data.lastName = lastName;
    }

    if (password) {
      data.password = password;
    }

    if (photo) {
      data.photo = photo;
    }

    if (googlePhoto) {
      data.googlePhoto = googlePhoto;
    }

    if (facebookPhoto) {
      data.facebookPhoto = facebookPhoto;
    }

    if (googleId) {
      arrayData = {
        googleId
      };
    }

    if (facebookId) {
      arrayData = {
        facebookId
      };
    }

    db.collection('users')
      .updateOne(
        {
          _id: userId
        },
        {
          $set: data,
          $addToSet: arrayData
        },
        (err) => {
          if (err) { return reject(err); }

          return resolve(true);
        });
  });
}

function updateCredentials(userId, credentials) {
  return new Promise((resolve, reject) => {
    let data = {};

    if (credentials) {
      if (credentials.email) {
        data.email = credentials.email;
      }

      if (credentials.phone) {
        data.phone = credentials.phone;
      }
    }

    db.collection('users')
      .updateOne(
        {
          _id: userId
        },
        {
          $set: data
        },
        (err) => {
          if (err) {
            return reject(err);
          }

          return resolve(true);
        });
  });
}

function updateImages(userId, photos) {
  return new Promise((resolve, reject) => {
    let data = {};
    let arrayData = {};

    if (photos && photos.length) {
      data.photo = photos[0];

      arrayData.photos = {
        $each: photos
      };
    }

    db.collection('users')
      .updateOne(
        {
          _id: userId
        },
        {
          $set: data,
          $addToSet: arrayData
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
      lastLogin: new Date(),
      hasLoggedIn: true
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

function unassignNotificationToken(notificationToken) {
  return new Promise((resolve, reject) => {
    db.collection('users')
      .updateMany(
        {
          notificationToken
        },
        {
          $set: {
            notificationToken: ''
          }
        },
        (err, result) => {
          if (err) { return reject(err); }

          return resolve(result);
        });
  });
}
