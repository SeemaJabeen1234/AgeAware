import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Store data in persistent storage
 * 
 * @param {string} key - The key to store the data under
 * @param {any} value - The value to store (will be JSON stringified)
 * @returns {Promise<void>}
 */
export const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`Error storing data for key ${key}:`, error);
    return false;
  }
};

/**
 * Retrieve data from persistent storage
 * 
 * @param {string} key - The key to retrieve data for
 * @returns {Promise<any>} - The parsed data or null if not found
 */
export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error(`Error retrieving data for key ${key}:`, error);
    return null;
  }
};

/**
 * Remove an item from persistent storage
 * 
 * @param {string} key - The key to remove
 * @returns {Promise<boolean>} - Success status
 */
export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing data for key ${key}:`, error);
    return false;
  }
};

/**
 * Clear all data from persistent storage
 * 
 * @returns {Promise<boolean>} - Success status
 */
export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing all data:', error);
    return false;
  }
};

/**
 * Get all keys stored in persistent storage
 * 
 * @returns {Promise<string[]>} - Array of keys
 */
export const getAllKeys = async () => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Error getting all keys:', error);
    return [];
  }
};
