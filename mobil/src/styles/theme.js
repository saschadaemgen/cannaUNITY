export const theme = {
  colors: {
    // Hauptfarben basierend auf AVRE Design
    primary: '#2ECC40', // Grün aus dem Logo
    primaryDark: '#27AE34',
    primaryLight: '#4CD964',
    
    // Akzentfarbe
    accent: '#E91E63', // Pink/Magenta aus dem Logo
    accentLight: '#F06292',
    
    // Hintergründe
    background: '#F5F5F7',
    surface: '#FFFFFF',
    surfaceVariant: '#F8F9FA',
    
    // Text
    text: '#333333',
    textSecondary: '#666666',
    textLight: '#999999',
    textOnPrimary: '#FFFFFF',
    
    // Status
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    
    // Borders & Dividers
    border: '#E0E0E0',
    divider: '#F0F0F0',
    
    // Schatten
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 999,
  },
  
  typography: {
    // Überschriften
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: 'bold',
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    
    // Body Text
    body: {
      fontSize: 16,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
    },
    
    // Buttons & Labels
    button: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
    },
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
  },
};