// Color palettes for light and dark themes
export const lightTheme = {
  colors: {
    primary: '#4C6EF5', // Indigo
    secondary: '#FF6B6B', // Coral
    accent: '#20C997', // Teal
    background: '#FFFFFF',
    card: '#F8F9FA',
    text: '#212529',
    textSecondary: '#6C757D',
    border: '#DEE2E6',
    notification: '#FF6B6B',
    success: '#20C997',
    warning: '#FFC107',
    error: '#DC3545',
    disabled: '#ADB5BD',
    // Glass morphism
    glass: 'rgba(255, 255, 255, 0.8)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
    glassShadow: 'rgba(0, 0, 0, 0.05)',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  shadows: {
    small: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
  },
  animations: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
};

export const darkTheme = {
  colors: {
    primary: '#5C7CFA', // Lighter Indigo for dark mode
    secondary: '#FF8787', // Lighter Coral for dark mode
    accent: '#38D9A9', // Lighter Teal for dark mode
    background: '#121212',
    card: '#1E1E1E',
    text: '#F8F9FA',
    textSecondary: '#ADB5BD',
    border: '#343A40',
    notification: '#FF8787',
    success: '#38D9A9',
    warning: '#FFD43B',
    error: '#FA5252',
    disabled: '#495057',
    // Glass morphism for dark theme
    glass: 'rgba(18, 18, 18, 0.8)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassShadow: 'rgba(0, 0, 0, 0.2)',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  // Keep the same spacing, fontSizes, borderRadius, animations, and fontFamily
  spacing: lightTheme.spacing,
  fontSizes: lightTheme.fontSizes,
  borderRadius: lightTheme.borderRadius,
  shadows: {
    small: {
      ...lightTheme.shadows.small,
      shadowOpacity: 0.2,
    },
    medium: {
      ...lightTheme.shadows.medium,
      shadowOpacity: 0.25,
    },
    large: {
      ...lightTheme.shadows.large,
      shadowOpacity: 0.3,
    },
  },
  animations: lightTheme.animations,
  fontFamily: lightTheme.fontFamily,
};

// Age group specific color schemes
export const ageGroupThemes = {
  Child: {
    primary: '#FF9E80', // Orange
    secondary: '#FFCC80', // Light Orange
    tertiary: '#FFF59D', // Yellow
    background: '#FAFAFA',
  },
  Teen: {
    primary: '#81D4FA', // Light Blue
    secondary: '#80DEEA', // Cyan
    tertiary: '#80CBC4', // Teal
    background: '#F5F5F5',
  },
  Adult: {
    primary: '#B39DDB', // Purple
    secondary: '#9FA8DA', // Indigo
    tertiary: '#90CAF9', // Blue
    background: '#EEEEEE',
  },
};

// Dark mode versions of age group themes
export const darkAgeGroupThemes = {
  Child: {
    primary: '#FF6E40', // Darker Orange
    secondary: '#FFB74D', // Darker Light Orange
    tertiary: '#FFF176', // Darker Yellow
    background: '#212121',
  },
  Teen: {
    primary: '#4FC3F7', // Darker Light Blue
    secondary: '#26C6DA', // Darker Cyan
    tertiary: '#26A69A', // Darker Teal
    background: '#212121',
  },
  Adult: {
    primary: '#9575CD', // Darker Purple
    secondary: '#7986CB', // Darker Indigo
    tertiary: '#64B5F6', // Darker Blue
    background: '#212121',
  },
};
