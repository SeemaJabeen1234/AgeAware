import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Image,
  Dimensions
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useUsage } from '../context/UsageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  SlideInUp
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CircularProgress from '../components/CircularProgress';
import AppUsageBar from '../components/AppUsageBar';
import { formatTime } from '../utils/timeUtils';
import { ageGroupThemes, darkAgeGroupThemes } from '../theme/theme';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const {
    ageGroup,
    remainingTime,
    allowedScreenTime,
    isTimerActive,
    usagePerApp,
    startTimer,
    updateUsageStats
  } = useUsage();
  const { isParentMode } = useAuth();
  const navigation = useNavigation();

  const [refreshing, setRefreshing] = useState(false);
  const [topApps, setTopApps] = useState([]);
  const [timePercent, setTimePercent] = useState(100);
  const [formattedTimeLeft, setFormattedTimeLeft] = useState('');

  const progressValue = useSharedValue(1);
  const headerOpacity = useSharedValue(0);

  // Get the current age group theme
  const getAgeGroupTheme = () => {
    // Default to a basic object if ageGroup is missing to prevent crashes
    if (!ageGroup || !ageGroupThemes[ageGroup]) return {};

    return isDarkMode
      ? darkAgeGroupThemes[ageGroup]
      : ageGroupThemes[ageGroup];
  };

  const ageGroupTheme = getAgeGroupTheme();

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();

      // Start timer if not already active
      // CRITICAL: Only auto-start timer for Child/Teen, NOT for Adults
      if (!isTimerActive && remainingTime > 0 && (ageGroup === 'Child' || ageGroup === 'Teen')) {
        console.log(`[HomeScreen] Auto-starting timer for ${ageGroup}`);
        startTimer();
      } else if (ageGroup === 'Adult') {
        console.log(`[HomeScreen] Skipping timer auto-start for Adult`);
      }

      // Auto-refresh every minute
      const refreshInterval = setInterval(loadData, 60000);

      return () => clearInterval(refreshInterval);
    }, [])
  );

  // Format time and calculate percentage
  useEffect(() => {
    if (remainingTime !== null && allowedScreenTime !== null && allowedScreenTime > 0) {
      const percent = Math.max(0, Math.min(100, (remainingTime / allowedScreenTime) * 100));
      setTimePercent(percent);
      progressValue.value = withTiming(percent / 100, { duration: 1000 });
      setFormattedTimeLeft(formatTime(remainingTime));
    }
  }, [remainingTime, allowedScreenTime]);

  // Animate header when loaded
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800 });
  }, []);

  // Load usage data
  const loadData = async () => {
    setRefreshing(true);

    try {
      // Update usage statistics
      await updateUsageStats();

      // Sort apps by usage time and get top 5
      if (usagePerApp && Object.keys(usagePerApp).length > 0) {
        const apps = Object.values(usagePerApp)
          .sort((a, b) => b.usageTime - a.usageTime)
          .slice(0, 5);

        setTopApps(apps);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    await loadData();
  };

  // Get appropriate status message based on remaining time
  const getStatusMessage = () => {
    if (!remainingTime) return '';

    const hoursLeft = remainingTime / 3600;

    if (hoursLeft > 3) return 'Plenty of time left today!';
    if (hoursLeft > 1) return 'Remember to take breaks!';
    if (hoursLeft > 0.5) return 'Time running low!';
    return 'Almost out of time!';
  };

  // Animated styles
  const headerAnimStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Age Group Banner */}
      <Animated.View
        style={[
          styles.ageGroupBanner,
          { backgroundColor: ageGroupTheme?.primary || theme.colors.primary },
          headerAnimStyle
        ]}
      >
        <View style={styles.bannerContent}>
          <Text style={styles.welcomeText}>
            Hello there!
          </Text>
          <Text style={styles.ageGroupText}>
            {ageGroup || 'Unknown'} Mode
          </Text>
          {isParentMode && (
            <View style={styles.parentBadge}>
              <Icon name="shield-check" size={14} color="#FFFFFF" />
              <Text style={styles.parentBadgeText}>Parent Mode</Text>
            </View>
          )}
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Screen Time Card */}
        <Animated.View
          entering={FadeIn.delay(300).duration(500)}
          style={[styles.card, { backgroundColor: theme.colors.card }]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            Screen Time Remaining
          </Text>

          <View style={styles.timeContainer}>
            <CircularProgress
              percentage={timePercent}
              radius={80}
              strokeWidth={15}
              duration={1000}
              color={ageGroupTheme.primary || theme.colors.primary}
              textColor={theme.colors.text}
              inActiveStrokeColor={theme.colors.border}
              inActiveStrokeOpacity={0.2}
            />

            <View style={styles.timeTextContainer}>
              <Text style={[styles.timeText, { color: theme.colors.text }]}>
                {formattedTimeLeft}
              </Text>
              <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
                remaining
              </Text>
            </View>
          </View>

          <Text style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            {getStatusMessage()}
          </Text>
        </Animated.View>

        {/* App Usage Summary Card */}
        <Animated.View
          entering={FadeIn.delay(500).duration(500)}
          style={[styles.card, { backgroundColor: theme.colors.card }]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              Most Used Apps Today
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Usage')}>
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {topApps.length > 0 ? (
            <View style={styles.appsContainer}>
              {topApps.map((app, index) => (
                <AppUsageBar
                  key={index}
                  appName={app.name}
                  usageTime={app.usageTime}
                  maxTime={topApps[0].usageTime}
                  color={ageGroupTheme.secondary || theme.colors.secondary}
                  textColor={theme.colors.text}
                  secondaryTextColor={theme.colors.textSecondary}
                  backgroundColor={theme.colors.background}
                  index={index}
                />
              ))}
            </View>
          ) : (
            <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
              No app usage data available yet
            </Text>
          )}
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeIn.delay(700).duration(500)}
          style={styles.quickActionsContainer}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Quick Actions
          </Text>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.card }]}
              onPress={() => navigation.navigate('FaceDetection')}
            >
              <Icon name="face-recognition" size={24} color={theme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                Verify Age
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.card }]}
              onPress={() => navigation.navigate('ParentAuth')}
            >
              <Icon name="shield-lock" size={24} color={theme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                Parent Mode
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.card }]}
              onPress={() => navigation.navigate('Privacy')}
            >
              <Icon name="shield-account" size={24} color={theme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                Privacy
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 100,
    paddingBottom: 30,
  },
  ageGroupBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    paddingTop: 40,
    paddingHorizontal: 20,
    zIndex: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  bannerContent: {
    flexDirection: 'column',
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.9,
  },
  ageGroupText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  parentBadge: {
    position: 'absolute',
    right: 0,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  parentBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  timeTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  timeLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  statusText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  viewAllText: {
    fontSize: 14,
  },
  appsContainer: {
    marginTop: 10,
  },
  noDataText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 50) / 3,
    height: 90,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButtonText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default HomeScreen;
