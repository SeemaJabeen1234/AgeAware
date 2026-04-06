import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn } from 'react-native-reanimated';

const PrivacySection = ({ title, content, iconName, theme }) => {
  return (
    <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
      <View style={styles.sectionHeader}>
        <Icon name={iconName} size={24} color={theme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.sectionContent, { color: theme.colors.textSecondary }]}>
        {content}
      </Text>
    </View>
  );
};

const PrivacyScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>
      
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(500)}>
          <Text style={[styles.introduction, { color: theme.colors.text }]}>
            At Age-Aware, we are committed to protecting your privacy and ensuring the security 
            of your personal information. This Privacy Policy explains how we collect, use, and 
            safeguard your data when you use our application.
          </Text>
          
          <PrivacySection
            title="Face Detection & Age Estimation"
            content="Our app uses your device's camera to detect faces and estimate age. All processing happens in real-time and on-device. No facial images or biometric data are stored or transmitted to any server. The app only retains the detected age group (Child, Teen, or Adult) to enforce appropriate screen time limits."
            iconName="face-recognition"
            theme={theme}
          />
          
          <PrivacySection
            title="App Usage Statistics"
            content="We collect data about your app usage patterns solely on your device to provide you with screen time analytics. This includes which apps you use and for how long. This data never leaves your device and is used exclusively to enforce screen time limits and provide you with usage reports."
            iconName="chart-bar"
            theme={theme}
          />
          
          <PrivacySection
            title="Permissions Required"
            content="Our app requires several permissions to function properly: Camera access (for age detection), Usage Stats (to monitor screen time), Accessibility Service (to assist with enforcement), Device Administrator (to lock the device when limits are reached), Display Over Apps (to show lock screen), and Foreground Service (to run in the background). These permissions are used solely for the app's core functionality."
            iconName="key"
            theme={theme}
          />
          
          <PrivacySection
            title="Parent PIN Security"
            content="Your parent PIN is encrypted and stored only on your device using industry-standard encryption methods. We do not have access to your PIN and cannot recover it if forgotten."
            iconName="shield-lock"
            theme={theme}
          />
          
          <PrivacySection
            title="Children's Privacy"
            content="We take children's privacy seriously and comply with applicable laws. We do not knowingly collect personal information from children. Our app is designed to be used with parental supervision for children."
            iconName="account-child"
            theme={theme}
          />
          
          <PrivacySection
            title="Data Retention"
            content="All data collected by Age-Aware is stored locally on your device. Usage statistics are retained for 30 days to provide usage trends and reports. You can clear all data by uninstalling the application or through the app settings."
            iconName="database"
            theme={theme}
          />
          
          <PrivacySection
            title="Third-Party Services"
            content="Age-Aware does not integrate with third-party analytics, advertising services, or social networks. We do not share your data with any third parties."
            iconName="account-group"
            theme={theme}
          />
          
          <PrivacySection
            title="Updates to Privacy Policy"
            content="We may update this Privacy Policy from time to time. Any changes will be reflected in the app with a notification upon update."
            iconName="update"
            theme={theme}
          />
          
          <View style={styles.contactSection}>
            <Text style={[styles.contactTitle, { color: theme.colors.text }]}>
              Contact Us
            </Text>
            <Text style={[styles.contactText, { color: theme.colors.textSecondary }]}>
              If you have any questions or concerns about our Privacy Policy, please contact us at:
              privacy@age-aware.example.com
            </Text>
          </View>
          
          <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
            Privacy Policy Version 1.0, January 2026
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  introduction: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  contactSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    lineHeight: 22,
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
});

export default PrivacyScreen;
