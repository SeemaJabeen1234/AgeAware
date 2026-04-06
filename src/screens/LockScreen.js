import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Dimensions,
  StatusBar
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useUsage } from '../context/UsageContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeIn
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


const { width, height } = Dimensions.get('window');

const LockScreen = () => {
  const { theme } = useTheme();
  const { pinSetup, verifyPIN } = useAuth();
  const { ageGroup, unlockDevice } = useUsage();
  const navigation = useNavigation();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [extensionTime, setExtensionTime] = useState(0);

  const pulseAnim = useSharedValue(1);
  const iconRotate = useSharedValue(0);

  // Prevent going back
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        return true; // Prevent going back
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  // Setup animations
  useEffect(() => {
    // Pulse animation
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );

    // Icon rotation animation
    iconRotate.value = withRepeat(
      withTiming(360, { duration: 10000 }),
      -1
    );
  }, []);

  // Handle PIN input
  const handlePinDigit = (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  // Remove last PIN digit
  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setError('');
    }
  };

  // Clear PIN
  const handleClearPin = () => {
    setPin('');
    setError('');
  };

  // Verify entered PIN
  const verifyPin = async (enteredPin) => {
    const isCorrect = await verifyPIN(enteredPin);

    if (isCorrect) {
      setShowOptions(true);
      setError('');
    } else {
      setPin('');
      setError('Incorrect PIN. Please try again.');
    }
  };

  // Handle device unlock with extension
  const handleUnlock = () => {
    unlockDevice(extensionTime);
    navigation.navigate('Main');
  };

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnim.value }],
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${iconRotate.value}deg` }],
    };
  });

  const renderPinPad = () => (
    <View style={styles.pinPadContainer}>
      <View style={styles.pinDisplay}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.pinDot,
              {
                backgroundColor: i < pin.length ? theme.colors.primary : 'transparent',
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
      ) : (
        <Text style={[styles.instructionText, { color: theme.colors.text }]}>
          Enter parent PIN to unlock
        </Text>
      )}

      <View style={styles.keypadContainer}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
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
    </View>
  );

  const renderExtensionOptions = () => (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={styles.extensionContainer}
    >
      <Text style={[styles.extensionTitle, { color: theme.colors.text }]}>
        Screen Time Extension
      </Text>

      <Text style={[styles.extensionText, { color: theme.colors.textSecondary }]}>
        How much extra time would you like to add?
      </Text>

      <View style={styles.timeOptions}>
        {[15, 30, 45, 60].map((minutes) => (
          <TouchableOpacity
            key={minutes}
            style={[
              styles.timeOption,
              {
                backgroundColor: extensionTime === minutes
                  ? theme.colors.primary
                  : theme.colors.card,
                borderColor: theme.colors.border
              }
            ]}
            onPress={() => setExtensionTime(minutes)}
          >
            <Text
              style={[
                styles.timeOptionText,
                {
                  color: extensionTime === minutes
                    ? '#FFFFFF'
                    : theme.colors.text
                }
              ]}
            >
              {minutes} min
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.error }]}
          onPress={() => setShowOptions(false)}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: extensionTime > 0
                ? theme.colors.primary
                : theme.colors.disabled,
              opacity: extensionTime > 0 ? 1 : 0.7
            }
          ]}
          onPress={handleUnlock}
          disabled={extensionTime === 0}
        >
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      <View style={styles.topContent}>
        <Animated.View style={[styles.iconContainer, pulseStyle]}>
          <Icon
            name="clock-time-four-outline"
            size={60}
            color={theme.colors.primary}
          />
        </Animated.View>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          Screen Time Limit Reached
        </Text>

        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          {ageGroup === 'Child' ? (
            "It's time for a break! You've used all your allowed screen time for today."
          ) : ageGroup === 'Teen' ? (
            "You've reached your screen time limit. Time for a break or ask a parent to extend."
          ) : (
            "You've reached your set screen time limit."
          )}
        </Text>
      </View>

      {!showOptions ? renderPinPad() : renderExtensionOptions()}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Age-Aware Screen Time Regulator
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  topContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(76, 110, 245, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  pinPadContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
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
    marginBottom: 20,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  keypadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
  },
  keypadButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
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
  extensionContainer: {
    width: '90%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  extensionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  extensionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 30,
  },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    borderWidth: 1,
    margin: 5,
  },
  timeOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  footerText: {
    fontSize: 12,
  },
});

export default LockScreen;
