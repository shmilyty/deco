const CryptoJS = require('crypto-js');
const { SECRET_KEY } = require('../config');

const encrypt = (text) => CryptoJS.AES.encrypt(text, SECRET_KEY).toString();

const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

const sanitizeUsername = (name) => {
  if (!name || typeof name !== 'string') return 'unknown';
  return name.trim().slice(0, 50) || 'unknown';
};

module.exports = { encrypt, decrypt, sanitizeUsername };
