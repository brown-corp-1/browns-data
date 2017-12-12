module.exports = {
    get,
    getDrivers,
    login,
    setCurrentCab,
    getCurrentDriversPerCab,
    getCurrentManagers,
    getUsersInformation
};

const Promise = require('promise');

function get(userId) {
    return new Promise((resolve, reject) => {
        db.collection('users')
            .find(
                {
                    id: userId
                },
                {
                    _id: 0,
                    password: 0
                })
            .limit(1)
            .toArray((err, result) => {
                if (err) { return reject(err); }
                return resolve(result[0]);
            });
    });
}

function login(userId, password) {
    return new Promise((resolve, reject) => {
        db.collection('users')
            .find(
                {
                    id: userId,
                    password: password
                },
                {
                    id: 1,
                    firstName: 1,
                    lastName: 1,
                    photo: 1,
                    roles: 1,
                    email: 1
                })
            .limit(1)
            .toArray((err, result) => {
                if (err) { return reject(err); }
                return resolve(result[0]);
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
                    id: 1,
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

function setCurrentCab(userId, plate) {
    return new Promise((resolve, reject) => {
        db.collection('users')
            .update(
                {id: userId},
                {
                    $set: {
                        currentCab: plate
                    },
                    $addToSet: {
                        cabs: plate
                    }
                },
                (err, result) => {
                    if (err) { return reject(err); }
                    return resolve(result);
                });
    });
}

function getCurrentDriversPerCab(plate) {
    return new Promise((resolve, reject) => {
        db.collection('users')
            .find(
                {
                    currentCab: plate,
                    roles: {
                        $elemMatch: {$eq: 'DRIVER'}
                    }
                },
                {
                    _id: 0,
                    id: 1,
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

function getCurrentManagers(plate) {
    return new Promise((resolve, reject) => {
        db.collection('users')
            .find(
                {
                    roles: {
                        $elemMatch: {$eq: 'MANAGER'}
                    },
                    managed: {
                        $elemMatch: {$eq: plate}
                    }
                },
                {
                    _id: 0,
                    id: 1,
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
            .find({
                id: { $in: ids }
            },
            {
                _id: 0,
                id: 1,
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
