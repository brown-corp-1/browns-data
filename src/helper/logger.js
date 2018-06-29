module.exports = {
    error,
    info
};

const config = globalConfig.brownsData;

function error(res, errorMessage, errorCode) {
    if (config.debug) {
        console.log(500, errorMessage, errorCode ? errorCode : '');
    }
    res.send(500, errorMessage);
}

function info(message, data) {
    if (config.debug) {
        console.log(message, data ? data : '');
    }
}
