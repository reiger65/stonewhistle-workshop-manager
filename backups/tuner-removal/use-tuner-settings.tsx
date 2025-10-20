import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the types for tuner settings
export interface TunerSettings {
  instrumentType: string;
  tuningNote: string;
  frequency: string;
  sensitivityThreshold: number;
}

// Define the context interface
interface TunerContextType {
  settings: TunerSettings;
  updateSettings: (newSettings: Partial<TunerSettings>) => void;
  resetSettings: () => void;
}

// Default settings
const defaultSettings: TunerSettings = {
  instrumentType: 'INNATO',
  tuningNote: 'Cm4',
  frequency: '440',
  sensitivityThreshold: 0.00005,
};

// Create the context
const TunerContext = createContext<TunerContextType | undefined>(undefined);

// Provider component
export function TunerSettingsProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from localStorage if available
  const [settings, setSettings] = useState<TunerSettings>(() => {
    const savedSettings = localStorage.getItem('tunerSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  // Update localStorage when settings change
  useEffect(() => {
    localStorage.setItem('tunerSettings', JSON.stringify(settings));
  }, [settings]);

  // Update settings function
  const updateSettings = (newSettings: Partial<TunerSettings>) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  };

  // Reset settings to default
  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <TunerContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </TunerContext.Provider>
  );
}

// Hook for using the context
export function useTunerSettings() {
  const context = useContext(TunerContext);
  if (context === undefined) {
    throw new Error('useTunerSettings must be used within a TunerSettingsProvider');
  }
  return context;
}