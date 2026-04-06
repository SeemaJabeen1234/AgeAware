import axios from 'axios';

// Configure base URL for API requests
const API = axios.create({
  baseURL: 'http://192.168.55.103:8000',  // Default for Android emulator to reach localhost
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Create a function to update the base URL when needed
export const updateApiBaseUrl = (newBaseUrl) => {
  API.defaults.baseURL = newBaseUrl;
};

// API functions for age detection
export const detectAge = async (imageBase64) => {
  try {
    const response = await API.post('/detect', {
      image: imageBase64
    });
    return response.data;
  } catch (error) {
    console.error('Error detecting age:', error);
    throw error;
  }
};

// API function to get model info
export const getModelInfo = async () => {
  try {
    const response = await API.get('/model-info');
    return response.data;
  } catch (error) {
    console.error('Error getting model info:', error);
    throw error;
  }
};

// API function to test connectivity
export const testConnection = async () => {
  try {
    const response = await API.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error connecting to API:', error);
    throw error;
  }
};

// API function to get app usage limits based on age
export const getUsageLimits = async (ageGroup) => {
  try {
    const response = await API.get(`/limits/${ageGroup}`);
    return response.data;
  } catch (error) {
    console.error('Error getting usage limits:', error);
    throw error;
  }
};

// Export the API instance for direct use
export default API;
