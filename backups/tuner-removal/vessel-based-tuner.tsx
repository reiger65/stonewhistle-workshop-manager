import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { VolumeMeter } from '@/components/tuner/volume-meter';
import { 
  NOTE_FREQUENCIES,
  getVesselNotesForKey,
  FluteType,
  getNoteFrequency,
} from '@shared/instrument-reference';

interface VesselBasedTunerProps {
  fluteType: string;
  tuningKey: string;
  frequency?: string;
  onClose?: () => void;
  compactMode?: boolean;
  moldName?: string;
}

export default function VesselBasedTuner({ 
  fluteType,
  tuningKey, 
  frequency = '440',
  onClose,
  compactMode = false,
  moldName
}: VesselBasedTunerProps) {
  // Audio processing state
  const [isListening, setIsListening] = useState(false);
  const [sensitivity, setSensitivity] = useState(0.5);
  const [currentFrequency, setCurrentFrequency] = useState(0);
  const [activeNote, setActiveNote] = useState('');
  const [centDifference, setCentDifference] = useState(0);
  const [currentVessel, setCurrentVessel] = useState('all');
  
  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  
  // Get dynamic styling based on flute type
  const getInstrumentStyles = () => {
    const type = fluteType.toLowerCase();
    
    if (type.includes('innato')) {
      return {
        bgLight: "bg-blue-50",
        bgMedium: "bg-blue-100",
        border: "border-blue-100",
        borderActive: "border-blue-300",
        text: "text-blue-800",
        textDark: "text-blue-800",
        arrow: "border-t-blue-500",
        tab: "bg-blue-50 data-[state=active]:bg-blue-100",
        tabColor: "text-blue-800 bg-blue-50 data-[state=active]:bg-blue-100",
        footnote: "text-blue-600",
        star: "text-blue-500",
      };
    } 
    else if (type.includes('natey')) {
      return {
        bgLight: "bg-amber-50",
        bgMedium: "bg-amber-100",
        border: "border-amber-100",
        borderActive: "border-amber-300",
        text: "text-amber-800",
        textDark: "text-amber-800",
        arrow: "border-t-amber-500",
        tab: "bg-amber-50 data-[state=active]:bg-amber-100",
        tabColor: "text-amber-800 bg-amber-50 data-[state=active]:bg-amber-100",
        footnote: "text-amber-600",
        star: "text-amber-500",
      };
    }
    else if (type.includes('double')) {
      return {
        bgLight: "bg-purple-50",
        bgMedium: "bg-purple-100",
        border: "border-purple-100",
        borderActive: "border-purple-300",
        text: "text-purple-800",
        textDark: "text-purple-800",
        arrow: "border-t-purple-500",
        tab: "bg-purple-50 data-[state=active]:bg-purple-100",
        tabColor: "text-purple-800 bg-purple-50 data-[state=active]:bg-purple-100",
        footnote: "text-purple-600",
        star: "text-purple-500",
      };
    }
    else if (type.includes('zen')) {
      return {
        bgLight: "bg-green-50",
        bgMedium: "bg-green-100",
        border: "border-green-100",
        borderActive: "border-green-300",
        text: "text-green-800",
        textDark: "text-green-800",
        arrow: "border-t-green-500",
        tab: "bg-green-50 data-[state=active]:bg-green-100",
        tabColor: "text-green-800 bg-green-50 data-[state=active]:bg-green-100",
        footnote: "text-green-600",
        star: "text-green-500",
      };
    }
    else if (type.includes('ova')) {
      return {
        bgLight: "bg-teal-50",
        bgMedium: "bg-teal-100",
        border: "border-teal-100",
        borderActive: "border-teal-300",
        text: "text-teal-800",
        textDark: "text-teal-800",
        arrow: "border-t-teal-500",
        tab: "bg-teal-50 data-[state=active]:bg-teal-100",
        tabColor: "text-teal-800 bg-teal-50 data-[state=active]:bg-teal-100",
        footnote: "text-teal-600",
        star: "text-teal-500",
      };
    }
    
    // Default styling
    return {
      bgLight: "bg-gray-50",
      bgMedium: "bg-gray-100",
      border: "border-gray-100",
      borderActive: "border-gray-300",
      text: "text-gray-800",
      textDark: "text-gray-800",
      arrow: "border-t-gray-500",
      tab: "bg-gray-50 data-[state=active]:bg-gray-100",
      tabColor: "text-gray-800 bg-gray-50 data-[state=active]:bg-gray-100",
      footnote: "text-gray-600",
      star: "text-gray-500",
    };
  };
  
  const styles = getInstrumentStyles();
  
  // Clear audio resources when component unmounts
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);
  
  // Stop listening and clean up resources
  const stopListening = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    
    if (analyserNodeRef.current) {
      analyserNodeRef.current.disconnect();
      analyserNodeRef.current = null;
    }
    
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    setIsListening(false);
  };
  
  // Start listening to the microphone
  const startListening = async () => {
    try {
      console.log("Starting microphone...");
      
      // Basic AudioContext creation
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      // Get microphone access with minimal options
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Basic audio processing setup
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyserNodeRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;
      
      // Connect the audio nodes
      source.connect(analyser);
      analyser.connect(processor);
      processor.connect(audioContext.destination);
      
      // Very simple audio processing
      processor.onaudioprocess = (e) => {
        const buffer = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatTimeDomainData(buffer);
        
        // Simple autocorrelation for basic pitch detection
        const pitch = detectPitch(buffer, audioContext.sampleRate);
        
        if (pitch && pitch > 50 && pitch < 2000) {
          setCurrentFrequency(pitch);
          const noteData = findClosestNote(pitch);
          if (noteData) {
            setActiveNote(noteData.note);
            setCentDifference(noteData.cents);
            console.log(`Note: ${noteData.note}, F: ${pitch.toFixed(1)} Hz, cents: ${noteData.cents.toFixed(1)}`);
          }
        }
      };
      
      // Update state
      setIsListening(true);
      console.log("Microphone activated successfully");
    } catch (error) {
      console.error("Error starting microphone:", error);
      stopListening();
      alert("Could not access microphone. Please check browser permissions.");
    }
  };
  
  // Format the note name for display
  const formatDisplayNote = () => {
    return activeNote || 'E';
  };
  
  // Find the closest note to a given frequency
  const findClosestNote = (freq: number): { note: string, cents: number } | null => {
    // Adjust frequency based on the reference tuning
    const freqAdjustmentRatio = parseFloat(frequency) / 440.0;
    const adjustedFreq = freq / freqAdjustmentRatio;
    
    const notes = Object.keys(NOTE_FREQUENCIES);
    let closestNote = '';
    let closestDistance = Infinity;
    
    for (const note of notes) {
      const noteFreq = NOTE_FREQUENCIES[note];
      const distance = Math.abs(noteFreq - adjustedFreq);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestNote = note;
      }
    }
    
    if (!closestNote) return null;
    
    // Calculate cents off
    const closestFreq = NOTE_FREQUENCIES[closestNote];
    const ratio = adjustedFreq / closestFreq;
    const cents = Math.round(1200 * Math.log2(ratio));
    
    return { note: closestNote, cents };
  };
  
  // Simple autocorrelation pitch detection
  const detectPitch = (buffer: Float32Array, sampleRate: number): number | null => {
    // Apply sensitivity to buffer threshold
    const threshold = 0.2 - sensitivity * 0.15; // Range from 0.05 to 0.2 based on sensitivity
    
    // Normalize the buffer
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);
    
    // Exit early if signal too weak
    if (rms < threshold) return null;
    
    // Basic autocorrelation
    const correlations: number[] = [];
    for (let lag = 0; lag < buffer.length / 2; lag++) {
      let correlation = 0;
      for (let i = 0; i < buffer.length / 2; i++) {
        correlation += buffer[i] * buffer[i + lag];
      }
      correlations.push(correlation);
    }
    
    // Find peaks in autocorrelation
    const peaks: number[] = [];
    for (let i = 1; i < correlations.length - 1; i++) {
      if (correlations[i] > correlations[i-1] && correlations[i] > correlations[i+1]) {
        peaks.push(i);
      }
    }
    
    // Skip the first peak (zero lag)
    if (peaks.length > 1) {
      const firstPeak = peaks[1];
      const frequency = sampleRate / firstPeak;
      return frequency;
    }
    
    return null;
  };
  
  // Check if a note needs an adjustment star marker
  const needsAdjustment = (note: string) => {
    // NATEY flutes don't need extra cents adjustments
    if (!isInnatoFlute) {
      return false;
    }
    
    // Only INNATO flutes need adjustment for specific notes and intervals
    // Bb notes - always have +10 cent adjustment
    if (note.includes('Bb')) {
      return true;
    }
    
    // Minor 3rds (D#/Eb), augmented 4ths (F#), and minor 7ths (Bb) need adjustment
    if ((note.includes('D#') || note.includes('F#') || note.includes('Bb')) && 
        (isInnatoFlute && normalizedTuningKey === 'C4')) {
      return true;
    }
    
    return false;
  };
  
  // Format the tuning frequency display
  const formatTuningFrequency = () => {
    return `${frequency} Hz`;
  };
  
  // Check flute types
  const isNateyFlute = fluteType.toLowerCase().includes('natey');
  const isInnatoFlute = fluteType.toLowerCase().includes('innato');
  const isDoubleFlute = fluteType.toLowerCase().includes('double');
  const isZenFlute = fluteType.toLowerCase().includes('zen');
  const isOvaFlute = fluteType.toLowerCase().includes('ova');
  
  // Remove 'm' from tuning key if it exists (e.g., "Cm4" -> "C4")
  const normalizedTuningKey = tuningKey.replace('m', '');
  
  // Get notes for different chambers/vessels based on flute type
  const getNotesForVessel = (vessel: string) => {
    try {
      // For INNATO - use the three vessels
      if (isInnatoFlute) {
        if (vessel === 'LEFT') {
          return getVesselNotesForKey(fluteType as FluteType, tuningKey, 'LEFT');
        } else if (vessel === 'RIGHT') {
          return getVesselNotesForKey(fluteType as FluteType, tuningKey, 'RIGHT');
        } else if (vessel === 'FRONT') {
          return getVesselNotesForKey(fluteType as FluteType, tuningKey, 'FRONT');
        } else if (vessel === 'ALL') {
          // Combine all notes from all vessels for ALL view
          const leftNotes = getVesselNotesForKey(fluteType as FluteType, tuningKey, 'LEFT');
          const rightNotes = getVesselNotesForKey(fluteType as FluteType, tuningKey, 'RIGHT');
          const frontNotes = getVesselNotesForKey(fluteType as FluteType, tuningKey, 'FRONT');
          return [...leftNotes, ...rightNotes, ...frontNotes];
        }
      }
      
      // For DOUBLE flute - use the two chambers
      else if (isDoubleFlute) {
        if (vessel === 'CHAMBER1') {
          return getVesselNotesForKey(fluteType as FluteType, tuningKey, 'CHAMBER1');
        } else if (vessel === 'CHAMBER2') {
          return getVesselNotesForKey(fluteType as FluteType, tuningKey, 'CHAMBER2');
        } else if (vessel === 'ALL') {
          // Combine all notes from both chambers for ALL view
          const chamber1Notes = getVesselNotesForKey(fluteType as FluteType, tuningKey, 'CHAMBER1');
          const chamber2Notes = getVesselNotesForKey(fluteType as FluteType, tuningKey, 'CHAMBER2');
          return [...chamber1Notes, ...chamber2Notes];
        }
      }
      
      // For NATEY, ZEN, and OVA - single chamber
      else {
        return getVesselNotesForKey(fluteType as FluteType, tuningKey, 'SINGLE');
      }
    } catch (error) {
      console.error(`Error getting notes for ${fluteType} ${tuningKey} vessel ${vessel}:`, error);
      return [];
    }
    
    return [];
  };
  
  // Render a note cell with frequency
  const renderNoteCell = (note: string, active: boolean = false) => {
    try {
      // Calculate the frequency for this note
      const freq = getNoteFrequency(note, frequency);
      
      // Determine if this note needs adjustment
      const needsAdj = needsAdjustment(note);
      
      return (
        <div 
          key={`note-${note}`}
          className={`flex flex-col items-center justify-center p-2 ${
            active
              ? `${styles.bgMedium} border ${styles.borderActive}` 
              : 'bg-gray-50 border border-gray-200'
          } rounded relative`}
        >
          <div className="text-sm mb-1">{note}</div>
          <div className="text-xs text-gray-500">{freq.toFixed(1)} Hz</div>
          {needsAdj && (
            <span className={`absolute top-0 right-0 text-xs ${styles.star}`}>★</span>
          )}
        </div>
      );
    } catch (error) {
      console.error(`Error rendering note cell for ${note}:`, error);
      return null;
    }
  };
  
  return (
    <div className="w-full bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
      
      {/* Header with tuning reference */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h4 className="text-sm uppercase font-semibold mr-2">
            🎵 TUNING REFERENCE
          </h4>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{formatTuningFrequency()}</span>
          <Button
            onClick={() => {
              if (isListening) {
                stopListening();
                // Auto-close the popup when stopping
                if (onClose) {
                  onClose();
                }
              } else {
                startListening();
              }
            }}
            variant={isListening ? "destructive" : "default"}
            size="sm"
            className={`${isListening ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600 text-white"}`}
          >
            {isListening ? "STOP" : "START"}
          </Button>
          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              CLOSE
            </Button>
          )}
        </div>
      </div>
      
      {/* Sensitivity slider - matches screenshot */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>More sensitive</span>
          <span>Less sensitive</span>
        </div>
        <Slider
          value={[sensitivity]}
          min={0}
          max={1}
          step={0.1}
          onValueChange={(value) => setSensitivity(value[0])}
        />
      </div>
      
      {/* Tuning meter - horizontal style */}
      <div className="relative h-8 mb-4">
        <div className="flex justify-between text-xs text-gray-500">
          <span>-30¢</span>
          <span>-15¢</span>
          <span>0¢</span>
          <span>+15¢</span>
          <span>+30¢</span>
        </div>
        
        {/* Indicator background with dynamic colors */}
        <div className={`absolute top-4 left-0 right-0 h-8 ${styles.bgLight} border ${styles.border}`}></div>
        
        {/* Vertical tick marks */}
        <div className="absolute top-4 left-0 right-0 h-8 flex justify-between">
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="h-8 w-px bg-gray-300"></div>
        </div>
        
        {/* Indicator arrow with dynamic colors */}
        <div className="absolute top-4 left-1/2 h-8 flex justify-center">
          <div 
            className={`h-0 w-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent ${styles.arrow}`}
            style={{
              transform: `translateX(${centDifference * 3}px)`,
            }}
          ></div>
        </div>
      </div>
      
      {/* Large note display with dynamic colors */}
      <div className={`rounded-lg ${styles.bgLight} text-center py-4 mb-4 border ${styles.border}`}>
        <div className={`text-7xl font-bold ${styles.text}`}>
          {formatDisplayNote()}
        </div>
      </div>

      {/* Notes grid tabs that match the screenshot - DYNAMIC based on instrument type */}
      <div>
        {isInnatoFlute ? (
          // INNATO FLUTE - 3 chambers (LEFT, RIGHT, FRONT)
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4 bg-transparent gap-1">
              <TabsTrigger value="all" className={`text-xs py-1 px-2 ${styles.tab} border border-gray-200 rounded`}>ALL</TabsTrigger>
              <TabsTrigger value="left" className={`text-xs py-1 px-2 ${styles.tab} border border-gray-200 rounded`}>LEFT</TabsTrigger>
              <TabsTrigger value="right" className={`text-xs py-1 px-2 ${styles.tab} border border-gray-200 rounded`}>RIGHT</TabsTrigger>
              <TabsTrigger value="front" className={`text-xs py-1 px-2 ${styles.tab} border border-gray-200 rounded`}>FRONT</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-1">
              <div className="text-sm font-medium mb-1 text-gray-600">LEFT VESSEL:</div>
              <div className="grid grid-cols-4 gap-1">
                {getNotesForVessel('LEFT').map(note => renderNoteCell(note, activeNote === note))}
              </div>
              
              <div className="text-sm font-medium mb-1 mt-2 text-gray-600">RIGHT VESSEL:</div>
              <div className="grid grid-cols-4 gap-1">
                {getNotesForVessel('RIGHT').map(note => renderNoteCell(note, activeNote === note))}
              </div>
              
              <div className="text-sm font-medium mb-1 mt-2 text-gray-600">FRONT VESSEL:</div>
              <div className="grid grid-cols-4 gap-1">
                {getNotesForVessel('FRONT').map(note => renderNoteCell(note, activeNote === note))}
              </div>
              
              <div className={`mt-3 text-xs ${styles.footnote} flex items-center`}>
                <span className={`${styles.star} mr-1`}>★</span>
                <span>+10¢ for minor 3rds, #4ths, and minor 7ths</span>
              </div>
            </TabsContent>
            
            <TabsContent value="left" className="mt-1">
              <div className="grid grid-cols-4 gap-1">
                {getNotesForVessel('LEFT').map(note => renderNoteCell(note, activeNote === note))}
              </div>
              
              <div className={`mt-3 text-xs ${styles.footnote} flex items-center`}>
                <span className={`${styles.star} mr-1`}>★</span>
                <span>+10¢ for minor 3rds, #4ths, and minor 7ths</span>
              </div>
            </TabsContent>
            
            <TabsContent value="right" className="mt-1">
              <div className="grid grid-cols-4 gap-1">
                {getNotesForVessel('RIGHT').map(note => renderNoteCell(note, activeNote === note))}
              </div>
              
              <div className={`mt-3 text-xs ${styles.footnote} flex items-center`}>
                <span className={`${styles.star} mr-1`}>★</span>
                <span>+10¢ for minor 3rds, #4ths, and minor 7ths</span>
              </div>
            </TabsContent>
            
            <TabsContent value="front" className="mt-1">
              <div className="grid grid-cols-4 gap-1">
                {getNotesForVessel('FRONT').map(note => renderNoteCell(note, activeNote === note))}
              </div>
              
              <div className={`mt-3 text-xs ${styles.footnote} flex items-center`}>
                <span className={`${styles.star} mr-1`}>★</span>
                <span>+10¢ for minor 3rds, #4ths, and minor 7ths</span>
              </div>
            </TabsContent>
          </Tabs>
        ) : isDoubleFlute ? (
          // DOUBLE FLUTE - 2 chambers (CHAMBER1, CHAMBER2)
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full grid grid-cols-3 mb-4 bg-transparent gap-1">
              <TabsTrigger value="all" className={`text-xs py-1 px-2 ${styles.tab} border border-gray-200 rounded`}>ALL</TabsTrigger>
              <TabsTrigger value="chamber1" className={`text-xs py-1 px-2 ${styles.tab} border border-gray-200 rounded`}>CHAMBER 1</TabsTrigger>
              <TabsTrigger value="chamber2" className={`text-xs py-1 px-2 ${styles.tab} border border-gray-200 rounded`}>CHAMBER 2</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-1">
              <div className="text-sm font-medium mb-1 text-gray-600">CHAMBER 1:</div>
              <div className="grid grid-cols-6 gap-1">
                {getNotesForVessel('CHAMBER1').map(note => renderNoteCell(note, activeNote === note))}
              </div>
              
              <div className="text-sm font-medium mb-1 mt-2 text-gray-600">CHAMBER 2:</div>
              <div className="grid grid-cols-6 gap-1">
                {getNotesForVessel('CHAMBER2').map(note => renderNoteCell(note, activeNote === note))}
              </div>
              
              <div className={`mt-3 text-xs ${styles.footnote} flex items-center`}>
                <span className={`${styles.star} mr-1`}>★</span>
                <span>+10¢ for minor 3rds, #4ths, and minor 7ths</span>
              </div>
            </TabsContent>
            
            <TabsContent value="chamber1" className="mt-1">
              <div className="grid grid-cols-3 gap-1">
                {getNotesForVessel('CHAMBER1').map(note => renderNoteCell(note, activeNote === note))}
              </div>
              
              <div className={`mt-3 text-xs ${styles.footnote} flex items-center`}>
                <span className={`${styles.star} mr-1`}>★</span>
                <span>+10¢ for minor 3rds, #4ths, and minor 7ths</span>
              </div>
            </TabsContent>
            
            <TabsContent value="chamber2" className="mt-1">
              <div className="grid grid-cols-3 gap-1">
                {getNotesForVessel('CHAMBER2').map(note => renderNoteCell(note, activeNote === note))}
              </div>
              
              <div className={`mt-3 text-xs ${styles.footnote} flex items-center`}>
                <span className={`${styles.star} mr-1`}>★</span>
                <span>+10¢ for minor 3rds, #4ths, and minor 7ths</span>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // SINGLE CHAMBER FLUTES (NATEY, ZEN, OVA) - Just show all notes
          <div>
            <div className="grid grid-cols-4 gap-1">
              {getNotesForVessel('SINGLE').map(note => renderNoteCell(note, activeNote === note))}
            </div>
            
            {!isNateyFlute && (
              <div className={`mt-3 text-xs ${styles.footnote} flex items-center`}>
                <span className={`${styles.star} mr-1`}>★</span>
                <span>+10¢ for minor 3rds, #4ths, and minor 7ths</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}