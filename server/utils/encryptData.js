// server/utils/encryptData.js
const CryptoJS = require('crypto-js');

const SECRET_KEY = process.env.AES_SECRET_KEY || 'finbuddy_default_32char_key_here';

const encrypt = (data) => {
  try {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  } catch (err) {
    console.error('Encryption error:', err.message);
    return null;
  }
};

const decrypt = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    try { return JSON.parse(decrypted); } catch { return decrypted; }
  } catch (err) {
    console.error('Decryption error:', err.message);
    return null;
  }
};

const hashData = (data) => {
  return CryptoJS.SHA256(data).toString();
};

module.exports = { encrypt, decrypt, hashData };
