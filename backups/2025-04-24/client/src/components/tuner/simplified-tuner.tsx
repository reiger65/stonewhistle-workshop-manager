import React, { useState, useEffect, useRef } from 'react';
import { Music, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  NOTE_FREQUENCIES,
  FluteType,
} from '@shared/instrument-reference';

// Define the range for the cent meter
const CENTS_RANGE = 30; // -30 to +30 cents
const TARGET_SENSITIVITY = 3; // How many cents within target to be "in tune"

// Smooth value function for creating "oily" fluid movement
const smoothValue = (newValue: number, prevValue: number, smoothingFactor = 0.4): number => {
  return prevValue * smoothingFactor + newValue * (1 - smoothingFactor);
};

// Define your component
const SimplifiedTuner: React.FC<{
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
  const animationRef = useRef<number | null>(null);
  
  // Initialize state
  const [sensitivity, setSensitivity] = useState(0.5);

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
          
          // Smooth the cents value for gradual meter movement
          const newSmoothedCents = smoothValue(cents, smoothedCents);
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

  // Main render
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md w-full max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Music className="mr-2 h-5 w-5 text-primary" />
          <span className="text-lg font-medium">Tuner - {fluteType} {tuningKey}</span>
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
          
          {onClose && (
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
      {renderMeter()}
    </div>
  );
};

export default SimplifiedTuner;