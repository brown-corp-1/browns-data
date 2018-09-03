module.exports = {
    active,
    add,
    addUserToGroup,
    find,
    remove,
    update
};

const Promise = require('promise');

function add(group) {
    return new Promise((resolve, reject) => {
        db.collection('groups')
            .insertOne(
                group,
                (err, result) => {
                    if (err) { return reject(err); }
                    return resolve(result.insertedId);
                });
    });
}

function update(groupId, name) {
    return new Promise((resolve, reject) => {
        db.collection('groups')
            .updateOne(
                {
                    _id: groupId
                },
                {
                    $set: {
                        name
                    }
                },
                (err, result) => {
                    if (err) { return reject(err); }

                    return resolve(result.result);
                });
    });
}

function remove(groupId) {
    return _updateGroupActive(groupId, false);
}

function active(groupId) {
    return _updateGroupActive(groupId, true);
}

function addUserToGroup(managerId, groupId, userId) {
    return new Promise((resolve, reject) => {
        db.collection('groups')
            .updateOne(
                {
                    _id: groupId,
                    managerId: managerId
                },
                {
                    $addToSet: {
                        userIds: userId
                    }
                },
                (err, result) => {
                    if (err) { return reject(err); }

                    return resolve(result.result);
                });
    });
}

function find(userId) {
    return new Promise((resolve, reject) => {
        db.collection('businessGroups')
            .aggregate([
                {
                    $match: {
                        userId
                    }
                },
                {
                    $lookup: {
                        from: 'groups',
                        localField: 'groupId',
                        foreignField: '_id',
                        as: 'group'
                    }
                },
                {
                    $unwind: {path: '$group', preserveNullAndEmptyArrays: true}
                },
                {
                    $sort: {
                        'group.name': 1
                    }
                },
                {
                    $project: {
                        _id: '$group._id',
                        name: '$group.name',
                        managerId: '$group.managerId',
                        active: '$active',
                        parentActive: '$group.active',
                        removedFromManager: '$removedFromManager'
                    }
                }
            ])
            .toArray((err, result) => {
                if (err) { return reject(err); }

                return resolve(result);
            });
    });
}

function _updateGroupActive(groupId, isActive) {
    return new Promise((resolve, reject) => {
        db.collection('groups')
            .updateOne(
                {
                    _id: groupId
                },
                {
                    $set: {
                        active: isActive,
                        lastUpdate: new Date()
                    }
                },
                (err, result) => {
                    if (err) { return reject(err); }

                    return resolve(result.result);
                });
    });
}
