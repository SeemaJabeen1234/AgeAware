import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, AppState } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useModel } from '../context/ModelContext';
import { useUsage } from '../context/UsageContext';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  Easing
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


const ModelLoadingScreen = () => {
  const { theme } = useTheme();
  const { isModelLoaded, isModelLoading, modelError, checkModelStatus } = useModel();
  const { isLocked } = useUsage();
  const navigation = useNavigation();

  const [loadingPercentage, setLoadingPercentage] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing AI model...');
  const progressValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);

  // Loading states
  const loadingStates = [
    'Initializing AI model...',
    'Loading MobileNetV2 architecture...',
    'Setting up age classification layers...',
    'Loading pre-trained weights...',
    'Preparing for face detection...',
    'Optimizing for inference...',
    'Almost ready...',
  ];

  useEffect(() => {
    // Start loading animation
    const interval = setInterval(() => {
      if (loadingPercentage < 95 && !isModelLoaded && !modelError) {
        setLoadingPercentage(prev => {
          // Calculate next value based on previous
          const increment = Math.floor(Math.random() * 5) + 1;
          const newValue = Math.min(prev + increment, 95);
          return newValue;
        });
      }
    }, 800);

    return () => clearInterval(interval);
  }, [isModelLoaded, modelError]); // Added dependency to refresh interval closure if needed, though mostly using functional updates

  // Update shared value when loadingPercentage changes
  useEffect(() => {
    progressValue.value = loadingPercentage / 100;

    // Update text based on percentage
    if (loadingPercentage < 100) {
      const stateIndex = Math.min(
        Math.floor(loadingPercentage / (95 / loadingStates.length)),
        loadingStates.length - 1
      );
      setLoadingText(loadingStates[stateIndex]);
    }
  }, [loadingPercentage]);

  useEffect(() => {
    // Start pulse animation
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    // Check model status periodically
    const checkStatusInterval = setInterval(() => {
      checkModelStatus();
    }, 2000);

    return () => {
      // clearInterval(interval); // interval is not in this scope
      clearInterval(checkStatusInterval);
    };
  }, []);

  // Handle model loading completion
  useEffect(() => {
    if (isModelLoaded) {
      setLoadingPercentage(100);
      progressValue.value = withTiming(1, { duration: 500 });

      // Check if app is locked (coming from kiosk mode)
      if (isLocked) {
        // Coming from kiosk mode - stay locked, don't navigate
        setLoadingText('Model loaded. Phone remains locked.');
        console.log('[ModelLoadingScreen] App is locked, NOT navigating to FaceDetection');
      } else {
        // Initial app startup - navigate to face detection
        setLoadingText('Model loaded successfully!');
        console.log('[ModelLoadingScreen] App is NOT locked, navigating to FaceDetection');

        setTimeout(() => {
          navigation.replace('FaceDetection');
        }, 2000);
      }

    } else if (modelError) {
      setLoadingText(`Error: ${modelError}`);
    }
  }, [isModelLoaded, modelError, isLocked]);

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value * 100}%`,
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseValue.value }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        entering={FadeIn.duration(800)}
        style={styles.contentContainer}
      >
        <Animated.View style={[styles.iconContainer, pulseStyle]}>
          <Icon name="brain" size={100} color={theme.colors.primary} />
          {/* Rotating ring around the brain icon */}
          <LoadingSpinner color={theme.colors.primary} size={130} />
        </Animated.View>

        <Text style={[styles.title, { color: theme.colors.primary }]}>
          Loading AI Model
        </Text>

        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          {loadingText}
        </Text>

        <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.border }]}>
          <Animated.View
            style={[
              styles.progressBar,
              progressBarStyle,
              {
                backgroundColor: modelError
                  ? theme.colors.error
                  : isModelLoaded
                    ? theme.colors.success
                    : theme.colors.primary
              }
            ]}
          />
        </View>

        <Text style={[styles.percentageText, { color: theme.colors.textSecondary }]}>
          {loadingPercentage}%
        </Text>

        {modelError && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={24} color={theme.colors.error} />
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              Failed to load model. Please check your internet connection and try again.
            </Text>
          </View>
        )}

        {isModelLoaded && (
          <View style={styles.successContainer}>
            <Icon name="check-circle" size={24} color={theme.colors.success} />
            <Text style={[styles.successText, { color: theme.colors.success }]}>
              Model loaded successfully! Redirecting...
            </Text>
          </View>
        )}

        <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
          This process may take a few moments depending on your device.
        </Text>
      </Animated.View>
    </View>
  );
};

// Reanimated Spinner Component
const LoadingSpinner = ({ color, size }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1
    );
  }, []);

  const style = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
      position: 'absolute',
    };
  });

  return (
    <Animated.View style={style}>
      <Icon name="loading" size={size} color={color} style={{ opacity: 0.5 }} />
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
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    width: 120,
    height: 120,
    marginBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
  },
  percentageText: {
    fontSize: 14,
    marginBottom: 30,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(32, 201, 151, 0.1)',
    marginBottom: 20,
  },
  successText: {
    fontSize: 14,
    marginLeft: 10,
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default ModelLoadingScreen;
