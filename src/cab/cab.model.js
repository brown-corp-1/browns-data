module.exports = {
    getCabWithOwners,
    getCabsWithOwners,
    getOwners,
    getRelatedUsers,
    getCarsByOwner,
    getCabsInformation
};

const Promise = require('promise');

function getCabWithOwners(plate) {
    return new Promise((resolve, reject) => {
        db.collection('cabs')
            .aggregate([
                {
                    $match: {
                        plate: plate
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'owners',
                        foreignField: 'id',
                        as: 'owners'
                    }
                },
                {
                    $project: {
                        _id: 0,
                        plate: 1,
                        photo: 1,
                        owners: {
                            id: 1,
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

function getCabsWithOwners(plates) {
    return new Promise((resolve, reject) => {
        db.collection('cabs')
            .aggregate([
                {
                    $match: {
                        plate: {$in: plates}
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'owners',
                        foreignField: 'id',
                        as: 'owners'
                    }
                },
                {
                    $project: {
                        _id: 0,
                        plate: 1,
                        owners: {
                            id: 1,
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

function getCarsByOwner(userId) {
    return new Promise((resolve, reject) => {
        db.collection('cabs')
            .aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'owners',
                        foreignField: 'id',
                        as: 'owners'
                    }
                },
                {
                    $match: {
                        owners: { $in: [userId] }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        plate: 1,
                        owners: {
                            id: 1,
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

function getOwners(plate) {
    return new Promise((resolve, reject) => {
        db.collection('cabs')
            .aggregate([
                {
                    $lookup: {
                        from: 'users',
                        localField: 'owners',
                        foreignField: 'id',
                        as: 'owners'
                    }
                },
                {
                    $match: {
                        plate: plate
                    }
                },
                {
                    $project: {
                        owners: {
                            id: 1,
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

function getRelatedUsers(plate) {
    return new Promise((resolve, reject) => {
        db.collection('users')
            .aggregate([
                {
                    $match: {cabs: {$in: [plate]}}
                },
                {
                    $project: {
                        _id: 0,
                        id: 1,
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

function getCabsInformation(ids) {
    return new Promise((resolve, reject) => {
        db.collection('cabs')
            .find({
                plate: { $in: ids }
            },
            {
                _id: 0,
                plate: 1,
                photo: 1
            }).toArray((err, result) => {
                if (err) { return reject(err); }

                return resolve(result);
            });
    });
}
