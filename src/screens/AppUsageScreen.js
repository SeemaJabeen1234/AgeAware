import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useUsage } from '../context/UsageContext';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatTime, formatDate } from '../utils/timeUtils';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { PieChart, LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const AppUsageScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const { usageStats, usagePerApp, updateUsageStats } = useUsage();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('apps'); // 'apps', 'chart', 'timeline'
  const [chartData, setChartData] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [sortBy, setSortBy] = useState('time'); // 'time', 'name'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc', 'desc'

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Load usage data
  const loadData = async () => {
    setRefreshing(true);

    try {
      await updateUsageStats();
      prepareChartData();
      prepareTimelineData();
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Prepare data for pie chart visualization
  const prepareChartData = () => {
    if (!usagePerApp || Object.keys(usagePerApp).length === 0) {
      setChartData(null);
      return;
    }

    // Sort apps by usage time
    const sortedApps = Object.values(usagePerApp)
      .sort((a, b) => b.usageTime - a.usageTime)
      .slice(0, 5); // Get top 5 apps

    // Add "Other" category if there are more than 5 apps
    let otherTime = 0;
    if (Object.values(usagePerApp).length > 5) {
      otherTime = Object.values(usagePerApp)
        .sort((a, b) => b.usageTime - a.usageTime)
        .slice(5)
        .reduce((total, app) => total + app.usageTime, 0);
    }

    // Generate colors based on theme
    const generateColor = (index) => {
      const colors = isDarkMode
        ? ['#5C7CFA', '#748FFC', '#8DA4FD', '#A5B8FD', '#BDD2FE', '#D4E2FE']
        : ['#4C6EF5', '#5C7CFA', '#748FFC', '#8DA4FD', '#A5B8FD', '#BDD2FE'];
      return colors[index % colors.length];
    };

    // Create chart data
    const data = sortedApps.map((app, index) => ({
      name: app.name,
      usage: app.usageTime,
      color: generateColor(index),
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    }));

    // Add "Other" if needed
    if (otherTime > 0) {
      data.push({
        name: 'Other Apps',
        usage: otherTime,
        color: generateColor(5),
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      });
    }

    setChartData(data);
  };

  // Prepare timeline data (mock data for now)
  const prepareTimelineData = () => {
    // This would normally be populated from usage stats
    // For now, we'll use mock data
    const mockTimelineData = [
      {
        hour: '12 AM',
        apps: [
          { name: 'Sleep', duration: 60, color: theme.colors.disabled }
        ]
      },
      {
        hour: '6 AM',
        apps: [
          { name: 'Clock', duration: 10, color: theme.colors.secondary },
          { name: 'Weather', duration: 5, color: theme.colors.primary }
        ]
      },
      {
        hour: '8 AM',
        apps: [
          { name: 'Messages', duration: 15, color: theme.colors.success },
          { name: 'Email', duration: 20, color: theme.colors.primary }
        ]
      },
      {
        hour: '12 PM',
        apps: [
          { name: 'YouTube', duration: 30, color: theme.colors.error },
          { name: 'Games', duration: 45, color: theme.colors.warning }
        ]
      },
      {
        hour: '4 PM',
        apps: [
          { name: 'Instagram', duration: 40, color: theme.colors.secondary },
          { name: 'Chrome', duration: 25, color: theme.colors.primary }
        ]
      },
      {
        hour: '8 PM',
        apps: [
          { name: 'Netflix', duration: 90, color: theme.colors.error },
          { name: 'Music', duration: 30, color: theme.colors.success }
        ]
      },
    ];

    setTimelineData(mockTimelineData);
  };

  // Handle refresh
  const onRefresh = async () => {
    await loadData();
  };

  // Toggle sort order
  const toggleSort = (type) => {
    if (sortBy === type) {
      // Toggle direction if same type
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new type and default direction
      setSortBy(type);
      setSortDirection(type === 'time' ? 'desc' : 'asc');
    }
  };

  // Get sorted app list
  const getSortedAppList = () => {
    if (!usagePerApp || Object.keys(usagePerApp).length === 0) {
      return [];
    }

    const appList = Object.values(usagePerApp);

    // Sort by selected criteria
    if (sortBy === 'time') {
      return appList.sort((a, b) => {
        return sortDirection === 'desc'
          ? b.usageTime - a.usageTime
          : a.usageTime - b.usageTime;
      });
    } else { // sort by name
      return appList.sort((a, b) => {
        return sortDirection === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
    }
  };

  // Render app usage list item
  const renderAppItem = ({ item, index }) => (
    <Animated.View
      entering={SlideInRight.delay(index * 50).duration(300)}
      style={[styles.appItem, { backgroundColor: theme.colors.card }]}
    >
      <View style={styles.appIconPlaceholder}>
        <Text style={{ color: '#FFF' }}>{item.name.charAt(0)}</Text>
      </View>

      <View style={styles.appInfo}>
        <Text style={[styles.appName, { color: theme.colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.appUsageBar}>
          <View
            style={[
              styles.appUsageBarFill,
              {
                width: `${Math.min(100, (item.usageTime / (3 * 3600)) * 100)}%`,
                backgroundColor: theme.colors.primary
              }
            ]}
          />
        </View>
      </View>

      <Text style={[styles.appUsageTime, { color: theme.colors.textSecondary }]}>
        {formatTime(item.usageTime)}
      </Text>
    </Animated.View>
  );

  // Render pie chart
  const renderChart = () => {
    if (!chartData) {
      return (
        <View style={styles.noDataContainer}>
          <Icon name="chart-pie" size={50} color={theme.colors.disabled} />
          <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
            No usage data available
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
          App Usage Distribution
        </Text>

        <PieChart
          data={chartData}
          width={width - 32}
          height={220}
          chartConfig={{
            backgroundColor: theme.colors.card,
            backgroundGradientFrom: theme.colors.card,
            backgroundGradientTo: theme.colors.card,
            color: (opacity = 1) => `rgba(${isDarkMode ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(${isDarkMode ? '255, 255, 255' : '0, 0, 0'}, ${opacity})`,
          }}
          accessor="usage"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />

        <Text style={[styles.chartNote, { color: theme.colors.textSecondary }]}>
          Total screen time today: {formatTime(usageStats?.totalScreenTime || 0)}
        </Text>
      </View>
    );
  };

  // Render timeline view
  const renderTimeline = () => {
    if (timelineData.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Icon name="timeline" size={50} color={theme.colors.disabled} />
          <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
            No timeline data available
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.timelineContainer}>
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
          Daily App Usage Timeline
        </Text>

        {timelineData.map((timeSlot, index) => (
          <View key={index} style={styles.timeSlot}>
            <Text style={[styles.timeSlotHour, { color: theme.colors.textSecondary }]}>
              {timeSlot.hour}
            </Text>

            <View style={styles.timeSlotApps}>
              {timeSlot.apps.map((app, appIndex) => (
                <View key={appIndex} style={styles.timeSlotApp}>
                  <View
                    style={[
                      styles.timeSlotAppBar,
                      {
                        backgroundColor: app.color,
                        width: `${Math.min(100, (app.duration / 60) * 100)}%`
                      }
                    ]}
                  />
                  <Text style={[styles.timeSlotAppName, { color: theme.colors.text }]}>
                    {app.name} ({app.duration} min)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Animated.Text
          entering={FadeIn.duration(500)}
          style={styles.headerTitle}
        >
          App Usage
        </Animated.Text>
      </View>

      {/* Tab selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'apps' && [styles.selectedTab, { borderColor: theme.colors.primary }]
          ]}
          onPress={() => setSelectedTab('apps')}
        >
          <Icon
            name="cellphone"
            size={22}
            color={selectedTab === 'apps' ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: selectedTab === 'apps'
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            ]}
          >
            Apps
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'chart' && [styles.selectedTab, { borderColor: theme.colors.primary }]
          ]}
          onPress={() => setSelectedTab('chart')}
        >
          <Icon
            name="chart-pie"
            size={22}
            color={selectedTab === 'chart' ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: selectedTab === 'chart'
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            ]}
          >
            Chart
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'timeline' && [styles.selectedTab, { borderColor: theme.colors.primary }]
          ]}
          onPress={() => setSelectedTab('timeline')}
        >
          <Icon
            name="timeline"
            size={22}
            color={selectedTab === 'timeline' ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              {
                color: selectedTab === 'timeline'
                  ? theme.colors.primary
                  : theme.colors.textSecondary
              }
            ]}
          >
            Timeline
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content based on selected tab */}
      {selectedTab === 'apps' && (
        <>
          {/* Sort controls */}
          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => toggleSort('time')}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  {
                    color: sortBy === 'time'
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                ]}
              >
                Time
              </Text>
              {sortBy === 'time' && (
                <Icon
                  name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={theme.colors.primary}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => toggleSort('name')}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  {
                    color: sortBy === 'name'
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                ]}
              >
                Name
              </Text>
              {sortBy === 'name' && (
                <Icon
                  name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={theme.colors.primary}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* App list */}
          <FlatList
            data={getSortedAppList()}
            renderItem={renderAppItem}
            keyExtractor={(item, index) => `app-${index}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.noDataContainer}>
                <Icon name="cellphone-off" size={50} color={theme.colors.disabled} />
                <Text style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
                  No app usage data available
                </Text>
              </View>
            }
          />
        </>
      )}

      {selectedTab === 'chart' && (
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
          {renderChart()}
        </ScrollView>
      )}

      {selectedTab === 'timeline' && (
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
          {renderTimeline()}
        </ScrollView>
      )}

      {/* Date info */}
      <View style={[styles.dateContainer, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.dateText, { color: theme.colors.text }]}>
          {formatDate(new Date(), true)}
        </Text>
      </View>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTab: {
    borderWidth: 1,
  },
  tabText: {
    marginLeft: 6,
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 6,
  },
  sortButtonText: {
    fontWeight: '500',
    marginRight: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
  },
  appIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#4C6EF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appInfo: {
    flex: 1,
    marginLeft: 12,
  },
  appName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  appUsageBar: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  appUsageBarFill: {
    height: '100%',
  },
  appUsageTime: {
    fontSize: 12,
    marginLeft: 12,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    marginTop: 10,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  chartContainer: {
    marginBottom: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  chartNote: {
    fontSize: 14,
    marginTop: 10,
    fontStyle: 'italic',
  },
  timelineContainer: {
    paddingBottom: 20,
  },
  timeSlot: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeSlotHour: {
    width: 50,
    fontSize: 12,
  },
  timeSlotApps: {
    flex: 1,
  },
  timeSlotApp: {
    marginBottom: 8,
  },
  timeSlotAppBar: {
    height: 20,
    borderRadius: 4,
    marginBottom: 2,
  },
  timeSlotAppName: {
    fontSize: 12,
  },
  dateContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
  },
});

export default AppUsageScreen;
