import React, { createContext, useState, useContext, useEffect } from 'react';
import { storeData, getData } from '../utils/storage';
import { Alert } from 'react-native';
import * as Crypto from '../utils/crypto';

// Create the context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isParentMode, setIsParentMode] = useState(false);
  const [pinSetup, setPinSetup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [pinEntryAttempts, setPinEntryAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState(null);

  // Maximum allowed PIN entry attempts before lockout
  const MAX_PIN_ATTEMPTS = 5;
  // Lockout duration in minutes
  const LOCKOUT_DURATION = 5;

  // Initialize auth state from storage on app start
  useEffect(() => {
    // Explicitly clear PIN setup on mount to force new PIN generation
    setPinSetup(false);
    loadAuthState();
  }, []);

  // Check for lockout expiration
  useEffect(() => {
    if (isLockedOut && lockoutEndTime) {
      const checkLockoutInterval = setInterval(() => {
        if (new Date() >= new Date(lockoutEndTime)) {
          setIsLockedOut(false);
          setPinEntryAttempts(0);
          clearInterval(checkLockoutInterval);
        }
      }, 1000);

      return () => clearInterval(checkLockoutInterval);
    }
  }, [isLockedOut, lockoutEndTime]);

  // Load authentication state from storage
  const loadAuthState = async () => {
    try {
      const authState = await getData('authState');

      if (authState) {
        // PER USER REQUEST: Do not restore PIN on reload. 
        // Force new PIN setup every time app opens.
        // setPinSetup(!!authState.pin); 

        setIsParentMode(false); // Always start in child mode

        // Check if there's a lockout in effect
        if (authState.isLockedOut && authState.lockoutEndTime) {
          const lockoutEnd = new Date(authState.lockoutEndTime);

          if (new Date() < lockoutEnd) {
            // Lockout still in effect
            setIsLockedOut(true);
            setLockoutEndTime(authState.lockoutEndTime);
          } else {
            // Lockout expired
            setIsLockedOut(false);
            setPinEntryAttempts(0);
          }
        }
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    }
  };

  // Save authentication state to storage
  const saveAuthState = async (newState = {}) => {
    try {
      // Use provided state or fall back to current state, but prefer parameters for fresh values
      const pinToSave = newState.pin !== undefined ? newState.pin : currentUser?.pin;
      const pinSetupToSave = newState.pinSetup !== undefined ? newState.pinSetup : pinSetup;

      const authState = {
        pin: pinToSave, // Store encrypted PIN
        pinSetup: pinSetupToSave,
        pinEntryAttempts: newState.pinEntryAttempts ?? pinEntryAttempts,
        isLockedOut: newState.isLockedOut ?? isLockedOut,
        lockoutEndTime: (newState.lockoutEndTime ?? lockoutEndTime) ? (newState.lockoutEndTime ?? lockoutEndTime).toISOString() : null,
      };

      await storeData('authState', authState);
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  };

  // Set up the parent PIN
  const setupPIN = async (pin) => {
    try {
      if (!pin || pin.length !== 4 || isNaN(pin)) {
        throw new Error('PIN must be a 4-digit number');
      }

      // Encrypt the PIN before storing
      const encryptedPin = await Crypto.encrypt(pin);

      setCurrentUser({
        pin: encryptedPin,
        isParent: true,
      });

      setPinSetup(true);
      setIsParentMode(true);

      // Save auth state with explicit new values
      await saveAuthState({
        pin: encryptedPin,
        pinSetup: true
      });

      return true;
    } catch (error) {
      console.error('Error setting up PIN:', error);
      Alert.alert('Error', `Failed to set up PIN: ${error.message}`);
      return false;
    }
  };

  // Verify the parent PIN
  const verifyPIN = async (pin) => {
    try {
      // If lockout is in effect, reject PIN verification
      if (isLockedOut) {
        const remainingTime = Math.ceil(
          (new Date(lockoutEndTime) - new Date()) / 60000
        );
        Alert.alert(
          'Account Locked',
          `Too many incorrect attempts. Please try again in ${remainingTime} minutes.`
        );
        return false;
      }

      const authState = await getData('authState');

      if (!authState || !authState.pin) {
        throw new Error('No PIN is set up');
      }

      // Decrypt stored PIN and compare
      const decryptedPin = await Crypto.decrypt(authState.pin);

      if (pin === decryptedPin) {
        // Successful PIN entry
        setIsParentMode(true);
        setPinEntryAttempts(0);
        return true;
      } else {
        // Failed PIN entry
        const newAttempts = pinEntryAttempts + 1;
        setPinEntryAttempts(newAttempts);

        // Check if max attempts reached
        if (newAttempts >= MAX_PIN_ATTEMPTS) {
          const endTime = new Date();
          endTime.setMinutes(endTime.getMinutes() + LOCKOUT_DURATION);

          setIsLockedOut(true);
          setLockoutEndTime(endTime);

          Alert.alert(
            'Too Many Attempts',
            `Account locked for ${LOCKOUT_DURATION} minutes due to too many failed PIN attempts.`
          );
        } else {
          Alert.alert(
            'Incorrect PIN',
            `Invalid PIN. ${MAX_PIN_ATTEMPTS - newAttempts} attempts remaining.`
          );
        }

        // Save updated auth state
        await saveAuthState();
        return false;
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      Alert.alert('Error', `Failed to verify PIN: ${error.message}`);
      return false;
    }
  };

  // Change the parent PIN
  const changePIN = async (oldPin, newPin) => {
    try {
      // Verify old PIN first
      const isVerified = await verifyPIN(oldPin);

      if (!isVerified) {
        return false;
      }

      if (!newPin || newPin.length !== 4 || isNaN(newPin)) {
        throw new Error('New PIN must be a 4-digit number');
      }

      // Encrypt the new PIN
      const encryptedPin = await Crypto.encrypt(newPin);

      setCurrentUser({
        ...currentUser,
        pin: encryptedPin,
      });

      // Save auth state
      await saveAuthState();

      Alert.alert('Success', 'PIN has been successfully changed');
      return true;
    } catch (error) {
      console.error('Error changing PIN:', error);
      Alert.alert('Error', `Failed to change PIN: ${error.message}`);
      return false;
    }
  };

  // Exit parent mode
  const exitParentMode = () => {
    setIsParentMode(false);
  };

  const value = {
    isParentMode,
    pinSetup,
    currentUser,
    isLockedOut,
    lockoutEndTime,
    setupPIN,
    verifyPIN,
    changePIN,
    exitParentMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
