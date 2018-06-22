module.exports = {
    add,
    addBusiness,
    addManagedBusiness,
    findRelatedUsersToBusiness,
    findUsersByGroup,
    get,
    getCurrentDriversPerBusiness,
    getCurrentManagers,
    removeBusiness,
    setCurrentBusiness
};

const Promise = require('promise');

function add(userId, groupId, managedBusinessId, businessId) {
    return new Promise((resolve, reject) => {
        db.collection('businessGroups')
            .insertOne(
                {
                    userId,
                    groupId,
                    managedIds: managedBusinessId ? [managedBusinessId] : [],
                    businessIds: businessId ? [businessId] : []
                },
                (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(result.insertedId);
                });
    });
}

function addBusiness(id, businessId) {
    return new Promise((resolve, reject) => {
        db.collection('businessGroups')
            .updateOne(
                {
                    _id: id
                },
                {
                    $addToSet: {
                        businessIds: businessId,
                        roles: 'OWNER'
                    }
                },
                (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(result.result);
                });
    });
}

function addManagedBusiness(id, businessId) {
    return new Promise((resolve, reject) => {
        db.collection('businessGroups')
            .updateOne(
                {
                    _id: id
                },
                {
                    $addToSet: {
                        managedIds: businessId
                    }
                },
                (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(result.result);
                });
    });
}

function get(userId, groupId) {
    return new Promise((resolve, reject) => {
        db.collection('businessGroups')
            .find({
                userId,
                groupId
            })
            .limit(1)
            .toArray((err, result) => {
                if (err) {
                    return reject(err);
                }

                return resolve(result.length ? result[0] : null);
            });
    });
}

function getCurrentDriversPerBusiness(groupId, businessId) {
    return new Promise((resolve, reject) => {
        db.collection('businessGroups')
            .aggregate([
                {
                    $match: {
                        groupId,
                        currentBusinessId: businessId,
                        roles: {
                            $elemMatch: {$eq: 'DRIVER'}
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: {path: '$user', preserveNullAndEmptyArrays: true}
                },
                {
                    $replaceRoot: {newRoot: '$user'}
                },
                {
                    $project: {
                        firstName: 1,
                        lastName: 1,
                        photo: 1
                    }
                }
            ])
            .sort({firstName: 1})
            .toArray((err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
    });
}

function getCurrentManagers(groupId, businessId) {
    return new Promise((resolve, reject) => {
        db.collection('businessGroups')
            .aggregate([
                {
                    $match: {
                        groupId,
                        managedIds: {
                            $elemMatch: {$eq: businessId}
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: {path: '$user', preserveNullAndEmptyArrays: true}
                },
                {
                    $replaceRoot: {newRoot: '$user'}
                },
                {
                    $project: {
                        firstName: 1,
                        lastName: 1,
                        photo: 1
                    }
                }
            ])
            .sort({firstName: 1})
            .toArray((err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
    });
}

function setCurrentBusiness(userId, groupId, businessId, rol) {
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
                        roles: rol
                    }
                },
                (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(result);
                });
    });
}

function findUsersByGroup(groupId) {
    return new Promise((resolve, reject) => {
        db.collection('businessGroups')
            .aggregate([
                {
                    $match: {
                        groupId: groupId
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: {path: '$user', preserveNullAndEmptyArrays: true}
                },
                {
                    $project: {
                        _id: '$user._id',
                        firstName: '$user.firstName',
                        lastName: '$user.lastName',
                        photo: '$user.photo',
                        roles: 1,
                        businesses: '$businessIds',
                        currentBusiness: '$currentBusinessId'
                    }
                },
                {
                    $sort: {firstName: 1, lastName: 1}
                }
            ])
            .toArray((err, result) => {
                if (err) {
                    return reject(err);
                }

                return resolve(result);
            });
    });
}

function removeBusiness(userIds, groupId, businessId) {
    return new Promise((resolve, reject) => {
        db.collection('businessGroups')
            .updateMany({
                groupId,
                userId: {$in: userIds}
            }, {
                $pull: {businessIds: businessId}
            }, (err, result) => {
                if (err) {
                    return reject(err);
                }

                return resolve(result);
            });
    });
}

function findRelatedUsersToBusiness(groupId, businessId) {
    return new Promise((resolve, reject) => {
        db.collection('businessGroups')
            .aggregate([
                {
                    $match: {
                        groupId,
                        businessIds: {$in: [businessId]}
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: {path: '$user', preserveNullAndEmptyArrays: true}
                },
                {
                    $project: {
                        _id: '$user._id',
                        firstName: '$user.firstName',
                        lastName: '$user.lastName',
                        photo: '$user.photo'
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
