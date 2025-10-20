import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Volume, Volume2, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Step-by-step microphone debugging test
 * 
 * This component breaks down the microphone access, audio context creation,
 * and signal processing into discrete steps to isolate any issues.
 */
const MicDebug: React.FC = () => {
  const { toast } = useToast();
  
  // Individual step progress tracking
  const [steps, setSteps] = useState({
    browserSupport: null as boolean | null,
    microphoneAccess: null as boolean | null,
    audioContextCreation: null as boolean | null,
    analyzerSetup: null as boolean | null,
    signalDetection: null as boolean | null
  });
  
  // Audio state
  const [isActive, setIsActive] = useState(false);
  const [signalStrength, setSignalStrength] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Refs for audio objects
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Add log message with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 29)]);
    console.log(`${timestamp}: ${message}`);
  };
  
  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      if (isActive) {
        stopAudioProcessing();
      }
    };
  }, []);
  
  // Step 1: Check browser support for WebAudio API
  const checkBrowserSupport = () => {
    addLog("STEP 1: Checking browser support for Web Audio API...");
    
    try {
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasAudioContext = !!(window.AudioContext || (window as any).webkitAudioContext);
      
      if (hasGetUserMedia && hasAudioContext) {
        addLog("✅ Browser supports getUserMedia and AudioContext");
        setSteps(prev => ({ ...prev, browserSupport: true }));
        toast({
          title: "Browser check passed",
          description: "Your browser supports the Web Audio API",
          variant: "success"
        });
        return true;
      } else {
        const missing = [];
        if (!hasGetUserMedia) missing.push("getUserMedia");
        if (!hasAudioContext) missing.push("AudioContext");
        
        addLog(`❌ Browser missing support for: ${missing.join(", ")}`);
        setSteps(prev => ({ ...prev, browserSupport: false }));
        toast({
          title: "Browser check failed",
          description: `Missing support for: ${missing.join(", ")}`,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      addLog(`❌ Error checking browser support: ${error}`);
      setSteps(prev => ({ ...prev, browserSupport: false }));
      return false;
    }
  };
  
  // Step 2: Request microphone access with specific constraints
  const requestMicrophoneAccess = async () => {
    // Ensure browser support is confirmed first
    if (steps.browserSupport !== true) {
      if (!checkBrowserSupport()) return false;
    }
    
    addLog("STEP 2: Requesting microphone access...");
    
    try {
      // Request microphone with optimal settings for audio analysis
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: false
      });
      
      if (stream && stream.active) {
        // Save stream reference
        streamRef.current = stream;
        
        // Log detected audio tracks
        const audioTracks = stream.getAudioTracks();
        addLog(`✅ Microphone access granted. Found ${audioTracks.length} audio tracks`);
        
        audioTracks.forEach((track, index) => {
          addLog(`  Track ${index+1}: "${track.label}" (${track.enabled ? 'enabled' : 'disabled'}, ${track.readyState})`);
          
          // Log track settings if available
          const settings = track.getSettings();
          const settingsStr = Object.entries(settings)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          
          addLog(`  Settings: ${settingsStr}`);
        });
        
        setSteps(prev => ({ ...prev, microphoneAccess: true }));
        toast({
          title: "Microphone access granted",
          description: `Found ${audioTracks.length} audio tracks`,
          variant: "success"
        });
        return true;
      } else {
        addLog("❌ Stream obtained but not active");
        setSteps(prev => ({ ...prev, microphoneAccess: false }));
        return false;
      }
    } catch (error) {
      addLog(`❌ Error requesting microphone: ${error instanceof Error ? error.message : String(error)}`);
      setSteps(prev => ({ ...prev, microphoneAccess: false }));
      toast({
        title: "Microphone access failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Step 3: Create audio context
  const createAudioContext = async () => {
    // Ensure we have microphone access first
    if (steps.microphoneAccess !== true) {
      if (!await requestMicrophoneAccess()) return false;
    }
    
    addLog("STEP 3: Creating audio context...");
    
    try {
      // Close any existing audio context
      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Create new audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({
        latencyHint: 'interactive',
        sampleRate: 48000
      });
      
      audioContextRef.current = audioContext;
      
      addLog(`✅ Audio context created with sample rate: ${audioContext.sampleRate}Hz`);
      addLog(`   State: ${audioContext.state}`);
      
      // Resume context if suspended (some browsers require this)
      if (audioContext.state === 'suspended') {
        addLog("  Audio context is suspended, attempting to resume...");
        await audioContext.resume();
        addLog(`  After resume attempt, state is now: ${audioContext.state}`);
      }
      
      setSteps(prev => ({ ...prev, audioContextCreation: true }));
      toast({
        title: "Audio context created",
        description: `Sample rate: ${audioContext.sampleRate}Hz`,
        variant: "success"
      });
      return true;
    } catch (error) {
      addLog(`❌ Error creating audio context: ${error instanceof Error ? error.message : String(error)}`);
      setSteps(prev => ({ ...prev, audioContextCreation: false }));
      toast({
        title: "Audio context creation failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Step 4: Set up analyzer
  const setupAnalyzer = () => {
    // Ensure we have an audio context first
    if (steps.audioContextCreation !== true || !audioContextRef.current || !streamRef.current) {
      if (!createAudioContext()) return false;
    }
    
    addLog("STEP 4: Setting up audio analyzer...");
    
    try {
      const audioContext = audioContextRef.current!;
      const stream = streamRef.current!;
      
      // Create analyzer
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      
      // Configure analyzer
      analyser.fftSize = 1024; // Power of 2, between 32-32768
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.85;
      
      addLog(`  Analyzer created with FFT size: ${analyser.fftSize}`);
      addLog(`  Frequency bins: ${analyser.frequencyBinCount}`);
      addLog(`  Min/max dB: ${analyser.minDecibels}/${analyser.maxDecibels}`);
      
      // Create source node from stream
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      // Connect source to analyzer
      source.connect(analyser);
      addLog("✅ Source connected to analyzer");
      
      setSteps(prev => ({ ...prev, analyzerSetup: true }));
      toast({
        title: "Analyzer setup complete",
        description: "Audio analyzer is ready for signal processing",
        variant: "success"
      });
      return true;
    } catch (error) {
      addLog(`❌ Error setting up analyzer: ${error instanceof Error ? error.message : String(error)}`);
      setSteps(prev => ({ ...prev, analyzerSetup: false }));
      toast({
        title: "Analyzer setup failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Step 5: Start signal detection
  const startSignalDetection = () => {
    // Ensure analyzer is set up
    if (steps.analyzerSetup !== true || !analyserRef.current || !audioContextRef.current) {
      if (!setupAnalyzer()) return false;
    }
    
    addLog("STEP 5: Starting signal detection...");
    setIsActive(true);
    
    try {
      const analyser = analyserRef.current!;
      
      // Create buffer for time domain data
      const bufferLength = analyser.fftSize;
      const timeDataArray = new Float32Array(bufferLength);
      
      // Audio processing function
      const processAudio = () => {
        if (!isActive || !analyserRef.current) {
          return;
        }
        
        try {
          // Get time domain data
          analyser.getFloatTimeDomainData(timeDataArray);
          
          // Calculate signal strength (RMS)
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += timeDataArray[i] * timeDataArray[i];
          }
          const rms = Math.sqrt(sum / bufferLength);
          
          // Update signal strength
          setSignalStrength(rms);
          
          // Log signal strength occasionally
          if (Math.random() < 0.05) { // Log roughly 5% of frames
            addLog(`Signal strength: ${rms.toFixed(6)} RMS`);
          }
          
          // Test if we're getting a reasonable signal
          if (rms > 0.005) {
            setSteps(prev => ({ ...prev, signalDetection: true }));
          }
          
          // Continue processing
          animationRef.current = requestAnimationFrame(processAudio);
        } catch (error) {
          addLog(`❌ Error in audio processing: ${error instanceof Error ? error.message : String(error)}`);
          
          // Continue despite errors
          animationRef.current = requestAnimationFrame(processAudio);
        }
      };
      
      // Start processing
      processAudio();
      addLog("✅ Signal detection started");
      
      toast({
        title: "Signal detection started",
        description: "Monitoring audio input...",
      });
      return true;
    } catch (error) {
      addLog(`❌ Error starting signal detection: ${error instanceof Error ? error.message : String(error)}`);
      setSteps(prev => ({ ...prev, signalDetection: false }));
      setIsActive(false);
      return false;
    }
  };
  
  // Stop all audio processing and clean up
  const stopAudioProcessing = () => {
    addLog("Stopping audio processing...");
    setIsActive(false);
    
    // Cancel animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    // Disconnect source
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        addLog(`Stopped track: ${track.kind}`);
      });
      streamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(error => {
        addLog(`Error closing audio context: ${error}`);
      });
      audioContextRef.current = null;
    }
    
    addLog("Audio processing stopped and resources cleaned up");
    toast({
      title: "Audio processing stopped",
      description: "All audio resources have been cleaned up",
    });
  };
  
  // Run all steps in sequence
  const runAllSteps = async () => {
    // Reset all steps
    setSteps({
      browserSupport: null,
      microphoneAccess: null,
      audioContextCreation: null,
      analyzerSetup: null,
      signalDetection: null
    });
    setLogs([]);
    
    addLog("Starting all steps in sequence...");
    
    const browserSupported = checkBrowserSupport();
    if (!browserSupported) return;
    
    const microphoneGranted = await requestMicrophoneAccess();
    if (!microphoneGranted) return;
    
    const contextCreated = await createAudioContext();
    if (!contextCreated) return;
    
    const analyzerReady = setupAnalyzer();
    if (!analyzerReady) return;
    
    startSignalDetection();
  };
  
  // Get status icon for each step
  const getStatusIcon = (status: boolean | null) => {
    if (status === true) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status === false) return <XCircle className="h-5 w-5 text-red-500" />;
    return null;
  };
  
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Microphone Debug Tool</CardTitle>
          <CardDescription>
            A step-by-step test to diagnose microphone and audio processing issues
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step 1: Browser Support */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex-none w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">1</span>
              <span className="font-medium">Check Browser Support</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(steps.browserSupport)}
              <Button 
                size="sm" 
                variant={steps.browserSupport === true ? "outline" : "default"}
                onClick={checkBrowserSupport}
                disabled={isActive}
              >
                Test Browser
              </Button>
            </div>
          </div>
          
          {/* Step 2: Microphone Access */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex-none w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">2</span>
              <span className="font-medium">Request Microphone</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(steps.microphoneAccess)}
              <Button 
                size="sm" 
                variant={steps.microphoneAccess === true ? "outline" : "default"}
                onClick={requestMicrophoneAccess}
                disabled={isActive || steps.browserSupport !== true}
              >
                <Mic className="h-4 w-4 mr-1" />
                Request Mic
              </Button>
            </div>
          </div>
          
          {/* Step 3: Audio Context */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex-none w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">3</span>
              <span className="font-medium">Create Audio Context</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(steps.audioContextCreation)}
              <Button 
                size="sm" 
                variant={steps.audioContextCreation === true ? "outline" : "default"}
                onClick={createAudioContext}
                disabled={isActive || steps.microphoneAccess !== true}
              >
                Create Context
              </Button>
            </div>
          </div>
          
          {/* Step 4: Analyzer Setup */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex-none w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">4</span>
              <span className="font-medium">Setup Audio Analyzer</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(steps.analyzerSetup)}
              <Button 
                size="sm" 
                variant={steps.analyzerSetup === true ? "outline" : "default"}
                onClick={setupAnalyzer}
                disabled={isActive || steps.audioContextCreation !== true}
              >
                Setup Analyzer
              </Button>
            </div>
          </div>
          
          {/* Step 5: Signal Detection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex-none w-7 h-7 flex items-center justify-center rounded-full bg-gray-100">5</span>
              <span className="font-medium">Start Signal Detection</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(steps.signalDetection)}
              <Button 
                size="sm" 
                variant={isActive ? "destructive" : "default"}
                onClick={isActive ? stopAudioProcessing : startSignalDetection}
                disabled={!isActive && steps.analyzerSetup !== true}
              >
                {isActive ? (
                  <>
                    <MicOff className="h-4 w-4 mr-1" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-1" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          {/* Audio meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium flex items-center">
                <Volume2 className="h-5 w-5 mr-1" />
                Signal Strength
              </span>
              <span className="font-mono text-sm">{signalStrength.toFixed(6)}</span>
            </div>
            <Progress
              value={Math.min(signalStrength * 400, 100)}
              className="h-4"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Silent</span>
              <span>Quiet</span>
              <span>Normal</span>
              <span>Loud</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={runAllSteps} disabled={isActive}>
            Run All Steps
          </Button>
          <Button variant="destructive" onClick={stopAudioProcessing} disabled={!isActive}>
            Stop All
          </Button>
        </CardFooter>
      </Card>
      
      {/* Log display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-60 overflow-y-auto text-xs font-mono bg-gray-900 text-gray-200 rounded p-4">
            {logs.length === 0 ? (
              <div className="text-gray-500 italic">No logs yet. Run steps to see debug output.</div>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="border-b border-gray-800 py-1">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MicDebug;