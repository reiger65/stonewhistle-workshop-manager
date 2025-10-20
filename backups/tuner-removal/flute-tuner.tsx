import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Flute tuning ranges and note data
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BASE_FREQUENCY = 440; // A4 = 440Hz

// Frequency ranges for different flute types
const FLUTE_RANGES = {
  innato: { min: 160, max: 660 }, // Em3-Em4 range
  natey: { min: 195, max: 440 },  // Gm3-Am4 range
  double: { min: 130, max: 277 }  // Gm2-C#m3 range
};

// Interface for detected note information
interface NoteInfo {
  name: string;
  octave: number;
  cents: number;
  frequency: number;
}

export default function FluteSpecificTuner() {
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState<NoteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signalLevel, setSignalLevel] = useState(0);
  const [maxSignalLevel, setMaxSignalLevel] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [fluteType, setFluteType] = useState<string>("innato");
  const [frequencyData, setFrequencyData] = useState<number[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const domainBufferRef = useRef<Float32Array | null>(null);
  const freqBufferRef = useRef<Uint8Array | null>(null);
  
  // Add log message
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [message, ...prev].slice(0, 15));
  };
  
  // Platform detection
  const isMacOS = /Mac/.test(navigator.platform);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  // Start the tuner
  const startTuner = async () => {
    try {
      setError(null);
      addLog("Starting microphone...");
      
      // Request microphone access - disable all processing for maximum sensitivity
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      streamRef.current = stream;
      addLog(`Microphone access granted with ${stream.getAudioTracks().length} tracks`);
      
      // Log track info
      stream.getAudioTracks().forEach(track => {
        const settings = track.getSettings();
        addLog(`Mic settings: ${JSON.stringify(settings)}`);
      });
      
      // Create audio context (preferably with higher sample rate)
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Resume audio context (important for iOS/Safari)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        addLog(`Audio context resumed from ${audioContext.state} state`);
      }
      
      // Create analyzer with large FFT size for better frequency resolution
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 4096; // Larger FFT for more precise frequency detection
      analyser.minDecibels = -90; // Very sensitive to quiet sounds
      analyser.maxDecibels = -10; // Prevent clipping on loud sounds
      analyser.smoothingTimeConstant = 0.7; // More stability
      analyserRef.current = analyser;
      
      // Create source from microphone
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      // Connect source to analyzer (don't connect to destination to avoid feedback)
      source.connect(analyser);
      
      // Create buffers for analysis
      const domainBuffer = new Float32Array(analyser.fftSize);
      domainBufferRef.current = domainBuffer;
      
      const freqBuffer = new Uint8Array(analyser.frequencyBinCount);
      freqBufferRef.current = freqBuffer;
      
      addLog(`Audio setup complete with sample rate: ${audioContext.sampleRate}Hz`);
      setIsListening(true);
      
      // Start the detection loop
      updatePitch();
    } catch (err) {
      setError(`Error accessing microphone: ${err instanceof Error ? err.message : String(err)}`);
      addLog(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Stop the tuner
  const stopTuner = () => {
    setIsListening(false);
    
    // Cancel animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    // Disconnect and close audio components
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
    setSignalLevel(0);
    setMaxSignalLevel(0);
    setFrequencyData([]);
    addLog("Microphone stopped");
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isListening) {
        stopTuner();
      }
    };
  }, [isListening]);

  // Update max signal level
  useEffect(() => {
    if (signalLevel > maxSignalLevel) {
      setMaxSignalLevel(signalLevel);
    }
  }, [signalLevel, maxSignalLevel]);
  
  // Get the peak frequency from the frequency data
  // This approach is more reliable than time-domain autocorrelation for some instruments
  const getPeakFrequency = (
    frequencyData: Uint8Array, 
    sampleRate: number,
    minFreq: number,
    maxFreq: number
  ): number | null => {
    const nyquist = sampleRate / 2;
    const binCount = frequencyData.length;
    const binWidth = nyquist / binCount;
    
    let peakIndex = -1;
    let peakValue = 0;
    
    // Calculate min/max bin range from target frequencies
    const minBin = Math.floor(minFreq / binWidth);
    const maxBin = Math.min(Math.ceil(maxFreq / binWidth), binCount - 1);
    
    // Search for the highest peak in the specified frequency range
    for (let i = minBin; i <= maxBin; i++) {
      if (frequencyData[i] > peakValue) {
        peakValue = frequencyData[i];
        peakIndex = i;
      }
    }
    
    // If we found a significant peak
    if (peakValue > 10) { // Threshold out noise
      const peakFrequency = peakIndex * binWidth;
      return peakFrequency;
    }
    
    return null;
  };
  
  // Calculate note from frequency
  const getNote = (frequency: number): NoteInfo => {
    // Calculate how many semitones away from A4 (440Hz)
    const semitones = 12 * Math.log2(frequency / BASE_FREQUENCY);
    
    // Get note index (A4 is midi note 69)
    const noteIndex = Math.round(semitones) + 69;
    
    // Get note name and octave
    const name = NOTE_NAMES[noteIndex % 12];
    const octave = Math.floor(noteIndex / 12) - 1;
    
    // Calculate exact frequency for this note
    const noteFrequency = BASE_FREQUENCY * Math.pow(2, (noteIndex - 69) / 12);
    
    // Calculate cents deviation (how many cents sharp/flat)
    const cents = Math.round(1200 * Math.log2(frequency / noteFrequency));
    
    return { name, octave, cents, frequency };
  };
  
  // Update pitch detection loop
  const updatePitch = () => {
    if (!isListening || !analyserRef.current || !freqBufferRef.current || !audioContextRef.current) {
      return;
    }
    
    try {
      // Get frequency data (more reliable for flutes than time domain)
      analyserRef.current.getByteFrequencyData(freqBufferRef.current);
      
      // Store a copy of the frequency data for visualization
      const dataForDisplay = Array.from(freqBufferRef.current).slice(0, 100);
      setFrequencyData(dataForDisplay);
      
      // Get overall signal level (average of the frequency bins)
      const avgLevel = dataForDisplay.reduce((sum, val) => sum + val, 0) / dataForDisplay.length / 255;
      setSignalLevel(avgLevel);
      
      // Debug log on Mac (less frequent)
      if ((isMacOS || isSafari) && Math.random() < 0.05) {
        addLog(`Signal level: ${avgLevel.toFixed(6)}`);
      }
      
      // Get flute range
      const range = FLUTE_RANGES[fluteType as keyof typeof FLUTE_RANGES];
      
      // Detect pitch using frequency domain peak finding
      const freq = getPeakFrequency(
        freqBufferRef.current, 
        audioContextRef.current.sampleRate,
        range.min,
        range.max
      );
      
      if (freq) {
        // Log detected frequency occasionally
        if (Math.random() < 0.05) {
          addLog(`Detected: ${freq.toFixed(1)} Hz`);
        }
        
        // Get note information
        const noteInfo = getNote(freq);
        setNote(noteInfo);
      }
      
      // Continue the detection loop
      rafRef.current = requestAnimationFrame(updatePitch);
    } catch (err) {
      addLog(`Error in pitch detection: ${err instanceof Error ? err.message : String(err)}`);
      rafRef.current = requestAnimationFrame(updatePitch);
    }
  };
  
  // Helper to get color based on cents
  const getCentsColor = () => {
    if (!note) return "text-gray-500";
    const absCents = Math.abs(note.cents);
    if (absCents < 5) return "text-green-600";
    if (absCents < 15) return "text-yellow-600";
    return "text-red-600";
  };
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Flute Tuner</h1>
      
      <div className="max-w-xl mx-auto grid gap-4">
        <Tabs defaultValue="innato" onValueChange={setFluteType}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="innato">Innato</TabsTrigger>
            <TabsTrigger value="natey">Natey</TabsTrigger>
            <TabsTrigger value="double">Double</TabsTrigger>
          </TabsList>
          
          <TabsContent value="innato" className="p-0">
            <Card className="p-4">
              <div className="text-sm mb-1">Range: E minor 3-4</div>
              <div className="text-xs text-gray-500">Frequency range: 160-660 Hz</div>
            </Card>
          </TabsContent>
          
          <TabsContent value="natey" className="p-0">
            <Card className="p-4">
              <div className="text-sm mb-1">Range: G minor 3 - A minor 4</div>
              <div className="text-xs text-gray-500">Frequency range: 195-440 Hz</div>
            </Card>
          </TabsContent>
          
          <TabsContent value="double" className="p-0">
            <Card className="p-4">
              <div className="text-sm mb-1">Range: G minor 2 - C# minor 3</div>
              <div className="text-xs text-gray-500">Frequency range: 130-277 Hz</div>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Card className="p-6">
          <div className="flex flex-col items-center">
            <div className="text-7xl font-bold mb-2">
              {note ? `${note.name}${note.octave}` : '--'}
            </div>
            
            <div className={`text-3xl ${getCentsColor()} mb-4`}>
              {note ? `${note.cents > 0 ? '+' : ''}${note.cents} cents` : '--'}
            </div>
            
            {note && (
              <div className="text-sm text-gray-500 mb-6">
                {note.frequency.toFixed(1)} Hz
              </div>
            )}
            
            <div className="w-full mb-1 text-xs flex justify-between">
              <span>Signal Level</span>
              <span>{(signalLevel * 100).toFixed(1)}%</span>
            </div>
            
            <div className="w-full h-8 bg-gray-200 rounded-full mb-6 overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(signalLevel * 300, 100)}%` }}
              ></div>
            </div>
            
            {/* Frequency spectrum visualization */}
            {frequencyData.length > 0 && (
              <div className="w-full h-16 bg-gray-800 rounded mb-6 overflow-hidden flex items-end">
                {frequencyData.slice(0, 50).map((value, index) => (
                  <div 
                    key={index}
                    className="bg-blue-500 w-1"
                    style={{ 
                      height: `${Math.max((value / 255) * 100, 1)}%`,
                      backgroundColor: `hsl(${200 + value/2}, 80%, 60%)`
                    }}
                  ></div>
                ))}
              </div>
            )}
            
            {!isListening ? (
              <Button 
                size="lg" 
                onClick={startTuner}
                className="w-full"
              >
                Start Microphone
              </Button>
            ) : (
              <Button 
                size="lg" 
                variant="destructive" 
                onClick={stopTuner}
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
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Debug Info</h2>
            <div className="text-xs text-gray-500">
              {isMacOS ? 'MacOS' : 'Other'} / {isSafari ? 'Safari' : 'Other'}
            </div>
          </div>
          
          <div className="h-40 overflow-y-auto bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
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