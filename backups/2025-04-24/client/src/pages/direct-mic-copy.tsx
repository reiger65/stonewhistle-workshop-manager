import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

export default function DirectMicTest() {
  // State
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [signalLevel, setSignalLevel] = useState(0);
  const [sensitivity, setSensitivity] = useState(5); // on a scale of 1-10
  const [audioData, setAudioData] = useState<number[]>([]);
  
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
  
  // Start the audio analyzer using ScriptProcessorNode (direct access to audio)
  const startAudio = async () => {
    try {
      setError(null);
      addLog("Starting direct microphone access...");
      
      // Request microphone access with absolutely no processing
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
      // This is deprecated but sometimes works better on Mac
      const processor = audioContext.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;
      
      // Connect the nodes: source -> processor -> destination (with zero gain to avoid feedback)
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // Set up processing callback to get direct audio data
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        processAudioData(inputData);
      };
      
      setIsListening(true);
      addLog(`Direct audio processing started - please play your flute`);
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
      
      // Apply sensitivity multiplier (1-10)
      const adjustedLevel = Math.min(rms * sensitivity * 20, 1);
      setSignalLevel(adjustedLevel);
      
      // Log the level occasionally
      if (Math.random() < 0.05) {
        addLog(`Raw signal level: ${rms.toFixed(8)}, Adjusted: ${adjustedLevel.toFixed(6)}`);
      }
      
      // Update visualization with a subset of the data
      const dataPoints: number[] = [];
      for (let i = 0; i < data.length; i += 20) { // Take every 20th sample
        dataPoints.push(data[i]);
      }
      setAudioData(dataPoints);
    } catch (error) {
      console.error('Error processing audio data:', error);
    }
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
  
  // Update sensitivity
  const handleSensitivityChange = (value: number[]) => {
    setSensitivity(value[0]);
  };
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-2 text-center">Direct Microphone Test</h1>
      <p className="text-center mb-6 text-gray-500">Using ScriptProcessorNode for direct audio access</p>
      
      <div className="max-w-xl mx-auto grid gap-6">
        <Card className="p-6">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4">Raw Audio Waveform</h2>
            
            <div className="w-full h-32 bg-gray-900 rounded mb-6 overflow-hidden">
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
            
            <h3 className="text-lg font-medium mb-2">Signal Level</h3>
            <div className="w-full h-16 bg-gray-200 rounded-full mb-4 overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-100"
                style={{ width: `${signalLevel * 100}%` }}
              ></div>
            </div>
            
            <div className="w-full mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Sensitivity: {sensitivity}</span>
                <span className="text-sm text-gray-500">(Higher values amplify quiet sounds)</span>
              </div>
              <Slider
                value={[sensitivity]}
                min={1}
                max={10}
                step={1}
                onValueChange={handleSensitivityChange}
              />
            </div>
            
            {!isListening ? (
              <Button 
                size="lg" 
                onClick={startAudio}
                className="w-full"
              >
                Start Direct Microphone Test
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
              <div>Platform: {isMacOS ? 'macOS' : 'Other'} / Browser: {isSafari ? 'Safari' : 'Other'}</div>
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