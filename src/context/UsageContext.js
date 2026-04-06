import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import { useModel } from './ModelContext';
import { useAuth } from './AuthContext';
import { getUsageStats, startLockTask, stopLockTask, startBackgroundTimer, stopBackgroundTimer, lockDeviceNow } from '../services/usageStats';
import { storeData, getData } from '../utils/storage';

const UsageContext = createContext();

export const useUsage = () => {
  const context = useContext(UsageContext);
  if (!context) {
    throw new Error('useUsage must be used within a UsageProvider');
  }
  return context;
};

export const UsageProvider = ({ children }) => {
  const { isModelLoaded } = useModel();
  const { currentUser } = useAuth();

  const [ageGroup, setAgeGroup] = useState(null); // Child, Teen, or Adult
  const [usageStats, setUsageStats] = useState({});
  const [remainingTime, setRemainingTime] = useState(null);
  const [allowedScreenTime, setAllowedScreenTime] = useState(null);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState(null);
  const [timerEndTime, setTimerEndTime] = useState(null);
  const [usagePerApp, setUsagePerApp] = useState({});
  const [appState, setAppState] = useState(AppState.currentState);

  // Time limits per age group (in minutes)
  const [timeLimits, setTimeLimits] = useState({
    Child: 1,   // Default 5 minutes
    Teen: 10,   // Default 10 minutes
    Adult: 5,   // Default 3 minutes
  });

  // Refs to track current state in event listeners
  const ageGroupRef = useRef(ageGroup);
  const remainingTimeRef = useRef(remainingTime);
  const isLockedRef = useRef(isLocked);
  const isTimerActiveRef = useRef(isTimerActive);
  const timerEndTimeRef = useRef(timerEndTime);
  const timerIntervalRef = useRef(null);
  const lastActiveTimeRef = useRef(null);
  const backgroundStartTimeRef = useRef(null);
  const isLockingRef = useRef(false);  // Prevent double-lock,
  const timerStateRef = React.useRef({
    isTimerActive: false,
    remainingTime: null,
    ageGroup: null,
    timerStartTime: null,
    timerEndTime: null,
    isLocked: false,
    timeLimits: { Child: 5, Teen: 10, Adult: 3 }
  });

  // Update refs when state changes
  useEffect(() => {
    timerStateRef.current = {
      isTimerActive,
      remainingTime,
      ageGroup,
      timerStartTime,
      timerEndTime,
      isLocked,
      timeLimits
    };
  }, [isTimerActive, remainingTime, ageGroup, timerStartTime, timerEndTime, isLocked, timeLimits]);

  // Initialize usage data from storage on app start
  useEffect(() => {
    loadUsageData();

    // Subscribe to AppState changes to track background/foreground transitions
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // USER REQUIREMENT: Detect phone unlock and reset app
  useEffect(() => {
    const handleUnlock = async (nextAppState) => {
      // When phone is unlocked after system lock, AppState goes from 'background' to 'active'
      if (nextAppState === 'active' && isLocked) {
        console.log('[UsageContext] Phone unlocked detected, resetting app state...');

        // Reset all state
        setIsLocked(false);
        setIsTimerActive(false);
        setRemainingTime(null);
        setTimerEndTime(null);
        setAgeGroup(null);

        // Stop kiosk mode
        await stopLockTask();
        await stopBackgroundTimer();

        // Clear saved data to force fresh start
        await storeData('usageData', null);

        isLockingRef.current = false;

        console.log('[UsageContext] App state reset complete');
      }
    };

    const subscription = AppState.addEventListener('change', handleUnlock);

    return () => {
      subscription.remove();
    };
  }, [isLocked]);

  // Watch for age group changes and update allowed screen time
  useEffect(() => {
    if (ageGroup) {
      setAllowedScreenTime(timeLimits[ageGroup] * 60); // Convert to seconds

      // If this is a new session, reset remaining time to full allowance
      if (!remainingTime || !timerStartTime) {
        setRemainingTime(timeLimits[ageGroup] * 60);
        setIsLocked(false);
      }
    }
  }, [ageGroup]);

  // Handle app state changes (active, background, inactive)
  const handleAppStateChange = async (nextAppState) => {
    if (appState === 'active' && nextAppState.match(/inactive|background/)) {
      // App is going to background
      const currentState = timerStateRef.current;

      if (currentState.isTimerActive) {
        // Save current timer state using FRESH state
        try {
          const usageData = {
            ageGroup: currentState.ageGroup,
            remainingTime: currentState.remainingTime,
            timerStartTime: currentState.timerStartTime ? currentState.timerStartTime.toISOString() : null,
            isTimerActive: currentState.isTimerActive,
            isLocked: currentState.isLocked,
            customTimeLimits: currentState.timeLimits,
            lastUpdated: new Date().toISOString(),
          };
          await storeData('usageData', usageData);
        } catch (error) {
          console.error('Error saving usage data on background:', error);
        }

        // Start native background timer
        if (currentState.remainingTime > 0) {
          startBackgroundTimer(currentState.remainingTime * 1000);
        }
      }
    } else if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App is coming to foreground

      // Stop native background timer as JS will take over
      stopBackgroundTimer();

      await loadUsageData();

      // Update usage stats
      await updateUsageStats();
    }

    setAppState(nextAppState);
  };

  // Save usage data to persistent storage
  const saveUsageData = async () => {
    try {
      const usageData = {
        ageGroup,
        remainingTime,
        timerStartTime: timerStartTime ? timerStartTime.toISOString() : null,
        isTimerActive,
        isLocked,
        customTimeLimits: timeLimits,
        lastUpdated: new Date().toISOString(),
      };

      await storeData('usageData', usageData);
    } catch (error) {
      console.error('Error saving usage data:', error);
    }
  };

  // Load usage data from persistent storage
  const loadUsageData = async () => {
    console.log(`[loadUsageData] START - Current ageGroup: ${ageGroup}, remainingTime: ${remainingTime}, isLocked: ${isLocked}`);

    try {
      const usageData = await getData('usageData');
      console.log(`[loadUsageData] Loaded data:`, usageData);

      if (usageData) {
        setAgeGroup(usageData.ageGroup);

        // Restore custom time limits if they exist
        // This is commented out to ensure code-level defaults take precedence during development
        // if (usageData.customTimeLimits) {
        //   setTimeLimits(usageData.customTimeLimits);
        // }

        if (usageData.isTimerActive && usageData.timerEndTime) {
          // Absolute calculation based on target end time
          const endTime = new Date(usageData.timerEndTime);
          const now = new Date();
          const secondsRemaining = Math.max(0, Math.ceil((endTime.getTime() - now.getTime()) / 1000));

          setRemainingTime(secondsRemaining);
          setTimerEndTime(endTime);
          setTimerStartTime(usageData.timerStartTime ? new Date(usageData.timerStartTime) : null);
          setIsTimerActive(true);

          console.log(`Resuming timer. End: ${endTime.toLocaleTimeString()}, Remaining: ${secondsRemaining}s`);

          if (secondsRemaining <= 0) {
            // CRITICAL: Check CURRENT age group state, not saved usageData.ageGroup!
            // When Adult face is shown after Child session expires, we need to check
            // the NEW current ageGroup, not the old saved age group
            // Adults should NEVER be locked, even when resuming with expired time
            if (ageGroup === 'Child' || ageGroup === 'Teen') {
              console.log(`[loadUsageData] Locking device for ${ageGroup} with expired time`);
              lockDevice();
            } else {
              console.log(`[loadUsageData] Skipping lock for ${ageGroup} - Adults don't get locked`);
              // For adults, just reset the timer to inactive
              setIsTimerActive(false);
              setTimerEndTime(null);
            }
          }
        } else {
          // Fallback or not active
          if (usageData.remainingTime !== undefined) {
            setRemainingTime(usageData.remainingTime);
          }
          setIsTimerActive(false);
          setTimerEndTime(null);
        }
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
    }
    console.log(`[loadUsageData] END - ageGroup: ${ageGroup}, isLocked: ${isLocked}, isTimerActive: ${isTimerActive}`);
  };

  // Update app usage statistics
  const updateUsageStats = async () => {
    try {
      const stats = await getUsageStats();
      setUsageStats(stats);

      // Extract per-app usage
      const appUsage = {};
      if (stats && stats.apps) {
        stats.apps.forEach(app => {
          appUsage[app.packageName] = {
            name: app.appName,
            usageTime: app.usageTime,
            lastTimeUsed: app.lastTimeUsed,
            launchCount: app.launchCount,
          };
        });
      }

      setUsagePerApp(appUsage);
    } catch (error) {
      console.error('Error updating usage stats:', error);
      Alert.alert('Permission Error', 'Please grant usage access permission to monitor app usage.');
    }
  };

  // Start the screen time timer
  const startTimer = () => {
    if (ageGroup && allowedScreenTime) {
      setIsTimerActive(true);
      setTimerStartTime(new Date());

      // If resuming, use remainingTime, otherwise full allowance
      const durationSeconds = remainingTime !== null ? remainingTime : allowedScreenTime;
      const endTime = new Date(new Date().getTime() + durationSeconds * 1000);
      setTimerEndTime(endTime);

      // Save initial state with end time
      storeData('usageData', {
        ageGroup,
        remainingTime: durationSeconds,
        timerStartTime: new Date().toISOString(),
        timerEndTime: endTime.toISOString(),
        isTimerActive: true,
        isLocked,
        customTimeLimits: timeLimits,
        lastUpdated: new Date().toISOString(),
      });

      // Start native timer as well (failsafe)
      if (durationSeconds > 0) {
        startBackgroundTimer(durationSeconds * 1000);
      }
    }
  };

  // Stop the screen time timer
  const stopTimer = () => {
    setIsTimerActive(false);
    setTimerEndTime(null);
    saveUsageData();
    stopBackgroundTimer();
  };

  // Timer interval to update remaining time every second
  // Now uses absolute end time calculation for robustness
  useEffect(() => {
    let interval = null;

    // Logic for active timer
    if (isTimerActive && timerEndTime) {
      interval = setInterval(() => {
        const now = new Date();
        const secondsLeft = Math.ceil((timerEndTime.getTime() - now.getTime()) / 1000);
        const newTime = Math.max(0, secondsLeft);

        setRemainingTime(newTime);

        if (newTime <= 0) {
          // CRITICAL: Only lock Child/Teen when timer expires
          // Adults should never be locked by timer expiry
          if (ageGroup === 'Child' || ageGroup === 'Teen') {
            console.log(`[Timer] Locking device for ${ageGroup} - time expired`);
            lockDevice();
          } else {
            console.log(`[Timer] Time expired for ${ageGroup} but not locking - Adults don't get locked`);
            setIsTimerActive(false);
          }
          clearInterval(interval);
        }
      }, 1000);
    }
    // Fallback logic if timerActive but no endTime (shouldn't happen with new logic but safe to keep old behavior or reset)
    else if (isTimerActive && remainingTime > 0 && !timerEndTime) {
      // Temporary fallback to manual decrement if endTime missing
      interval = setInterval(() => {
        setRemainingTime((prevTime) => {
          const newTime = Math.max(0, prevTime - 1);
          if (newTime <= 0) {
            // CRITICAL: Only lock Child/Teen when timer expires
            if (ageGroup === 'Child' || ageGroup === 'Teen') {
              console.log(`[Fallback Timer] Locking device for ${ageGroup} - time expired`);
              lockDevice();
            } else {
              console.log(`[Fallback Timer] Time expired for ${ageGroup} but not locking`);
              setIsTimerActive(false);
            }
            clearInterval(interval);
          }
          return newTime;
        });
      }, 1000);
    }
    else if (remainingTime <= 0 && isTimerActive) {
      // CRITICAL: Only lock Child/Teen
      if (ageGroup === 'Child' || ageGroup === 'Teen') {
        console.log(`[Timer effect] Locking device for ${ageGroup} - timer active with 0 time`);
        lockDevice();
      } else {
        console.log(`[Timer effect] ${ageGroup} has 0 time but not locking`);
        setIsTimerActive(false);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timerEndTime, remainingTime]);

  // Update age group based on face detection
  const updateAgeGroup = async (newAgeGroup) => {
    console.log(`[updateAgeGroup] Called with: ${newAgeGroup}, Current remainingTime: ${remainingTime}`);

    // Always unlock and unpin when starting a new session via face detection
    // regardless of whether the age group changed or not
    setIsLocked(false);
    setIsTimerActive(false); // Stop the timer explicitly to prevent immediate re-lock race condition
    setTimerEndTime(null);   // Clear end time

    // CRITICAL: Await stopLockTask to ensure kiosk mode is fully disabled before proceeding
    await stopLockTask();
    console.log(`[updateAgeGroup] Kiosk mode stopped, continuing...`);

    stopBackgroundTimer();

    if (newAgeGroup !== ageGroup) {
      setAgeGroup(newAgeGroup);
      // We rely on the useEffect[ageGroup] to reset time, but we can also do it here for safety if needed
      // but let's trust the effect if we stopped the timer
      saveUsageData();
    } else {
      // If age group is same, reset time if it was expired
      if (remainingTime <= 0) {
        const newTime = timeLimits[newAgeGroup] * 60;
        setRemainingTime(newTime);
        // We do NOT start the timer here. User must press start on Home screen?
        // Or should we auto start?
        // For now, just ensure we claim a valid state.
      }
    }

    // AGE-BASED LOCK LOGIC AFTER FACE DETECTION
    // CRITICAL: Face detection is ALWAYS a fresh session start
    // Do NOT check remainingTime here - it's stale from previous session!

    // For Child/Teen: They will need to start timer on Home screen
    // For Adult: They get unrestricted access

    // NOTE: We explicitly do NOT call lockDevice() for anyone here.
    // The only time a lock should happen is when:
    // 1. Timer expires during active use (handled by timer interval)
    // 2. App resumes with expired time (handled by loadUsageData)
    // Face detection = NEW session = NO immediate lock for anyone

    console.log(`[updateAgeGroup] Age group set to: ${newAgeGroup}, isLocked: false, isTimerActive: false`);
  };

  // Lock the device when time expires
  const lockDevice = async () => {
    // CRITICAL: Prevent double-lock by checking if already locking
    if (isLockingRef.current) {
      console.log('[lockDevice] Already locking, skipping duplicate call');
      return;
    }

    isLockingRef.current = true;
    console.log('[lockDevice] Starting lock process...');

    setIsLocked(true);
    saveUsageData();
    // Stop background timer as we are locked
    stopBackgroundTimer();
    // PER USER REQUEST: Pin app to screen (Kiosk Mode)
    await startLockTask();

    // USER REQUIREMENT: After kiosk mode activates, trigger Android system lock screen
    console.log('[lockDevice] Kiosk mode activated, triggering system lock screen...');
    await lockDeviceNow();

    // Reset flag after a delay to allow next lock if needed
    setTimeout(() => {
      isLockingRef.current = false;
    }, 2000);
  };

  // Unlock the device (parent action)
  const unlockDevice = (minutes = 0) => {
    setIsLocked(false);
    // PER USER REQUEST: Unpin app from screen
    stopLockTask();

    // Add bonus time if specified
    if (minutes > 0) {
      const newRemainingTime = remainingTime + minutes * 60;
      setRemainingTime(newRemainingTime);

      // Restart background timer if active
      if (isTimerActive) {
        startBackgroundTimer(newRemainingTime * 1000);
      }
    }

    saveUsageData();
  };

  // Reset daily usage limits
  const resetDailyLimits = () => {
    if (ageGroup) {
      setRemainingTime(timeLimits[ageGroup] * 60);
      setTimerStartTime(new Date());
      saveUsageData();
    }
  };

  // Update time limits for age groups
  const updateTimeLimit = (group, minutes) => {
    const newLimits = { ...timeLimits, [group]: minutes };
    setTimeLimits(newLimits);

    // Update current user's remaining time if their age group was changed
    if (group === ageGroup) {
      setAllowedScreenTime(minutes * 60);
    }

    // Persist the updated time limits (we need to pass newLimits because state update is async)
    // We'll create a temporary object to save immediately
    storeData('usageData', {
      ageGroup,
      remainingTime,
      timerStartTime: timerStartTime ? timerStartTime.toISOString() : null,
      isTimerActive,
      isLocked,
      customTimeLimits: newLimits,
      lastUpdated: new Date().toISOString(),
    }).catch(err => console.error('Error saving usage data:', err));
  };

  const value = {
    ageGroup,
    usageStats,
    remainingTime,
    allowedScreenTime,
    isTimerActive,
    isLocked,
    usagePerApp,
    updateAgeGroup,
    startTimer,
    stopTimer,
    lockDevice,
    unlockDevice,
    resetDailyLimits,
    updateTimeLimit,
    updateUsageStats,
    timeLimits,
  };

  return (
    <UsageContext.Provider value={value}>
      {children}
    </UsageContext.Provider>
  );
};
