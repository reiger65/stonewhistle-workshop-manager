import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Note names for display
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Flute data from the JSON
const FLUTE_DATA = {
  "innato": {
    "description": "A three-chambered vessel flute tuned to a minor pentatonic scale.",
    "key": "A minor",
    "scale": ["A", "C", "D", "E"],
    "ranges": {
      "left_back": ["A2", "C3", "D3", "E3"],
      "right_back": ["A3", "C4", "D4", "E4"],
      "front": ["A3", "C4", "D4", "E4"]
    },
    "frequency_range": {
      "min": 110, // A2
      "max": 330  // E4
    }
  },
  "double": {
    "description": "Two parallel vessel flutes joined together.",
    "key": "C minor",
    "scale": ["C", "Eb", "F", "G", "Bb", "C2", "D", "Eb"],
    "frequency_range": {
      "min": 130, // C3
      "max": 310  // Eb4
    }
  },
  "natey": {
    "description": "Native American style flute with closed vessel design.",
    "key": "C minor",
    "scale": ["C", "Eb", "F", "G", "Bb", "C2", "D", "Eb"],
    "frequency_range": {
      "min": 130, // C3
      "max": 310  // Eb4
    }
  }
};

// Interface for note information
interface NoteInfo {
  name: string;
  octave: number;
  cents: number;
  frequency: number;
}

