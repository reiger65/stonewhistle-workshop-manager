import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Note names for display
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Interface for note information
interface NoteInfo {
  name: string;
  octave: number;
  cents: number;
  frequency: number;
}

export default function NoFilterTuner() {
  // State
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState<NoteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [rawBufferView, setRawBufferView] = useState<number[]>([]);
  const [frequencyData, setFrequencyData] = useState<number[]>([]);
  
  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);
  const freqBufferRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  
  // Add log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log(logMessage);
    setLogs(prev => [logMessage, ...prev].slice(0, 20));
  };
  
  // Start the tuner
  const startTuner = async () => {
    try {
      setError(null);
      addLog("Starting microphone...");
      
      // Request microphone access with absolutely no processing
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
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
      
      // Create analyzer with large FFT size
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.0; // No smoothing at all
      analyser.minDecibels = -100; // Very sensitive
      analyserRef.current = analyser;
      
      // Create source from microphone
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      // Connect source to analyzer
      source.connect(analyser);
      
      // Create buffers for analysis
      const buffer = new Float32Array(analyser.fftSize);
      bufferRef.current = buffer;
      
      const freqBuffer = new Uint8Array(analyser.frequencyBinCount);
      freqBufferRef.current = freqBuffer;
      
      setIsListening(true);
      addLog(`Tuner started - please play your flute`);
      
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
  
  // Super simple autocorrelation with NO filtering at all
  const autoCorrelate = (buffer: Float32Array, sampleRate: number): number | null => {
    // Use ONLY a simple autocorrelation approach
    let bestCorrelation = 0;
    let bestOffset = -1;
    
    // Start from a reasonable offset to avoid very high frequencies
    for (let offset = 10; offset < buffer.length / 2; offset++) {
      let correlation = 0;
      
      // Direct multiplication correlation 
      for (let i = 0; i < buffer.length / 2; i++) {
        correlation += buffer[i] * buffer[i + offset];
      }
      
      // Track the best correlation
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }
    
    // We found a correlation peak
    if (bestOffset > 0) {
      const frequency = sampleRate / bestOffset;
      
      // Only log if reasonable frequency for a flute (130-1400 Hz)
      if (frequency > 130 && frequency < 1400) {
        return frequency;
      }
    }
    
    return null;
  };
  
  // Calculate note information from frequency
  const getNote = (frequency: number): NoteInfo => {
    // A4 = 440Hz (midi note 69)
    const A4 = 440;
    
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
  
  // Update pitch detection loop
  const updatePitch = () => {
    if (!isListening || !analyserRef.current || !bufferRef.current || !audioContextRef.current || !freqBufferRef.current) {
      return;
    }
    
    try {
      // Get time domain and frequency domain data
      analyserRef.current.getFloatTimeDomainData(bufferRef.current);
      analyserRef.current.getByteFrequencyData(freqBufferRef.current);
      
      // Show raw buffer data (just for visualization)
      const samplePoints = Array.from(bufferRef.current)
        .filter((_, i) => i % 32 === 0) // Take every 32nd point to avoid too many points
        .slice(0, 64);
      setRawBufferView(samplePoints);
      
      // Update frequency data visualization
      const freqDataView = Array.from(freqBufferRef.current.slice(0, 100));
      setFrequencyData(freqDataView);
      
      // Try to detect pitch with NO threshold or filtering
      const frequency = autoCorrelate(bufferRef.current, audioContextRef.current.sampleRate);
      
      if (frequency) {
        // Log detected frequency occasionally
        if (Math.random() < 0.05) {
          addLog(`Detected: ${frequency.toFixed(1)} Hz`);
        }
        
        // Get note information
        const noteInfo = getNote(frequency);
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
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">No-Filter Tuner</h1>
      <p className="text-center mb-6 text-gray-500">Ultra-simple pitch detection with no filtering</p>
      
      <div className="max-w-xl mx-auto grid gap-6">
        <Card className="p-6">
          <div className="flex flex-col items-center">
            <div className="text-7xl font-bold mb-4">
              {note ? `${note.name}${note.octave}` : '--'}
            </div>
            
            <div className={`text-4xl ${getCentsColor()} mb-6`}>
              {note ? `${note.cents > 0 ? '+' : ''}${note.cents} cents` : '--'}
            </div>
            
            {note && (
              <div className="text-sm text-gray-500 mb-6">
                {note.frequency.toFixed(1)} Hz
              </div>
            )}
            
            {/* Raw waveform visualization */}
            <h3 className="text-sm font-medium mb-1">Raw Audio Waveform</h3>
            <div className="w-full h-16 bg-gray-900 rounded mb-4 p-1 overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 64 100" preserveAspectRatio="none">
                <polyline
                  points={rawBufferView.map((val, i) => `${i}, ${50 + val * 40}`).join(' ')}
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="1"
                />
              </svg>
            </div>
            
            {/* Frequency spectrum visualization */}
            <h3 className="text-sm font-medium mb-1">Frequency Spectrum</h3>
            <div className="w-full h-24 bg-gray-900 rounded mb-6 overflow-hidden flex items-end">
              {frequencyData.map((value, index) => (
                <div 
                  key={index}
                  className="w-1"
                  style={{ 
                    height: `${Math.max((value / 255) * 100, 1)}%`,
                    backgroundColor: `hsl(${200 + value/2}, 80%, 60%)`
                  }}
                ></div>
              ))}
            </div>
            
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
          <h2 className="text-lg font-semibold mb-2">Debug Log</h2>
          <div className="h-60 overflow-y-auto bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
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