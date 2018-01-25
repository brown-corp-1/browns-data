module.exports = {
    add,
    getBusinessWithOwners,
    getBusinessesWithOwners,
    getOwners,
    getRelatedUsers,
    getBusinessesByOwner,
    getBusinessesInformation
};

const Promise = require('promise');

function add(business) {
    return new Promise((resolve, reject) => {
        db.collection('businesses')
            .insertOne(
                business,
                (err, result) => {
                    if (err) { return reject(err); }
                    return resolve(result.insertedId);
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
                    $lookup: {
                        from: 'users',
                        localField: 'owners',
                        foreignField: '_id',
                        as: 'owners'
                    }
                },
                {
                    $project: {
                        name: 1,
                        photo: 1,
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
                if (err) { return reject(err); }

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
                    $lookup: {
                        from: 'users',
                        localField: 'owners',
                        foreignField: '_id',
                        as: 'owners'
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
                if (err) { return reject(err); }

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
                        owners: {$in: [userId]}
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
                if (err) { return reject(err); }

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
                if (err) { return reject(err); }

                return resolve(result[0].owners);
            });
    });
}

function getRelatedUsers(id) {
    return new Promise((resolve, reject) => {
        db.collection('users')
            .aggregate([
                {
                    $match: {businesses: {$in: [id]}}
                },
                {
                    $project: {
                        _id: 1,
                        firstName: 1,
                        lastName: 1,
                        photo: 1
                    }
                }
            ])
            .sort({firstName: 1, lastName: 1})
            .toArray((err, result) => {
                if (err) { return reject(err); }

                return resolve(result);
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
                if (err) { return reject(err); }

                return resolve(result);
            });
    });
}
