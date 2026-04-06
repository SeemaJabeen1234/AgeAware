import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { apiConfig } from '../config/api';

// Create the context
const ModelContext = createContext();

export const useModel = () => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};

export const ModelProvider = ({ children }) => {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState(null);

  const checkModelStatus = async () => {
    try {
      setIsModelLoading(true);
      const response = await fetch(`${apiConfig.baseUrl}/model-status`);
      const data = await response.json();
      
      if (data.status === 'ready') {
        setIsModelLoaded(true);
        setModelError(null);
      } else {
        setIsModelLoaded(false);
        setModelError('Model is not ready yet. Please wait.');
      }
    } catch (error) {
      setIsModelLoaded(false);
      setModelError(`Failed to check model status: ${error.message}`);
      console.error('Failed to check model status:', error);
    } finally {
      setIsModelLoading(false);
    }
  };

  const predictAge = async (base64Image) => {
    try {
      if (!isModelLoaded) {
        throw new Error('Model is not loaded yet');
      }

      const response = await fetch(`${apiConfig.baseUrl}/predict-age`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: base64Image,
          detect_face: true,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to predict age');
      }

      return data;
    } catch (error) {
      console.error('Error predicting age:', error);
      throw error;
    }
  };

  const reloadModel = async () => {
    try {
      setIsModelLoading(true);
      const response = await fetch(`${apiConfig.baseUrl}/reload-model`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        setIsModelLoaded(true);
        setModelError(null);
        Alert.alert('Success', 'Model has been successfully reloaded');
      } else {
        setIsModelLoaded(false);
        setModelError('Failed to reload model');
        Alert.alert('Error', 'Failed to reload model');
      }
    } catch (error) {
      setIsModelLoaded(false);
      setModelError(`Failed to reload model: ${error.message}`);
      Alert.alert('Error', `Failed to reload model: ${error.message}`);
      console.error('Failed to reload model:', error);
    } finally {
      setIsModelLoading(false);
    }
  };

  // Check model status on mount
  useEffect(() => {
    checkModelStatus();
    
    // Set up interval to check model status every 5 seconds until it's loaded
    const intervalId = setInterval(() => {
      if (!isModelLoaded && !modelError) {
        checkModelStatus();
      } else {
        clearInterval(intervalId);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isModelLoaded, modelError]);

  const value = {
    isModelLoaded,
    isModelLoading,
    modelError,
    checkModelStatus,
    predictAge,
    reloadModel,
  };

  return (
    <ModelContext.Provider value={value}>
      {children}
    </ModelContext.Provider>
  );
};
