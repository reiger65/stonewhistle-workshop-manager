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

// Define instrument note ranges
const INSTRUMENT_SCALES = {
  innato: {
    description: "A three-chambered vessel flute tuned to a minor scale",
    key: "Em",
    scale: ["Em4", "Dm4", "Cm4", "Bm3", "Am3", "Gm3", "Fm3", "Em3"],
    ranges: {
      left_back: ["Em3", "Fm3", "Gm3", "Am3"],
      right_back: ["Gm3", "Am3", "Bm3", "Cm4"],
      front: ["Cm4", "Dm4", "Em4", "Fm4"]
    },
    frequency_range: { min: 160, max: 660 }
  },
  double: {
    description: "A double-chambered vessel flute with two voices",
    key: "C#m",
    scale: ["C#m3", "Bm3", "Am3", "Gm3", "Fm3", "Em3", "Dm3", "C#m3"],
    frequency_range: { min: 130, max: 530 }
  },
  natey: {
    description: "A small vessel flute with a bright sound",
    key: "Am",
    scale: ["Am4", "Gm4", "Fm4", "Em4", "Dm4", "Cm4", "Bm3", "Am3", "Gm3"],
    frequency_range: { min: 180, max: 880 }
  }
};

interface GridTunerProps {
  instrumentType: string;
  tuningNote?: string;
  frequency?: string;
}

