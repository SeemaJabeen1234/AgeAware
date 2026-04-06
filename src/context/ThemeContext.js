import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';
import { lightTheme, darkTheme } from '../theme/theme';

// Create the context
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Check device's default theme
  const deviceTheme = Appearance.getColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(deviceTheme === 'dark');
  const [theme, setTheme] = useState(isDarkMode ? darkTheme : lightTheme);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkMode(colorScheme === 'dark');
      setTheme(colorScheme === 'dark' ? darkTheme : lightTheme);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Function to toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(!isDarkMode ? darkTheme : lightTheme);
  };

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
