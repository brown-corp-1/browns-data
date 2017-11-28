module.exports = {
    createFolder
};

const fs = require('fs');

function createFolder(folder) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
}
