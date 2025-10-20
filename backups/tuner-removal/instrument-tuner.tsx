import React, { useState, useEffect, useRef } from 'react';
import { Music, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface InstrumentTunerProps {
  instrumentType: string;
  tuningNote?: string;
  frequency?: string | null;
}

const InstrumentTuner: React.FC<InstrumentTunerProps> = ({ 
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
  const [signalLevel, setSignalLevel] = useState(0);
  
  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  
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
  
  // Get the instrument background color
  const instrumentBgColor = () => {
    const color = getInstrumentColor();
    return `${color}10`; // 10% opacity version of the color
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
  
  // Get instrument type category
  const getInstrumentCategory = (): string => {
    const lowerType = instrumentType.toLowerCase();
    if (lowerType.includes('innato')) return 'innato';
    if (lowerType.includes('natey')) return 'natey';
    if (lowerType.includes('double')) return 'double';
    return 'innato'; // Default to innato if unknown
  };
  
  // Get the highest tuning note available for an instrument type
  const getHighestTuningNote = (category: string): string => {
    switch(category) {
      case 'innato':
        return 'Em4'; // Highest tuning for Innato
      case 'natey':
        return 'Am4'; // Highest tuning for Natey
      case 'double':
        return 'C#m3'; // Highest tuning for Double
      default:
        return 'Em4'; // Default highest tuning
    }
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
  
  // Get all the notes for this instrument/tuning from the structured data
  const [selectedSection, setSelectedSection] = useState<'all' | 'leftBack' | 'rightBack' | 'front'>('all');
  const [notesData, setNotesData] = useState<any>(null);
  
  // Handle button click with stopPropagation to prevent bubbling
  const handleSectionClick = (e: React.MouseEvent, section: 'all' | 'leftBack' | 'rightBack' | 'front') => {
    e.stopPropagation(); // Prevent event from bubbling up and closing the popover
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
  
  // Enhanced multi-stage YIN algorithm specifically optimized for ceramic flutes
  const autoCorrelate = (buf: Float32Array, sampleRate: number) => {
    const SIZE = buf.length;
    
    // Calculate signal strength
    const rms = Math.sqrt(buf.reduce((sum, x) => sum + x * x, 0) / SIZE);
    
    // Return null if signal is basically silent
    if (rms < 0.001) {
      return null;
    }
    
    // Preprocessing to improve signal quality:
    // 1. Remove DC offset (center around zero)
    const bufferCopy = new Float32Array(SIZE);
    let sum = 0;
    for (let i = 0; i < SIZE; i++) {
      sum += buf[i];
    }
    const mean = sum / SIZE;
    for (let i = 0; i < SIZE; i++) {
      bufferCopy[i] = buf[i] - mean;
    }
    
    // 2. Apply pre-emphasis filter to improve high frequency detection
    // This helps with detecting harmonics more accurately in flutes
    const preEmphasis = 0.97;
    for (let i = SIZE - 1; i > 0; i--) {
      bufferCopy[i] -= preEmphasis * bufferCopy[i - 1];
    }
    
    // YIN algorithm implementation specifically optimized for flutes
    // We use the full YIN algorithm with all steps for maximum accuracy
    
    // Use a limited buffer size for analysis - longer period captures more of the waveform
    // but we want to be responsive for real-time tuning
    const MAX_SAMPLES = Math.min(SIZE, 1024);
    
    // Set frequency range limits specific to flutes
    // Lower bound (140Hz) corresponds to approximately E3/F3 (lowest notes on Innato/Natey)
    // Upper bound (1400Hz) covers the highest harmonics we care about
    const MIN_FREQUENCY = 140;   // Hz - lowest expected flute note frequency
    const MAX_FREQUENCY = 1400;  // Hz - highest expected flute note frequency
    
    // Convert frequency limits to sample periods (tau values)
    const maxPeriod = Math.floor(sampleRate / MIN_FREQUENCY);
    const minPeriod = Math.ceil(sampleRate / MAX_FREQUENCY);
    
    // Ensure our periods are within reasonable bounds based on buffer size
    const searchStart = Math.max(2, minPeriod);     // Skip very small periods (avoid false hits)
    const searchEnd = Math.min(MAX_SAMPLES / 2, maxPeriod); // Can't look beyond half the buffer
    
    // Create the YIN buffer for analysis
    const yinBuffer = new Float32Array(searchEnd + 1);
    
    // Step 1: Autocorrelation function (ACF) - this captures periodicity
    for (let tau = searchStart; tau <= searchEnd; tau++) {
      let acf = 0;
      
      // Number of samples to use for comparison - optimized for speed vs. accuracy
      const numSamples = Math.min(MAX_SAMPLES - tau, 512);
      
      // Calculate autocorrelation
      for (let i = 0; i < numSamples; i++) {
        acf += bufferCopy[i] * bufferCopy[i + tau];
      }
      
      yinBuffer[tau] = acf;
    }
    
    // Step 2: Difference function (central to YIN algorithm)
    // This eliminates many issues with traditional autocorrelation
    for (let tau = searchStart; tau <= searchEnd; tau++) {
      let df = 0;
      
      // Use same window size as for autocorrelation
      const numSamples = Math.min(MAX_SAMPLES - tau, 512);
      
      for (let i = 0; i < numSamples; i++) {
        const delta = bufferCopy[i] - bufferCopy[i + tau];
        df += delta * delta;
      }
      
      yinBuffer[tau] = df;
    }
    
    // Step 3: Cumulative mean normalized difference
    // This is a key improvement in the YIN algorithm
    yinBuffer[0] = 1; // Set first value to 1 to avoid division by zero
    let runningSum = 0;
    for (let t = 1; t <= searchEnd; t++) {
      runningSum += yinBuffer[t];
      if (runningSum === 0) continue; // Avoid division by zero
      
      // Normalize by the running mean
      yinBuffer[t] *= t / runningSum;
    }
    
    // Step 4: Absolute threshold detection - find dips in the function
    // For flutes, we use a very low threshold to catch even subtle periodicities
    // which is especially important for ceramic flutes with complex harmonics
    const threshold = 0.10; // Lower threshold = more sensitive detection but may have false positives
    
    // Collect potential candidates instead of just taking the first one
    const candidates: {tau: number, value: number}[] = [];
    
    for (let t = searchStart; t <= searchEnd; t++) {
      // Is this a local minimum?
      if (t > searchStart && t < searchEnd && 
          yinBuffer[t] < yinBuffer[t-1] && 
          yinBuffer[t] <= yinBuffer[t+1]) {
        
        // Only consider minima below our threshold
        if (yinBuffer[t] < threshold) {
          // Store candidate with its value for confidence calculation
          candidates.push({tau: t, value: yinBuffer[t]});
        }
      }
    }
    
    // Find first dip below threshold, or the global minimum if no dips below threshold
    let minTau = 0;
    let minVal = 1000; // Start with a high value
    
    // First check if we have any candidates
    if (candidates.length > 0) {
      // Sort by value (lowest first - best confidence)
      candidates.sort((a, b) => a.value - b.value);
      const bestCandidate = candidates[0];
      
      minTau = bestCandidate.tau;
      minVal = bestCandidate.value;
    } else {
      // No candidates below threshold, find the global minimum
      for (let t = searchStart; t <= searchEnd; t++) {
        if (yinBuffer[t] < minVal) {
          minVal = yinBuffer[t];
          minTau = t;
        }
      }
    }
    
    // If we found a good minimum (either from candidates or global search)
    if (minTau > 0) {
      // Step 5: Parabolic interpolation for better accuracy
      let betterTau = minTau;
      
      // Only do interpolation if we have points on either side
      if (minTau > searchStart && minTau < searchEnd) {
        const s0 = yinBuffer[minTau - 1];
        const s1 = yinBuffer[minTau];
        const s2 = yinBuffer[minTau + 1];
        
        // Only do interpolation if all three points are valid
        if (s0 !== undefined && s1 !== undefined && s2 !== undefined) {
          // The division here can sometimes cause problems if the points don't form
          // a nice curve, so check the denominator
          const denominator = 2 * (2 * s1 - s2 - s0);
          if (denominator !== 0) {
            const adjustment = (s2 - s0) / denominator;
            // Limit the adjustment to avoid jumping to the wrong octave
            if (Math.abs(adjustment) < 1) {
              betterTau = minTau + adjustment;
            }
          }
        }
      }
      
      // Convert period to frequency
      const estimatedFreq = sampleRate / betterTau;
      const confidence = 1 - Number(minVal);
      console.log(`YIN detected frequency: ${estimatedFreq.toFixed(1)} Hz (confidence: ${confidence.toFixed(3)}) tau: ${betterTau.toFixed(1)}`);
      
      // Double-check that the frequency is within a reasonable range
      if (estimatedFreq >= 140 && estimatedFreq <= 1400) {
        return estimatedFreq;
      } else {
        console.log(`Frequency outside expected range: ${estimatedFreq.toFixed(1)} Hz`);
      }
    }
    
    return null;
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
    
    return { note: closestNote, cents: closestCents };
  };

  // Update the display based on detected frequency
  const updateDisplay = (freq: number) => {
    if (!freq) return;
    
    const { note, cents } = findClosestNote(freq);
    
    if (note) {
      setActiveNote(note);
      setCurrentFreq(freq);
      setCents(cents);
    }
  };

  // Start the audio analysis - completely optimized for flute detection
  const startMic = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling
    e.preventDefault(); // Prevent default behavior
    
    // Prevent multiple initialization attempts
    if (isActive) {
      console.log('Microphone is already active');
      return;
    }
    
    // Already set active state for immediate UI feedback
    setIsActive(true);
    
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Browser does not support getUserMedia API');
        setMicPermission(false);
        setIsActive(false);
        alert("Your browser doesn't support microphone access");
        return;
      }
      
      console.log('Requesting microphone access with OPTIMAL settings for flute detection...');
      
      // Detect if running on macOS or Safari for special handling
      const isMacOS = /Mac/.test(navigator.platform);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      console.log(`Environment detection: macOS=${isMacOS}, Safari=${isSafari}`);
      
      // Request microphone access with HIGHLY optimized constraints for flute detection
      // But use simplified constraints on macOS/Safari which are more compatible
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: isMacOS || isSafari ? 
            true : // Use default audio constraints on Mac/Safari for better compatibility
            {
              // Turn off ALL sound processing to get pure audio signal on non-Mac systems
              echoCancellation: false,  
              noiseSuppression: false,  
              autoGainControl: false,   
              // Request highest quality audio
              sampleRate: 48000,        // Higher sample rate for better precision
              channelCount: 1           // Mono is better for pitch detection
            }
        });
        
        console.log('MICROPHONE SUCCESS! Access granted:', stream.active);
        
        // Log audio tracks and their constraints for debugging
        stream.getAudioTracks().forEach(track => {
          console.log('Audio track:', track.label, track.enabled, track.readyState);
          console.log('Audio track settings:', track.getSettings());
        });
        
        setMicPermission(true);
        streamRef.current = stream;
        
        // Close any existing audio context first to prevent memory leaks
        if (audioContextRef.current) {
          await audioContextRef.current.close();
        }
        
        // Create new audio context with optimal settings for flute detection
        // Use different settings based on platform - macOS/Safari need special handling
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        
        // On macOS/Safari, use more conservative audio context settings
        const audioContext = new AudioContextClass(isMacOS || isSafari ? 
          // Simple config for macOS/Safari
          {} 
          : 
          // Advanced config for other platforms
          {
            sampleRate: 48000,         // Higher sample rate for better precision
            latencyHint: 'interactive'  // Lower latency for real-time feedback
          }
        );
        audioContextRef.current = audioContext;
        
        console.log('Audio context created with sample rate:', audioContext.sampleRate);
        
        // CRITICAL: Force resume the audio context - required on many browsers
        // This is especially important on macOS/Safari
        try {
          if (audioContext.state === 'suspended') {
            console.log('Audio context suspended, attempting to resume...');
            await audioContext.resume();
            console.log('Audio context resumed:', audioContext.state);
          }
          
          // For Safari on macOS, we might need multiple resume attempts
          if (isSafari && isMacOS && audioContext.state !== 'running') {
            console.log('Safari on macOS detected, making additional resume attempt...');
            // Small delay to let Safari process the first resume attempt
            await new Promise(resolve => setTimeout(resolve, 100));
            await audioContext.resume();
            console.log('Second resume attempt result:', audioContext.state);
          }
        } catch (resumeErr) {
          // If resume fails, log but continue - it might work anyway
          console.warn('Error resuming audio context:', resumeErr);
          console.log('Continuing despite resume error - context may recover automatically');
        }
        
        // Create and configure analyzer for optimal flute detection
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        
        // Connect audio source to analyzer
        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        source.connect(analyser);
        
        // Optimal FFT settings for flute detection
        // Smaller FFT size gives faster updates with slight loss of precision
        // This is a good trade-off for wind instruments
        analyser.fftSize = 1024;  
        
        // Set analyzer parameters for maximum sensitivity
        analyser.minDecibels = -90;  // Very low threshold to catch quiet sounds
        analyser.maxDecibels = -10;  // Prevent clipping on loud sounds
        analyser.smoothingTimeConstant = 0.6; // Balance between stability and responsiveness
        
        // Create buffer for analysis
        const buffer = new Float32Array(analyser.fftSize);
        bufferRef.current = buffer;
        
        console.log('Audio analyzer configured with FFT size:', analyser.fftSize);
        console.log('Ready to detect pitches in the range 140Hz - 1400Hz (optimal for flutes)');
        
        // Special Mac-specific direct audio processing
        // Use ScriptProcessorNode for direct audio processing (older API but more reliable on Mac)
        if (isMacOS || isSafari) {
          console.log("Setting up Mac-specific ScriptProcessorNode for direct audio access");
          const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            if (!isActive) return;
            
            // Get input buffer directly from microphone
            const inputBuffer = audioProcessingEvent.inputBuffer;
            const inputData = inputBuffer.getChannelData(0);
            
            // Calculate RMS value (volume)
            let sum = 0;
            for (let i = 0; i < inputData.length; i++) {
              sum += inputData[i] * inputData[i];
            }
            const rms = Math.sqrt(sum / inputData.length);
            
            // Visual debug
            const signalBar = '◼'.repeat(Math.min(Math.floor(rms * 2000), 30));
            console.log(`ScriptProcessor: ${signalBar} (${rms.toFixed(8)})`);
            
            // Detect pitch with extremely low threshold for Mac
            if (rms > 0.00001) {
              const freq = autoCorrelate(inputData, audioContext.sampleRate);
              if (freq && freq > 100 && freq < 1800) {
                console.log(`⭐ ScriptProcessor detected: ${freq.toFixed(1)} Hz`);
                updateDisplay(freq);
              }
            }
          };
          
          // Connect the ScriptProcessorNode
          source.connect(scriptProcessor);
          scriptProcessor.connect(audioContext.destination);
          console.log("Mac-specific audio processing initialized");
        }
        
        // Start the regular audio processing loop with enhanced error handling
        const listen = () => {
          // Ensure all components are available before processing
          if (!isActive || !analyserRef.current || !bufferRef.current || !audioContextRef.current) {
            return;
          }
          
          try {
            // Get time-domain audio data (waveform)
            analyserRef.current.getFloatTimeDomainData(bufferRef.current);
            
            // Calculate signal strength (RMS)
            const sum = bufferRef.current.reduce((acc, val) => acc + val * val, 0);
            const rms = Math.sqrt(sum / bufferRef.current.length);
            
            // Special Mac handling - completely different approach for Mac
            if (isMacOS || isSafari) {
              // On Mac, try frequency domain analysis instead of time domain
              // Get frequency data which might be more reliable on Mac
              const frequencyData = new Uint8Array(analyserRef.current.frequencyBinCount);
              analyserRef.current.getByteFrequencyData(frequencyData);
              
              // Check if we have any frequency data (non-zero values) - signals sound
              const hasFrequencyData = frequencyData.some(val => val > 5); // Threshold of 5 (out of 255)
              
              // Create visualization for frequency data
              const freqLevel = Math.max(...Array.from(frequencyData)) / 255;
              const freqBar = '▓'.repeat(Math.min(Math.floor(freqLevel * 30), 30));
              
              // Calculate standard RMS from time domain too
              const sum = bufferRef.current.reduce((acc, val) => acc + val * val, 0);
              const rms = Math.sqrt(sum / bufferRef.current.length);
              const rmsBar = '█'.repeat(Math.min(Math.floor(rms * 1000), 30)); // Higher multiplier for Mac
              
              // Log both metrics
              console.log(`Freq: ${freqBar} (${freqLevel.toFixed(4)}) | RMS: ${rmsBar} (${rms.toFixed(6)})`);
              console.log(`Freq bins: [${frequencyData.slice(0, 10).join(',')}...]`);
              
              // Use the frequency data approach on Mac
              if (hasFrequencyData) { // If we have any frequency data
                // Only process when we have a minimal signal to avoid detecting noise
                const freq = autoCorrelate(bufferRef.current, audioContextRef.current.sampleRate);
                
                // Filter out frequencies outside expected flute range
                if (freq && freq >= 140 && freq <= 1400) {
                  console.log(`✓ DETECTED: ${freq.toFixed(1)} Hz`);
                  updateDisplay(freq);
                } else {
                  // No valid frequency detected despite having signal
                  console.log(`✗ No valid flute pitch detected in RMS: ${rms.toFixed(6)}`);
                }
              } else if (rms > 0.0005) {
                // Signal present but too weak
                console.log(`⚠ Signal too weak for reliable detection (${rms.toFixed(6)}) - please play louder or move closer`);
              }
            }
            
            // Continue processing if tuner is still active
            if (isActive) {
              animationRef.current = requestAnimationFrame(listen);
            }
          } catch (error) {
            console.error('Error in audio processing:', error);
            // Retry on next frame, don't immediately fail
            if (isActive) {
              animationRef.current = requestAnimationFrame(listen);
            }
          }
        };
        
        // Start the listening loop
        listen();
        
      } catch (micErr) {
        console.error('Microphone access failed with optimal settings, trying fallback...', micErr);
        
        // Fallback to basic audio settings if optimal failed
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true // Use browser defaults
        });
        
        console.log('Microphone access granted with basic settings');
        setMicPermission(true);
        streamRef.current = stream;
        
        // Setup basic audio context
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;
        
        // For macOS/Safari, we especially need to force resume the context
        try {
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('Fallback audio context resumed:', audioContext.state);
          }
        } catch (resumeErr) {
          console.warn('Error resuming fallback audio context:', resumeErr);
        }
        
        // Enhanced analyzer setup for Mac
        const analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;
        
        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        source.connect(analyser);
        
        // Optimized settings for Mac
        analyser.fftSize = 2048;
        // Set analyzer parameters for maximum sensitivity
        analyser.minDecibels = -100;  // Very low threshold to catch quiet sounds on Mac
        analyser.maxDecibels = -10;   // Prevent clipping on loud sounds
        analyser.smoothingTimeConstant = 0.5; // Balance between stability and responsiveness
        
        // Create buffer
        const buffer = new Float32Array(analyser.fftSize);
        bufferRef.current = buffer;
        
        // Basic listening function
        const listen = () => {
          if (!isActive || !analyserRef.current || !bufferRef.current || !audioContextRef.current) {
            return;
          }
          
          try {
            analyserRef.current.getFloatTimeDomainData(bufferRef.current);
            const sum = bufferRef.current.reduce((acc, val) => acc + val * val, 0);
            const rms = Math.sqrt(sum / bufferRef.current.length);
            
            // Lower threshold for Mac - 0.002 instead of 0.005
            const macThreshold = 0.002;
            const standardThreshold = 0.005;
            
            // Show signal strength for debugging on Mac
            if (isMacOS || isSafari) {
              console.log(`Fallback signal: ${rms.toFixed(6)} - Threshold: ${macThreshold}`);
            }
            
            if (rms > (isMacOS || isSafari ? macThreshold : standardThreshold)) {
              const freq = autoCorrelate(bufferRef.current, audioContextRef.current.sampleRate);
              if (freq && freq > 20 && freq < 2000) {
                console.log(`✓ FALLBACK DETECTED: ${freq.toFixed(1)} Hz`);
                updateDisplay(freq);
              }
            }
            
            if (isActive) {
              animationRef.current = requestAnimationFrame(listen);
            }
          } catch (error) {
            console.error('Error in audio processing:', error);
            if (isActive) {
              animationRef.current = requestAnimationFrame(listen);
            }
          }
        };
        
        listen();
      }
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setMicPermission(false);
      setIsActive(false);
      alert("Could not access microphone. Please check your browser permissions.");
    }
  };

  // Stop the microphone and audio processing
  const stopMic = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent event from bubbling
      e.preventDefault(); // Prevent default browser behavior
    }
    
    setIsActive(false);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    setCurrentFreq(null);
    setCents(0);
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isActive) {
        stopMic();
      }
    };
  }, [isActive]);
  
  // Get tuning meter color based on cents
  const getTuningClass = () => {
    const absCents = Math.abs(cents);
    if (absCents < 5) return 'bg-green-500';
    if (absCents < 15) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div 
      className="mb-3 p-2 rounded-md border border-gray-300 text-sm shadow-sm"
      style={{ backgroundColor: instrumentBgColor() }}
      onClick={(e) => e.stopPropagation()} // Prevent clicks from closing parent components
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-gray-700 flex items-center font-['PT_Sans_Narrow']">
          <Music className="h-3 w-3 mr-1" />
          TUNING REFERENCE
        </h4>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 font-['PT_Sans_Narrow']">
            {baseFrequency} Hz
          </div>
          {!isActive ? (
            <Button 
              size="sm" 
              variant="outline"
              className="p-1 h-6 text-xs font-['PT_Sans_Narrow']"
              onClick={startMic}
              style={{ 
                borderColor: getInstrumentColor(),
                color: getInstrumentColor()
              }}
            >
              <Mic className="h-3 w-3 mr-1" /> MIC
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="default"
              className="p-1 h-6 text-xs font-['PT_Sans_Narrow']"
              onClick={stopMic}
              style={{ 
                backgroundColor: getInstrumentColor(),
                borderColor: getInstrumentColor()
              }}
            >
              <MicOff className="h-3 w-3 mr-1" /> STOP
            </Button>
          )}
        </div>
      </div>
      
      {/* Live tuner display */}
      {isActive && (
        <div className="mb-2 border border-gray-300 rounded-md p-2 bg-white">
          <div className="text-center mb-1">
            <div className="text-base font-bold font-['PT_Sans_Narrow']" style={{ color: getInstrumentColor() }}>
              {activeNote || '--'}
            </div>
          </div>
          
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden relative border border-gray-200">
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-gray-700 left-1/2 transform -translate-x-1/2 z-10"
            ></div>
            <div 
              className={`h-full ${getTuningClass()} transition-all duration-100`}
              style={{ 
                width: '2px', 
                position: 'absolute',
                left: '50%',
                transform: `translateX(${Math.min(Math.max(cents * 2, -100), 100)}%)`,
              }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-400 mt-1 font-['PT_Sans_Narrow']">
            <span>-50¢</span>
            <span>♭</span>
            <span>0</span>
            <span>♯</span>
            <span>+50¢</span>
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <div className={`text-xs font-['PT_Sans_Narrow'] ${Math.abs(cents) < 10 ? 'text-green-600' : Math.abs(cents) < 20 ? 'text-yellow-600' : 'text-red-600'}`}>
              {cents > 0 ? '+' : ''}{cents.toFixed(1)} cents
            </div>
            {currentFreq && (
              <div className="text-xs text-gray-500 font-['PT_Sans_Narrow']">
                {currentFreq.toFixed(1)} Hz
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Chamber section tabs for Innato */}
      {getInstrumentCategory() === 'innato' && (
        <div className="flex mb-2 text-xs">
          <button 
            className={`flex-1 py-1 rounded-l-md font-['PT_Sans_Narrow'] border ${selectedSection === 'all' ? 'bg-opacity-20 bg-indigo-100 border-indigo-300' : 'border-gray-300'}`}
            onClick={(e) => handleSectionClick(e, 'all')}
            style={{ color: selectedSection === 'all' ? getInstrumentColor() : 'gray' }}
          >
            ALL
          </button>
          <button 
            className={`flex-1 py-1 font-['PT_Sans_Narrow'] border-t border-b ${selectedSection === 'leftBack' ? 'bg-opacity-20 bg-indigo-100 border-indigo-300' : 'border-gray-300'}`}
            onClick={(e) => handleSectionClick(e, 'leftBack')}
            style={{ color: selectedSection === 'leftBack' ? getInstrumentColor() : 'gray' }}
          >
            LEFT
          </button>
          <button 
            className={`flex-1 py-1 font-['PT_Sans_Narrow'] border-t border-b ${selectedSection === 'rightBack' ? 'bg-opacity-20 bg-indigo-100 border-indigo-300' : 'border-gray-300'}`}
            onClick={(e) => handleSectionClick(e, 'rightBack')}
            style={{ color: selectedSection === 'rightBack' ? getInstrumentColor() : 'gray' }}
          >
            RIGHT
          </button>
          <button 
            className={`flex-1 py-1 rounded-r-md font-['PT_Sans_Narrow'] border ${selectedSection === 'front' ? 'bg-opacity-20 bg-indigo-100 border-indigo-300' : 'border-gray-300'}`}
            onClick={(e) => handleSectionClick(e, 'front')}
            style={{ color: selectedSection === 'front' ? getInstrumentColor() : 'gray' }}
          >
            FRONT
          </button>
        </div>
      )}
      
      {/* Note reference grid */}
      {keyNotes.length > 0 ? (
        <div className="flex flex-wrap gap-1 justify-center">
          {keyNotes.map((note, index) => {
            // Extract base note for highlighting
            const displayNote = note.replace(' +10¢', '');
            const hasSharpTuning = note.includes('+10¢');
            
            return (
              <div 
                key={index} 
                className={`border rounded-md px-1 py-1 bg-white text-center flex-1 min-w-[40px] ${hasSharpTuning ? 'border-amber-300' : 'border-gray-300'} ${isActive && activeNote === displayNote ? 'border-green-500 bg-green-50' : ''}`}
              >
                <div className="text-base font-bold font-['PT_Sans_Narrow']" style={{ color: getInstrumentColor() }}>
                  {displayNote}
                </div>
                <div className="text-[10px] text-gray-500 font-['PT_Sans_Narrow']">
                  {calculateFrequency(displayNote)} Hz
                  {hasSharpTuning && <span className="text-amber-500 ml-0.5">+10¢</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-gray-500 text-xs font-['PT_Sans_Narrow']">
          No tuning notes available for {tuningNote || 'this instrument'}
        </div>
      )}
      
      {/* Permissions error message */}
      {micPermission === false && (
        <div className="mt-2 text-xs text-red-500 text-center font-['PT_Sans_Narrow']">
          Microphone access denied. Please check your browser permissions.
        </div>
      )}
      
      {/* Footer description */}
      <div className="mt-2 text-xs text-gray-500 text-center font-['PT_Sans_Narrow']">
        {getInstrumentCategory() === 'innato' ? 
          (selectedSection === 'all' ? 
            "All notes for this flute's tuning." : 
            `${selectedSection === 'leftBack' ? 'Left back' : selectedSection === 'rightBack' ? 'Right back' : 'Front'} chamber notes.`) :
          "Primary notes for this instrument's tuning."}
      </div>
    </div>
  );
};

export default InstrumentTuner;