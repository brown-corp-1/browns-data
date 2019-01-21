module.exports = {
  arrayBalanceToObject,
  balancesToUsers,
  createFolder,
  createFolders,
  consolidateDailyBalances,
  consolidateMontlyBalances,
  generateImages,
  getUserBalance,
  putImage,
  removeAccents,
  saveStream,
  saveImages
};

const fs = require('fs');
const sharp = require('sharp');
const {typeOfTransaction} = require('../transaction/transaction.constant');
const uuid = require('uuid');
const publicFolder = 'public/';
const resourcesFolder = publicFolder + 'resources/';

function createFolder(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
}

function consolidateMontlyBalances(balanceArray) {
  let balances = {};

  balanceArray.forEach((balance) => {
    const key = balance.year + ' ' + balance.month;

    if (!balances[key]) {
      balances[key] = {
        year: balance.year,
        month: balance.month
      };
    }

    if (balance.type === typeOfTransaction.QUOTA) {
      balances[key].deposits = balance.total + balance.savings;
    }
    if (balance.type === typeOfTransaction.EXPENSE) {
      balances[key].expenses = balance.total;
    }
    if (balance.type === typeOfTransaction.CASH_OUT) {
      balances[key].cashOut = balance.total;
    }
    if (balance.type === typeOfTransaction.CASH_IN) {
      balances[key].cashIn = balance.total;
    }
  });

  return Object.keys(balances).map((key) => balances[key]);
}

function consolidateDailyBalances(balanceArray) {
  let balances = {};

  balanceArray.forEach((balance) => {
    const key = balance.year + ' ' + balance.month + ' ' + balance.day;

    if (!balances[key]) {
      balances[key] = {
        year: balance.year,
        month: balance.month,
        day: balance.day
      };
    }

    if (balance.type === typeOfTransaction.QUOTA) {
      balances[key].deposits = balance.total + balance.savings;
    }
    if (balance.type === typeOfTransaction.EXPENSE) {
      balances[key].expenses = balance.total;
    }
    if (balance.type === typeOfTransaction.CASH_OUT) {
      balances[key].cashOut = balance.total;
    }
    if (balance.type === typeOfTransaction.CASH_IN) {
      balances[key].cashIn = balance.total;
    }
  });

  return Object.keys(balances).map((key) => balances[key]);
}

function arrayBalanceToObject(balanceArray) {
  const deposits = balanceArray.find((balance) => balance.type === typeOfTransaction.QUOTA) || {};
  const expenses = balanceArray.find((balance) => balance.type === typeOfTransaction.EXPENSE) || {};
  const cashOut = balanceArray.find((balance) => balance.type === typeOfTransaction.CASH_OUT) || {};
  const cashIn = balanceArray.find((balance) => balance.type === typeOfTransaction.CASH_IN) || {};
  const peekAndPlate = balanceArray.find((balance) => balance.type === typeOfTransaction.PEAK_AND_PLATE) || {};
  const stranded = balanceArray.find((balance) => balance.type === typeOfTransaction.STRANDED) || {};

  let balance = {
    deposits: deposits && deposits.total ? deposits.total : 0,
    expenses: expenses && expenses.total ? expenses.total : 0,
    cashOut: cashOut && cashOut.total ? cashOut.total : 0,
    cashIn: cashIn && cashIn.total ? cashIn.total : 0,
    savings: deposits && deposits.savings ? deposits.savings : 0,
    lastUpdate: new Date(
      Math.max(
        deposits.lastUpdate || 0,
        expenses.lastUpdate || 0,
        cashOut.lastUpdate || 0,
        cashIn.lastUpdate || 0,
        peekAndPlate.lastUpdate || 0,
        stranded.lastUpdate || 0))
  };

  balance.total = balance.deposits + balance.cashIn + balance.savings - balance.cashOut - balance.expenses;

  return balance;
}

function balancesToUsers(userIds, result) {
  let balances = {};

  userIds.forEach((userId) => {
    const userBalances = result.filter((balance) => balance.userId.toString() === userId.toString());

    balances[userId] = formatBalances(userBalances);
  });

  return balances;
}

function getUserBalance(balances, userId, businessId) {
  let userBalances;

  if (businessId) {
    userBalances = balances.filter((balance) => {
      return balance.userId.toString() === userId.toString() && balance.businessId.toString() === businessId.toString();
    });
  } else {
    userBalances = balances.filter((balance) => {
      return balance.userId.toString() === userId.toString();
    });
  }

  return formatBalances(userBalances);
}

