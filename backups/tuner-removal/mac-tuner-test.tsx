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

export default function MacTunerTest() {
  // State
  const [isListening, setIsListening] = useState(false);
  const [note, setNote] = useState<NoteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [signalLevel, setSignalLevel] = useState(0);
  const [freqData, setFreqData] = useState<number[]>([]);
  
  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const domainBufferRef = useRef<Float32Array | null>(null);
  const freqBufferRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  
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
  
  // Start the tuner
  const startTuner = async () => {
    try {
      setError(null);
      addLog("Starting microphone...");
      
      // Request microphone access with no processing to maximize sensitivity
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
      analyser.fftSize = 2048; // Larger FFT for better frequency resolution
      analyser.minDecibels = -90; // Very sensitive to quiet sounds
      analyser.maxDecibels = -10; // Prevent clipping on loud sounds
      analyser.smoothingTimeConstant = 0.8; // More stability
      analyserRef.current = analyser;
      
      // Create source from microphone
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      // Connect source to analyzer
      source.connect(analyser);
      
      // Create buffers for analysis
      const domainBuffer = new Float32Array(analyser.fftSize);
      domainBufferRef.current = domainBuffer;
      
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
  
  // Ultra-simple autocorrelation function optimized for flutes on Mac
  const autoCorrelate = (buffer: Float32Array, sampleRate: number): number | null => {
    const SIZE = buffer.length;
    
    // Calculate root mean square to see if there's a signal
    let sum = 0;
    for (let i = 0; i < SIZE; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / SIZE);
    
    // Using extremely low threshold for Mac
    const threshold = isMacOS || isSafari ? 0.0001 : 0.01;
    
    // Update signal level display
    setSignalLevel(rms);
    
    // Log the signal level occasionally to prevent overwhelming the logs
    if (Math.random() < 0.1) {
      addLog(`Signal level: ${rms.toFixed(6)}`);
    }
    
    // Exit if signal too weak, but make the threshold very low for Mac
    if (rms < threshold) {
      return null;
    }
    
    // Use a super simple autocorrelation approach
    let bestOffset = -1;
    let bestCorrelation = 0;
    
    // Search for the best correlation
    for (let offset = 8; offset < SIZE / 2; offset++) {
      let correlation = 0;
      
      for (let i = 0; i < SIZE / 2; i++) {
        correlation += buffer[i] * buffer[i + offset];
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    }
    
    // If we found a good correlation
    if (bestOffset > 0) {
      // Convert offset to frequency
      const frequency = sampleRate / bestOffset;
      return frequency;
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
  
  // Alternative frequency detection method using FFT
  // This can sometimes work better than autocorrelation on some systems
  const getFrequencyFromSpectrum = (): number | null => {
    if (!analyserRef.current || !freqBufferRef.current || !audioContextRef.current) {
      return null;
    }
    
    const frequencyData = freqBufferRef.current;
    const sampleRate = audioContextRef.current.sampleRate;
    const binCount = frequencyData.length;
    
    // Get the frequency data
    analyserRef.current.getByteFrequencyData(frequencyData);
    
    // Save the first 100 bins for visualization
    const displayData = Array.from(frequencyData.slice(0, 100));
    setFreqData(displayData);
    
    // Calculate signal level from frequency data
    const avgLevel = displayData.reduce((sum, val) => sum + val, 0) / (displayData.length * 255);
    setSignalLevel(avgLevel);
    
    // Find the bin with the highest amplitude
    let maxBin = -1;
    let maxValue = 0;
    
    // Focus on bins that correspond to flute frequencies (roughly 130-1400 Hz)
    const minBin = Math.floor(130 * binCount / sampleRate);
    const maxBin = Math.min(Math.ceil(1400 * binCount / sampleRate), binCount - 1);
    
    for (let i = minBin; i <= maxBin; i++) {
      if (frequencyData[i] > maxValue) {
        maxValue = frequencyData[i];
        maxBin = i;
      }
    }
    
    // If we found a significant peak
    if (maxValue > 20) { // Threshold to filter out noise
      // Convert bin to frequency
      const frequency = maxBin * sampleRate / binCount;
      return frequency;
    }
    
    return null;
  };
  
  // Update pitch detection loop
  const updatePitch = () => {
    if (!isListening || !analyserRef.current || !domainBufferRef.current || !audioContextRef.current) {
      return;
    }
    
    try {
      // Try time domain approach (autocorrelation)
      analyserRef.current.getFloatTimeDomainData(domainBufferRef.current);
      const freqByAutocorrelation = autoCorrelate(domainBufferRef.current, audioContextRef.current.sampleRate);
      
      // Try frequency domain approach (FFT)
      const freqByFFT = getFrequencyFromSpectrum();
      
      // Use whichever method gives a result, prioritizing autocorrelation
      const frequency = freqByAutocorrelation || freqByFFT;
      
      if (frequency) {
        // Log detected pitch occasionally
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
      <h1 className="text-3xl font-bold mb-6 text-center">Mac Tuner Test</h1>
      
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
            
            <div className="w-full mb-1 text-xs flex justify-between">
              <span>Signal Level</span>
              <span>{(signalLevel * 100).toFixed(2)}%</span>
            </div>
            
            <div className="w-full h-12 bg-gray-200 rounded-full mb-6">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(signalLevel * 500, 100)}%` }}
              ></div>
            </div>
            
            {/* Frequency spectrum visualization */}
            {freqData.length > 0 && (
              <div className="w-full h-20 bg-gray-900 rounded mb-6 overflow-hidden flex items-end">
                {freqData.map((value, index) => (
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
            
            <div className="mt-4 text-sm text-gray-500">
              <div>Platform: {isMacOS ? 'macOS' : 'Other'} / {isSafari ? 'Safari' : 'Other'}</div>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Debug Log</h2>
          <div className="h-80 overflow-y-auto bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
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