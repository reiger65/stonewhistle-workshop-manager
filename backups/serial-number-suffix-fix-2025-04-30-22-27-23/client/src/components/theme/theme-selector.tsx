import { useEffect } from 'react';
import { Settings2 } from 'lucide-react';

// Single theme application
export function ThemeSelector() {
  // Apply theme on mount
  useEffect(() => {
    applyDefaultTheme();
  }, []);

  // Apply default theme
  const applyDefaultTheme = () => {
    // Set default theme properties
    const themeConfig = {
      variant: 'professional',
      primary: '#015a6c',
      appearance: 'light',
      radius: 0.5
    };
    
    // Apply theme changes
    document.documentElement.setAttribute('data-theme', 'stonefired');
    document.documentElement.classList.remove('dark');
    
    // Save theme to localStorage
    localStorage.setItem('selectedTheme', 'stonefired');
    localStorage.setItem('themeConfig', JSON.stringify(themeConfig));
  };

  // Return empty component - no selector needed with just one theme
  return null;
}