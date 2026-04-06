import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  withRepeat,
  Easing
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SplashScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Logo animation
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 1000 });

    // Continuous rotation for outer ring effect if we added one, or just simple logo entrance

    // Navigate to Permissions screen after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('Permissions');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: withTiming(opacity.value === 1 ? 0 : 20, { duration: 800 }) }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Animated logo */}
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Icon name="shield-check" size={100} color={theme.colors.primary} />
      </Animated.View>

      {/* App name with fade-in animation */}
      <Animated.Text style={[
        styles.appName,
        { color: theme.colors.primary },
        textStyle
      ]}>
        Age-Aware
      </Animated.Text>

      <Animated.Text style={[
        styles.tagline,
        { color: theme.colors.textSecondary },
        textStyle
      ]}>
        AI-Powered Screen Time Regulator
      </Animated.Text>

      {/* Loading indicator */}
      <View style={styles.loaderContainer}>
        <LoadingSpinner color={theme.colors.primary} />
      </View>
    </View>
  );
};

// Simple Reanimated Spinner Component
const LoadingSpinner = ({ color }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1
    );
  }, []);

  const style = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <Animated.View style={style}>
      <Icon name="loading" size={30} color={color} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(76, 110, 245, 0.1)',
    borderRadius: 75,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    marginBottom: 60,
    textAlign: 'center',
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
  },
});

export default SplashScreen;
