module.exports = {
    add,
    exist,
    get,
    getByEmail,
    getDrivers,
    setAsDriver,
    login,
    getUsersInformation
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
                photo: 1,
                roles: 1
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

function getDrivers() {
    return new Promise((resolve, reject) => {
        db.collection('users')
            .find(
                {
                    roles: {
                        $elemMatch: {$eq: 'DRIVER'}
                    }
                },
                {
                    firstName: 1,
                    lastName: 1,
                    photo: 1
                })
            .sort({firstName: 1})
            .toArray((err, result) => {
                if (err) { return reject(err); }
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
                },
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
