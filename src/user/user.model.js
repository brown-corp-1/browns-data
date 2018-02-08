module.exports = {
    add,
    addBusiness,
    addManagedBusiness,
    exist,
    get,
    getDrivers,
    findByGroup,
    setCurrentBusiness,
    login,
    getCurrentDriversPerBusiness,
    getCurrentManagers,
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
            .find(
                {
                    email: userId,
                    password: password
                },
                {
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

function findByGroup(groupId) {
    return new Promise((resolve, reject) => {
        db.collection('groups')
            .aggregate([
                {
                    $match: {
                        _id: groupId
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userIds',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $project: {
                        user: {
                            _id: 1,
                            firstName: 1,
                            lastName: 1,
                            photo: 1,
                            roles: 1,
                            businesses: 1,
                            currentBusiness: 1
                        }
                    }
                }
            ])
            .limit(1)
            .toArray((err, result) => {
                if (err && !result.length) { return reject(err); }

                return resolve(result[0].user);
            });
    });
}

function setCurrentBusiness(userId, businessId) {
    return new Promise((resolve, reject) => {
        db.collection('users')
            .updateOne(
                {
                    _id: userId
                },
                {
                    $set: {
                        currentBusiness: businessId
                    },
                    $addToSet: {
                        businesses: businessId
                    }
                },
                (err, result) => {
                    if (err) { return reject(err); }
                    return resolve(result);
                });
    });
}

function addBusiness(users, businessId) {
    return new Promise((resolve, reject) => {
        db.collection('users')
            .updateMany(
                {
                    _id: {$in: users}
                },
                {
                    $addToSet: {
                        businesses: businessId,
                        roles: 'OWNER'
                    }
                },
                (err, result) => {
                    if (err) { return reject(err); }
                    return resolve(result.result);
                });
    });
}

function addManagedBusiness(userId, businessId) {
    return new Promise((resolve, reject) => {
        db.collection('users')
            .updateOne(
                {
                    _id: userId
                },
                {
                    $addToSet: {
                        managed: businessId,
                        roles: 'MANAGER'
                    }
                },
                (err, result) => {
                    if (err) { return reject(err); }
                    return resolve(result.result);
                });
    });
}

function getCurrentDriversPerBusiness(businessId) {
    return new Promise((resolve, reject) => {
        db.collection('users')
            .find(
                {
                    currentBusiness: businessId,
                    roles: {
                        $elemMatch: {$eq: 'DRIVER'}
                    }
                },
                {
                    firstName: 1,
                    lastName: 1,
                    photo: 1
                }
            )
            .sort({firstName: 1})
            .toArray((err, result) => {
                if (err) { return reject(err); }
                return resolve(result);
            });
    });
}

function getCurrentManagers(businessId) {
    return new Promise((resolve, reject) => {
        db.collection('users')
            .find(
                {
                    roles: {
                        $elemMatch: {$eq: 'MANAGER'}
                    },
                    managed: {
                        $elemMatch: {$eq: businessId}
                    }
                },
                {
                    firstName: 1,
                    lastName: 1,
                    photo: 1
                }
            )
            .sort({firstName: 1})
            .toArray((err, result) => {
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
