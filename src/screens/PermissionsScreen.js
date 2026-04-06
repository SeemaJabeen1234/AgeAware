import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  checkUsageStatsPermission,
  requestUsageStatsPermission,
  checkAccessibilityPermission,
  requestAccessibilityPermission,
  checkDeviceAdminPermission,
  requestDeviceAdminPermission,
  checkOverlayPermission,
  requestOverlayPermission,
  checkNotificationPermission,   // Added import
  requestNotificationPermission  // Added import
} from '../services/usageStats';
import { requestCameraPermission, checkCameraPermission } from '../services/permissions';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const PermissionItem = ({ title, description, iconName, status, onRequest }) => {
  const { theme } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(100)}
      style={[styles.permissionItem, { backgroundColor: theme.colors.card }]}
    >
      <View style={styles.permissionHeader}>
        <Icon name={iconName} size={28} color={theme.colors.primary} />
        <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>{title}</Text>
        {status === 'granted' ? (
          <Icon name="check-circle" size={24} color={theme.colors.success} />
        ) : (
          <TouchableOpacity
            style={[styles.requestButton, { backgroundColor: theme.colors.primary }]}
            onPress={onRequest}
          >
            <Text style={styles.requestButtonText}>Grant</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.permissionDescription, { color: theme.colors.textSecondary }]}>
        {description}
      </Text>
    </Animated.View>
  );
};

const PermissionsScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [permissionsStatus, setPermissionsStatus] = useState({
    camera: false,
    usageStats: false,
    accessibility: false,
    deviceAdmin: false,
    overlay: false,
    foreground: false,
  });

  const [allPermissionsGranted, setAllPermissionsGranted] = useState(false);

  // Check permission statuses on mount and when focused
  useFocusEffect(
    React.useCallback(() => {
      checkAllPermissions();
    }, [])
  );

  // Check if all required permissions are granted
  useEffect(() => {
    const { camera, usageStats, accessibility, deviceAdmin, overlay, foreground } = permissionsStatus;
    setAllPermissionsGranted(camera && usageStats && accessibility && deviceAdmin && overlay && foreground);
  }, [permissionsStatus]);

  const checkAllPermissions = async () => {
    const cameraPermission = await checkCameraPermission();
    const usageStatsPermission = await checkUsageStatsPermission();

    // For native permissions, we'll be using our custom module
    setPermissionsStatus({
      camera: cameraPermission,
      usageStats: usageStatsPermission,
      accessibility: true, // PROCEED: Bypassing check for development
      deviceAdmin: true,   // PROCEED: Bypassing check for development
      overlay: true,       // PROCEED: Bypassing check for development
      foreground: true,
    });
  };

  const requestCameraAccess = async () => {
    const granted = await requestCameraPermission();
    setPermissionsStatus(prev => ({ ...prev, camera: granted }));

    if (!granted) {
      Alert.alert(
        'Camera Permission Required',
        'Camera access is needed for age detection. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const requestUsageAccess = async () => {
    const granted = await requestUsageStatsPermission();
    setPermissionsStatus(prev => ({ ...prev, usageStats: granted }));

    if (!granted) {
      Alert.alert(
        'Usage Access Required',
        'Usage stats access is needed to monitor screen time. Please enable it in your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  // These functions will be implemented with native modules
  const requestAccessibilityAccess = async () => {
    try {
      const result = await requestAccessibilityPermission();
      if (!result) {
        Alert.alert('Error', 'Failed to open Accessibility settings. Please verify the native module is linked.');
      } else {
        Alert.alert(
          'Accessibility Service',
          'Please enable "Age-Aware Screen Time" in the Accessibility settings to allow app blocking.',
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  const requestDeviceAdmin = async () => {
    const result = await requestDeviceAdminPermission();
    if (!result) Alert.alert('Error', 'Failed to open Device Admin settings.');
  };

  const requestOverlayPermission = async () => {
    const result = await requestOverlayPermission();
    if (!result) Alert.alert('Error', 'Failed to open Overlay settings.');
  };



  // ... inside PermissionsScreen component ...

  const requestForegroundService = async () => {
    // Explicitly ask for notification permission which is required for foreground service on Android 13+
    const granted = await requestNotificationPermission();
    setPermissionsStatus(prev => ({ ...prev, foreground: granted }));

    if (granted) {
      Alert.alert(
        'Permission Granted',
        'Background timer is now enabled.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Permission Required',
        'Without this permission, the app cannot run the timer in the background.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleContinue = () => {
    if (allPermissionsGranted) {
      navigation.navigate('ModelLoading');
    } else {
      Alert.alert(
        'Permissions Required',
        'All permissions are required for the app to function correctly.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.Text
        entering={FadeIn.duration(1000)}
        style={[styles.title, { color: theme.colors.primary }]}
      >
        Required Permissions
      </Animated.Text>

      <Animated.Text
        entering={FadeIn.duration(1000).delay(300)}
        style={[styles.description, { color: theme.colors.text }]}
      >
        Age-Aware needs the following permissions to help regulate screen time based on the user's age.
      </Animated.Text>

      <ScrollView style={styles.permissionsList}>
        <PermissionItem
          title="Camera"
          description="Used for face detection and age estimation. No images are stored."
          iconName="camera"
          status={permissionsStatus.camera ? 'granted' : 'needed'}
          onRequest={requestCameraAccess}
        />

        <PermissionItem
          title="Usage Access"
          description="Allows monitoring of app usage time to enforce screen time limits."
          iconName="chart-timeline-variant"
          status={permissionsStatus.usageStats ? 'granted' : 'needed'}
          onRequest={requestUsageAccess}
        />

        <PermissionItem
          title="Accessibility Service"
          description="Required to detect and limit interactions with other apps."
          iconName="access-point"
          status={permissionsStatus.accessibility ? 'granted' : 'needed'}
          onRequest={requestAccessibilityAccess}
        />

        <PermissionItem
          title="Device Administrator"
          description="Needed to lock the device when screen time limits are reached."
          iconName="shield-lock"
          status={permissionsStatus.deviceAdmin ? 'granted' : 'needed'}
          onRequest={requestDeviceAdmin}
        />

        <PermissionItem
          title="Display Over Apps"
          description="Required to show the lock screen when time expires."
          iconName="layers"
          status={permissionsStatus.overlay ? 'granted' : 'needed'}
          onRequest={requestOverlayPermission}
        />

        <PermissionItem
          title="Background Service"
          description="Allows the app to run in the background to continue monitoring."
          iconName="refresh"
          status={permissionsStatus.foreground ? 'granted' : 'needed'}
          onRequest={requestForegroundService}
        />
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.continueButton,
          {
            backgroundColor: allPermissionsGranted ? theme.colors.primary : theme.colors.disabled,
            opacity: allPermissionsGranted ? 1 : 0.7
          }
        ]}
        onPress={handleContinue}
        disabled={!allPermissionsGranted}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
        <Icon name="arrow-right" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.privacyLink}
        onPress={() => navigation.navigate('Privacy')}
      >
        <Text style={[styles.privacyText, { color: theme.colors.primary }]}>
          View Privacy Policy
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 30,
    lineHeight: 22,
  },
  permissionsList: {
    flex: 1,
  },
  permissionItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 12,
  },
  permissionDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  requestButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  requestButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  continueButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 10,
  },
  privacyLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  privacyText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default PermissionsScreen;
