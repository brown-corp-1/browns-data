/**
 * Created by fabian.moreno on 14/07/2017.
 */
const fs = require('fs');

module.exports = {
    createFolder: createFolder
};

function createFolder(folder) {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
}
