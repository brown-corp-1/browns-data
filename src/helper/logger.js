module.exports = {
  error,
  info
};

function error(res, errorMessage, errorCode) {
  if (config.brownsData.debug) {
    console.log(500, errorMessage, errorCode ? errorCode : '');
  }
  res.send(500, errorMessage);
}

function info(message, data) {
  if (config.brownsData.debug) {
    console.log(message, data ? data : '');
  }
}
