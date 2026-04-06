import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useModel } from '../context/ModelContext';
import { useUsage } from '../context/UsageContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';

const FaceDetectionScreen = () => {
  const { theme } = useTheme();
  const { isModelLoaded, predictAge } = useModel();
  const { updateAgeGroup } = useUsage();
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // Vision Camera v3/v4 requires getting the device object first
  const device = useCameraDevice('front');

  const camera = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [detectionResult, setDetectionResult] = useState(null);
  const [countdown, setCountdown] = useState(null);

  const borderAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);

  // Request camera permissions on component mount
  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      setHasPermission(cameraPermission === 'granted');

      if (cameraPermission !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Camera access is needed for age detection. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
      }
    })();
  }, []);

  // Setup animations
  useEffect(() => {
    // Animate border when face is detected
    if (faceDetected) {
      borderAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0, { duration: 500 })
        ),
        -1,
        true
      );

      // Start countdown for capture
      let count = 3;
      setCountdown(count);

      const interval = setInterval(() => {
        count -= 1;
        setCountdown(count);

        if (count === 0) {
          clearInterval(interval);
          captureImage();
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      borderAnim.value = 0;
      setCountdown(null);
    }
  }, [faceDetected]);

  // Pulse animation for scanning effect
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  // Handle navigation once age is determined
  useEffect(() => {
    if (detectionResult) {
      // Update the age group in context
      (async () => {
        console.log(`[FaceDetectionScreen] Calling updateAgeGroup with: ${detectionResult.age_group}`);
        await updateAgeGroup(detectionResult.age_group);
        console.log(`[FaceDetectionScreen] updateAgeGroup completed`);

        // Navigate immediately - setTimeout doesn't work reliably after exiting kiosk mode
        console.log(`[FaceDetectionScreen] Navigating to Main screen NOW`);
        navigation.replace('Main');
      })();
    }
  }, [detectionResult]);

  // Function to handle face detection (Simulated for V4 without frame processor plugin)
  useEffect(() => {
    if (isCameraReady && !isCapturing && !processingImage && !faceDetected) {
      // Simulate finding a face after 1.5 seconds to trigger the auto-capture flow
      const timer = setTimeout(() => {
        setFaceDetected(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isCameraReady, isCapturing, processingImage, faceDetected]);

  // Placeholder for the unused function to avoid linter errors if kept
  const onFacesDetected = () => { };

  // Capture image and send to backend for age estimation
  const captureImage = async () => {
    if (camera.current && !isCapturing) {
      try {
        setIsCapturing(true);

        // Capture photo
        const photo = await camera.current.takePhoto({
          qualityPrioritization: 'speed',
          enableAutoStabilization: true,
        });

        // Process captured image
        await processImage(photo.path);

      } catch (error) {
        console.error('Error capturing image:', error);
        Alert.alert('Error', 'Failed to capture image. Please try again.');
        setIsCapturing(false);
        setFaceDetected(false);
      }
    }
  };

  // Process the captured image
  const processImage = async (imagePath) => {
    try {
      setProcessingImage(true);

      // Convert image to base64
      const imageAsBase64 = await RNFS.readFile(imagePath, 'base64');

      // Send to backend for age prediction
      const result = await predictAge(imageAsBase64);

      // Delete the image file after processing (privacy)
      await RNFS.unlink(imagePath);

      // Set detection result to display
      setDetectionResult(result);

    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
      setFaceDetected(false);
    } finally {
      setProcessingImage(false);
      setIsCapturing(false);
    }
  };

  // Skip face detection for testing/development
  const skipDetection = () => {
    // For development only: randomly select an age group
    const ageGroups = ['Child', 'Teen', 'Adult'];
    const randomIndex = Math.floor(Math.random() * 3);
    const randomAgeGroup = ageGroups[randomIndex];

    setDetectionResult({
      age_group: randomAgeGroup,
      confidence: 0.85,
    });
  };

  // Animated styles
  const borderStyle = useAnimatedStyle(() => {
    return {
      borderColor: theme.colors.primary,
      borderWidth: borderAnim.value * 4,
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnim.value }],
      opacity: pulseAnim.value > 1.1 ? 0.7 : 0.3,
    };
  });

  if (!hasPermission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.text }]}>
          Camera permission is required to use this feature
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate('Permissions')}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (detectionResult) {
    // Show detection result before navigating
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Animated.View
          entering={FadeIn.duration(500)}
          style={[styles.resultContainer, { backgroundColor: theme.colors.card }]}
        >
          <Animated.View entering={FadeIn.delay(200)}>
            <Icon name="check-circle" size={100} color={theme.colors.success} style={{ marginBottom: 20 }} />
          </Animated.View>

          <Text style={[styles.resultTitle, { color: theme.colors.primary }]}>
            Age Detected!
          </Text>

          <Text style={[styles.resultText, { color: theme.colors.text }]}>
            You appear to be a{detectionResult.age_group === 'Adult' ? 'n' : ''}
          </Text>

          <Text style={[styles.ageGroupText, { color: theme.colors.primary }]}>
            {detectionResult.age_group}
          </Text>

          <Text style={[styles.confidenceText, { color: theme.colors.textSecondary }]}>
            Confidence: {Math.round(detectionResult.confidence * 100)}%
          </Text>

          <Text style={[styles.redirectingText, { color: theme.colors.textSecondary }]}>
            Redirecting to dashboard...
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isFocused && (
        <Animated.View
          style={[styles.cameraContainer, borderStyle]}
          entering={FadeIn.duration(300)}
        >
          {device != null && (
            <Camera
              ref={camera}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={isFocused}
              photo={true}
              onInitialized={() => setIsCameraReady(true)}
            />
          )}

          {/* Face detection guide overlay */}
          <Animated.View
            style={[styles.faceOverlay, pulseStyle]}
          />

          {/* Countdown display */}
          {faceDetected && countdown !== null && countdown > 0 && (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>
                {countdown}
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      <View style={styles.bottomContainer}>
        <Text style={[styles.instructionText, { color: theme.colors.text }]}>
          {processingImage
            ? 'Processing image...'
            : faceDetected
              ? 'Hold still...'
              : 'Position your face in the center'}
        </Text>

        {/* Development only: skip button */}
        <TouchableOpacity
          style={[styles.skipButton, { backgroundColor: theme.colors.secondary }]}
          onPress={skipDetection}
        >
          <Text style={styles.skipButtonText}>Skip Detection (Dev Only)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    width: 300,
    height: 400,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  faceOverlay: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: '50%',
    height: '50%',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  countdownContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  resultContainer: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '80%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  resultText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 5,
  },
  ageGroupText: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  confidenceText: {
    fontSize: 14,
    marginBottom: 30,
  },
  redirectingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  successAnimation: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
});

export default FaceDetectionScreen;
