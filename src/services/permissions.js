import { NativeModules, Platform, PermissionsAndroid } from 'react-native';
const { PermissionsModule } = NativeModules;

/**
 * Check if camera permission is granted
 * 
 * @returns {Promise<boolean>} - Whether permission is granted
 */
export const checkCameraPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      return granted;
    }
    return false;
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return false;
  }
};

/**
 * Request camera permission
 * 
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export const requestCameraPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'Age-Aware needs access to your camera to detect faces and estimate age.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return false;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
};

/**
 * Check if accessibility service is enabled
 * 
 * @returns {Promise<boolean>} - Whether the service is enabled
 */
export const checkAccessibilityService = async () => {
  try {
    if (Platform.OS === 'android' && PermissionsModule) {
      return await PermissionsModule.isAccessibilityServiceEnabled();
    }
    return false;
  } catch (error) {
    console.error('Error checking accessibility service:', error);
    return false;
  }
};

/**
 * Open accessibility settings to enable the service
 * 
 * @returns {Promise<void>}
 */
export const openAccessibilitySettings = async () => {
  try {
    if (Platform.OS === 'android' && PermissionsModule) {
      await PermissionsModule.openAccessibilitySettings();
    }
  } catch (error) {
    console.error('Error opening accessibility settings:', error);
  }
};

/**
 * Check if device admin is active
 * 
 * @returns {Promise<boolean>} - Whether device admin is active
 */
export const checkDeviceAdmin = async () => {
  try {
    if (Platform.OS === 'android' && PermissionsModule) {
      return await PermissionsModule.isDeviceAdminActive();
    }
    return false;
  } catch (error) {
    console.error('Error checking device admin:', error);
    return false;
  }
};

/**
 * Request device admin activation
 * 
 * @returns {Promise<boolean>} - Whether the activation was successful
 */
export const requestDeviceAdmin = async () => {
  try {
    if (Platform.OS === 'android' && PermissionsModule) {
      return await PermissionsModule.requestDeviceAdmin();
    }
    return false;
  } catch (error) {
    console.error('Error requesting device admin:', error);
    return false;
  }
};

/**
 * Check if display overlay permission is granted
 * 
 * @returns {Promise<boolean>} - Whether permission is granted
 */
export const checkOverlayPermission = async () => {
  try {
    if (Platform.OS === 'android' && PermissionsModule) {
      return await PermissionsModule.canDrawOverlays();
    }
    return false;
  } catch (error) {
    console.error('Error checking overlay permission:', error);
    return false;
  }
};

/**
 * Request display overlay permission
 * 
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export const requestOverlayPermission = async () => {
  try {
    if (Platform.OS === 'android' && PermissionsModule) {
      return await PermissionsModule.requestOverlayPermission();
    }
    return false;
  } catch (error) {
    console.error('Error requesting overlay permission:', error);
    return false;
  }
};

/**
 * Check if foreground service permission is granted (Android 9+)
 * 
 * @returns {Promise<boolean>} - Whether permission is granted
 */
export const checkForegroundServicePermission = async () => {
  try {
    if (Platform.OS === 'android' && PermissionsModule && Platform.Version >= 28) {
      return await PermissionsModule.hasForegroundServicePermission();
    }
    return true; // Not required on older Android versions
  } catch (error) {
    console.error('Error checking foreground service permission:', error);
    return false;
  }
};

/**
 * Request foreground service permission
 * 
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export const requestForegroundServicePermission = async () => {
  try {
    if (Platform.OS === 'android' && PermissionsModule && Platform.Version >= 28) {
      return await PermissionsModule.requestForegroundServicePermission();
    }
    return true; // Not required on older Android versions
  } catch (error) {
    console.error('Error requesting foreground service permission:', error);
    return false;
  }
};
