import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  SlideInUp,
  ZoomIn
} from 'react-native-reanimated';

const SetupPINScreen = () => {
  const { theme } = useTheme();
  const { setupPIN, pinSetup } = useAuth();
  const navigation = useNavigation();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState('create'); // 'create' or 'confirm'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const shakeAnim = useSharedValue(0);

  // Prevent accidental back navigation
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        return true; // Prevent going back
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  // Handle PIN digit input
  const handlePinDigit = (digit) => {
    if (step === 'create' && pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === 4) {
        // Move to confirmation step
        setStep('confirm');
      }
    } else if (step === 'confirm' && confirmPin.length < 4) {
      const newConfirmPin = confirmPin + digit;
      setConfirmPin(newConfirmPin);

      if (newConfirmPin.length === 4) {
        // Check if PINs match
        if (newConfirmPin === pin) {
          // Save PIN and proceed
          handleSavePin(newConfirmPin);
        } else {
          // Trigger shake animation
          shakeAnim.value = withTiming(1, { duration: 300 });
          setTimeout(() => {
            shakeAnim.value = 0;
          }, 300);

          setError('PINs do not match. Please try again.');
          setConfirmPin('');
          setStep('create');
          setPin('');
        }
      }
    }
  };

  // Remove last PIN digit
  const handleBackspace = () => {
    if (step === 'create' && pin.length > 0) {
      setPin(pin.slice(0, -1));
    } else if (step === 'confirm' && confirmPin.length > 0) {
      setConfirmPin(confirmPin.slice(0, -1));
    }
    setError('');
  };

  // Clear PIN
  const handleClearPin = () => {
    if (step === 'create') {
      setPin('');
    } else if (step === 'confirm') {
      setConfirmPin('');
    }
    setError('');
  };

  // Handle PIN saving
  const handleSavePin = async (pinToSave) => {
    const success = await setupPIN(pinToSave);

    if (success) {
      setSuccess(true);
      setTimeout(() => {
        navigation.navigate('FaceDetection');
      }, 2000);
    } else {
      setError('Failed to save PIN. Please try again.');
      setPin('');
      setConfirmPin('');
      setStep('create');
    }
  };

  // Animated style for shake effect
  const shakeStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: shakeAnim.value * 10 * Math.sin(10 * shakeAnim.value * Math.PI),
        },
      ],
    };
  });

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.successContainer}>
          <Animated.View entering={ZoomIn.duration(500)}>
            <Icon name="check-circle" size={120} color={theme.colors.success} />
          </Animated.View>
          <Text style={[styles.successTitle, { color: theme.colors.primary }]}>
            PIN Set Successfully
          </Text>
          <Text style={[styles.successMessage, { color: theme.colors.textSecondary }]}>
            Your PIN has been set up successfully. You will now be redirected...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        entering={FadeIn.duration(500)}
        style={styles.content}
      >
        <View style={styles.headerContainer}>
          <Icon name="shield-account" size={60} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {step === 'create' ? 'Create Parent PIN' : 'Confirm PIN'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {step === 'create'
              ? 'Set up a 4-digit PIN for parent access'
              : 'Please re-enter your PIN to confirm'}
          </Text>
        </View>

        <Animated.View style={[styles.pinContainer, shakeStyle]}>
          <View style={styles.pinDisplay}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  {
                    backgroundColor: step === 'create'
                      ? (i < pin.length ? theme.colors.primary : 'transparent')
                      : (i < confirmPin.length ? theme.colors.primary : 'transparent'),
                    borderColor: theme.colors.border,
                  },
                ]}
              />
            ))}
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
          ) : null}
        </Animated.View>

        <Animated.View
          entering={SlideInUp.duration(500).delay(300)}
          style={styles.keypadContainer}
        >
          <View style={styles.keypadRow}>
            {[1, 2, 3].map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.keypadButton, { backgroundColor: theme.colors.card }]}
                onPress={() => handlePinDigit(num.toString())}
              >
                <Text style={[styles.keypadButtonText, { color: theme.colors.text }]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            {[4, 5, 6].map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.keypadButton, { backgroundColor: theme.colors.card }]}
                onPress={() => handlePinDigit(num.toString())}
              >
                <Text style={[styles.keypadButtonText, { color: theme.colors.text }]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            {[7, 8, 9].map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.keypadButton, { backgroundColor: theme.colors.card }]}
                onPress={() => handlePinDigit(num.toString())}
              >
                <Text style={[styles.keypadButtonText, { color: theme.colors.text }]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.keypadRow}>
            <TouchableOpacity
              style={[styles.keypadButton, { backgroundColor: theme.colors.card }]}
              onPress={handleClearPin}
            >
              <Icon name="delete" size={24} color={theme.colors.error} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.keypadButton, { backgroundColor: theme.colors.card }]}
              onPress={() => handlePinDigit('0')}
            >
              <Text style={[styles.keypadButtonText, { color: theme.colors.text }]}>
                0
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.keypadButton, { backgroundColor: theme.colors.card }]}
              onPress={handleBackspace}
            >
              <Icon name="backspace" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          This PIN will be required to access parent mode and modify app settings
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 10,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    width: '100%',
  },
  keypadButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 14,
    paddingHorizontal: 30,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 30,
  }
});

export default SetupPINScreen;
