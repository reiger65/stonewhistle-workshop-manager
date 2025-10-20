import React from 'react';
import { Music } from 'lucide-react';

// Simple display component for tuning notes based on the screenshot
interface SimpleTunerDisplayProps {
  instrumentType: string;
  tuningNote?: string;
  frequency?: string | null;
}

const SimpleTunerDisplay: React.FC<SimpleTunerDisplayProps> = ({
  instrumentType,
  tuningNote,
  frequency
}) => {
  // Extract base note (A, B, C, etc.) from tuning note
  const getBaseNote = () => {
    if (!tuningNote) return 'A';
    return tuningNote.charAt(0) + (tuningNote.charAt(1) === '#' || tuningNote.charAt(1) === 'b' ? tuningNote.charAt(1) : '');
  };
  
  // Default to 440 Hz if no frequency provided
  const baseFrequency = frequency?.includes('432') ? '432' :
                        frequency?.includes('425') ? '425' :
                        frequency?.includes('420') ? '420' : '440';
  
  // Determine chamber ranges based on the key
  const getChamberRanges = () => {
    const baseNote = getBaseNote();
    
    // This is a simplified version based on the A minor tuning shown in screenshot
    // In a real implementation, this would change based on the tuning note
    return {
      leftBack: 'E3, G3 +10¢, A3, B3',
      rightBack: 'A3, C4 +10¢, D4, E4',
      front: 'E4, G4 +10¢, A4, B4'
    };
  };
  
  const ranges = getChamberRanges();
  
  return (
    <div className="mb-3 p-4 rounded-md text-sm shadow-sm bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold text-gray-800 flex items-center">
          <Music className="h-5 w-5 mr-2" />
          Tuning Notes
        </h4>
      </div>
      
      <div className="mb-4 p-3 rounded-md bg-white border border-gray-100">
        <div className="text-lg font-medium mb-2">Innato Flute</div>
        <div className="mb-2">Key: {getBaseNote()} minor</div>
        <div className="mb-3">Frequency: <span className="bg-red-100 text-red-900 px-2 py-0.5 rounded">{baseFrequency} Hz</span></div>
        
        <div className="mt-4">
          <div className="font-medium mb-2">Chamber Ranges:</div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="font-medium">Left Back</div>
              <div>{ranges.leftBack}</div>
            </div>
            <div>
              <div className="font-medium">Right Back</div>
              <div>{ranges.rightBack}</div>
            </div>
            <div>
              <div className="font-medium">Front</div>
              <div>{ranges.front}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTunerDisplay;