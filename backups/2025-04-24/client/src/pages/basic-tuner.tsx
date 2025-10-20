import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Note names array
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Interface for detected note information
interface NoteInfo {
  name: string;
  octave: number;
  cents: number;
  frequency: number;
}

export default function BasicTuner() {
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState<NoteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signalLevel, setSignalLevel] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);
  
  // Add log message
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [message, ...prev].slice(0, 20));
  };
  
  // Platform detection
  const isMacOS = /Mac/.test(navigator.platform);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  // Start the tuner
  const startTuner = async () => {
    try {
      setError(null);
      addLog("Starting microphone...");
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      streamRef.current = stream;
      addLog(`Microphone access granted with ${stream.getAudioTracks().length} tracks`);
      
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Resume audio context (important for iOS/Safari)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        addLog(`Audio context resumed from ${audioContext.state} state`);
      }
      
      // Create analyzer
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      
      // Create source from microphone
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      // Connect source to analyzer
      source.connect(analyser);
      
      // Create buffer for analysis
      const buffer = new Float32Array(analyser.fftSize);
      bufferRef.current = buffer;
      
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
  
  // Auto-correlation algorithm for pitch detection (from sample code)
  const autoCorrelate = (buffer: Float32Array, sampleRate: number): number | null => {
    const SIZE = buffer.length;
    
    // Calculate signal strength (RMS)
    let sum = 0;
    for (let i = 0; i < SIZE; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / SIZE);
    
    // Extremely low threshold for macOS - almost zero
    const threshold = isMacOS || isSafari ? 0.0001 : 0.01;
    
    // Log RMS value on Mac for debugging
    if (isMacOS || isSafari) {
      addLog(`Raw signal strength: ${rms.toFixed(8)}`);
    }
    
    // Update signal level meter
    setSignalLevel(rms);
    
    // Exit if signal too weak
    if (rms < threshold) {
      return null;
    }
    
    // Find the best correlation
    let bestOffset = -1;
    let bestCorrelation = 0;
    for (let offset = 10; offset < SIZE / 2; offset++) {
      let correlation = 0;
      
      for (let i = 0; i < SIZE / 2; i++) {
        correlation += buffer[i] * buffer[i + offset];
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }
    
    // Get frequency from best offset
    if (bestCorrelation > threshold) {
      // Convert best offset to frequency
      const frequency = sampleRate / bestOffset;
      return frequency;
    }
    
    return null;
  };
  
  // Calculate note from frequency
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
    if (!isListening || !analyserRef.current || !bufferRef.current || !audioContextRef.current) {
      return;
    }
    
    try {
      // Get audio data
      analyserRef.current.getFloatTimeDomainData(bufferRef.current);
      
      // Detect pitch
      const frequency = autoCorrelate(bufferRef.current, audioContextRef.current.sampleRate);
      
      if (frequency) {
        // Log detected frequency with clear indicator
        if (Math.random() < 0.1) { // Only log occasionally
          addLog(`Detected frequency: ${frequency.toFixed(1)} Hz`);
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
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Simple Tuner</h1>
      
      <div className="max-w-xl mx-auto grid gap-6">
        <Card className="p-6">
          <div className="flex flex-col items-center">
            <div className="text-7xl font-bold mb-4">
              {note ? `${note.name}${note.octave}` : '--'}
            </div>
            
            <div className="text-3xl text-gray-500 mb-6">
              {note ? `${note.cents > 0 ? '+' : ''}${note.cents} cents` : '--'}
            </div>
            
            {note && (
              <div className="text-sm text-gray-400 mb-4">
                {note.frequency.toFixed(1)} Hz
              </div>
            )}
            
            <div className="w-full h-4 bg-gray-200 rounded-full mb-6">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(signalLevel * 1000, 100)}%` }}
              ></div>
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
            
            <div className="mt-4 text-sm text-gray-500">
              <div>Platform: {isMacOS ? 'macOS' : 'Other'}</div>
              <div>Browser: {isSafari ? 'Safari' : 'Other'}</div>
            </div>
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