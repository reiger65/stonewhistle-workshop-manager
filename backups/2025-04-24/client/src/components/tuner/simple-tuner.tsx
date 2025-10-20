import React, { useState } from 'react';
import { Music, Mic, MicOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimpleTunerProps {
  instrumentType: string;
  tuningNote?: string;
  frequency?: string;
  allowSelections?: boolean;
  standalone?: boolean;
}

const SimpleTuner: React.FC<SimpleTunerProps> = ({
  instrumentType,
  tuningNote = 'Cm4',
  frequency = '440',
  allowSelections = true,
  standalone = false
}) => {
  // Basic state
  const [isActive, setIsActive] = useState(false);
  const [selectedSection, setSelectedSection] = useState('ALL');
  
  // Format instrument key for display
  const formatInstrumentKey = (key: string): string => {
    if (!key) return '';
    const match = key.match(/^([A-G][b#]?)m(\d+)$/);
    if (match) {
      // Remove the 'm' from the key for display (e.g., Cm4 -> C4)
      return `${match[1]}${match[2]}`;
    }
    return key;
  };

  // Get the normalized instrument type (innato, natey, double, zen)
  const getNormalizedInstrumentType = (): string => {
    const lowerType = instrumentType.toLowerCase();
    if (lowerType.includes('innato')) return 'innato';
    if (lowerType.includes('natey')) return 'natey';
    if (lowerType.includes('double')) return 'double';
    if (lowerType.includes('zen')) return 'zen';
    return 'innato'; // Default to innato
  };

  // Get chamber names based on instrument type
  const getChamberNames = (): string[] => {
    const instrumentType = getNormalizedInstrumentType();
    
    if (instrumentType === 'innato') {
      return ['LEFT', 'RIGHT', 'FRONT'];
    } else if (instrumentType === 'double') {
      return ['LEFT', 'RIGHT'];
    }
    
    return []; // Natey and ZEN flutes don't have separate chambers
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    setIsActive(!isActive);
  };

  // Render header with prominent instrument key
  const renderHeader = () => (
    <div className="flex flex-col mb-4">
      {/* Large instrument title */}
      <div className="p-3 bg-indigo-600 text-white rounded-t-lg text-center">
        <h2 className="text-xl font-bold tracking-wider uppercase" data-testid="tuner-title">
          {instrumentType} {formatInstrumentKey(tuningNote)}
        </h2>
        <div className="text-xs font-medium text-indigo-100 mt-0.5">
          {frequency} Hz
        </div>
      </div>
      
      {/* Controls bar */}
      <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-b-lg">
        <div className="flex items-center">
          <Music className="w-5 h-5 mr-2 text-indigo-500" />
          <span className="text-sm font-medium">TUNING REFERENCE</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMicrophone}
            className="ml-2"
          >
            {isActive ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
          
          {allowSelections && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={(e) => e.stopPropagation()}
            >
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // Render vessel/section selection tabs
  const renderSectionTabs = () => {
    const chamberNames = getChamberNames();
    
    if (chamberNames.length === 0) {
      return null; // No chamber selection for Natey and ZEN
    }
    
    // Full width tab design
    return (
      <div className="flex w-full bg-gray-100 dark:bg-gray-800 rounded-md mt-2 mb-4 overflow-hidden">
        <button
          onClick={() => setSelectedSection('ALL')}
          className={`flex-1 py-2 px-3 text-center text-sm font-medium border-b-2 transition-all ${
            selectedSection === 'ALL' 
              ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-gray-700' 
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          ALL
        </button>
        
        {chamberNames.map(chamber => (
          <button
            key={chamber}
            onClick={() => setSelectedSection(chamber)}
            className={`flex-1 py-2 px-3 text-center text-sm font-medium border-b-2 transition-all ${
              selectedSection === chamber 
                ? 'border-indigo-600 text-indigo-600 bg-white dark:bg-gray-700' 
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {chamber}
          </button>
        ))}
      </div>
    );
  };

  // Placeholder for note grid
  const renderNoteGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
      {/* Example note cards, will be replaced with real data */}
      {Array.from({ length: 8 }).map((_, index) => (
        <div 
          key={index} 
          className="relative p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
        >
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <div className="text-lg font-semibold">
                Note
              </div>
              <div className="text-xs -mt-1">
                4
              </div>
            </div>
            
            <div className="text-sm font-medium">
              440.0 Hz
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Main render
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md w-full max-w-lg mx-auto">
      {renderHeader()}
      
      {/* Placeholder tuner meter */}
      <div className="w-full max-w-md mx-auto mb-5">
        <div className="relative h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-500 dark:bg-gray-400 z-10 transform -translate-x-1/2" />
        </div>
        
        <div className="flex justify-between text-xs mt-1 px-1">
          <span>-30¢</span>
          <span>-20¢</span>
          <span>-10¢</span>
          <span>0¢</span>
          <span>+10¢</span>
          <span>+20¢</span>
          <span>+30¢</span>
        </div>
        
        <div className="mt-2 flex justify-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isActive ? 'Waiting for sound...' : 'Microphone off'}
          </div>
        </div>
      </div>
      
      {renderSectionTabs()}
      {renderNoteGrid()}
    </div>
  );
};

export default SimpleTuner;