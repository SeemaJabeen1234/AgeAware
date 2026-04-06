import 'react-native-get-random-values';
import * as CryptoJS from 'crypto-js';
import { Platform } from 'react-native';
import { getUniqueId } from 'react-native-device-info';

// We'll use the device's unique ID as part of the encryption key
// This ensures that the encrypted data can only be decrypted on this device
const getDeviceKey = async () => {
  try {
    const deviceId = await getUniqueId();
    // Use a fixed salt and device ID to create a consistent key
    return CryptoJS.PBKDF2('AgeAware-Salt', deviceId, {
      keySize: 256 / 32,
      iterations: 1000
    }).toString();
  } catch (error) {
    console.error('Error getting device key:', error);
    // Fallback to a static key (less secure but prevents crashes)
    return 'AgeAware-Static-Fallback-Key';
  }
};

/**
 * Encrypt sensitive data
 * 
 * @param {string} data - Data to encrypt
 * @returns {Promise<string>} - Encrypted data
 */
export const encrypt = async (data) => {
  if (!data) return null;

  try {
    const key = await getDeviceKey();
    const encrypted = CryptoJS.AES.encrypt(data.toString(), key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data
 * 
 * @param {string} encryptedData - Data to decrypt
 * @returns {Promise<string>} - Decrypted data
 */
export const decrypt = async (encryptedData) => {
  if (!encryptedData) return null;

  try {
    const key = await getDeviceKey();
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key).toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Generate a secure hash of data (one-way)
 * 
 * @param {string} data - Data to hash
 * @returns {Promise<string>} - Hashed data
 */
export const hash = async (data) => {
  if (!data) return null;

  try {
    return CryptoJS.SHA256(data.toString()).toString();
  } catch (error) {
    console.error('Hashing error:', error);
    throw new Error('Failed to hash data');
  }
};
