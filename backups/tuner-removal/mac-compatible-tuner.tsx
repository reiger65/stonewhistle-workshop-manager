import React, { useState, useEffect, useRef } from 'react';
import { Music, Mic, MicOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  NOTE_FREQUENCIES,
  getVesselNotesForKey,
  FluteType,
} from '@shared/instrument-reference';
import { useTunerSettings } from '@/hooks/use-tuner-settings';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Smooth value function for creating "oily" fluid movement
const smoothValue = (newValue: number, prevValue: number, smoothingFactor = 0.4): number => {
  // Lower smoothing factor (0.4) creates more responsive needle movement
  // while still maintaining some fluidity. Previous value was 0.8 which was too sluggish.
  return prevValue * smoothingFactor + newValue * (1 - smoothingFactor);
};

// Define notes for each instrument (for fallback)
const INSTRUMENT_NOTES = {
  'innato': {
    'Cm4': ['G3', 'Bb3', 'C4', 'D4', 'C4', 'Eb4', 'F4', 'G4', 'G4', 'Bb4', 'C5', 'D5'],
    'D#m4': ['A#3', 'C#4', 'D#4', 'F4', 'D#4', 'F#4', 'G#4', 'A#4', 'A#4', 'C#5', 'D#5', 'F5']
  },
  'natey': {
    'Am4': ['A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'B5', 'C6'],
    'Gm4': ['G4', 'Bb4', 'C5', 'D5', 'F5', 'G5', 'A5', 'Bb5']
  },
  'double': {
    'Cm4': ['C4', 'D#4', 'F4', 'G4', 'Bb4', 'C5'],
    'C#m4': ['C#4', 'E4', 'F#4', 'G#4', 'B4', 'C#5']
  },
  'zen': {
    'Gm3': ['G3', 'Bb3', 'C4', 'D4', 'F4', 'G4'],
    'Am3': ['A3', 'C4', 'D4', 'E4', 'G4', 'A4']
  },
  'ova': {
    'Cm4': ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5'],
    'Bm3': ['B3', 'D4', 'E4', 'F#4', 'A4', 'B4']
  }
};

// Vessel name mapping
const VESSEL_NAMES = {
  'innato': {
    'left': 'Left',
    'right': 'Right',
    'front': 'Front'
  },
  'natey': {
    'all': 'All'
  },
  'double': {
    'left': 'Left',
    'right': 'Right'
  },
  'zen': {
    'all': 'All'
  },
  'ova': {
    'all': 'All'
  }
};

// Define the range for the cent meter
const CENTS_RANGE = 30; // -30 to +30 cents
const TARGET_SENSITIVITY = 3; // How many cents within target to be "in tune"

// For INNATO instruments only - special case adjustments
const INNATO_ADJUSTMENTS = {
  'Cm4': {
    'Bb3': 10, // Adjust Bb3 by +10 cents on Innato Cm4 
    'Eb4': 10, // Adjust Eb4 by +10 cents on Innato Cm4
    'Bb4': 10  // Adjust Bb4 by +10 cents on Innato Cm4
  },
  'D#m4': {
    'C#4': 10, // Adjust C#4 by +10 cents on Innato D#m4
    'F#4': 10, // Adjust F#4 by +10 cents on Innato D#m4
    'C#5': 10  // Adjust C#5 by +10 cents on Innato D#m4
  }
};

// Define your component
const MacCompatibleTuner: React.FC<{
  fluteType: FluteType;
  tuningKey: string;
  onClose?: () => void;
}> = ({ fluteType, tuningKey, onClose }) => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState<number | null>(null);
  const [smoothedCents, setSmoothedCents] = useState(0);
  const [prevNote, setPrevNote] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState<string | null>(null);
  const [currentVessel, setCurrentVessel] = useState('all');
  const [availableVessels, setAvailableVessels] = useState<string[]>(['all']);
  const [displayNotes, setDisplayNotes] = useState<string[]>([]);
  const [adjustedNotes, setAdjustedNotes] = useState<Record<string, number>>({});
  const animationRef = useRef<number | null>(null);
  
  // Safely use the tuner settings if available, otherwise use local state
  const [sensitivity, setSensitivity] = useState(0.5);
  let tunerContext;
  
  try {
    tunerContext = useTunerSettings();
  } catch (error) {
    // If no context available, we'll just use the local state
    console.info("TunerSettings context not available, using local state only");
  }

  // Initialize available vessels based on flute type
  useEffect(() => {
    const instrumentLower = fluteType.toLowerCase();
    let vessels: string[] = ['all'];
    
    if (instrumentLower === 'innato') {
      vessels = ['all', 'left', 'right', 'front'];
    } else if (instrumentLower === 'double') {
      vessels = ['all', 'left', 'right'];
    }
    
    setAvailableVessels(vessels);
    setCurrentVessel('all');
  }, [fluteType]);

  // Update display notes when vessel or tuning key changes
  useEffect(() => {
    const instrumentLower = fluteType.toLowerCase();
    const keyLower = tuningKey.toLowerCase();
    
    // Initialize notes from default note sets
    let notes: string[] = [];
    
    // Try to load from shared reference
    try {
      notes = getVesselNotesForKey(instrumentLower, keyLower, currentVessel);
    } catch (error) {
      console.error("Error loading notes from reference:", error);
      // Fall back to default note patterns
      const keyNotes = INSTRUMENT_NOTES[instrumentLower as keyof typeof INSTRUMENT_NOTES]?.[keyLower as keyof (typeof INSTRUMENT_NOTES)[keyof typeof INSTRUMENT_NOTES]];
      
      if (keyNotes) {
        notes = keyNotes;
      } else {
        console.warn(`No notes found for ${instrumentLower} ${keyLower}`);
      }
    }
    
    // For Innato, check if there are any note-specific adjustments and set them
    if (instrumentLower === 'innato') {
      const adjustments: Record<string, number> = {};
      const keyAdjustments = INNATO_ADJUSTMENTS[keyLower as keyof typeof INNATO_ADJUSTMENTS];
      
      if (keyAdjustments) {
        Object.keys(keyAdjustments).forEach(note => {
          adjustments[note] = keyAdjustments[note as keyof typeof keyAdjustments];
        });
      }
      
      setAdjustedNotes(adjustments);
    } else {
      setAdjustedNotes({});
    }
    
    setDisplayNotes(notes);
  }, [fluteType, tuningKey, currentVessel]);

  // Start/stop audio analysis
  useEffect(() => {
    if (isListening) {
      startListening();
    } else {
      stopListening();
    }
    
    return () => {
      stopListening();
    };
  }, [isListening]);

  // Start the audio analysis
  const startListening = async () => {
    try {
      if (!audioContext) {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(context);
        
        // Check if we have previous permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Create analyzer
        const analyserNode = context.createAnalyser();
        analyserNode.fftSize = 2048;
        
        // Connect microphone to analyzer
        const source = context.createMediaStreamSource(stream);
        source.connect(analyserNode);
        
        setAnalyser(analyserNode);
        
        // Start analyzing
        startAnalyzing(analyserNode);
      } else if (analyser) {
        startAnalyzing(analyser);
      }
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setIsListening(false);
    }
  };

  // Stop the audio analysis
  const stopListening = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setCurrentFrequency(null);
    setCurrentNote(null);
    setPrevNote(null);
  };

  // Start analyzing the audio stream
  const startAnalyzing = (analyserNode: AnalyserNode) => {
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const analyzeSound = () => {
      analyserNode.getByteTimeDomainData(dataArray);
      
      // Use autocorrelation for more accurate pitch detection
      const frequency = autoCorrelate(dataArray, audioContext!.sampleRate);
      
      if (frequency > 0) {
        setCurrentFrequency(frequency);
        
        // Find the closest note
        const closestNote = findClosestNote(frequency);
        if (closestNote) {
          const { note, cents } = closestNote;
          
          // Apply adjustment if needed
          let adjustedCents = cents;
          if (adjustedNotes[note]) {
            adjustedCents = cents - adjustedNotes[note];
          }
          
          // Smooth the cents value for gradual meter movement
          const newSmoothedCents = smoothValue(adjustedCents, smoothedCents);
          setSmoothedCents(newSmoothedCents);
          
          if (note !== prevNote) {
            setCurrentNote(note);
            setPrevNote(note);
          }
        }
      }
      
      animationRef.current = requestAnimationFrame(analyzeSound);
    };
    
    analyzeSound();
  };

  // Autocorrelation function for pitch detection
  const autoCorrelate = (buffer: Uint8Array, sampleRate: number): number => {
    // Convert from Uint8Array to Float32Array and normalize
    const floatBuffer = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      floatBuffer[i] = (buffer[i] - 128) / 128;
    }
    
    const bufferSize = floatBuffer.length;
    const correlations = new Array(bufferSize).fill(0);
    
    // Apply sensitivity - higher value means it will pick up quieter sounds
    const sensitivityThreshold = 0.2 - sensitivity * 0.15;
    
    // Check if the signal is strong enough
    let rms = 0;
    for (let i = 0; i < bufferSize; i++) {
      rms += floatBuffer[i] * floatBuffer[i];
    }
    rms = Math.sqrt(rms / bufferSize);
    
    if (rms < sensitivityThreshold) {
      return -1; // Signal too quiet
    }
    
    // Perform autocorrelation
    for (let lag = 0; lag < bufferSize; lag++) {
      let sum = 0;
      for (let i = 0; i < bufferSize - lag; i++) {
        sum += floatBuffer[i] * floatBuffer[i + lag];
      }
      correlations[lag] = sum;
    }
    
    // Find the peak in the correlation
    let maxCorrelation = 0;
    let maxLag = -1;
    for (let lag = 1; lag < bufferSize / 2; lag++) {
      if (correlations[lag] > maxCorrelation) {
        maxCorrelation = correlations[lag];
        maxLag = lag;
      }
    }
    
    if (maxLag <= 0) {
      return -1; // No correlation found
    }
    
    // Refine the peak by interpolating the peak position
    let y1 = correlations[maxLag - 1];
    let y2 = correlations[maxLag];
    let y3 = correlations[maxLag + 1];
    
    let refinedLag = maxLag + 0.5 * (y1 - y3) / (y1 - 2 * y2 + y3);
    
    // Calculate frequency from lag
    return sampleRate / refinedLag;
  };

  // Find the closest musical note to a given frequency
  const findClosestNote = (frequency: number) => {
    if (!frequency) return null;
    
    let closestNote = '';
    let closestDistance = Infinity;
    let closestFrequency = 0;
    
    // Check all notes to find the closest match
    Object.entries(NOTE_FREQUENCIES).forEach(([note, noteFreq]) => {
      const distance = Math.abs(Math.log2(frequency / noteFreq));
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestNote = note;
        closestFrequency = noteFreq;
      }
    });
    
    // Calculate cents deviation
    // 1 octave = 1200 cents
    // cents = 1200 * log2(f1/f2)
    const cents = 1200 * Math.log2(frequency / closestFrequency);
    
    return {
      note: closestNote,
      cents: cents,
      frequency: closestFrequency
    };
  };

  // Toggle listening
  const toggleListening = () => {
    setIsListening(!isListening);
  };

  // Render the header section with mic control
  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Music className="mr-2 h-5 w-5 text-primary" />
          <span className="text-lg font-medium">Tuner</span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={isListening ? "default" : "outline"}
            onClick={toggleListening}
          >
            {isListening ? (
              <Mic className="h-4 w-4 mr-1" />
            ) : (
              <MicOff className="h-4 w-4 mr-1" />
            )}
            {isListening ? "Listening" : "Start"}
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Tuner Settings</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Sensitivity</span>
                    <span>{sensitivity.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[sensitivity]}
                    min={0}
                    max={1}
                    step={0.1}
                    onValueChange={(value) => setSensitivity(value[0])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>More sensitive</span>
                    <span>Less sensitive</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {onClose && (
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Render the tuning meter with needle
  const renderMeter = () => {
    // Calculate needle rotation
    // Limit cents to range for display
    const clampedCents = Math.max(-CENTS_RANGE, Math.min(CENTS_RANGE, smoothedCents));
    const rotation = (clampedCents / CENTS_RANGE) * 90; // -90 to 90 degrees
    
    // Determine if note is in tune (within TARGET_SENSITIVITY cents)
    const isTuned = Math.abs(clampedCents) <= TARGET_SENSITIVITY;
    
    return (
      <div className="my-6 flex flex-col items-center">
        <div className="w-full h-44 relative">
          {/* Dial background */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gray-100 dark:bg-gray-800 rounded-t-full overflow-hidden">
            {/* Cent markers */}
            <div className="relative w-full h-full">
              {/* Scale markers */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pb-6">
                <span className="text-xs">-{CENTS_RANGE}¢</span>
                <span className="text-xs">0¢</span>
                <span className="text-xs">+{CENTS_RANGE}¢</span>
              </div>
              
              {/* Colored zones */}
              <div className="absolute bottom-0 left-0 right-0 h-12 flex">
                <div className="flex-1 bg-red-200 dark:bg-red-900/30 rounded-tl-full" />
                <div className="w-24 bg-green-200 dark:bg-green-900/40" />
                <div className="flex-1 bg-red-200 dark:bg-red-900/30 rounded-tr-full" />
              </div>
              
              {/* Fine tick marks */}
              <div className="absolute bottom-12 left-0 right-0 flex justify-between px-8">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="h-2 w-0.5 bg-gray-400" />
                ))}
              </div>
            </div>
          </div>
          
          {/* Needle - always visible and centered at bottom */}
          <div className="absolute bottom-0 left-1/2 -ml-1 h-20 w-2 flex justify-center origin-bottom transition-transform duration-100 ease-out"
              style={{ transform: `rotate(${rotation}deg)` }}>
            <div className="w-0.5 h-full bg-primary rounded-t-full" />
            <div className={`absolute bottom-0 w-4 h-4 -ml-1.5 rounded-full ${isTuned ? 'bg-green-500' : 'bg-primary'}`} />
          </div>
          
          {/* Note display */}
          <div className="absolute top-0 left-0 right-0 flex justify-center">
            <div className={`text-5xl font-bold ${isTuned ? 'text-green-500' : 'text-primary'}`}>
              {currentNote || '-'}
            </div>
          </div>
          
          {/* Frequency display */}
          <div className="absolute top-16 left-0 right-0 flex justify-center">
            <div className="text-gray-500 text-sm">
              {currentFrequency ? `${currentFrequency.toFixed(1)} Hz (${smoothedCents.toFixed(1)}¢)` : '-'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render vessel tabs
  const renderSectionTabs = () => {
    if (availableVessels.length <= 1) return null;
    
    return (
      <div className="mb-4">
        <div className="flex space-x-1 border-b">
          {availableVessels.map((vessel) => (
            <button
              key={vessel}
              className={`px-3 py-2 text-sm font-medium ${
                currentVessel === vessel 
                  ? 'text-primary border-b-2 border-primary' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              onClick={() => setCurrentVessel(vessel)}
            >
              {VESSEL_NAMES[fluteType.toLowerCase() as keyof typeof VESSEL_NAMES]?.[vessel] || vessel.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render the note grid
  const renderNoteGrid = () => {
    return (
      <div className="grid grid-cols-3 gap-2 mt-4">
        {displayNotes.map((note) => {
          // Get the target frequency for this note
          const targetFreq = NOTE_FREQUENCIES[note];
          const isTarget = currentNote === note;
          
          return (
            <div 
              key={note}
              className={`
                relative p-3 rounded-lg border ${
                  isTarget 
                    ? 'border-primary bg-primary/10' 
                    : 'border-gray-200 dark:border-gray-700'
                }
              `}
            >
              <div className="flex flex-col items-center">
                <div className="text-lg font-bold mb-1">
                  {note}
                </div>
                <div className="text-sm font-medium">
                  {targetFreq ? targetFreq.toFixed(1) + ' Hz' : '-'}
                </div>
              </div>
              
              {/* Adjustment indicator */}
              {adjustedNotes[note] && (
                <div className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center" 
                     title={`Adjusted: ${adjustedNotes[note]}`}>
                  <div className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Main render
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md w-full max-w-lg mx-auto">
      {renderHeader()}
      {renderMeter()}
      {renderSectionTabs()}
      {displayNotes.length > 0 ? renderNoteGrid() : (
        <div className="flex justify-center p-4 text-gray-500">
          No notes available for this instrument and tuning
        </div>
      )}
    </div>
  );
};

export default MacCompatibleTuner;