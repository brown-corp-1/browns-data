module.exports = {
    get,
    add,
    remove,
    addMany,
    getRecord,
    getBalance,
    getUsersBalance,
    getTotalUsersBalance
};

const Promise = require('promise');
const util = require('../helper/util');

function get(businessId, userId, admin, pageNumber, pageSize) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .aggregate([
                {
                    $match: {
                        businessId: businessId,
                        owner: userId,
                        admin: admin,
                        active: true
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'driver',
                        foreignField: '_id',
                        as: 'driver'
                    }
                },
                {
                    $unwind: {path: '$driver', preserveNullAndEmptyArrays: true}
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'target',
                        foreignField: '_id',
                        as: 'target'
                    }
                },
                {
                    $unwind: {path: '$target', preserveNullAndEmptyArrays: true}
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'from',
                        foreignField: '_id',
                        as: 'from'
                    }
                },
                {
                    $unwind: {path: '$from', preserveNullAndEmptyArrays: true}
                },
                {
                    $lookup: {
                        from: 'businesses',
                        localField: 'businessId',
                        foreignField: '_id',
                        as: 'business'
                    }
                },
                {
                    $unwind: {path: '$business', preserveNullAndEmptyArrays: true}
                },
                {
                    $sort: {date: -1, creationDate: -1}
                },
                {
                    $project: {
                        type: 1,
                        date: 1,
                        value: 1,
                        description: 1,
                        driverSaving: 1,
                        business: {
                            _id: '$business._id',
                            name: '$business.name'
                        },
                        driver: {
                            _id: '$driver._id',
                            firstName: '$driver.firstName',
                            lastName: '$driver.lastName',
                            photo: '$driver.photo'
                        },
                        target: {
                            _id: '$target._id',
                            firstName: '$target.firstName',
                            lastName: '$target.lastName',
                            photo: '$target.photo'
                        },
                        from: {
                            _id: '$from._id',
                            firstName: '$from.firstName',
                            lastName: '$from.lastName',
                            photo: '$from.photo'
                        }
                    }
                }
            ])
            .skip(pageSize * (pageNumber - 1))
            .limit(pageSize)
            .toArray((err, result) => {
                if (err) {
                    return reject(err);
                }

                return resolve(result);
            });
    });
}

function getRecord(transactionId) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .aggregate([
                {
                    $match: {
                        _id: transactionId
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'driver',
                        foreignField: '_id',
                        as: 'driver'
                    }
                },
                {
                    $unwind: {path: '$driver', preserveNullAndEmptyArrays: true}
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'target',
                        foreignField: '_id',
                        as: 'target'
                    }
                },
                {
                    $unwind: {path: '$target', preserveNullAndEmptyArrays: true}
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'from',
                        foreignField: '_id',
                        as: 'from'
                    }
                },
                {
                    $unwind: {path: '$from', preserveNullAndEmptyArrays: true}
                },
                {
                    $lookup: {
                        from: 'businesses',
                        localField: 'businessId',
                        foreignField: '_id',
                        as: 'business'
                    }
                },
                {
                    $unwind: {path: '$business', preserveNullAndEmptyArrays: true}
                },
                {
                    $project: {
                        _id: 1,
                        owner: 1,
                        admin: 1,
                        type: 1,
                        date: 1,
                        value: 1,
                        parentId: 1,
                        lstImages: 1,
                        description: 1,
                        driverSaving: 1,
                        business: {
                            _id: '$business._id',
                            name: '$business.name'
                        },
                        driver: {
                            _id: '$driver._id',
                            firstName: '$driver.firstName',
                            lastName: '$driver.lastName',
                            photo: '$driver.photo'
                        },
                        target: {
                            _id: '$target._id',
                            firstName: '$target.firstName',
                            lastName: '$target.lastName',
                            photo: '$target.photo'
                        },
                        from: {
                            _id: '$from._id',
                            firstName: '$from.firstName',
                            lastName: '$from.lastName',
                            photo: '$from.photo'
                        }
                    }
                }
            ])
            .limit(1)
            .toArray((err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result[0]);
            });
    });
}

function add(transaction) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .insert(transaction, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
    });
}

