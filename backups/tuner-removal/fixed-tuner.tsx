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
    // ... other keys for innato
  },
  natey: {
    // Natey flute scales
    'A': {
      notes: ['C4', 'Eb4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'Eb5'],
      scale: ['A3', 'C4', 'D4', 'E4', 'G4', 'A4', 'B4', 'C5']
    },
    // ... other keys for natey
  },
  double: {
    // Double flute scales
    'A': {
      notes: ['E3', 'A3', 'B3', 'C4', 'E4', 'A4']
    },
    // ... other keys for double
  }
};

interface FixedTunerProps {
  instrumentType: string;
  tuningNote?: string;
  frequency?: string | null;
}

const FixedTuner: React.FC<FixedTunerProps> = ({ 
  instrumentType, 
  tuningNote,
  frequency 
}) => {
  // Basic state
  const [baseFrequency, setBaseFrequency] = useState<number>(440);
  const [keyNotes, setKeyNotes] = useState<string[]>([]);
  
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

  // Get instrument color based on type
  const getInstrumentColor = (): string => {
    const lowerType = instrumentType.toLowerCase();
    if (lowerType.includes('innato')) return '#4f46e5';
    if (lowerType.includes('natey')) return '#f59e0b';
    if (lowerType.includes('double')) return '#8b5cf6';
    if (lowerType.includes('zen')) return '#0d9488';
    if (lowerType.includes('ova')) return '#ec4899';
    if (lowerType.includes('cards')) return '#f43f5e';
    return '#64748b';
  };
  
  // Get the instrument background color
  const instrumentBgColor = () => {
    const color = getInstrumentColor();
    return `${color}10`;
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
    e.stopPropagation();
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
    const baseNote = getBaseNote(tuningNote || '') || 'C';
    
    try {
      if (category in INSTRUMENT_NOTES) {
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
  
  // Start the microphone - using ScriptProcessorNode for better macOS support
  const startMic = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Prevent multiple initialization attempts
    if (isActive) {
      console.log('Microphone is already active');
      return;
    }
    
    // Set active state for immediate UI feedback
    setIsActive(true);
    
    try {
      console.log('Requesting microphone access...');
      
      // Request microphone access with minimal processing
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1
        } 
      });
      
      console.log('Microphone access granted with', stream.getAudioTracks().length, 'tracks');
      
      // Log track settings for debugging
      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings();
      console.log(`Sample rate: ${settings.sampleRate}, Channel count: ${settings.channelCount}`);
      
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
        
        // Only attempt pitch detection if signal is strong enough
        const threshold = 0.0005; // Very low threshold for macOS
        if (rms < threshold) {
          return;
        }
        
        // Detect pitch using auto-correlation
        const frequency = detectPitch(inputData, audioContext.sampleRate);
        
        // Only update with valid frequencies in flute range
        if (frequency && frequency > 140 && frequency < 1400) {
          updateDisplay(frequency);
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
  
  return (
    <div className="flex flex-col border rounded-lg shadow-sm p-2"
      style={{backgroundColor: instrumentBgColor()}}>
      <div className="flex justify-between items-center mb-2 text-xs">
        <div className="font-semibold">{instrumentType} {tuningNote || ''} {frequency || ''}</div>
      </div>
      
      <div className="flex justify-between mb-2">
        <div className="flex space-x-2">
          {getInstrumentCategory() === 'innato' && (
            <div className="flex space-x-1">
              <Button 
                size="sm" 
                variant={selectedSection === 'all' ? "default" : "outline"}
                className="p-1 h-6 text-xs font-['PT_Sans_Narrow']"
                onClick={(e) => handleSectionClick(e, 'all')}
              >
                All
              </Button>
              <Button 
                size="sm" 
                variant={selectedSection === 'leftBack' ? "default" : "outline"}
                className="p-1 h-6 text-xs font-['PT_Sans_Narrow']"
                onClick={(e) => handleSectionClick(e, 'leftBack')}
              >
                L-Back
              </Button>
              <Button 
                size="sm" 
                variant={selectedSection === 'rightBack' ? "default" : "outline"}
                className="p-1 h-6 text-xs font-['PT_Sans_Narrow']"
                onClick={(e) => handleSectionClick(e, 'rightBack')}
              >
                R-Back
              </Button>
              <Button 
                size="sm" 
                variant={selectedSection === 'front' ? "default" : "outline"}
                className="p-1 h-6 text-xs font-['PT_Sans_Narrow']"
                onClick={(e) => handleSectionClick(e, 'front')}
              >
                Front
              </Button>
            </div>
          )}
        </div>
        
        <div>
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
      
      {/* Notes table */}
      <div className="grid gap-1 grid-cols-5 mb-2 text-xs">
        {keyNotes.map((note, index) => {
          const isActive = note.replace(' +10¢', '') === activeNote;
          const hasCent = note.includes('+10¢');
          return (
            <div 
              key={`${note}-${index}`}
              className={`border p-1 text-center rounded ${
                isActive ? 'bg-blue-100 border-blue-500 font-bold' : ''
              }`}
            >
              {note}
              {hasCent && <span className="text-[0.6rem] text-green-600 ml-0.5">+10¢</span>}
            </div>
          );
        })}
      </div>
      
      {/* Tuner display */}
      {isActive && (
        <div className="border rounded p-2 bg-white">
          <div className="flex justify-between items-center">
            <div className="text-sm font-semibold">
              {activeNote || '–'} 
              {currentFreq ? ` (${currentFreq.toFixed(1)} Hz)` : ''}
            </div>
            <div className="text-sm font-medium">
              {cents ? `${cents > 0 ? '+' : ''}${cents.toFixed(0)}¢` : ''}
            </div>
          </div>
          
          {/* Tuning meter */}
          <div className="h-2 bg-gray-200 rounded-full mt-1 relative overflow-hidden">
            <div className="absolute top-0 bottom-0 w-[1px] bg-black left-1/2 z-10"></div>
            <div 
              className={`h-full ${getTuningClass()} transition-all duration-100`}
              style={{
                width: '20%',
                transform: `translateX(${Math.max(Math.min(cents * 2.5, 100), -100)}%)`,
                marginLeft: '40%'
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedTuner;