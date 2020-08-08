module.exports = {
  v2: {
    generateImages: generateImagesV2
  },
  arrayBalanceToObject,
  balancesToUsers,
  createFolder,
  createFolders,
  consolidateDailyBalances,
  consolidateDailyBalancesV2,
  consolidateMontlyBalances,
  consolidateMontlyBalancesV2,
  generateImages,
  getUserBalance,
  getUserBalancePerBusiness,
  transactionBalancesToObject,
  getGroupBalance,
  putImage,
  removeAccents,
  parseToArray,
  saveStream,
  saveImages
};

const _ = require('lodash');
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


// @Deprecated
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

function consolidateMontlyBalancesV2(balanceArray, valueProperty) {
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
      balances[key].deposits = balance[valueProperty];
    }
    if (balance.type === typeOfTransaction.EXPENSE) {
      balances[key].expenses = balance[valueProperty];
    }
    if (balance.type === typeOfTransaction.CASH_OUT) {
      balances[key].cashOut = balance[valueProperty];
    }
    if (balance.type === typeOfTransaction.CASH_IN) {
      balances[key].cashIn = balance[valueProperty];
    }
  });

  return Object.keys(balances).map((key) => balances[key]);
}

// @deprecated
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

function consolidateDailyBalancesV2(balanceArray, valueProperty) {
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
      balances[key].deposits = balance[valueProperty];
    }
    if (balance.type === typeOfTransaction.EXPENSE) {
      balances[key].expenses = balance[valueProperty];
    }
    if (balance.type === typeOfTransaction.CASH_OUT) {
      balances[key].cashOut = balance[valueProperty];
    }
    if (balance.type === typeOfTransaction.CASH_IN) {
      balances[key].cashIn = balance[valueProperty];
    }
  });

  return Object.keys(balances).map((key) => balances[key]);
}

function arrayBalanceToObject(balanceArray) {
  const deposits = {total: 0, savings: 0, lastUpdate: 0};
  const expenses = {total: 0, lastUpdate: 0};
  const cashOut = {total: 0, lastUpdate: 0};
  const cashIn = {total: 0, lastUpdate: 0};
  const peekAndPlate = {total: 0, lastUpdate: 0};
  const stranded = {total: 0, lastUpdate: 0};

  if (balanceArray && balanceArray.length) {
    balanceArray.forEach((item) => {
      switch (item.type) {
        case  typeOfTransaction.QUOTA: {
          deposits.total += item.total || 0;
          deposits.savings += item.savings || 0;
          deposits.lastUpdate = Math.max(item.lastUpdate || 0, deposits.lastUpdate);
          break;
        }
        case  typeOfTransaction.EXPENSE: {
          expenses.total += item.total || 0;
          expenses.lastUpdate = Math.max(item.lastUpdate || 0, expenses.lastUpdate);
          break;
        }
        case  typeOfTransaction.CASH_OUT: {
          cashOut.total += item.total || 0;
          cashOut.lastUpdate = Math.max(item.lastUpdate || 0, cashOut.lastUpdate);
          break;
        }
        case  typeOfTransaction.CASH_IN: {
          cashIn.total += item.total || 0;
          cashIn.lastUpdate = Math.max(item.lastUpdate || 0, cashIn.lastUpdate);
          break;
        }
        case  typeOfTransaction.PEAK_AND_PLATE: {
          peekAndPlate.total += item.total || 0;
          peekAndPlate.lastUpdate = Math.max(item.lastUpdate || 0, peekAndPlate.lastUpdate);
          break;
        }
        case  typeOfTransaction.STRANDED: {
          stranded.total += item.total || 0;
          stranded.lastUpdate = Math.max(item.lastUpdate || 0, stranded.lastUpdate);
          break;
        }
      }
    });
  }

  let balance = {
    deposits: deposits.total,
    expenses: expenses.total,
    cashOut: cashOut.total,
    cashIn: cashIn.total,
    savings: deposits.savings,
    lastUpdate: new Date(
      Math.max(
        deposits.lastUpdate,
        expenses.lastUpdate,
        cashOut.lastUpdate,
        cashIn.lastUpdate,
        peekAndPlate.lastUpdate,
        stranded.lastUpdate))
  };

  balance.total = balance.deposits + balance.cashIn + balance.savings - balance.cashOut - balance.expenses;

  return balance;
}