function remove(transactionId) {
    const queryCondition = {
        $or: [
            {
                _id: transactionId
            },
            {
                parentId: transactionId
            }
        ]
    };

    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .updateMany(
                queryCondition,
                {
                    $set: {
                        active: false
                    }
                }, (err) => {
                    if (err) {
                        return reject(err);
                    }

                    // return deleted transactions
                    db.collection('transactions')
                        .find(
                            queryCondition,
                            {
                                owner: 1,
                                admin: 1,
                                type: 1,
                                businessId: 1,
                                date: 1,
                                value: 1,
                                driver: 1,
                                description: 1,
                                driverSaving: 1,
                                lstImages: 1,
                                target: 1,
                                from: 1
                            })
                        .toArray((findErr, result) => {
                            if (findErr) {
                                return reject(findErr);
                            }

                            return resolve(result);
                        });
                });
    });
}

function addMany(transactions) {
    return new Promise((resolve, reject) => {
        if (transactions && transactions.length) {
            db.collection('transactions')
                .insertMany(transactions, (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(result);
                });
        } else {
            return resolve({ok: 1, ops: []});
        }
    });
}

function getBalance(businessId, userId, admin) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .aggregate([
                {
                    $sort: {date: -1}
                },
                {
                    $match: {
                        businessId: businessId,
                        owner: userId,
                        admin: admin,
                        active: true
                    }
                },
                {
                    $group: {
                        _id: {
                            businessId: '$businessId',
                            type: '$type',
                            owner: '$owner'
                        },
                        lastUpdate: {$first: '$date'},
                        driverSaving: {
                            $sum: '$driverSaving'
                        },
                        total: {
                            $sum: '$value'
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        userId: '$_id.owner',
                        type: '$_id.type',
                        lastUpdate: '$lastUpdate',
                        savings: '$driverSaving',
                        total: '$total'
                    }
                }
            ])
            .toArray((err, result) => {
                if (err) {
                    return reject(err);
                }

                return resolve(util.arrayBalanceToObject(result));
            });
    });
}

function getUsersBalance(businessId, userIds, admin) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .aggregate([
                {
                    $sort: {date: -1}
                },
                {
                    $match: {
                        businessId: businessId,
                        owner: {$in: userIds},
                        admin: admin,
                        active: true
                    }
                },
                {
                    $group: {
                        _id: {
                            businessId: '$businessId',
                            type: '$type',
                            owner: '$owner'
                        },
                        lastUpdate: {$first: '$date'},
                        driverSaving: {
                            $sum: '$driverSaving'
                        },
                        total: {
                            $sum: '$value'
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        userId: '$_id.owner',
                        type: '$_id.type',
                        lastUpdate: '$lastUpdate',
                        savings: '$driverSaving',
                        total: '$total'
                    }
                }
            ])
            .toArray((err, result) => {
                if (err) {
                    return reject(err);
                }

                return resolve(util.balancesToUsers(userIds, result));
            });
    });
}

function getTotalUsersBalance(userIds, admin) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .aggregate([
                {
                    $sort: {date: -1}
                },
                {
                    $match: {
                        owner: {$in: userIds},
                        admin: admin,
                        active: true
                    }
                },
                {
                    $lookup: {
                        from: 'businesses',
                        localField: 'businessId',
                        foreignField: '_id',
                        as: 'business'
                    }
                },
                {
                    $unwind: {path: '$business', preserveNullAndEmptyArrays: true}
                },
                {
                    $match: {
                        'business.active': true
                    }
                },
                {
                    $group: {
                        _id: {
                            type: '$type',
                            owner: '$owner'
                        },
                        lastUpdate: {$first: '$date'},
                        driverSaving: {
                            $sum: '$driverSaving'
                        },
                        total: {
                            $sum: '$value'
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        userId: '$_id.owner',
                        type: '$_id.type',
                        lastUpdate: '$lastUpdate',
                        savings: '$driverSaving',
                        total: '$total'
                    }
                }
            ])
            .toArray((err, result) => {
                if (err) {
                    return reject(err);
                }

                return resolve(util.balancesToUsers(userIds, result));
            });
    });
}
