import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CircularProgress = ({
  percentage = 75,
  radius = 40,
  strokeWidth = 10,
  duration = 500,
  color = '#4C6EF5',
  textColor = '#000',
  inActiveStrokeColor = '#E5E5E5',
  inActiveStrokeOpacity = 0.5,
  showPercentage = false,
  children,
}) => {
  // Calculate values for svg
  const circumference = 2 * Math.PI * radius;
  const halfCircle = radius + strokeWidth;
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    // Animate the progress
    animatedValue.value = withTiming(percentage / 100, { duration });
  }, [percentage, duration]);

  // Animated props for the progress arc
  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference - (circumference * animatedValue.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={styles.container}>
      <Svg
        width={radius * 2 + strokeWidth * 2}
        height={radius * 2 + strokeWidth * 2}
        viewBox={`0 0 ${halfCircle * 2} ${halfCircle * 2}`}
      >
        <G rotation="-90" origin={`${halfCircle}, ${halfCircle}`}>
          {/* Background Circle */}
          <Circle
            cx={halfCircle}
            cy={halfCircle}
            r={radius}
            fill="transparent"
            stroke={inActiveStrokeColor}
            strokeWidth={strokeWidth}
            strokeOpacity={inActiveStrokeOpacity}
          />
          {/* Foreground Circle */}
          <AnimatedCircle
            cx={halfCircle}
            cy={halfCircle}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      
      {/* Center content */}
      <View style={styles.valueContainer}>
        {children || (
          showPercentage && (
            <Text style={[styles.valueText, { color: textColor }]}>
              {`${Math.round(percentage)}%`}
            </Text>
          )
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CircularProgress;
