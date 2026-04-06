import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useModel } from '../context/ModelContext';
import { useAuth } from '../context/AuthContext';
import { useUsage } from '../context/UsageContext';
import { useTheme } from '../context/ThemeContext';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import PermissionsScreen from '../screens/PermissionsScreen';
import ModelLoadingScreen from '../screens/ModelLoadingScreen';
import FaceDetectionScreen from '../screens/FaceDetectionScreen';
import HomeScreen from '../screens/HomeScreen';
import AppUsageScreen from '../screens/AppUsageScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LockScreen from '../screens/LockScreen';
import ParentAuthScreen from '../screens/ParentAuthScreen';
import SetupPINScreen from '../screens/SetupPINScreen';
import PrivacyScreen from '../screens/PrivacyScreen';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator (only shown when unlocked)
const MainTabNavigator = () => {
  const { theme } = useTheme();
  const { isLocked } = useUsage();

  useEffect(() => {
    if (isLocked) {
      // Navigate to lock screen logic could go here, or handled by a separate listener
      // For now, allow rendering but rely on context to trigger lock behavior
    }
  }, [isLocked]);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Usage"
        component={AppUsageScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-bar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Root navigation stack
const AppNavigator = () => {
  const { isModelLoaded, isModelLoading } = useModel();
  const { pinSetup, isParentMode } = useAuth();
  const { isLocked, ageGroup } = useUsage();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Initial setup flow */}
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
      <Stack.Screen name="ModelLoading" component={ModelLoadingScreen} />

      {/* PIN setup (only shown if PIN is not set) */}
      {!pinSetup && (
        <Stack.Screen name="SetupPIN" component={SetupPINScreen} />
      )}

      {/* Face detection (only if model is loaded and not in lock state) */}
      <Stack.Screen name="FaceDetection" component={FaceDetectionScreen} />



      {/* Parent authentication */}
      <Stack.Screen name="ParentAuth" component={ParentAuthScreen} />

      {/* Privacy info screen */}
      <Stack.Screen name="Privacy" component={PrivacyScreen} />

      {/* Main app or Lock Screen based on state */}
      {isLocked ? (
        <Stack.Screen name="Lock" component={LockScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
