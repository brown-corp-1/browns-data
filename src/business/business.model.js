module.exports = {
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
                    if (err) { return reject(err); }
                    return resolve(result.insertedId);
                });
    });
}

function update(businessId, name, owners) {
    return new Promise((resolve, reject) => {
        db.collection('businesses')
            .updateOne(
                {
                    _id: businessId
                },
                {
                    $set: {
                        name,
                        owners
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
                        _id: id,
                        active: true
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
                        _id: {$in: businessIds},
                        active: true
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
                        _id: id,
                        active: true
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
