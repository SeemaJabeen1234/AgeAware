import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  SlideInRight,
} from 'react-native-reanimated';
import { formatTime } from '../utils/timeUtils';

const AppUsageBar = ({
  appName,
  usageTime,
  maxTime,
  color = '#4C6EF5',
  textColor = '#000000',
  secondaryTextColor = '#666666',
  backgroundColor = '#F0F0F0',
  index = 0,
}) => {
  // Calculate percentage of usage compared to the max
  const percentage = maxTime > 0 ? (usageTime / maxTime) * 100 : 0;
  const barWidth = useSharedValue(0);

  useEffect(() => {
    // Animate the bar width with a slight delay based on index
    barWidth.value = withTiming(percentage, { 
      duration: 800 + (index * 100) 
    });
  }, [percentage, index]);

  // Animated style for the progress bar
  const animatedBarStyle = useAnimatedStyle(() => {
    return {
      width: `${barWidth.value}%`,
    };
  });

  return (
    <Animated.View 
      style={styles.container}
      entering={SlideInRight.delay(100 * index).duration(400)}
    >
      <View style={styles.headerContainer}>
        <Text 
          style={[styles.appName, { color: textColor }]} 
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {appName}
        </Text>
        <Text style={[styles.usageTime, { color: secondaryTextColor }]}>
          {formatTime(usageTime)}
        </Text>
      </View>
      
      <View style={[styles.barBackground, { backgroundColor }]}>
        <Animated.View 
          style={[
            styles.barFill, 
            animatedBarStyle, 
            { backgroundColor: color }
          ]} 
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  usageTime: {
    fontSize: 12,
    fontWeight: '400',
  },
  barBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default AppUsageBar;