export default function FluteEnhancedTuner() {
  // State
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState<NoteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [audioData, setAudioData] = useState<number[]>([]);
  const [fluteType, setFluteType] = useState<string>("innato");
  const [sensitivity, setSensitivity] = useState(5); // 1-10 scale
  const [baseFrequency, setBaseFrequency] = useState(440); // A4 reference
  const [chamber, setChamber] = useState<string>("all");
  
  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Add log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(logMessage);
    setLogs(prev => [logMessage, ...prev].slice(0, 20));
  };
  
  // Platform detection
  const isMacOS = /Mac/.test(navigator.platform);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  // Start the audio analyzer
  const startAudio = async () => {
    try {
      setError(null);
      addLog("Starting microphone for flute tuning...");
      
      // Request microphone access with no processing
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1
        } 
      });
      
      streamRef.current = stream;
      addLog(`Microphone access granted with ${stream.getAudioTracks().length} tracks`);
      
      // Log track settings
      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings();
      addLog(`Sample rate: ${settings.sampleRate}, Channel count: ${settings.channelCount}`);
      
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      addLog(`Audio context created with sample rate: ${audioContext.sampleRate}Hz`);
      
      // Resume audio context if needed
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        addLog(`Audio context resumed from suspended state`);
      }
      
      // Create source from microphone stream
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      // Create ScriptProcessorNode for direct access to audio data
      // This approach is deprecated but works better on Mac
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;
      
      // Connect the nodes: source -> processor -> destination (with zero gain to prevent feedback)
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // Set up processing callback to get direct audio data
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        processAudioData(inputData);
      };
      
      setIsListening(true);
      addLog(`Flute tuner started - please play your ${fluteType} flute`);
    } catch (err) {
      setError(`Error accessing microphone: ${err instanceof Error ? err.message : String(err)}`);
      addLog(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Process the raw audio data
  const processAudioData = (data: Float32Array) => {
    try {
      // Calculate RMS of the signal
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i]; 
      }
      const rms = Math.sqrt(sum / data.length);
      
      // Update visualization with a subset of the data
      const dataPoints: number[] = [];
      for (let i = 0; i < data.length; i += 20) { // Take every 20th sample
        dataPoints.push(data[i]);
      }
      setAudioData(dataPoints);
      
      // Only attempt pitch detection if signal is strong enough
      // Apply sensitivity multiplier to lower the threshold for quiet sounds
      const threshold = 0.001 / sensitivity;
      if (rms < threshold) {
        return;
      }
      
      // Detect pitch using autocorrelation
      const frequency = detectPitch(data, audioContextRef.current?.sampleRate || 48000);
      
      if (frequency) {
        // Check if frequency is in the range for the selected flute type
        const fluteRange = FLUTE_DATA[fluteType].frequency_range;
        if (frequency >= fluteRange.min && frequency <= fluteRange.max) {
          // Get note information
          const noteInfo = getNote(frequency);
          setNote(noteInfo);
        }
      }
    } catch (error) {
      console.error('Error processing audio data:', error);
    }
  };
  
  // Pitch detection using autocorrelation
  const detectPitch = (buffer: Float32Array, sampleRate: number): number | null => {
    // Use a simple autocorrelation approach
    let bestOffset = -1;
    let bestCorrelation = 0;
    
    // Limit to reasonable offsets for our frequency range
    const minOffset = Math.floor(sampleRate / 1500); // Highest expected frequency
    const maxOffset = Math.ceil(sampleRate / 100);  // Lowest expected frequency
    
    // Search for the best correlation
    for (let offset = minOffset; offset <= maxOffset; offset++) {
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
    if (bestOffset !== -1) {
      // Convert offset to frequency
      return sampleRate / bestOffset;
    }
    
    return null;
  };
  
  // Calculate note from frequency
  const getNote = (frequency: number): NoteInfo => {
    // Adjust the base frequency according to the user selection
    const A4 = baseFrequency; // Configurable A4 reference (440Hz standard, 432Hz alternative)
    
    // Calculate semitones from A4
    const semitones = 12 * Math.log2(frequency / A4);
    
    // Get note index
    const noteIndex = Math.round(semitones) + 69; // A4 is midi note 69
    
    // Get note name and octave
    const name = NOTE_NAMES[noteIndex % 12];
    const octave = Math.floor(noteIndex / 12) - 1;
    
    // Calculate exact frequency for this note
    const noteFrequency = A4 * Math.pow(2, (noteIndex - 69) / 12);
    
    // Calculate cents deviation
    const cents = Math.round(1200 * Math.log2(frequency / noteFrequency));
    
    return { name, octave, cents, frequency };
  };
  
  // Stop the audio analyzer
  const stopAudio = () => {
    setIsListening(false);
    
    // Disconnect and close audio components
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    
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
    
    setNote(null);
    addLog("Microphone stopped");
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopAudio();
      }
    };
  }, [isListening]);
  
  // Effect to update when flute type changes
  useEffect(() => {
    if (isListening) {
      addLog(`Flute type changed to: ${fluteType}`);
    }
  }, [fluteType, isListening]);
  
  // Update sensitivity
  const handleSensitivityChange = (value: number[]) => {
    setSensitivity(value[0]);
  };
  
  // Update base frequency
  const handleFrequencyChange = (value: number) => {
    setBaseFrequency(value);
    addLog(`Tuning reference changed to: ${value}Hz`);
  };
  
  // Helper to get color based on cents
  const getCentsColor = () => {
    if (!note) return "text-gray-500";
    const absCents = Math.abs(note.cents);
    if (absCents <= 5) return "text-green-600"; // Very good
    if (absCents <= 15) return "text-yellow-600"; // Acceptable
    return "text-red-600"; // Too far off
  };
  
  // Format note with chamber info
  const getFormattedNote = () => {
    if (!note) return "--";
    
    // If we're in a specific chamber mode, indicate it
    if (chamber !== "all" && fluteType === "innato") {
      return `${note.name}${note.octave} (${chamber.replace("_", " ")})`;
    }
    
    return `${note.name}${note.octave}`;
  };
  
  // Get matched notes from scale
  const getScaleMatch = () => {
    if (!note) return null;
    
    const noteName = note.name;
    const scale = FLUTE_DATA[fluteType].scale;
    
    if (scale.includes(noteName)) {
      return <span className="text-green-600">✓ In scale</span>;
    }
    
    return <span className="text-gray-400">Not in scale</span>;
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2 text-center">Stonewhistle Flute Tuner</h1>
      <p className="text-center mb-6 text-gray-500">Specialized tuner for handcrafted ceramic flutes</p>
      
      <div className="max-w-xl mx-auto grid gap-6">
        <Card className="p-4">
          <Tabs defaultValue="innato" onValueChange={setFluteType}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="innato">Innato</TabsTrigger>
              <TabsTrigger value="natey">Natey</TabsTrigger>
              <TabsTrigger value="double">Double</TabsTrigger>
            </TabsList>
            
            <TabsContent value="innato" className="p-2">
              <div className="text-sm">
                <p><strong>Key:</strong> {FLUTE_DATA.innato.key}</p>
                <p><strong>Scale:</strong> {FLUTE_DATA.innato.scale.join(", ")}</p>
                <p><strong>Range:</strong> A2-E4 (110-330 Hz)</p>
                
                {/* Chamber selector for Innato */}
                <div className="mt-2">
                  <p className="font-medium mb-1">Chamber Selection:</p>
                  <div className="flex gap-2">
                    <Button 
                      variant={chamber === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChamber("all")}
                    >
                      All
                    </Button>
                    <Button 
                      variant={chamber === "left_back" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChamber("left_back")}
                    >
                      Left Back
                    </Button>
                    <Button 
                      variant={chamber === "right_back" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChamber("right_back")}
                    >
                      Right Back
                    </Button>
                    <Button 
                      variant={chamber === "front" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChamber("front")}
                    >
                      Front
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="natey" className="p-2">
              <div className="text-sm">
                <p><strong>Key:</strong> {FLUTE_DATA.natey.key}</p>
                <p><strong>Scale:</strong> {FLUTE_DATA.natey.scale.join(", ")}</p>
                <p><strong>Range:</strong> C3-Eb4 (130-310 Hz)</p>
                <p><strong>Style:</strong> Native American style closed vessel flute</p>
              </div>
            </TabsContent>
            
            <TabsContent value="double" className="p-2">
              <div className="text-sm">
                <p><strong>Key:</strong> {FLUTE_DATA.double.key}</p>
                <p><strong>Scale:</strong> {FLUTE_DATA.double.scale.join(", ")}</p>
                <p><strong>Range:</strong> C3-Eb4 (130-310 Hz)</p>
                <p><strong>Style:</strong> Two parallel vessel flutes</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
        
        <Card className="p-6">
          <div className="flex flex-col items-center">
            {/* Note display */}
            <div className="text-7xl font-bold mb-2">
              {getFormattedNote()}
            </div>
            
            {/* Cents display */}
            <div className={`text-4xl ${getCentsColor()} mb-1`}>
              {note ? `${note.cents > 0 ? '+' : ''}${note.cents} cents` : '--'}
            </div>
            
            {/* Frequency and scale match */}
            <div className="flex flex-col items-center mb-6">
              {note && (
                <div className="text-sm text-gray-500">
                  {note.frequency.toFixed(1)} Hz
                </div>
              )}
              <div className="text-sm mt-1">
                {getScaleMatch()}
              </div>
            </div>
            
            {/* Raw waveform visualization */}
            <div className="w-full h-20 bg-gray-900 rounded mb-4 overflow-hidden">
              {audioData.length > 0 ? (
                <svg width="100%" height="100%" viewBox={`0 0 ${audioData.length} 2`} preserveAspectRatio="none">
                  <path
                    d={`M 0 1 ${audioData.map((point, i) => `L ${i} ${1 + point}`).join(' ')}`}
                    stroke="#4ade80"
                    strokeWidth="0.05"
                    fill="none"
                  />
                </svg>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No audio data
                </div>
              )}
            </div>
            
            {/* Settings */}
            <div className="w-full mb-4 grid grid-cols-2 gap-4">
              {/* Sensitivity control */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Sensitivity: {sensitivity}</span>
                </div>
                <Slider
                  value={[sensitivity]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={handleSensitivityChange}
                />
              </div>
              
              {/* Tuning reference */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">A4 Reference: {baseFrequency}Hz</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant={baseFrequency === 440 ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleFrequencyChange(440)}
                  >
                    440Hz
                  </Button>
                  <Button 
                    variant={baseFrequency === 432 ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleFrequencyChange(432)}
                  >
                    432Hz
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Microphone controls */}
            {!isListening ? (
              <Button 
                size="lg" 
                onClick={startAudio}
                className="w-full"
              >
                Start Microphone
              </Button>
            ) : (
              <Button 
                size="lg" 
                variant="destructive" 
                onClick={stopAudio}
                className="w-full"
              >
                Stop Microphone
              </Button>
            )}
            
            {error && (
              <div className="mt-4 p-2 bg-red-100 text-red-800 rounded text-sm">
                {error}
              </div>
            )}
            
            <div className="mt-4 text-xs text-gray-500">
              <div>Platform: {isMacOS ? 'macOS' : 'Other'} / Browser: {isSafari ? 'Safari' : 'Other'}</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Debug Log</h2>
          <div className="h-48 overflow-y-auto bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))}
            {logs.length === 0 && <div className="text-gray-500">No logs yet</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}