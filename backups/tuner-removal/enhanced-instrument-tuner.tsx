import React, { useState, useEffect, useRef } from 'react';
import { Music, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PitchDetector } from './pitch-detector';
import FingeringDiagram from './fingering-diagram';

// Define note frequencies reference
const NOTE_INDEX = {
  "C": 0, "C#": 1, "Db": 1,
  "D": 2, "D#": 3, "Eb": 3,
  "E": 4, "F": 5, "F#": 6, "Gb": 6,
  "G": 7, "G#": 8, "Ab": 8,
  "A": 9, "A#": 10, "Bb": 10,
  "B": 11
};

// Reference note frequencies for different instruments with chamber mapping
// Based on Stonewhistle tuning system
const INSTRUMENT_NOTES = {
  innato: {
    // Format is organized by chambers: [leftBack, rightBack, front]
    'A': {
      notes: ['G3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5'],
      leftBack: ['E3', 'G3 +10¢', 'A3', 'B3'],
      rightBack: ['A3', 'C4 +10¢', 'D4', 'E4'],
      front: ['E4', 'G4 +10¢', 'A4', 'B4']
    },
    'Bb': {
      notes: ['G3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5'],
      leftBack: ['F3', 'Ab3 +10¢', 'Bb3', 'C4'],
      rightBack: ['Bb3', 'Db4 +10¢', 'Eb4', 'F4'], 
      front: ['F4', 'Ab4 +10¢', 'Bb4', 'C5']
    },
    'B': {
      notes: ['G3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5'],
      leftBack: ['F#3', 'A3 +10¢', 'B3', 'C#4'],
      rightBack: ['B3', 'D4 +10¢', 'E4', 'F#4'],
      front: ['F#4', 'A4 +10¢', 'B4', 'C#5']
    },
    'C': {
      notes: ['G3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5'],
      leftBack: ['G3', 'Bb3 +10¢', 'C4', 'D4'],
      rightBack: ['C4', 'Eb4 +10¢', 'F4', 'G4'],
      front: ['G4', 'Bb4 +10¢', 'C5', 'D5']
    },
    'C#': {
      notes: ['G3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5'],
      leftBack: ['G#3', 'B3 +10¢', 'C#4', 'D#4'],
      rightBack: ['C#4', 'E4 +10¢', 'F#4', 'G#4'],
      front: ['G#4', 'B4 +10¢', 'C#5', 'D#5']
    },
    'D': {
      notes: ['G3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5'],
      leftBack: ['A3', 'C4 +10¢', 'D4', 'E4'],
      rightBack: ['D4', 'F4 +10¢', 'G4', 'A4'],
      front: ['A4', 'C5 +10¢', 'D5', 'E5']
    },
    'Eb': {
      notes: ['G3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5'],
      leftBack: ['Bb3', 'Db4 +10¢', 'Eb4', 'F4'],
      rightBack: ['Eb4', 'Gb4 +10¢', 'Ab4', 'Bb4'],
      front: ['Bb4', 'Db5 +10¢', 'Eb5', 'F5']
    },
    'E': {
      notes: ['G3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5'],
      leftBack: ['B3', 'D4 +10¢', 'E4', 'F#4'],
      rightBack: ['E4', 'G4 +10¢', 'A4', 'B4'],
      front: ['B4', 'D5 +10¢', 'E5', 'F#5']
    },
    'F': {
      notes: ['G3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5'],
      leftBack: ['C4', 'Eb4 +10¢', 'F4', 'G4'],
      rightBack: ['F4', 'Ab4 +10¢', 'Bb4', 'C5'],
      front: ['C5', 'Eb5 +10¢', 'F5', 'G5']
    },
    'F#': {
      notes: ['G3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5'],
      leftBack: ['C#4', 'E4 +10¢', 'F#4', 'G#4'],
      rightBack: ['F#4', 'A4 +10¢', 'B4', 'C#5'],
      front: ['C#5', 'E5 +10¢', 'F#5', 'G#5']
    },
    'G': {
      notes: ['G3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5'],
      leftBack: ['D4', 'F4 +10¢', 'G4', 'A4'],
      rightBack: ['G4', 'Bb4 +10¢', 'C5', 'D5'],
      front: ['D5', 'F5 +10¢', 'G5', 'A5']
    },
    'G#': {
      notes: ['G3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5'],
      leftBack: ['D#4', 'F#4 +10¢', 'G#4', 'A#4'],
      rightBack: ['G#4', 'B4 +10¢', 'C#5', 'D#5'],
      front: ['D#5', 'F#5 +10¢', 'G#5', 'A#5']
    }
  },
  natey: {
    // Natey flute scales
    'A': {
      notes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5'],
      scale: ['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'B4', 'C5']
    },
    'Bb': {
      notes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5'],
      scale: ['Bb3', 'Db4', 'Eb4', 'F4', 'Ab4', 'Bb4', 'C5', 'Db5']
    },
    'B': {
      notes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5'],
      scale: ['B3', 'D4', 'E4', 'F#4', 'A4', 'B4', 'C#5', 'D5']
    },
    'C': {
      notes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5'],
      scale: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5']
    },
    'C#': {
      notes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5'],
      scale: ['C#4', 'E4', 'F#4', 'G#4', 'B4', 'C#5', 'D#5', 'E5']
    },
    'D': {
      notes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5'],
      scale: ['D4', 'F4', 'G4', 'A4', 'C5', 'D5', 'E5', 'F5']
    },
    'Eb': {
      notes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5'],
      scale: ['Eb4', 'Gb4', 'Ab4', 'Bb4', 'Db5', 'Eb5', 'F5', 'Gb5']
    },
    'E': {
      notes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5'],
      scale: ['E4', 'G4', 'A4', 'B4', 'D5', 'E5', 'F#5', 'G5']
    },
    'F': {
      notes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5'],
      scale: ['F4', 'Ab4', 'Bb4', 'C5', 'Eb5', 'F5', 'G5', 'Ab5']
    },
    'F#': {
      notes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5'],
      scale: ['F#4', 'A4', 'B4', 'C#5', 'E5', 'F#5', 'G#5', 'A5']
    },
    'G': {
      notes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5'],
      scale: ['G4', 'Bb4', 'C5', 'D5', 'F5', 'G5', 'A5', 'Bb5']
    },
    'G#': {
      notes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5'],
      scale: ['G#4', 'B4', 'C#5', 'D#5', 'F#5', 'G#5', 'A#5', 'B5']
    }
  },
  double: {
    // Double flute - more compact array of notes
    'C': {
      notes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5']
    },
    // Other keys follow the same pattern but transposed
    'D': {
      notes: ['D4', 'F4', 'G4', 'A4', 'C5', 'D5']
    },
    'E': {
      notes: ['E4', 'G4', 'A4', 'B4', 'D5', 'E5']
    },
    'F': {
      notes: ['F4', 'Ab4', 'Bb4', 'C5', 'Eb5', 'F5']
    },
    'G': {
      notes: ['G4', 'Bb4', 'C5', 'D5', 'F5', 'G5']
    },
    'A': {
      notes: ['A4', 'C5', 'D5', 'E5', 'G5', 'A5']
    },
    'B': {
      notes: ['B4', 'D5', 'E5', 'F#5', 'A5', 'B5']
    }
  }
};

interface EnhancedInstrumentTunerProps {
  instrumentType: string;
  tuningNote?: string;
  frequency?: string | null;
}

const EnhancedInstrumentTuner: React.FC<EnhancedInstrumentTunerProps> = ({ 
  instrumentType, 
  tuningNote,
  frequency 
}) => {
  const [baseFrequency, setBaseFrequency] = useState<number>(440);
  const [keyNotes, setKeyNotes] = useState<string[]>([]);
  
  // Microphone tuner state
  const [isActive, setIsActive] = useState(false);
  const [currentFreq, setCurrentFreq] = useState<number | null>(null);
  const [cents, setCents] = useState<number>(0);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [activeNote, setActiveNote] = useState<string>('');
  
  // Reference to our pitch detector
  const pitchDetectorRef = useRef<PitchDetector | null>(null);
  
  // Get instrument type category as a FluteType
  const getInstrumentCategory = () => {
    const lowerType = instrumentType.toLowerCase();
    if (lowerType.includes('innato')) return 'innato' as const;
    if (lowerType.includes('natey')) return 'natey' as const;
    if (lowerType.includes('double')) return 'double' as const;
    return 'innato' as const; // Default to innato if unknown
  };
  
  // Get instrument color based on type (matching instrument colors from app)
  const getInstrumentColor = (): string => {
    const lowerType = instrumentType.toLowerCase();
    if (lowerType.includes('innato')) return '#4f46e5'; // indigo-600
    if (lowerType.includes('natey')) return '#f59e0b'; // amber-500
    if (lowerType.includes('double')) return '#8b5cf6'; // purple-600
    if (lowerType.includes('zen')) return '#0d9488'; // teal-600
    if (lowerType.includes('ova')) return '#ec4899'; // pink-600
    if (lowerType.includes('cards')) return '#f43f5e'; // rose-500
    return '#64748b'; // slate-500 (default for unknown types)
  };
  
  // Set the base frequency based on the instrument tuning
  useEffect(() => {
    if (frequency) {
      if (frequency.includes('432')) {
        setBaseFrequency(432);
      } else if (frequency.includes('425')) {
        setBaseFrequency(425);
      } else if (frequency.includes('420')) {
        setBaseFrequency(420);
      } else {
        setBaseFrequency(440); // Default
      }
    }
  }, [frequency]);
  
  // Get the base note (e.g., "C" from "Cm4")
  const getBaseNote = (note: string): string => {
    if (!note) return '';
    // First character is always the base note
    const baseNote = note.charAt(0);
    
    // Check if there's a sharp or flat
    let modifier = '';
    if (note.length > 1) {
      const nextChar = note.charAt(1);
      if (nextChar === '#' || nextChar === 'b') {
        modifier = nextChar;
      }
    }
    
    return baseNote + modifier;
  };
  
  // Calculate frequency for a given note
  const calculateFrequency = (note: string): number => {
    const parts = note.match(/([A-G][b#]?)(\d+)/);
    if (!parts) return 0;
    
    const noteName = parts[1];
    const octave = parseInt(parts[2]);
    const n = NOTE_INDEX[noteName as keyof typeof NOTE_INDEX];
    const semitones = n - NOTE_INDEX["A"] + (octave - 4) * 12;
    let freq = baseFrequency * Math.pow(2, semitones / 12);
    
    // Apply 10 cents sharp for Stonewhistle tuning on certain notes
    if (["Bb", "Eb", "G"].includes(noteName)) {
      freq *= Math.pow(2, 10 / 1200);
    }
    
    return parseFloat(freq.toFixed(1));
  };
  
  // Find the closest note to a given frequency
  const findClosestNote = (freq: number): { note: string, cents: number } => {
    const notes = Object.keys(NOTE_INDEX);
    let closestNote = '';
    let closestCents = 0;
    let minCentsDiff = Infinity;
    
    // Try all notes in different octaves
    for (let octave = 2; octave < 7; octave++) {
      for (const note of notes) {
        const fullNote = `${note}${octave}`;
        const noteFreq = calculateFrequency(fullNote);
        
        if (noteFreq) {
          // Convert frequency difference to cents
          const diff = 1200 * Math.log2(freq / noteFreq);
          const absDiff = Math.abs(diff);
          
          if (absDiff < minCentsDiff) {
            minCentsDiff = absDiff;
            closestNote = fullNote;
            closestCents = diff;
          }
        }
      }
    }
    
    return { note: closestNote, cents: Math.round(closestCents) };
  };
  
  // Handle frequency detected from our pitch detector
  const handleFrequencyChange = (frequency: number) => {
    if (frequency > 0) {
      setCurrentFreq(frequency);
      const { note, cents } = findClosestNote(frequency);
      setActiveNote(note);
      setCents(cents);
    }
  };
  
  // Start the microphone and detection
  const startMic = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Set active state for immediate UI feedback
    setIsActive(true);
    
    // Create the pitch detector if it doesn't exist
    if (!pitchDetectorRef.current) {
      pitchDetectorRef.current = new PitchDetector(handleFrequencyChange);
    }
    
    try {
      const success = await pitchDetectorRef.current.initialize();
      
      if (success) {
        setMicPermission(true);
        pitchDetectorRef.current.start();
      } else {
        setMicPermission(false);
        setIsActive(false);
      }
    } catch (error) {
      console.error("Error starting microphone:", error);
      setMicPermission(false);
      setIsActive(false);
    }
  };
  
  // Stop the microphone
  const stopMic = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (pitchDetectorRef.current) {
      pitchDetectorRef.current.stop();
      pitchDetectorRef.current.cleanup();
      pitchDetectorRef.current = null;
    }
    
    setIsActive(false);
    setCurrentFreq(null);
    setActiveNote('');
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pitchDetectorRef.current) {
        pitchDetectorRef.current.stop();
        pitchDetectorRef.current.cleanup();
      }
    };
  }, []);
  
  // Get all the notes for this instrument/tuning from the structured data
  const [selectedSection, setSelectedSection] = useState<'all' | 'leftBack' | 'rightBack' | 'front'>('all');
  const [notesData, setNotesData] = useState<any>(null);
  
  // Handle button click with stopPropagation to prevent bubbling
  const handleSectionClick = (e: React.MouseEvent, section: 'all' | 'leftBack' | 'rightBack' | 'front') => {
    e.stopPropagation(); // Prevent event from bubbling up
    setSelectedSection(section);
  };
  
  // Type definition for a chamber note data structure
  type ChamberData = {
    notes?: string[];
    leftBack?: string[];
    rightBack?: string[];
    front?: string[];
    scale?: string[];
  };

  useEffect(() => {
    const category = getInstrumentCategory();
    const baseNote = getBaseNote(tuningNote || '') || 'C'; // Default to C if no tuning note
    
    try {
      if (category in INSTRUMENT_NOTES) {
        // Get instrument data with proper type casting
        const instrumentData = INSTRUMENT_NOTES[category as keyof typeof INSTRUMENT_NOTES];
        let keyData: ChamberData = {};
        
        // Find the closest key if exact key not found
        if (baseNote in instrumentData) {
          keyData = instrumentData[baseNote as keyof typeof instrumentData] as ChamberData;
        } else {
          // Default to C key if the specific key isn't found
          keyData = instrumentData['C' as keyof typeof instrumentData] as ChamberData;
        }
        
        if (keyData) {
          setNotesData(keyData);
          
          // Get the relevant notes based on selection
          if (category === 'innato') {
            // For Innato, we have sections
            if (selectedSection === 'all') {
              keyData.notes && setKeyNotes(keyData.notes);
            } else {
              // Handle each specific section
              const sectionKey = selectedSection as keyof ChamberData;
              if (keyData[sectionKey] && Array.isArray(keyData[sectionKey])) {
                // Keep the original notes with their +10¢ markings
                const sectionNotes = keyData[sectionKey] as string[];
                setKeyNotes(sectionNotes);
              } else {
                keyData.notes && setKeyNotes(keyData.notes);
              }
            }
          } else if (category === 'natey') {
            // For Natey, use the scale or notes
            if (keyData.scale && Array.isArray(keyData.scale)) {
              setKeyNotes(keyData.scale);
            } else if (keyData.notes && Array.isArray(keyData.notes)) {
              setKeyNotes(keyData.notes);
            } else {
              setKeyNotes([]);
            }
          } else {
            // For Double, just use notes
            keyData.notes && Array.isArray(keyData.notes) && setKeyNotes(keyData.notes);
          }
        } else {
          setKeyNotes([]);
        }
      } else {
        setKeyNotes([]);
      }
    } catch (error) {
      console.error('Error processing tuning data:', error);
      setKeyNotes([]);
    }
  }, [tuningNote, instrumentType, selectedSection]);
  
  // Get accurate needle rotation based on cents offset
  const getNeedleRotation = () => {
    if (!isActive || (cents === 0 && !currentFreq)) return 0;
    
    // Limit the rotation to +/- 50 degrees, with 50 degrees representing +/- 50 cents
    const maxRotation = 50;
    let rotation = (cents / 50) * maxRotation;
    
    // Clamp the rotation value
    if (rotation > maxRotation) rotation = maxRotation;
    if (rotation < -maxRotation) rotation = -maxRotation;
    
    // Add slight random movement when inactive to simulate sensitivity
    if (!currentFreq && isActive) {
      rotation = (Math.random() * 6) - 3; // Small random movement
    }
    
    return rotation;
  };
  
  // Format the detected note for display
  const formatDetectedNote = () => {
    if (!activeNote) return '—';
    
    // Extract the note name and octave
    const match = activeNote.match(/([A-G][b#]?)(\d+)/);
    if (!match) return activeNote;
    
    const noteName = match[1];
    const octave = match[2];
    
    return `${noteName}${octave}`;
  };
  
  // Get CSS color class based on cents offset
  const getCentsColorClass = () => {
    if (!isActive || !currentFreq) return 'text-gray-400';
    
    const absCents = Math.abs(cents);
    if (absCents < 5) return 'text-green-500';
    if (absCents < 15) return 'text-green-400';
    if (absCents < 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Format frequency with one decimal place
  const formatFrequency = (freq: number | null) => {
    if (!freq) return '—';
    return `${freq.toFixed(1)} Hz`;
  };
  
  return (
    <div className="instrument-tuner w-full rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
      {/* Tuner header with gradient */}
      <div className="relative overflow-hidden">
        <div 
          className="p-2 text-white text-center flex justify-between items-center relative z-10" 
          style={{ 
            background: `linear-gradient(to right, ${getInstrumentColor()}dd, ${getInstrumentColor()})`,
          }}
        >
          <div className="text-xs font-medium opacity-90 flex items-center backdrop-blur-sm bg-white/10 rounded-full px-2 py-0.5">
            <Music className="h-3 w-3 mr-1" />
            <span>Base: {baseFrequency} Hz</span>
          </div>
          <div className="text-sm font-bold tracking-wide">TUNER</div>
          <div className="text-xs font-medium bg-white/15 rounded-full px-2 py-0.5 backdrop-blur-sm">
            {tuningNote ? tuningNote.replace('m', ' minor ') : ''}
          </div>
        </div>
        
        {/* Decorative dots/pattern in header */}
        <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10 overflow-hidden">
          <div className="absolute -top-12 -right-10 w-32 h-32 rounded-full bg-white/20"></div>
          <div className="absolute -bottom-14 -left-10 w-28 h-28 rounded-full bg-white/15"></div>
        </div>
      </div>
      
      {/* Main tuner interface */}
      <div className="p-4">
        {/* Visual diagram */}
        <div className="mb-1">
          <FingeringDiagram 
            fluteType={getInstrumentCategory()}
            detectedNote={formatDetectedNote()}
            centsOffset={cents}
            size="small"
          />
        </div>
        
        {/* Active note and tuning indicator */}
        <div className="flex justify-center items-center mb-4 mt-4">
          <div className="tuning-gauge relative w-40 h-12 flex items-center justify-center">
            {/* Tuning scale with markers and improved styling */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="gauge-scale w-full h-2 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                <div className="w-1/5 h-full bg-gradient-to-r from-red-400 to-red-300"></div>
                <div className="w-1/5 h-full bg-gradient-to-r from-red-300 to-yellow-300"></div>
                <div className="w-1/5 h-full bg-gradient-to-r from-yellow-300 to-green-400"></div>
                <div className="w-1/5 h-full bg-gradient-to-r from-green-400 to-yellow-300"></div>
                <div className="w-1/5 h-full bg-gradient-to-r from-yellow-300 to-red-400"></div>
              </div>
              
              {/* Tick marks */}
              <div className="absolute inset-x-0 top-1/2 flex justify-between px-1 -mt-3 pointer-events-none">
                <div className="h-2 w-px bg-gray-400 opacity-60"></div>
                <div className="h-1.5 w-px bg-gray-400 opacity-40"></div>
                <div className="h-3 w-0.5 bg-gray-600"></div>
                <div className="h-1.5 w-px bg-gray-400 opacity-40"></div>
                <div className="h-2 w-px bg-gray-400 opacity-60"></div>
              </div>
              
              {/* Center line */}
              <div className="gauge-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-700"></div>
              
              {/* Cent labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] text-gray-500 mt-1 px-0.5 font-medium">
                <span>-50¢</span>
                <span className="opacity-0">-25¢</span>
                <span>0¢</span>
                <span className="opacity-0">+25¢</span>
                <span>+50¢</span>
              </div>
            </div>
            
            {/* Needle with improved styling */}
            <div 
              className="gauge-needle absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 origin-center transition-transform duration-100"
              style={{ transform: `translateX(-50%) translateY(-140%) rotate(${getNeedleRotation()}deg)` }}
            >
              <div className="w-0.5 h-8 bg-gray-900 rounded-full shadow-md"></div>
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-900 to-gray-700 -mt-0.5 -ml-[5px] shadow-md"></div>
            </div>
          </div>
        </div>
        
        {/* Active note and cents offset display */}
        <div className="flex justify-center items-baseline mb-2">
          <div className={`text-3xl font-bold text-center ${getCentsColorClass()}`}>
            {formatDetectedNote()}
          </div>
          <div className={`ml-2 text-lg ${getCentsColorClass()}`}>
            {isActive && currentFreq ? (cents > 0 ? `+${cents}¢` : `${cents}¢`) : ''}
          </div>
        </div>
        
        {/* Frequency display */}
        <div className={`text-sm text-center mb-2 ${getCentsColorClass()}`}>
          {isActive ? formatFrequency(currentFreq) : ''}
        </div>
      
        {/* Controls with improved design */}
        <div className="flex justify-center mt-4">
          {!isActive ? (
            <button
              className="flex items-center px-5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium shadow-md hover:shadow-lg transition-all"
              onClick={startMic}
            >
              <Mic className="h-4 w-4 mr-2 animate-pulse" />
              <span>START TUNING</span>
            </button>
          ) : (
            <button
              className="flex items-center px-5 py-2 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white font-medium shadow-md hover:shadow-lg transition-all"
              onClick={stopMic}
            >
              <MicOff className="h-4 w-4 mr-2" />
              <span>STOP</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Chamber buttons for Innato flutes */}
      {getInstrumentCategory() === 'innato' && (
        <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-gray-100">
          <div className="flex justify-center p-2 gap-1">
            <button
              className={`text-xs py-1.5 px-3 rounded-full transition-colors ${
                selectedSection === 'all' 
                  ? 'text-white font-medium shadow-sm' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
              style={selectedSection === 'all' ? { backgroundColor: getInstrumentColor() } : {}}
              onClick={(e) => handleSectionClick(e, 'all')}
            >
              All Notes
            </button>
            <button
              className={`text-xs py-1.5 px-3 rounded-full transition-colors ${
                selectedSection === 'leftBack' 
                  ? 'text-white font-medium shadow-sm' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
              style={selectedSection === 'leftBack' ? { backgroundColor: getInstrumentColor() } : {}}
              onClick={(e) => handleSectionClick(e, 'leftBack')}
            >
              Left Back
            </button>
            <button
              className={`text-xs py-1.5 px-3 rounded-full transition-colors ${
                selectedSection === 'rightBack' 
                  ? 'text-white font-medium shadow-sm' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
              style={selectedSection === 'rightBack' ? { backgroundColor: getInstrumentColor() } : {}}
              onClick={(e) => handleSectionClick(e, 'rightBack')}
            >
              Right Back
            </button>
            <button
              className={`text-xs py-1.5 px-3 rounded-full transition-colors ${
                selectedSection === 'front' 
                  ? 'text-white font-medium shadow-sm' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 shadow-sm'
              }`}
              style={selectedSection === 'front' ? { backgroundColor: getInstrumentColor() } : {}}
              onClick={(e) => handleSectionClick(e, 'front')}
            >
              Front
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedInstrumentTuner;