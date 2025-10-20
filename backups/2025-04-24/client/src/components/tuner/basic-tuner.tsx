import React, { useState } from 'react';
import { Music, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BasicTunerProps {
  instrumentType: string;
  tuningNote?: string;
  frequency?: string;
}

const BasicTuner: React.FC<BasicTunerProps> = ({
  instrumentType,
  tuningNote = 'Em4',
  frequency = '440'
}) => {
  // Basic state
  const [isActive, setIsActive] = useState(false);
  
  // Mock notes for different instruments - in a real implementation this would come from API
  const getNotes = () => {
    if (instrumentType.toLowerCase().includes('natey')) {
      return [
        { note: 'E', octave: 4, frequency: 329.6 },
        { note: 'G', octave: 4, frequency: 394.3 },
        { note: 'A', octave: 4, frequency: 442.5 },
        { note: 'B', octave: 4, frequency: 493.9 },
        { note: 'D', octave: 5, frequency: 590.7 },
        { note: 'E', octave: 5, frequency: 659.3 },
        { note: 'F#', octave: 5, frequency: 740.0 },
        { note: 'G', octave: 5, frequency: 788.5 },
      ];
    } else if (instrumentType.toLowerCase().includes('innato')) {
      return [
        { note: 'G', octave: 3, frequency: 196.0 },
        { note: 'Bb', octave: 3, frequency: 233.1 },
        { note: 'C', octave: 4, frequency: 261.6 },
        { note: 'D', octave: 4, frequency: 293.7 },
        { note: 'Eb', octave: 4, frequency: 311.1 },
        { note: 'F', octave: 4, frequency: 349.2 },
        { note: 'G', octave: 4, frequency: 392.0 },
        { note: 'Bb', octave: 4, frequency: 466.2 },
        { note: 'C', octave: 5, frequency: 523.3 },
        { note: 'D', octave: 5, frequency: 587.3 }
      ];
    } else {
      return [
        { note: 'C', octave: 4, frequency: 261.6 },
        { note: 'D', octave: 4, frequency: 293.7 },
        { note: 'E', octave: 4, frequency: 329.6 },
        { note: 'F', octave: 4, frequency: 349.2 },
        { note: 'G', octave: 4, frequency: 392.0 },
        { note: 'A', octave: 4, frequency: 440.0 },
        { note: 'B', octave: 4, frequency: 493.9 },
        { note: 'C', octave: 5, frequency: 523.3 }
      ];
    }
  };

  // Toggle microphone 
  const toggleMicrophone = () => {
    setIsActive(!isActive);
  };

  // Format the tuning note for display
  const formatTuningNote = (note: string): string => {
    // Convert notation like "Em4" to just "E4" for display
    return note.replace('m', '');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md w-full">
      {/* Header */}
      <div className="p-2 bg-gray-100 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Music className="w-5 h-5 mr-2 text-gray-500" />
            <div>
              <h3 className="text-lg font-semibold">Tuner</h3>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-medium">{instrumentType.toUpperCase()}</span>
                <span className="text-xs px-1 py-0.5 bg-blue-100 rounded-md">
                  {formatTuningNote(tuningNote)}
                </span>
                <span className="text-xs px-1 py-0.5 bg-purple-100 rounded-md">
                  {frequency} Hz
                </span>
              </div>
            </div>
          </div>
          
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
        </div>
      </div>
      
      {/* Meter */}
      <div className="w-full max-w-md mx-auto mb-5">
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-gray-500 z-10 transform -translate-x-1/2" />
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
          <div className="text-sm text-gray-500">
            {isActive ? 'Waiting for sound...' : 'Microphone off'}
          </div>
        </div>
      </div>
      
      {/* Note Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
        {getNotes().map((noteData, index) => (
          <div 
            key={index} 
            className="p-3 rounded-lg bg-white border border-gray-300 flex flex-col items-center"
          >
            <div className="text-lg font-semibold">{noteData.note}</div>
            <div className="text-xs -mt-1">{noteData.octave}</div>
            <div className="text-xs mt-0.5">{noteData.frequency.toFixed(1)}Hz</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BasicTuner;