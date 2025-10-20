import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function SimpleMicTest() {
  // State
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [signalLevel, setSignalLevel] = useState(0);
  const [maxSignalLevel, setMaxSignalLevel] = useState(0);
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
  
  // Start the audio analyzer
  const startAudio = async () => {
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
      analyser.fftSize = 2048; // Buffer size
      analyser.minDecibels = -100; // Very sensitive to quiet sounds
      analyser.maxDecibels = -10; // Prevent clipping on loud sounds
      analyser.smoothingTimeConstant = 0.5;
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
      addLog(`Audio analyzer started - please play your flute`);
      
      // Start the visualization loop
      updateVisualization();
    } catch (err) {
      setError(`Error accessing microphone: ${err instanceof Error ? err.message : String(err)}`);
      addLog(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Stop the audio analyzer
  const stopAudio = () => {
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
        stopAudio();
      }
    };
  }, [isListening]);
  
  // Track max signal level
  useEffect(() => {
    if (signalLevel > maxSignalLevel) {
      setMaxSignalLevel(signalLevel);
    }
  }, [signalLevel, maxSignalLevel]);
  
  // Update visualization loop - this just shows signal without pitch detection
  const updateVisualization = () => {
    if (!isListening || !analyserRef.current || !domainBufferRef.current || !freqBufferRef.current) {
      return;
    }
    
    try {
      // Get time domain data (waveform)
      analyserRef.current.getFloatTimeDomainData(domainBufferRef.current);
      const timeDomainData = domainBufferRef.current;
      
      // Calculate current volume (RMS)
      let sum = 0;
      for (let i = 0; i < timeDomainData.length; i++) {
        sum += timeDomainData[i] * timeDomainData[i];
      }
      const rms = Math.sqrt(sum / timeDomainData.length);
      setSignalLevel(rms);
      
      // Log the RMS level occasionally
      if (Math.random() < 0.05) {
        addLog(`Signal level: ${rms.toFixed(6)}`);
      }
      
      // Get frequency domain data (spectrum)
      analyserRef.current.getByteFrequencyData(freqBufferRef.current);
      
      // Update frequency visualization (first 100 bins)
      const displayData = Array.from(freqBufferRef.current.slice(0, 100));
      setFreqData(displayData);
      
      // Continue the visualization loop
      rafRef.current = requestAnimationFrame(updateVisualization);
    } catch (err) {
      addLog(`Error in visualization: ${err instanceof Error ? err.message : String(err)}`);
      rafRef.current = requestAnimationFrame(updateVisualization);
    }
  };
  
  // Reset max signal level
  const resetMaxSignal = () => {
    setMaxSignalLevel(0);
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Simple Microphone Test</h1>
      
      <div className="max-w-xl mx-auto grid gap-6">
        <Card className="p-6">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4">Real-time Signal Level</h2>
            
            <div className="w-full mb-1 text-xs flex justify-between">
              <span>Current Level</span>
              <span>{(signalLevel * 100).toFixed(2)}%</span>
            </div>
            
            <div className="w-full h-12 bg-gray-200 rounded-full mb-4">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(signalLevel * 1000, 100)}%` }}
              ></div>
            </div>
            
            <div className="w-full mb-1 text-xs flex justify-between">
              <span>Max Level</span>
              <span className="flex items-center">
                {(maxSignalLevel * 100).toFixed(2)}%
                <button 
                  onClick={resetMaxSignal} 
                  className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                >
                  Reset
                </button>
              </span>
            </div>
            
            <div className="w-full h-4 bg-gray-200 rounded-full mb-6">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(maxSignalLevel * 1000, 100)}%` }}
              ></div>
            </div>
            
            {/* Frequency spectrum visualization */}
            <h3 className="text-lg font-medium mb-2">Frequency Spectrum</h3>
            <div className="w-full h-32 bg-gray-900 rounded mb-6 overflow-hidden flex items-end">
              {freqData.map((value, index) => (
                <div 
                  key={index}
                  className="w-1"
                  style={{ 
                    height: `${Math.max((value / 255) * 100, 1)}%`,
                    backgroundColor: `hsl(${180 + value/2}, 80%, 60%)`
                  }}
                ></div>
              ))}
            </div>
            
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