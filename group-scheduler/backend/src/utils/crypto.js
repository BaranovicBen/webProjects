// Cryptographic utilities for secure session management
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const CryptoJS = require('crypto-js');
const config = require('../config');

/**
 * Generate a cryptographically strong random token
 * @param {number} length - Length in bytes (default 32 = 256 bits)
 * @returns {string} - Hex encoded token
 */
function generateToken(length = config.tokenLength) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a short join code (6 characters)
 * @returns {string} - Alphanumeric join code
 */
function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return code;
}

/**
 * Hash a secret using bcrypt
 * @param {string} secret - The secret to hash
 * @returns {Promise<string>} - Hashed secret
 */
async function hashSecret(secret) {
  return bcrypt.hash(secret, config.saltRounds);
}

/**
 * Verify a secret against a hash
 * @param {string} secret - The secret to verify
 * @param {string} hash - The hash to compare against
 * @returns {Promise<boolean>} - True if valid
 */
async function verifySecret(secret, hash) {
  return bcrypt.compare(secret, hash);
}

/**
 * Encrypt data using AES
 * @param {object} data - Data to encrypt
 * @returns {string} - Encrypted data
 */
function encryptData(data) {
  const jsonString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, config.encryptionKey).toString();
}

/**
 * Decrypt data using AES
 * @param {string} encryptedData - Encrypted data
 * @returns {object} - Decrypted data
 */
function decryptData(encryptedData) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, config.encryptionKey);
  const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decryptedString);
}

module.exports = {
  generateToken,
  generateJoinCode,
  hashSecret,
  verifySecret,
  encryptData,
  decryptData,
};
