module.exports = {
    add,
    addUserToGroup,
    find
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
        db.collection('groups')
            .find(
                {
                    userIds: userId
                },
                {
                    name: 1,
                    managerId: 1
                })
            .toArray((err, result) => {
                if (err) { return reject(err); }

                return resolve(result);
            });
    });
}
