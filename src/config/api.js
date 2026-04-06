// API configuration for connecting to the Python backend
export const apiConfig = {
  // Use localhost for development
  baseUrl: 'http://192.168.55.103:8000', // Machine LAN IP for Physical Device
  timeout: 10000, // 10 seconds
  retryAttempts: 3, // Number of retry attempts for failed API calls

  // Endpoints
  endpoints: {
    modelStatus: '/model-status',
    predictAge: '/predict-age',
    reloadModel: '/reload-model',
  }
};
