import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Comprehensive audio debugging component
 * 
 * This component isolates each step of audio processing to locate issues:
 * 1. Browser API support checks
 * 2. Permission requesting with detailed error reporting
 * 3. Audio context creation and state reporting
 * 4. Audio source connection
 * 5. Data processing
 * 6. Raw data visualization
 */
export default function AudioDebug() {
  // State for tracking capability and permissions
  const [apiSupported, setApiSupported] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<string>("unknown");
  const [browserInfo, setBrowserInfo] = useState<string>("Unknown browser");
  const [isMac, setIsMac] = useState<boolean>(false);
  
  // Audio processing state
  const [audioContextState, setAudioContextState] = useState<string>("none");
  const [audioConnected, setAudioConnected] = useState<boolean>(false);
  const [dataReceived, setDataReceived] = useState<boolean>(false);
  const [dataBuffer, setDataBuffer] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  
  // References for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  // Add a log entry with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 99)]);
  };

  // Check API support and browser/OS info on component mount
  useEffect(() => {
    const checkApiSupport = () => {
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasAudioContext = !!(window.AudioContext || (window as any).webkitAudioContext);
      
      setApiSupported(hasGetUserMedia && hasAudioContext);
      addLog(`API support check: getUserMedia=${hasGetUserMedia}, AudioContext=${hasAudioContext}`);
      
      // Detect browser and OS
      const userAgent = navigator.userAgent;
      let browser = "Unknown";
      
      if (userAgent.indexOf("Chrome") > -1) {
        browser = "Chrome";
      } else if (userAgent.indexOf("Safari") > -1) {
        browser = "Safari";
      } else if (userAgent.indexOf("Firefox") > -1) {
        browser = "Firefox";
      } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident") > -1) {
        browser = "Internet Explorer";
      } else if (userAgent.indexOf("Edge") > -1) {
        browser = "Edge";
      }
      
      // Check if on Mac
      const isMacOS = /Mac/.test(navigator.platform);
      setIsMac(isMacOS);
      
      const browserWithVersion = `${browser} on ${isMacOS ? 'macOS' : 'other OS'}`;
      setBrowserInfo(browserWithVersion);
      addLog(`Browser detected: ${browserWithVersion}`);
      
      if (isMacOS) {
        addLog("⚠️ macOS detected: Check macOS-specific troubleshooting below");
      }
    };
    
    checkApiSupport();
  }, []);
  
  // Check microphone permission status
  const checkPermission = async () => {
    try {
      addLog("Checking microphone permission status...");
      const permissionStatus = await navigator.permissions.query({name: 'microphone' as PermissionName});
      setPermissionState(permissionStatus.state);
      addLog(`Permission status: ${permissionStatus.state}`);
      
      // Listen for changes to permission state
      permissionStatus.onchange = () => {
        setPermissionState(permissionStatus.state);
        addLog(`Permission changed to: ${permissionStatus.state}`);
      };
    } catch (error) {
      console.error("Error checking permission:", error);
      addLog(`Permission check error: ${error instanceof Error ? error.message : String(error)}`);
      setPermissionState("unavailable");
    }
  };
  
  // Request microphone access
  const requestMicrophone = async () => {
    setErrorMessage("");
    addLog("Requesting microphone access...");
    
    try {
      // Very specific audio constraints optimized for voice detection
      // Mac compatibility: Don't specify latency which isn't supported on Safari/WebKit
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        },
        video: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      addLog(`Successfully accessed microphone. Tracks: ${stream.getAudioTracks().length}`);
      const track = stream.getAudioTracks()[0];
      addLog(`Track settings: ${JSON.stringify(track.getSettings())}`);
      
      streamRef.current = stream;
      setPermissionState('granted');
      return true;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setErrorMessage(errorMsg);
      addLog(`Microphone access error: ${errorMsg}`);
      setPermissionState('denied');
      return false;
    }
  };
  
  // Create and setup audio context
  const setupAudioContext = () => {
    if (!streamRef.current) {
      addLog("No audio stream available");
      return false;
    }
    
    try {
      addLog("Creating AudioContext...");
      // Use standard AudioContext with fallback to webkitAudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }
      
      addLog(`AudioContext created. State: ${audioContextRef.current.state}`);
      setAudioContextState(audioContextRef.current.state);
      
      // Create nodes for audio processing
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      addLog(`Analyser created. FFT size: ${analyserRef.current.fftSize}`);
      
      // Connect source
      sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
      sourceRef.current.connect(analyserRef.current);
      
      addLog("Audio source connected to analyser");
      setAudioConnected(true);
      
      // Resume audio context if suspended
      if (audioContextRef.current && audioContextRef.current.state !== 'running') {
        addLog("Attempting to resume AudioContext...");
        audioContextRef.current.resume().then(() => {
          if (audioContextRef.current) {
            addLog(`AudioContext resumed. New state: ${audioContextRef.current.state}`);
            setAudioContextState(audioContextRef.current.state);
          }
        }).catch(err => {
          addLog(`Failed to resume: ${err.message}`);
        });
      }
      
      return true;
    } catch (error) {
      console.error("Error setting up audio context:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setErrorMessage(errorMsg);
      addLog(`Audio context setup error: ${errorMsg}`);
      return false;
    }
  };
  
  // Start audio processing and visualization
  const startProcessing = () => {
    if (!analyserRef.current) {
      addLog("No analyser available");
      return;
    }
    
    addLog("Starting audio data processing...");
    
    // Create buffer for audio data
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    
    // Animation loop for continuous data reading
    const processAudio = () => {
      if (!analyserRef.current) return;
      
      // Get time domain data (waveform)
      analyserRef.current.getFloatTimeDomainData(dataArray);
      
      // Check if we're getting actual data (non-zero values)
      const hasData = dataArray.some(value => value !== 0);
      if (hasData && !dataReceived) {
        addLog("Receiving audio data!");
        setDataReceived(true);
      }
      
      // Calculate RMS volume for visualization
      let rms = 0;
      for (let i = 0; i < bufferLength; i++) {
        rms += dataArray[i] * dataArray[i];
      }
      rms = Math.sqrt(rms / bufferLength);
      
      // Update state with data for visualization (just recent values)
      setDataBuffer(Array.from(dataArray.slice(0, 100)).map(v => v));
      
      // Continue animation loop
      animationRef.current = requestAnimationFrame(processAudio);
    };
    
    // Start the processing loop
    processAudio();
  };
  
  // Stop all audio processing and cleanup
  const stopAudio = () => {
    addLog("Stopping audio processing...");
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    setAudioConnected(false);
    setDataReceived(false);
    setAudioContextState("closed");
    addLog("Audio processing stopped and resources released");
  };
  
  // Run all steps in sequence
  const runFullTest = async () => {
    addLog("=== STARTING FULL AUDIO TEST ===");
    
    // Step 1: Request microphone
    const micSuccess = await requestMicrophone();
    if (!micSuccess) {
      addLog("❌ Microphone access failed, test aborted");
      return;
    }
    addLog("✅ Microphone access granted");
    
    // Step 2: Setup audio context
    const contextSuccess = setupAudioContext();
    if (!contextSuccess) {
      addLog("❌ Audio context setup failed");
      return;
    }
    addLog("✅ Audio context setup complete");
    
    // Step 3: Start processing
    startProcessing();
    addLog("✅ Audio processing started");
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current || audioContextRef.current) {
        stopAudio();
      }
    };
  }, []);
  
  // Visualize the audio data
  const renderAudioVisualization = () => {
    return (
      <div className="h-20 w-full bg-gray-100 border rounded overflow-hidden relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full flex items-center justify-center">
            {dataBuffer.length === 0 ? (
              <span className="text-gray-400">No audio data</span>
            ) : (
              <div className="flex items-center h-full w-full">
                {dataBuffer.map((value, index) => (
                  <div 
                    key={index}
                    className="w-1 bg-blue-500"
                    style={{ 
                      height: `${Math.abs(value) * 100}%`,
                      minHeight: '1px',
                      marginRight: '1px'
                    }}
                  ></div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-xl font-bold mb-4">Audio System Debugger</h1>
      
      {/* Mac-specific troubleshooting instructions */}
      <div className="mb-4 p-3 border border-blue-200 rounded bg-blue-50">
        <h2 className="font-bold mb-2">MacBook Troubleshooting Guide</h2>
        <p className="mb-2">If you're using a Mac, please check these settings:</p>
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>Check System Preferences → Security & Privacy → Microphone permissions</li>
          <li>In Safari: Preferences → Websites → Microphone → Allow for this website</li>
          <li>Check if microphone is selected in Control Center/Menu Bar</li>
          <li>Try restarting the browser after granting permissions</li>
          <li>Try disabling any audio processing extensions that might interfere</li>
        </ol>
      </div>
      
      {/* Environment Information */}
      <div className="mb-4 p-3 border rounded bg-gray-50">
        <h2 className="font-bold mb-2">Environment Information</h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center">
            <span className="text-sm font-medium w-32">Browser/OS:</span>
            <span className="text-sm">{browserInfo}</span>
          </div>
          {isMac && (
            <div className="rounded bg-amber-50 border border-amber-200 p-2 text-amber-800 text-xs">
              ⚠️ macOS detected: Audio permissions might need special handling
            </div>
          )}
        </div>
      </div>

      {/* API Support Status */}
      <div className="mb-4 p-3 border rounded bg-gray-50">
        <h2 className="font-bold mb-2">1. Web Audio API Support</h2>
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${apiSupported ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{apiSupported ? 'APIs are supported' : 'APIs not fully supported'}</span>
        </div>
        <Button
          onClick={checkPermission}
          variant="outline"
          size="sm"
          className="mr-2"
        >
          Check Permission Status
        </Button>
      </div>
      
      {/* Microphone Permission */}
      <div className="mb-4 p-3 border rounded bg-gray-50">
        <h2 className="font-bold mb-2">2. Microphone Permission</h2>
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            permissionState === 'granted' ? 'bg-green-500' : 
            permissionState === 'denied' ? 'bg-red-500' : 
            'bg-yellow-500'
          }`}></div>
          <span>Status: {permissionState}</span>
        </div>
        <Button 
          onClick={requestMicrophone} 
          variant="outline"
          size="sm"
          className="mr-2"
          disabled={permissionState === 'granted' && !!streamRef.current}
        >
          Request Microphone
        </Button>
      </div>
      
      {/* Audio Context */}
      <div className="mb-4 p-3 border rounded bg-gray-50">
        <h2 className="font-bold mb-2">3. Audio Context</h2>
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${
            audioContextState === 'running' ? 'bg-green-500' : 
            audioContextState === 'suspended' ? 'bg-yellow-500' : 
            'bg-gray-500'
          }`}></div>
          <span>Status: {audioContextState}</span>
        </div>
        <Button
          onClick={setupAudioContext}
          variant="outline"
          size="sm"
          className="mr-2"
          disabled={!streamRef.current || audioConnected}
        >
          Setup Audio Context
        </Button>
      </div>
      
      {/* Audio Processing */}
      <div className="mb-4 p-3 border rounded bg-gray-50">
        <h2 className="font-bold mb-2">4. Audio Processing</h2>
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${dataReceived ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          <span>{dataReceived ? 'Receiving audio data' : 'No data detected'}</span>
        </div>
        <Button
          onClick={startProcessing}
          variant="outline"
          size="sm"
          className="mr-2"
          disabled={!audioConnected}
        >
          Start Processing
        </Button>
        <Button
          onClick={stopAudio}
          variant="outline"
          size="sm"
          className="mr-2"
          disabled={!audioConnected}
        >
          Stop Audio
        </Button>
      </div>
      
      {/* Run all tests */}
      <div className="mb-4">
        <Button
          onClick={runFullTest}
          variant="default"
          size="default"
          className="mr-2"
        >
          Run Full Audio Test
        </Button>
      </div>
      
      {/* Audio Visualization */}
      <div className="mb-4 p-3 border rounded bg-gray-50">
        <h2 className="font-bold mb-2">Audio Visualization</h2>
        {renderAudioVisualization()}
      </div>
      
      {/* Error display */}
      {errorMessage && (
        <div className="mb-4 p-3 border border-red-300 bg-red-50 rounded text-red-700">
          <h3 className="font-bold mb-1">Error</h3>
          <p>{errorMessage}</p>
        </div>
      )}
      
      {/* Logs */}
      <div className="mb-4 p-3 border rounded bg-gray-50">
        <h2 className="font-bold mb-2">Debug Log</h2>
        <div className="h-60 overflow-y-auto bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
          {logs.map((log, i) => (
            <div key={i} className="mb-1">{log}</div>
          ))}
          {logs.length === 0 && <div className="text-gray-500">No logs yet</div>}
        </div>
      </div>
    </div>
  );
}