function transactionBalancesToObject(balanceArray) {
  let balanceMine = {
    deposits: 0,
    expenses: 0,
    cashOut: 0,
    cashIn: 0,
    peekAndPlate: 0,
    stranded: 0,
    savings: 0,
    lastUpdate: 0
  };
  let balanceHaveToOthers = {
    deposits: 0,
    expenses: 0,
    cashOut: 0,
    cashIn: 0,
    peekAndPlate: 0,
    stranded: 0,
    savings: 0,
    lastUpdate: 0
  };
  let balanceOthersHave = {
    deposits: 0,
    expenses: 0,
    cashOut: 0,
    cashIn: 0,
    peekAndPlate: 0,
    stranded: 0,
    savings: 0,
    lastUpdate: 0
  };

  if (balanceArray && balanceArray.length) {
    balanceArray.forEach((item) => {
      const balanceProperty = _getBalanceProperty(item);

      if (item.balanceMine) {
        balanceMine[balanceProperty] += item.balanceMine || 0;
        balanceMine.savings += item.savings || 0;
        balanceMine.lastUpdate = Math.max(item.lastUpdate || 0, balanceMine.lastUpdate);
      }

      if (item.balanceHaveToOthers) {
        balanceHaveToOthers[balanceProperty] += item.balanceHaveToOthers || 0;
        balanceHaveToOthers.savings += item.savings || 0;
        balanceHaveToOthers.lastUpdate = Math.max(item.lastUpdate || 0, balanceHaveToOthers.lastUpdate);
      }

      if (item.balanceOthersHave) {
        balanceOthersHave[balanceProperty] += item.balanceOthersHave || 0;
        balanceOthersHave.savings += item.savings || 0;
        balanceOthersHave.lastUpdate = Math.max(item.lastUpdate || 0, balanceOthersHave.lastUpdate);
      }
    });
  }

  return {
    balanceMine,
    balanceHaveToOthers,
    balanceOthersHave
  };
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

function getUserBalancePerBusiness(balances, userId) {
  let userBalances;
  let userBalancesPerBusiness = {};
  let formattedBalances = [];

  userBalances = balances.filter((balance) => {
    return balance.userId.toString() === userId.toString();
  });

  userBalances.forEach((balance) => {
    const businessId = balance.businessId.toString();

    userBalancesPerBusiness[businessId] = userBalancesPerBusiness[businessId] || [];
    userBalancesPerBusiness[businessId].push(balance);
  });

  Object.keys(userBalancesPerBusiness).forEach((balance) => {
    const currentBalance = formatBalances(userBalancesPerBusiness[balance]);

    currentBalance.businessId = balance;
    formattedBalances.push(currentBalance);
  });

  return formattedBalances;
}

function getGroupBalance(balances, groupId) {
  const adminBalances = balances.filter((balance) => {
    return balance.groupId.toString() === groupId.toString() && balance.admin;
  });

  const guestBalances = balances.filter((balance) => {
    return balance.groupId.toString() === groupId.toString() && !balance.admin;
  });

  return {
    admin: formatBalances(adminBalances),
    guest: formatBalances(guestBalances)
  };
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
    lastUpdate: new Date(0)
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
          _saveRenditions(filename, renditions);
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

function saveStream(filename, renditions) {
  filename = publicFolder + filename;

  return fs.createWriteStream(filename)
    .on('finish', () => {
      _saveRenditions(filename, renditions);
    });
}

function generateImages(entityId, newImages, imagesPath) {
  const galleyFolder = resourcesFolder + entityId + '/images/' + uuid.v4();
  let lstImages = imagesPath || [];

  if (newImages) {
    newImages.forEach((index) => {
      lstImages.splice(index, 0, galleyFolder.replace(publicFolder, '') + '/' + uuid.v4() + '.png');
    });
  }

  return lstImages;
}

function removeAccents(string) {
  if (string) {
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

  return string;
}

function parseToArray(value) {
  if (!Array.isArray(value)) {
    return [value];
  }

  return value;
}

function _saveRenditions(filename, renditions) {
  if (renditions && renditions.length) {
    renditions.forEach((rendition) => {
      const dimensions = rendition.split('x');
      const width = parseInt(dimensions[0]);
      const height = parseInt(dimensions[1]);
      const renditionFile = filename.replace('.png', '_' + width + '_' + height + '.png');

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
        });
    });
  }
}

function _getBalanceProperty(item) {
  switch (item.type) {
    case typeOfTransaction.QUOTA: {
      return 'deposits';
    }
    case typeOfTransaction.EXPENSE: {
      return 'expenses';
    }
    case typeOfTransaction.CASH_OUT: {
      return 'cashOut';
    }
    case typeOfTransaction.CASH_IN: {
      return 'cashIn';
    }
    case typeOfTransaction.PEAK_AND_PLATE: {
      return 'peekAndPlate';
    }
    case typeOfTransaction.STRANDED: {
      return 'stranded';
    }
  }

  return '';
}

function generateImagesV2(entityId, imagesPath) {
  const galleyFolder = resourcesFolder + entityId + '/images/' + uuid.v4();

  return _.map(imagesPath, (image) => {
    if (image.startsWith('file:')) {
      return galleyFolder.replace(publicFolder, '') + '/' + uuid.v4() + '.jpg';
    }

    return image;
  });
}
