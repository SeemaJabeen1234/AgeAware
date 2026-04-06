import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useUsage } from '../context/UsageContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';

const SettingsScreen = () => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { isParentMode, pinSetup, verifyPIN, changePIN, exitParentMode } = useAuth();
  const { ageGroup, updateTimeLimit, timeLimits: contextTimeLimits } = useUsage();
  const navigation = useNavigation();

  const [showPinDialog, setShowPinDialog] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Time limits per age group (in minutes)
  const [timeLimits, setTimeLimits] = useState({
    Child: contextTimeLimits?.Child || 60,
    Teen: contextTimeLimits?.Teen || 120,
    Adult: contextTimeLimits?.Adult || 240,
  });

  // Update local state when context changes (e.g. loaded from storage)
  useEffect(() => {
    if (contextTimeLimits) {
      setTimeLimits({
        Child: contextTimeLimits.Child || 60,
        Teen: contextTimeLimits.Teen || 120,
        Adult: contextTimeLimits.Adult || 240,
      });
    }
  }, [contextTimeLimits]);

  // Handle saving time limits
  const handleSaveTimeLimits = () => {
    // Update time limits in context
    Object.keys(timeLimits).forEach(group => {
      updateTimeLimit(group, timeLimits[group]);
    });

    Alert.alert(
      'Settings Saved',
      'Screen time limits have been updated.',
      [{ text: 'OK' }]
    );
  };

  // Handle PIN change
  const handlePinChange = async () => {
    // Reset error
    setPinError('');

    // Validation
    if (!currentPin || currentPin.length !== 4) {
      setPinError('Please enter your current 4-digit PIN');
      return;
    }

    if (!newPin || newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setPinError('New PIN must be 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('PINs do not match');
      return;
    }

    // Try to change PIN
    const success = await changePIN(currentPin, newPin);
    if (success) {
      // Clear inputs
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setShowPinDialog(false);

      Alert.alert('Success', 'Your PIN has been changed successfully');
    }
  };

  // Render settings section header
  const SettingsSectionHeader = ({ title }) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.primary }]}>
      {title}
    </Text>
  );

  // Render settings item
  const SettingsItem = ({ icon, title, description, rightElement, onPress }) => (
    <TouchableOpacity
      style={[styles.settingsItem, { backgroundColor: theme.colors.card }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsItemLeft}>
        <Icon name={icon} size={24} color={theme.colors.primary} style={styles.settingsItemIcon} />
        <View style={styles.settingsItemTextContainer}>
          <Text style={[styles.settingsItemTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
          {description && (
            <Text style={[styles.settingsItemDescription, { color: theme.colors.textSecondary }]}>
              {description}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingsItemRight}>
        {rightElement}
      </View>
    </TouchableOpacity>
  );

  // Render PIN change dialog
  const renderPinDialog = () => (
    <View style={[styles.pinDialogContainer, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
      <Animated.View
        entering={SlideInRight.duration(300)}
        style={[styles.pinDialog, { backgroundColor: theme.colors.card }]}
      >
        <Text style={[styles.pinDialogTitle, { color: theme.colors.text }]}>
          Change PIN
        </Text>

        {pinError ? (
          <Text style={[styles.pinError, { color: theme.colors.error }]}>
            {pinError}
          </Text>
        ) : (
          <Text style={[styles.pinDialogDescription, { color: theme.colors.textSecondary }]}>
            Enter your current PIN and new PIN
          </Text>
        )}

        <TextInput
          style={[
            styles.pinInput,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }
          ]}
          placeholder="Current PIN"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          value={currentPin}
          onChangeText={setCurrentPin}
        />

        <TextInput
          style={[
            styles.pinInput,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }
          ]}
          placeholder="New PIN (4 digits)"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          value={newPin}
          onChangeText={setNewPin}
        />

        <TextInput
          style={[
            styles.pinInput,
            {
              backgroundColor: theme.colors.background,
              color: theme.colors.text,
              borderColor: theme.colors.border
            }
          ]}
          placeholder="Confirm New PIN"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry
          value={confirmPin}
          onChangeText={setConfirmPin}
        />

        <View style={styles.pinDialogButtons}>
          <TouchableOpacity
            style={[
              styles.pinDialogButton,
              { backgroundColor: theme.colors.error }
            ]}
            onPress={() => {
              setShowPinDialog(false);
              setCurrentPin('');
              setNewPin('');
              setConfirmPin('');
              setPinError('');
            }}
          >
            <Text style={styles.pinDialogButtonText}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pinDialogButton,
              { backgroundColor: theme.colors.primary }
            ]}
            onPress={handlePinChange}
          >
            <Text style={styles.pinDialogButtonText}>
              Change PIN
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Animated.Text
          entering={FadeIn.duration(500)}
          style={styles.headerTitle}
        >
          Settings
        </Animated.Text>

        {isParentMode && (
          <TouchableOpacity
            style={styles.exitParentModeButton}
            onPress={exitParentMode}
          >
            <Icon name="account-convert" size={20} color="#FFFFFF" />
            <Text style={styles.exitParentModeText}>Exit Parent Mode</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Screen Time Settings */}
        <SettingsSectionHeader title="Screen Time Limits" />

        {!isParentMode ? (
          <View style={[styles.parentLockOverlay, { backgroundColor: theme.colors.card }]}>
            <Icon name="lock" size={40} color={theme.colors.textSecondary} />
            <Text style={[styles.parentLockText, { color: theme.colors.textSecondary }]}>
              Parent mode required
            </Text>
            <TouchableOpacity
              style={[styles.parentLockButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => navigation.navigate('ParentAuth')}
            >
              <Text style={styles.parentLockButtonText}>
                Enter Parent Mode
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Child time limit */}
            <View style={[styles.timeSettingItem, { backgroundColor: theme.colors.card }]}>
              <View style={styles.timeSettingHeader}>
                <Text style={[styles.timeSettingTitle, { color: theme.colors.text }]}>
                  Child Mode
                </Text>
                <Text style={[styles.timeSettingValue, { color: theme.colors.primary }]}>
                  {timeLimits.Child} min
                </Text>
              </View>

              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={120}
                step={5}
                value={timeLimits.Child}
                onValueChange={(value) => setTimeLimits({ ...timeLimits, Child: value })}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
              />

              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
                  5 min
                </Text>
                <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
                  120 min
                </Text>
              </View>
            </View>

            {/* Teen time limit */}
            <View style={[styles.timeSettingItem, { backgroundColor: theme.colors.card }]}>
              <View style={styles.timeSettingHeader}>
                <Text style={[styles.timeSettingTitle, { color: theme.colors.text }]}>
                  Teen Mode
                </Text>
                <Text style={[styles.timeSettingValue, { color: theme.colors.primary }]}>
                  {timeLimits.Teen} min
                </Text>
              </View>

              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={240}
                step={10}
                value={timeLimits.Teen}
                onValueChange={(value) => setTimeLimits({ ...timeLimits, Teen: value })}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
              />

              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
                  5 min
                </Text>
                <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
                  240 min
                </Text>
              </View>
            </View>

            {/* Adult time limit */}
            <View style={[styles.timeSettingItem, { backgroundColor: theme.colors.card }]}>
              <View style={styles.timeSettingHeader}>
                <Text style={[styles.timeSettingTitle, { color: theme.colors.text }]}>
                  Adult Mode
                </Text>
                <Text style={[styles.timeSettingValue, { color: theme.colors.primary }]}>
                  {timeLimits.Adult} min
                </Text>
              </View>

              <Slider
                style={styles.slider}
                minimumValue={5}
                maximumValue={480}
                step={30}
                value={timeLimits.Adult}
                onValueChange={(value) => setTimeLimits({ ...timeLimits, Adult: value })}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
              />

              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
                  5 min
                </Text>
                <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
                  480 min
                </Text>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleSaveTimeLimits}
            >
              <Text style={styles.saveButtonText}>
                Save Time Limits
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* App Settings */}
        <SettingsSectionHeader title="App Settings" />

        <SettingsItem
          icon="theme-light-dark"
          title="Dark Mode"
          description="Toggle between light and dark theme"
          rightElement={
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.colors.disabled, true: theme.colors.primary + '80' }}
              thumbColor={isDarkMode ? theme.colors.primary : '#f4f3f4'}
            />
          }
        />

        <SettingsItem
          icon="face-recognition"
          title="Verify Age"
          description="Run facial age verification again"
          rightElement={
            <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          }
          onPress={() => navigation.navigate('FaceDetection')}
        />

        {/* Security Settings */}
        <SettingsSectionHeader title="Security" />

        <SettingsItem
          icon="shield-lock"
          title="Change Parent PIN"
          description={pinSetup ? "Update your 4-digit security PIN" : "Set up a 4-digit security PIN"}
          rightElement={
            <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          }
          onPress={() => setShowPinDialog(true)}
        />

        <SettingsItem
          icon="refresh"
          title="Reset Daily Limits"
          description="Reset today's screen time usage"
          rightElement={
            <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          }
          onPress={() => {
            if (isParentMode) {
              Alert.alert(
                'Reset Daily Limits',
                'Are you sure you want to reset today\'s screen time limits?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: () => {
                      // Reset daily limits here
                      Alert.alert('Success', 'Daily limits have been reset');
                    }
                  }
                ]
              );
            } else {
              Alert.alert(
                'Parent Mode Required',
                'You need to enter parent mode to reset daily limits',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Enter Parent Mode',
                    onPress: () => navigation.navigate('ParentAuth')
                  }
                ]
              );
            }
          }}
        />

        {/* About */}
        <SettingsSectionHeader title="About" />

        <SettingsItem
          icon="shield-account"
          title="Privacy Policy"
          description="Read our privacy policy"
          rightElement={
            <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          }
          onPress={() => navigation.navigate('Privacy')}
        />

        <SettingsItem
          icon="information"
          title="About Age-Aware"
          description="Version 1.0.0"
          rightElement={
            <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          }
        />
      </ScrollView>

      {/* PIN change dialog */}
      {showPinDialog && renderPinDialog()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  exitParentModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 15,
    bottom: 15,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 15,
  },
  exitParentModeText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemIcon: {
    marginRight: 12,
  },
  settingsItemTextContainer: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingsItemDescription: {
    fontSize: 12,
    marginTop: 3,
  },
  settingsItemRight: {
    marginLeft: 8,
  },
  parentLockOverlay: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  parentLockText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 15,
  },
  parentLockButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  parentLockButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timeSettingItem: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  timeSettingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeSettingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  timeSettingValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 12,
  },
  saveButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pinDialogContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  pinDialog: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 15,
    padding: 20,
  },
  pinDialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  pinDialogDescription: {
    textAlign: 'center',
    marginBottom: 20,
  },
  pinError: {
    textAlign: 'center',
    marginBottom: 20,
  },
  pinInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  pinDialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  pinDialogButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  pinDialogButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default SettingsScreen;
