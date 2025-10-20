import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, AlertTriangle } from 'lucide-react';

/**
 * BasicMicTest - Absolute minimal microphone test
 * 
 * This is the most basic possible microphone test without any additional
 * complexity. It only tests microphone access without audio processing.
 */
const BasicMicTest: React.FC = () => {
  // State
  const [micState, setMicState] = useState<'inactive' | 'requesting' | 'active' | 'denied'>('inactive');
  const [tracks, setTracks] = useState<MediaStreamTrack[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Stream reference
  const streamRef = useRef<MediaStream | null>(null);

  // Add log messages
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, message]);
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start microphone access
  const startMic = async () => {
    try {
      // Update state to show we're requesting
      setMicState('requesting');
      addLog('Requesting microphone access...');
      
      // Request microphone access with minimal constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false
      });
      
      // Save stream reference for cleanup
      streamRef.current = stream;
      
      // Get available tracks
      const audioTracks = stream.getAudioTracks();
      setTracks(audioTracks);
      
      // Log all tracks
      addLog(`Microphone access GRANTED. Found ${audioTracks.length} tracks:`);
      audioTracks.forEach((track, i) => {
        addLog(`Track ${i+1}: "${track.label}" (${track.enabled ? 'enabled' : 'disabled'})`);
        
        // Log settings if available
        const settings = track.getSettings();
        if (settings) {
          Object.entries(settings).forEach(([key, value]) => {
            addLog(`  - ${key}: ${value}`);
          });
        }
      });
      
      // Update state to active
      setMicState('active');
      
      // Display a test message to console
      let testCounter = 0;
      const testInterval = setInterval(() => {
        testCounter++;
        console.log(`Microphone is active (test count: ${testCounter})`);
        
        // After 10 seconds, clear the interval
        if (testCounter >= 10) {
          clearInterval(testInterval);
        }
      }, 1000);
      
    } catch (error) {
      // Error getting microphone
      console.error('Error accessing microphone:', error);
      setMicState('denied');
      
      if (error instanceof Error) {
        addLog(`ERROR: ${error.name}: ${error.message}`);
        
        // Add more detail for common permission errors
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          addLog('User denied microphone permission. Please check your browser settings.');
        } else if (error.name === 'NotFoundError') {
          addLog('No microphone found. Please connect a microphone and try again.');
        } else if (error.name === 'NotReadableError' || error.name === 'AbortError') {
          addLog('Unable to read from microphone. It may be in use by another application.');
        }
      } else {
        addLog(`ERROR: Unknown error accessing microphone: ${String(error)}`);
      }
    }
  };

  // Stop microphone access
  const stopMic = () => {
    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        addLog(`Stopped track: ${track.label}`);
      });
      streamRef.current = null;
    }
    
    // Reset state
    setMicState('inactive');
    setTracks([]);
    addLog('Microphone stopped');
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Basic Microphone Test</h1>
      <p className="text-gray-600 mb-8 text-center">
        This is a minimal test to verify basic microphone access without any audio processing.
      </p>
      
      {/* Status Display */}
      <div className="mb-6 p-4 border rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <span className="font-medium">Microphone Status:</span>
          <span className={`font-medium px-3 py-1 rounded ${
            micState === 'active' ? 'bg-green-100 text-green-800' :
            micState === 'requesting' ? 'bg-yellow-100 text-yellow-800' :
            micState === 'denied' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {micState === 'active' ? 'Active' :
             micState === 'requesting' ? 'Requesting Access...' :
             micState === 'denied' ? 'Access Denied' :
             'Inactive'}
          </span>
        </div>

        {tracks.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Detected Microphones:</h3>
            <ul className="list-disc pl-5 space-y-1">
              {tracks.map((track, index) => (
                <li key={index} className="text-sm">
                  {track.label || `Microphone ${index + 1}`} 
                  <span className="text-xs text-gray-500 ml-1">
                    ({track.readyState})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {micState === 'denied' && (
          <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Microphone access was denied</p>
              <p className="mt-1">
                Please check your browser permissions and make sure you've allowed microphone access.
                You may need to click the camera/microphone icon in your browser's address bar.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {micState !== 'active' ? (
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              onClick={startMic}
              disabled={micState === 'requesting'}
            >
              <Mic className="h-4 w-4 mr-2" />
              {micState === 'requesting' ? 'Requesting...' : 'Start Microphone'}
            </Button>
          ) : (
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={stopMic}
            >
              <MicOff className="h-4 w-4 mr-2" />
              Stop Microphone
            </Button>
          )}
        </div>
      </div>

      {/* Logs */}
      <div className="border rounded-lg">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h3 className="font-medium">Debug Logs</h3>
        </div>
        <div className="p-4 bg-gray-800 text-gray-200 rounded-b-lg">
          <div className="h-64 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500 italic">No logs yet. Click "Start Microphone" to begin testing.</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="py-1 border-b border-gray-700">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-500 text-center">
        <p>
          This minimal test only checks if your browser can access the microphone.
          It doesn't perform any audio analysis or pitch detection.
        </p>
        <p className="mt-2">
          Check your browser console (F12) for additional debug information.
        </p>
      </div>
    </div>
  );
};

export default BasicMicTest;