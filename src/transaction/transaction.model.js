module.exports = {
    get,
    add,
    remove,
    addMany,
    getRecord,
    saveImages,
    getBalance,
    getTotalBalance,
    getUsersBalance,
    getTotalUsersBalance,
    getUnnotifiedTransactions,
    updateUnnotifiedTransactions
};

const Promise = require('promise');
const fs = require('fs');
const uuid = require('uuid');
const mongo = require('mongodb');
const resourcesFolder = 'public/resources/';
const util = require('../helper/util');
const {typeOfTransaction} = require('./transaction.constant');

function get(plate, userId, admin, pageNumber, pageSize) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .aggregate([
                {
                    $match: {
                        plate: plate,
                        owner: userId,
                        admin: admin,
                        active: true
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'driver',
                        foreignField: 'id',
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
                        foreignField: 'id',
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
                        foreignField: 'id',
                        as: 'from'
                    }
                },
                {
                    $unwind: {path: '$from', preserveNullAndEmptyArrays: true}
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
                        driver: {
                            id: '$driver.id',
                            firstName: '$driver.firstName',
                            lastName: '$driver.lastName',
                            photo: '$driver.photo'
                        },
                        target: {
                            id: '$target.id',
                            firstName: '$target.firstName',
                            lastName: '$target.lastName',
                            photo: '$target.photo'
                        },
                        from: {
                            id: '$from.id',
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
                        _id: new mongo.ObjectID(transactionId)
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'driver',
                        foreignField: 'id',
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
                        foreignField: 'id',
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
                        foreignField: 'id',
                        as: 'from'
                    }
                },
                {
                    $unwind: {path: '$from', preserveNullAndEmptyArrays: true}
                },
                {
                    $project: {
                        _id: 1,
                        plate: 1,
                        owner: 1,
                        admin: 1,
                        type: 1,
                        date: 1,
                        value: 1,
                        parentId: 1,
                        lstImages: 1,
                        description: 1,
                        driverSaving: 1,
                        driver: {
                            id: '$driver.id',
                            firstName: '$driver.firstName',
                            lastName: '$driver.lastName',
                            photo: '$driver.photo'
                        },
                        target: {
                            id: '$target.id',
                            firstName: '$target.firstName',
                            lastName: '$target.lastName',
                            photo: '$target.photo'
                        },
                        from: {
                            id: '$from.id',
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
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .updateMany(
                {
                    $or: [
                        {
                            _id: new mongo.ObjectID(transactionId)
                        },
                        {
                            parentId: new mongo.ObjectID(transactionId)
                        }
                    ]
                }, {
                    $set: {
                        active: false
                    }
                }, (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(result);
                });
    });
}

function addMany(transactions) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .insertMany(transactions, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
    });
}

function saveImages(plate, images, imagesPath) {
    let lstImages = imagesPath || [];

    return new Promise((resolve, reject) => {
        const id = uuid.v4();
        const cabFolder = resourcesFolder + plate;
        const imagesFolder = cabFolder + '/images/';
        const galleyFolder = imagesFolder + id;

        if (images && images.length) {
            try {
                util.createFolder(resourcesFolder);
                util.createFolder(cabFolder);
                util.createFolder(imagesFolder);
                util.createFolder(galleyFolder);

                images.forEach((img) => {
                    const imageId = uuid.v4();

                    lstImages.push(galleyFolder.replace('public/', '') + '/' + imageId + '.png');
                    fs.writeFileSync(galleyFolder + '/' + imageId + '.png', img.buffer);
                });

                return resolve(lstImages);
            } catch (ex) {
                return reject(ex);
            }
        } else {
            return resolve(lstImages);
        }
    });
}

function getBalance(plate, userId, admin) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .aggregate(
                {
                    $sort: {date: -1}
                },
                {
                    $match: {
                        plate: plate,
                        owner: userId,
                        admin: admin,
                        type: {
                            $in: [
                                typeOfTransaction.QUOTA, typeOfTransaction.EXPENSE,
                                typeOfTransaction.CASH_OUT, typeOfTransaction.CASH_IN]
                        },
                        active: true
                    }
                },
                {
                    $group: {
                        _id: {
                            plate: '$plate',
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
                }, (err, result) => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(util.arrrayBalanceToObject(result));
                });
    });
}

function getUsersBalance(plate, userIds, admin) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .aggregate(
                {
                    $sort: {date: -1}
                },
                {
                    $match: {
                        plate: plate,
                        owner: {$in: userIds},
                        admin: admin,
                        type: {
                            $in: [
                                typeOfTransaction.QUOTA, typeOfTransaction.EXPENSE,
                                typeOfTransaction.CASH_OUT, typeOfTransaction.CASH_IN]
                        },
                        active: true
                    }
                },
                {
                    $group: {
                        _id: {
                            plate: '$plate',
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
                }, (err, result) => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(util.balancesToUsers(userIds, result));
                });
    });
}

function getUnnotifiedTransactions() {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .find(
                {
                    active: true,
                    sent: false
                },
                {
                    owner: 1,
                    admin: 1,
                    type: 1,
                    plate: 1,
                    date: 1,
                    value: 1,
                    driver: 1,
                    description: 1,
                    driverSaving: 1,
                    lstImages: 1,
                    target: 1,
                    from: 1,
                    balance: 1
                })
            .limit(100)
            .toArray((err, result) => {
                if (err) {
                    return reject(err);
                }

                return resolve(result);
            });
    });
}

function getTotalBalance(userId, admin) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .aggregate(
                {
                    $sort: {date: -1}
                },
                {
                    $match: {
                        owner: userId,
                        admin: admin,
                        type: {
                            $in: [
                                typeOfTransaction.QUOTA, typeOfTransaction.EXPENSE,
                                typeOfTransaction.CASH_OUT, typeOfTransaction.CASH_IN]
                        },
                        active: true
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
                        _id: 0,
                        userId: '$_id.owner',
                        type: '$_id.type',
                        lastUpdate: '$lastUpdate',
                        savings: '$driverSaving',
                        total: '$total'
                    }
                }, (err, result) => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(util.arrrayBalanceToObject(result));
                });
    });
}

function getTotalUsersBalance(userIds, admin) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .aggregate(
                {
                    $sort: {date: -1}
                },
                {
                    $match: {
                        owner: {$in: userIds},
                        admin: admin,
                        type: {
                            $in: [
                                typeOfTransaction.QUOTA, typeOfTransaction.EXPENSE,
                                typeOfTransaction.CASH_OUT, typeOfTransaction.CASH_IN]
                        },
                        active: true
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
                        _id: 0,
                        userId: '$_id.owner',
                        type: '$_id.type',
                        lastUpdate: '$lastUpdate',
                        savings: '$driverSaving',
                        total: '$total'
                    }
                }, (err, result) => {
                    if (err) {
                        return reject(err);
                    }

                    return resolve(util.balancesToUsers(userIds, result));
                });
    });
}

function updateUnnotifiedTransactions(transactionIds) {
    let ids = [];

    transactionIds.forEach((id) => {
        ids.push(new mongo.ObjectID(id));
    });

    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .updateMany(
                {
                    _id: {
                        $in: ids
                    }
                },
                {
                    $set: {
                        sent: true
                    }
                },
                (err, result) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(true);
                }
            );
    });
}
