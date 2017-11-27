/**
 * Created by fabian.moreno on 14/07/2017.
 */
const Promise = require('promise');
const fs = require('fs');
const uuid = require('uuid');
const mongo = require('mongodb');
const resourcesFolder = './public/resources/';
const util = require('../helper/util');
const { typeOfTransaction } = require('./transaction.constant');

module.exports = {
    get,
    add,
    remove,
    addMany,
    getRecord,
    saveImages,
    getBalance,
    getUsersBalance
};

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
                        driverPhoto: '$driver.photo',
                        driverSaving: 1,
                        targetPhoto: '$target.photo',
                        fromPhoto: '$from.photo'
                    }
                }
            ])
            .skip(pageSize * (pageNumber - 1))
            .limit(pageSize)
            .toArray((err, result) => {
                if (err) { return reject(err); }

                return resolve(result);
            });
    });
}

function getRecord(transactionId) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .find({_id: new mongo.ObjectID(transactionId)})
            .limit(1)
            .toArray((err, result) => {
                if (err) { return reject(err); }
                return resolve(result[0]);
            });
    });
}

function add(transaction) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .insert(transaction, (err, result) => {
                if (err) { return reject(err); }
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
                    if (err) { return reject(err); }
                    return resolve(result);
                });
    });
}

function addMany(transactions) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .insertMany(transactions, (err, result) => {
                if (err) { return reject(err); }
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
        _getBalanceTotal(plate, userId, typeOfTransaction.QUOTA, admin)
            .then((deposits) => {
                _getBalanceTotal(plate, userId, typeOfTransaction.EXPENSE, admin)
                    .then((expenses) => {
                        _getBalanceTotal(plate, userId, typeOfTransaction.CASH_OUT, admin)
                            .then((cashOut) => {
                                _getBalanceTotal(plate, userId, typeOfTransaction.CASH_IN, admin)
                                    .then((cashIn) => {
                                        _getBalanceTotal(plate, userId, typeOfTransaction.QUOTA, admin, true)
                                            .then((savings) => {
                                                _getLastRecord(plate, userId)
                                                    .then((lastRecord) => {
                                                        let balance = {
                                                            deposits: deposits ? deposits.total : 0,
                                                            expenses: expenses ? expenses.total : 0,
                                                            cashOut: cashOut ? cashOut.total : 0,
                                                            cashIn: cashIn ? cashIn.total : 0,
                                                            savings: savings ? savings.total : 0,
                                                            lastUpdate: lastRecord ? lastRecord.date : '1900-01-01'
                                                        };

                                                        balance.total = balance.deposits + balance.cashIn -
                                                            balance.expenses - balance.cashOut + balance.savings;
                                                        return resolve(balance);
                                                    });
                                            })
                                            .catch(reject);
                                    })
                                    .catch(reject);
                            })
                            .catch(reject);
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
}

function getUsersBalance(plate, users, admin) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .aggregate(
                {
                    $sort: {date: -1}
                },
                {
                    $match: {
                        plate: plate,
                        owner: {$in: users},
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
                    if (err) { return reject(err); }

                    return resolve(result);
                });
    });
}

function _getBalanceTotal(plate, userId, type, admin, isSaving) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .aggregate(
                {
                    $match: {
                        plate: plate,
                        owner: userId,
                        type: type,
                        admin: admin,
                        active: true
                    }
                },
                {
                    $group: {
                        _id: '$plate',
                        total: {
                            $sum: isSaving ? '$driverSaving' : '$value'
                        }
                    }
                }, (err, result) => {
                    if (err) { return reject(err); }

                    return resolve(result[0]);
                });
    });
}

function _getLastRecord(plate, userId) {
    return new Promise((resolve, reject) => {
        db.collection('transactions')
            .find({
                plate: plate,
                owner: userId,
                active: true
            })
            .limit(1)
            .sort({date: -1})
            .toArray((err, result) => {
                if (err) { return reject(err); }

                return resolve(result[0]);
            });
    });
}
