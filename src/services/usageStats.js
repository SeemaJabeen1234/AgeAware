import { NativeModules, Platform } from 'react-native';
const { UsageStatsModule } = NativeModules;

// Fallback if native module is missing (for dev/bypass)
const isNativeModuleMissing = !UsageStatsModule;

/**
 * Check if usage stats permission is granted
 * 
 * @returns {Promise<boolean>} - Whether permission is granted
 */
export const checkUsageStatsPermission = async () => {
  if (Platform.OS !== 'android') {
    return false;
  }

  if (!UsageStatsModule) {
    console.warn('UsageStatsModule is null');
    return false;
  }

  try {
    return await UsageStatsModule.hasUsageStatsPermission();
  } catch (error) {
    console.error('Error checking usage stats permission:', error);
    return false;
  }
};

/**
 * Request usage stats permission
 * 
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export const requestUsageStatsPermission = async () => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    return await UsageStatsModule.requestUsageStatsPermission();
  } catch (error) {
    console.error('Error requesting usage stats permission:', error);
    return false;
  }
};

/**
 * Get app usage statistics
 * 
 * @param {number} days - Number of days to get stats for (default: 1)
 * @returns {Promise<Object>} - Usage statistics data
 */
export const getUsageStats = async (days = 1) => {
  if (Platform.OS !== 'android') {
    return { error: 'Usage stats are only available on Android' };
  }

  try {
    const hasPermission = await checkUsageStatsPermission();

    if (!hasPermission) {
      return { error: 'Usage stats permission not granted' };
    }

    const stats = await UsageStatsModule.getUsageStats(days);

    // Process and format the stats
    const totalScreenTime = stats.totalScreenTimeMs / 1000; // Convert to seconds

    // Sort apps by usage time
    const sortedApps = stats.apps.sort((a, b) => b.usageTimeMs - a.usageTimeMs);

    return {
      totalScreenTime,
      lastUsedTime: stats.lastUsedTimeMs,
      startTime: stats.startTimeMs,
      endTime: stats.endTimeMs,
      apps: sortedApps.map(app => ({
        packageName: app.packageName,
        appName: app.appName || app.packageName,
        usageTime: app.usageTimeMs / 1000, // Convert to seconds
        lastTimeUsed: app.lastTimeUsedMs,
        launchCount: app.launchCount
      }))
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return { error: error.message || 'Failed to get usage stats' };
  }
};

/**
 * Get daily app usage limits
 * 
 * @returns {Promise<Object>} - App usage limits data
 */
export const getAppUsageLimits = async () => {
  if (Platform.OS !== 'android') {
    return {};
  }

  try {
    return await UsageStatsModule.getAppUsageLimits();
  } catch (error) {
    console.error('Error getting app usage limits:', error);
    return {};
  }
};

export const checkAccessibilityPermission = async () => {
  if (Platform.OS !== 'android') return false;
  if (!UsageStatsModule) return false;
  try {
    return await UsageStatsModule.hasAccessibilityPermission();
  } catch (error) {
    console.error('Error checking accessibility permission:', error);
    return false;
  }
};

export const requestAccessibilityPermission = async () => {
  if (Platform.OS !== 'android') return false;
  if (!UsageStatsModule) return false;
  try {
    await UsageStatsModule.requestAccessibilityPermission();
    return true;
  } catch (error) {
    console.error('Error requesting accessibility permission:', error);
    return false;
  }
};

export const checkDeviceAdminPermission = async () => {
  if (Platform.OS !== 'android') return false;
  if (!UsageStatsModule) return false;
  try {
    return await UsageStatsModule.hasDeviceAdminPermission();
  } catch (error) {
    console.error('Error checking device admin permission:', error);
    return false;
  }
};

export const requestDeviceAdminPermission = async () => {
  if (Platform.OS !== 'android') return false;
  if (!UsageStatsModule) return false;
  try {
    await UsageStatsModule.requestDeviceAdminPermission();
    return true;
  } catch (error) {
    console.error('Error requesting device admin permission:', error);
    return false;
  }
};

export const checkOverlayPermission = async () => {
  if (Platform.OS !== 'android') return true;
  if (!UsageStatsModule) return false;
  try {
    return await UsageStatsModule.hasOverlayPermission();
  } catch (error) {
    console.error('Error checking overlay permission:', error);
    return false;
  }
};

export const requestOverlayPermission = async () => {
  if (Platform.OS !== 'android') return true;
  if (!UsageStatsModule) return false;
  try {
    await UsageStatsModule.requestOverlayPermission();
    return true;
  } catch (error) {
    console.error('Error requesting overlay permission:', error);
    return false;
  }
};

export const startLockTask = async () => {
  if (Platform.OS !== 'android') return;
  if (!UsageStatsModule) return;
  try {
    await UsageStatsModule.startLockTask();
    console.log('App pinned successfully');
  } catch (error) {
    console.error('Error starting lock task:', error);
  }
};

export const stopLockTask = async () => {
  if (Platform.OS !== 'android') return;
  if (!UsageStatsModule) return;
  try {
    await UsageStatsModule.stopLockTask();
    console.log('App unpinned successfully');
  } catch (error) {
    console.error('Error stopping lock task:', error);
  }
};

export const startBackgroundTimer = async (durationMs) => {
  if (Platform.OS !== 'android') return;
  if (!UsageStatsModule) return;
  try {
    await UsageStatsModule.startBackgroundTimer(durationMs);
    console.log(`Background timer started for ${durationMs}ms`);
  } catch (error) {
    console.error('Error starting background timer:', error);
  }
};

export const stopBackgroundTimer = async () => {
  if (Platform.OS !== 'android') return;
  if (!UsageStatsModule) return;
  try {
    await UsageStatsModule.stopBackgroundTimer();
    console.log('Background timer stopped');
  } catch (error) {
    console.error('Error stopping background timer:', error);
  }
};

export const lockDeviceNow = async () => {
  if (Platform.OS !== 'android') return false;
  if (!UsageStatsModule) return false;
  try {
    await UsageStatsModule.lockDeviceNow();
    console.log('Device locked via system lock screen');
    return true;
  } catch (error) {
    console.error('Error locking device:', error);
    return false;
  }
};