const GridTuner: React.FC<GridTunerProps> = ({ 
  instrumentType, 
  tuningNote,
  frequency 
}) => {
  // Basic state
  const [baseFrequency, setBaseFrequency] = useState<number>(440);
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [displayNotes, setDisplayNotes] = useState<string[]>([]);
  const [noteFrequencies, setNoteFrequencies] = useState<{[note: string]: number}>({});
  
  // Tuner state
  const [isActive, setIsActive] = useState(false);
  const [currentFreq, setCurrentFreq] = useState<number | null>(null);
  const [cents, setCents] = useState<number>(0);
  const [micPermission, setMicPermission] = useState<boolean | null>(null);
  const [activeNote, setActiveNote] = useState<string>('');
  
  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Set the base frequency based on the input or default to 440Hz
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

  // Get instrument type category
  const getInstrumentCategory = (): string => {
    const lowerType = instrumentType.toLowerCase();
    if (lowerType.includes('innato')) return 'innato';
    if (lowerType.includes('natey')) return 'natey';
    if (lowerType.includes('double')) return 'double';
    return 'innato'; // Default to innato if unknown
  };

  // Get the tuning note from the instrument type and tuning note string
  // e.g., "Em4" from "INNATO Em4"
  const getTuningNote = (): string => {
    if (tuningNote && tuningNote.length > 0) {
      return tuningNote;
    }
    
    // Default tuning notes for each instrument type
    const category = getInstrumentCategory();
    switch(category) {
      case 'innato': return 'Em4';
      case 'natey': return 'Am4';
      case 'double': return 'C#m3';
      default: return 'Em4';
    }
  };

  // Calculate frequency for a given note
  const calculateFrequency = (note: string): number => {
    if (!note) return 0;
    
    const parts = note.match(/([A-G][b#]?)([m]?)(\d+)/);
    if (!parts) return 0;
    
    const noteName = parts[1];
    const octave = parseInt(parts[3]);
    
    // Get the index of the note
    const n = NOTE_INDEX[noteName as keyof typeof NOTE_INDEX];
    if (n === undefined) return 0;
    
    // Calculate semitones from A4 at the base frequency
    const semitones = n - NOTE_INDEX["A"] + (octave - 4) * 12;
    let freq = baseFrequency * Math.pow(2, semitones / 12);
    
    // Round to 1 decimal place
    return parseFloat(freq.toFixed(1));
  };

  // Setup display notes and frequencies
  useEffect(() => {
    const category = getInstrumentCategory();
    const instrumentData = INSTRUMENT_SCALES[category as keyof typeof INSTRUMENT_SCALES];
    
    if (!instrumentData) {
      setDisplayNotes([]);
      return;
    }
    
    // Get notes based on the selected section
    let notes: string[] = [];
    
    if (selectedSection === 'ALL') {
      notes = [...instrumentData.scale];
    } else if (category === 'innato') {
      // For Innato, we have specific ranges for different chambers
      const section = selectedSection.toLowerCase();
      if (section === 'left' && 'ranges' in instrumentData) {
        notes = [...instrumentData.ranges.left_back];
      } else if (section === 'right' && 'ranges' in instrumentData) {
        notes = [...instrumentData.ranges.right_back];
      } else if (section === 'front' && 'ranges' in instrumentData) {
        notes = [...instrumentData.ranges.front];
      } else {
        // Fallback to full scale if ranges not found
        notes = [...instrumentData.scale];
      }
    } else {
      // For other instruments, just use the full scale
      notes = [...instrumentData.scale];
    }
    
    // Calculate frequencies for all notes
    const frequencies: {[note: string]: number} = {};
    for (const note of notes) {
      frequencies[note] = calculateFrequency(note);
    }
    
    setDisplayNotes(notes);
    setNoteFrequencies(frequencies);
    
  }, [instrumentType, selectedSection, baseFrequency]);

  // Pitch detection using auto-correlation
  const detectPitch = (buffer: Float32Array, sampleRate: number): number | null => {
    // Basic pitch detection using auto-correlation
    let bestOffset = -1;
    let bestCorrelation = 0;
    
    // Set reasonable frequency range for flutes (140Hz to 1400Hz)
    const minPeriod = Math.floor(sampleRate / 1400);
    const maxPeriod = Math.ceil(sampleRate / 140);
    
    for (let offset = minPeriod; offset <= maxPeriod; offset++) {
      let correlation = 0;
      
      // Calculate correlation at this offset
      for (let i = 0; i < buffer.length - offset; i++) {
        correlation += buffer[i] * buffer[i + offset];
      }
      
      // Normalize
      correlation = correlation / (buffer.length - offset);
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }
    
    // If we found a good correlation
    if (bestOffset !== -1 && bestCorrelation > 0.01) {
      // Convert offset to frequency
      const frequency = sampleRate / bestOffset;
      return frequency;
    }
    
    return null;
  };

  // Find the closest note to a given frequency
  const findClosestNote = (freq: number): { note: string, cents: number } => {
    // Check all display notes for the closest match
    let closestNote = '';
    let closestCents = 0;
    let minCentsDiff = Infinity;
    
    for (const note of Object.keys(noteFrequencies)) {
      const noteFreq = noteFrequencies[note];
      
      if (noteFreq) {
        // Convert frequency difference to cents
        const diff = 1200 * Math.log2(freq / noteFreq);
        const absDiff = Math.abs(diff);
        
        if (absDiff < minCentsDiff) {
          minCentsDiff = absDiff;
          closestNote = note;
          closestCents = diff;
        }
      }
    }
    
    // If no note was found or difference is too large
    if (!closestNote || minCentsDiff > 100) {
      // Check all notes in different octaves as a fallback
      const notes = Object.keys(NOTE_INDEX);
      
      for (let octave = 2; octave < 6; octave++) {
        for (const noteName of notes) {
          const fullNote = `${noteName}${octave}`;
          const noteFreq = calculateFrequency(fullNote);
          
          if (noteFreq) {
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

  // Start microphone access and audio processing
  const startMic = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Prevent multiple initialization attempts
    if (isActive) {
      console.log('Microphone is already active');
      return;
    }
    
    console.log('=== STARTING MICROPHONE SETUP ===');
    
    // Clean up any existing audio resources first
    if (isActive) {
      stopMic();
    }
    
    // Set active state for immediate UI feedback
    setIsActive(true);
    
    try {
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser does not support getUserMedia');
      }
      
      console.log('Requesting microphone access...');
      
      // Request microphone access with minimal processing
      // Using basic options first for maximum compatibility
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      
      console.log('Microphone access granted with', stream.getAudioTracks().length, 'tracks');
      
      // Log track settings for debugging
      const track = stream.getAudioTracks()[0];
      console.log('Track label:', track.label);
      console.log('Track constraints:', track.getConstraints());
      
      if (track.getSettings) {
        const settings = track.getSettings();
        console.log('Track settings:', JSON.stringify(settings));
      }
      
      setMicPermission(true);
      streamRef.current = stream;
      
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      console.log('Audio context created with sample rate:', audioContext.sampleRate);
      
      // Resume audio context if needed
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('Audio context resumed:', audioContext.state);
      }
      
      // Create source from microphone
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      // Create script processor node for direct audio access
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;
      
      // Connect the nodes: source -> processor -> destination
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // Set up processing callback to get direct audio data
      processor.onaudioprocess = (e) => {
        if (!isActive) return;
        
        // Get input buffer directly from microphone
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate RMS of the signal to determine volume
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i]; 
        }
        const rms = Math.sqrt(sum / inputData.length);
        
        // Log RMS value occasionally to debug
        if (Math.random() < 0.01) {
          console.log('Audio signal RMS:', rms);
        }
        
        // Use an extremely low threshold to detect any sound
        const threshold = 0.0001; // Super low threshold for compatibility
        
        if (rms < threshold) {
          // Not enough signal
          return;
        }
        
        // Detect pitch using auto-correlation
        const frequency = detectPitch(inputData, audioContext.sampleRate);
        
        if (frequency) {
          console.log('Detected frequency:', frequency);
          
          // Update with valid frequencies in a wide range to be safe
          // Flutes typically from 130Hz to 1500Hz
          if (frequency > 100 && frequency < 1500) {
            updateDisplay(frequency);
          }
        }
      };
      
      console.log('ScriptProcessorNode setup complete - tuner is ready');
      
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
      e.stopPropagation();
      e.preventDefault();
    }
    
    setIsActive(false);
    
    // Disconnect processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    
    // Disconnect source
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    // Stop all microphone tracks
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    setCurrentFreq(null);
    setCents(0);
    console.log('Microphone stopped');
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

  // Format function for the meter needle position
  const getMeterPosition = () => {
    const clampedCents = Math.max(-50, Math.min(50, cents)); // Limit to -50..50
    const position = (clampedCents + 50) / 100; // Convert to 0..1 scale
    return position * 100;
  };

  return (
    <div className="flex flex-col p-3 rounded-md bg-white">
      {/* Tuning Reference Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          <Music className="h-4 w-4 text-indigo-600" />
          <span className="font-medium text-sm text-gray-700">TUNING REFERENCE</span>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">{baseFrequency} Hz</span>
          {!isActive ? (
            <Button
              onClick={startMic}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 h-7 px-2.5"
            >
              <Mic className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">MIC</span>
            </Button>
          ) : (
            <Button
              onClick={stopMic}
              size="sm"
              className="bg-red-600 hover:bg-red-700 h-7 px-2.5"
            >
              <MicOff className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">STOP</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tuning Meter - Only show when active */}
      {isActive && (
        <div className="mb-4">
          <div className="relative h-8 bg-gray-100 rounded-full p-1">
            <div className="absolute inset-0 flex justify-center items-center">
              <span className="absolute left-1/4 text-xs text-gray-500">-</span>
              <span className="absolute right-1/4 text-xs text-gray-500">+</span>
              <span className="absolute text-xs text-gray-500">0</span>
            </div>
            
            {/* Needle position */}
            {currentFreq && (
              <div 
                className="absolute bottom-0 w-1 bg-red-500" 
                style={{
                  height: '90%',
                  left: `${getMeterPosition()}%`,
                  transform: 'translateX(-50%)',
                  transition: 'left 0.1s ease-out'
                }}
              />
            )}
            
            {/* Cents display */}
            {currentFreq && (
              <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-mono">
                {cents > 0 ? '+' : ''}{Math.round(cents)} cents
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section Selectors */}
      <div className="grid grid-cols-4 gap-1 mb-3">
        <button 
          className={`text-xs py-1 px-2 rounded ${selectedSection === 'ALL' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-600'}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSection('ALL');
          }}
        >
          ALL
        </button>
        <button 
          className={`text-xs py-1 px-2 rounded ${selectedSection === 'LEFT' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-600'}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSection('LEFT');
          }}
        >
          LEFT
        </button>
        <button 
          className={`text-xs py-1 px-2 rounded ${selectedSection === 'RIGHT' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-600'}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSection('RIGHT');
          }}
        >
          RIGHT
        </button>
        <button 
          className={`text-xs py-1 px-2 rounded ${selectedSection === 'FRONT' ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-gray-100 text-gray-600'}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedSection('FRONT');
          }}
        >
          FRONT
        </button>
      </div>

      {/* Note Grid */}
      <div className="grid grid-cols-5 gap-2">
        {displayNotes.map((note, index) => {
          const isActiveNote = activeNote === note && currentFreq !== null;
          return (
            <div 
              key={index} 
              className={`flex flex-col items-center p-1.5 rounded ${isActiveNote ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-gray-50'}`}
            >
              <div className={`text-sm font-medium ${isActiveNote ? 'text-indigo-700' : 'text-gray-700'}`}>
                {note}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {noteFrequencies[note]?.toFixed(1)} Hz
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer text */}
      <div className="mt-3 text-center text-xs text-gray-500">
        All notes for this flute's tuning:
      </div>
    </div>
  );
};

export default GridTuner;