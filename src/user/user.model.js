module.exports = {
    add,
    exist,
    get,
    getByEmail,
    getInvite,
    getUsersInformation,
    login,
    setAsDriver,
    update
};

const Promise = require('promise');

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
                {})
            .limit(1)
            .toArray((err, result) => {
                if (err) { return reject(err); }
                return resolve(result.length ? result[0] : null);
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
                photo: 1
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
                    password: 1
                })
            .limit(1)
            .toArray((err, result) => {
                if (err) { return reject(err); }

                result[0].password = !!result[0].password;
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
                        businessIds: businessId,
                        roles: 'DRIVER'
                    }
                },
                (err, result) => {
                    if (err) { return reject(err); }
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
                    email: 1
                })
            .toArray((err, result) => {
                if (err) { return reject(err); }

                return resolve(result);
            });
    });
}

function update(userId, firstName, lastName, password, photo, photos) {
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

        db.collection('users')
            .updateOne(
                {
                    _id: userId
                },
                {
                    $set: data,
                    $push: {
                        photos: {
                            $each: photos
                        }
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
