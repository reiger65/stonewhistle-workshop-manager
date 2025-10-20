import React, { createContext, useContext, useState, useEffect } from 'react';

// Define theme types
export type ThemeName = 'stonefired';

export interface Theme {
  name: ThemeName;
  label: string;
  variant: 'professional' | 'tint' | 'vibrant';
  primary: string;
  appearance: 'light' | 'dark' | 'system';
  radius: number;
  description: string;
  // Theme specific styling
  headerBg: string;
  headerText: string;
  toolbarBg: string;
  primaryButton: string;
  primaryButtonHover: string;
  rowOdd: string;
  rowEven: string;
  statusColumnBg: string;
  materialColumnBg: string;
  notesColumnBg: string;
  borderColor: string;
  resellerBg: string;
  resellerText: string;
  // Instrument type colors
  innatoColor: string;
  nateyColor: string;
  doubleColor: string;
  zenColor: string;
  ovaColor: string;
  cardsColor: string;
  fontFamily: string;
  fontSize: string;
  cellPadding: string;
}

// Define single theme
export const themes: Theme[] = [
  {
    name: 'stonefired',
    label: 'StoneFired',
    variant: 'professional',
    primary: '#015a6c',
    appearance: 'light',
    radius: 0.5,
    description: 'Default theme based on Stonewhistle colors',
    headerBg: '#015a6c',
    headerText: '#ffffff',
    toolbarBg: '#f0f0f0',
    primaryButton: '#1F5B61',
    primaryButtonHover: '#174349',
    rowOdd: '#F5F5F0',
    rowEven: '#FCFCFB',
    statusColumnBg: 'rgba(245, 247, 250, 0.75)',
    materialColumnBg: 'rgba(241, 245, 249, 0.5)',
    notesColumnBg: 'rgba(248, 250, 252, 0.7)',
    borderColor: '#e2e8f0',
    resellerBg: '#59296e',
    resellerText: '#ffffff',
    innatoColor: '#4f46e5',
    nateyColor: '#f59e0b',
    doubleColor: '#8b5cf6',
    zenColor: '#0d9488',
    ovaColor: '#ec4899',
    cardsColor: '#f43f5e',
    fontFamily: "'PT Sans Narrow', sans-serif",
    fontSize: '14pt',
    cellPadding: '0.5rem 1rem',
  }
];

// Get a theme by name
export function getThemeByName(name: ThemeName): Theme {
  return themes.find(theme => theme.name === name) || themes[0];
}

interface ThemeContextType {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  theme: Theme;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>('stonefired');

  // Load theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('selectedTheme') as ThemeName;
    if (savedTheme && themes.some(theme => theme.name === savedTheme)) {
      setCurrentTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  // Apply theme changes
  const applyTheme = (themeName: ThemeName) => {
    const theme = getThemeByName(themeName);
    
    // Update theme.json equivalent
    const themeConfig = {
      variant: theme.variant,
      primary: theme.primary,
      appearance: theme.appearance,
      radius: theme.radius
    };
    
    // Apply theme changes
    document.documentElement.setAttribute('data-theme', themeName);
    
    // Apply dark mode if needed
    if (theme.appearance === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save theme to localStorage
    localStorage.setItem('selectedTheme', themeName);
    localStorage.setItem('themeConfig', JSON.stringify(themeConfig));
  };

  // Function to set the theme
  const setTheme = (themeName: ThemeName) => {
    setCurrentTheme(themeName);
    applyTheme(themeName);
  };

  return (
    <ThemeContext.Provider value={{ 
      currentTheme, 
      setTheme,
      theme: getThemeByName(currentTheme)
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook for using the theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};