function formatBalances(userBalances) {
  if (userBalances && userBalances.length) {
    const deposits = userBalances.find((balance) => balance.type === typeOfTransaction.QUOTA) || {};
    const expenses = userBalances.find((balance) => balance.type === typeOfTransaction.EXPENSE) || {};
    const cashOut = userBalances.find((balance) => balance.type === typeOfTransaction.CASH_OUT) || {};
    const cashIn = userBalances.find((balance) => balance.type === typeOfTransaction.CASH_IN) || {};
    const peekAndPlate = userBalances.find((balance) => balance.type === typeOfTransaction.PEAK_AND_PLATE) || {};
    const stranded = userBalances.find((balance) => balance.type === typeOfTransaction.STRANDED) || {};

    let userBalance = {
      deposits: deposits && deposits.total ? deposits.total : 0,
      expenses: expenses && expenses.total ? expenses.total : 0,
      cashOut: cashOut && cashOut.total ? cashOut.total : 0,
      cashIn: cashIn && cashIn.total ? cashIn.total : 0,
      savings: deposits && deposits.savings ? deposits.savings : 0,
      lastUpdate: new Date(
        Math.max(
          deposits.lastUpdate || 0,
          expenses.lastUpdate || 0,
          cashOut.lastUpdate || 0,
          cashIn.lastUpdate || 0,
          peekAndPlate.lastUpdate || 0,
          stranded.lastUpdate || 0))
    };

    userBalance.total = userBalance.deposits + userBalance.cashIn + userBalance.savings - userBalance.cashOut - userBalance.expenses;

    return userBalance;
  }

  return {
    deposits: 0,
    expenses: 0,
    cashOut: 0,
    cashIn: 0,
    savings: 0,
    total: 0,
    lastUpdate: new Date()
  };
}

function saveImages(entityId, images, imagesPath, renditions) {
  let lstImages = imagesPath || [];

  return new Promise((resolve, reject) => {
    const id = uuid.v4();
    const businessFolder = resourcesFolder + entityId;
    const imagesFolder = businessFolder + '/images/';
    const galleyFolder = imagesFolder + id;

    if (images && images.length) {
      try {
        createFolder(resourcesFolder);
        createFolder(businessFolder);
        createFolder(imagesFolder);
        createFolder(galleyFolder);

        images.forEach((img) => {
          const imageId = uuid.v4();
          const filename = galleyFolder + '/' + imageId + '.png';

          lstImages.push(galleyFolder.replace(publicFolder, '') + '/' + imageId + '.png');
          fs.writeFileSync(filename, img.buffer);

          if (renditions && renditions.length) {
            renditions.forEach((rendition) => {
              const dimensions = rendition.split('x');
              const width = parseInt(dimensions[0]);
              const height = parseInt(dimensions[1]);
              const renditionFile = galleyFolder + '/' + imageId + '_' + width + '_' + height + '.png';

              sharp(filename)
                .resize(width, height)
                .max()
                .crop(sharp.strategy.attention)
                .withoutEnlargement()
                .jpeg({
                  quality: 95,
                  chromaSubsampling: '4:4:4'
                })
                .toFile(renditionFile)
                .then(() => {
                  resolve(renditionFile);
                });
            });
          }
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

function putImage(url, image) {
  return new Promise((resolve, reject) => {
    if (image) {
      return createFolders(url)
        .then((path) => {
          resolve(fs.writeFileSync(path, image.buffer));
        });
    }

    return reject();
  });
}

function createFolders(url) {
  return new Promise((resolve, reject) => {
    if (url) {
      try {
        let path = publicFolder;
        let urlParts = url.split('/');
        let urlPartsLen = urlParts.length - 1;

        if (!fs.existsSync(url)) {
          if (url.startsWith(resourcesFolder.replace(publicFolder, ''))) {
            for (let j = 0; j < urlPartsLen; j++) {
              path += urlParts[j] + '/';
              createFolder(path);
            }
          }
        }

        return resolve(path + urlParts[urlPartsLen]);
      } catch (ex) {
        return reject(ex);
      }
    }

    return reject();
  });
}

function saveStream(filename) {
  filename = publicFolder + filename;

  return fs.createWriteStream(filename);
}

function generateImages(entityId, newImages, imagesPath) {
  const galleyFolder = resourcesFolder + entityId + '/images/' + uuid.v4();
  let lstImages = imagesPath || [];
  let i = 0;

  if (newImages && newImages.length) {
    let length = newImages.length;

    for (; i < length; i++) {
      lstImages.splice(newImages[i], 0, galleyFolder.replace(publicFolder, '') + '/' + uuid.v4() + '.png');
    }
  }

  return lstImages;
}

function removeAccents(string) {
  return string.toLowerCase()
    .replace(new RegExp('\\s', 'g'), '')
    .replace(new RegExp('[àáâãäå]', 'g'), 'a')
    .replace(new RegExp('æ', 'g'), 'ae')
    .replace(new RegExp('ç', 'g'), 'c')
    .replace(new RegExp('[èéêë]', 'g'), 'e')
    .replace(new RegExp('[ìíîï]', 'g'), 'i')
    .replace(new RegExp('ñ', 'g'), 'n')
    .replace(new RegExp('[òóôõö]', 'g'), 'o')
    .replace(new RegExp('œ', 'g'), 'oe')
    .replace(new RegExp('[ùúûü]', 'g'), 'u')
    .replace(new RegExp('[ýÿ]', 'g'), 'y')
    .replace(new RegExp('\\W', 'g'), '');
}
