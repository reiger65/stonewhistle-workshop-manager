import React, { useState, useEffect } from 'react';
import { ChevronLeft, Music } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MacCompatibleTuner from '@/components/tuner/mac-compatible-tuner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Available tuning frequencies
const TUNING_FREQUENCIES = [
  { label: 'A = 420 Hz', value: '420' },
  { label: 'A = 432 Hz', value: '432' },
  { label: 'A = 440 Hz (Standard)', value: '440' },
  { label: 'A = 444 Hz', value: '444' }
];

// Types of chambered flutes
const FLUTE_TYPES = [
  { label: 'Innato (3 chambers)', value: 'innato' },
  { label: 'Natey (single chamber)', value: 'natey' },
  { label: 'Double (2 chambers)', value: 'double' }
];

// Available keys for the different flute types
const FLUTE_KEYS = {
  'innato': [
    { label: 'A3', value: 'A3' },
    { label: 'C4', value: 'C4' },
    { label: 'D4', value: 'D4' },
    { label: 'E4', value: 'E4' },
    { label: 'F4', value: 'F4' },
    { label: 'G4', value: 'G4' }
  ],
  'natey': [
    { label: 'A4', value: 'A4' },
    { label: 'E4', value: 'E4' }
  ],
  'double': [
    { label: 'C#3', value: 'C#3' },
    { label: 'E3', value: 'E3' }
  ]
};

/**
 * StandaloneTuner component
 * A simplified standalone version of the tuner application
 * that uses the MacCompatibleTuner component
 */
const StandaloneTuner: React.FC = () => {
  // Parse URL parameters
  const parseQueryParams = () => {
    const params = new URLSearchParams(window.location.search);
    const instrType = params.get('instrumentType') || 'innato';
    const key = params.get('tuningKey') || 'E4';
    const frequency = params.get('frequency') || '440';
    
    return { instrType, key, frequency };
  };
  
  const urlParams = parseQueryParams();
  
  // Settings state - initialized with URL params if available
  const [instrumentType, setInstrumentType] = useState<string>(urlParams.instrType);
  const [tuningKey, setTuningKey] = useState<string>(urlParams.key);
  const [baseFrequency, setBaseFrequency] = useState<string>(urlParams.frequency);
  const [tunerOpen, setTunerOpen] = useState<boolean>(false);
  
  // Get the available keys for the current instrument type
  const availableKeys = FLUTE_KEYS[instrumentType as keyof typeof FLUTE_KEYS] || [];
  
  // Handle instrument type change
  const handleInstrumentTypeChange = (value: string) => {
    setInstrumentType(value);
    
    // Set default key for the selected instrument type
    if (FLUTE_KEYS[value as keyof typeof FLUTE_KEYS]) {
      setTuningKey(FLUTE_KEYS[value as keyof typeof FLUTE_KEYS][0].value);
    }
  };
  
  // Update notes based on instrument type and key
  useEffect(() => {
    // Determine the notes to display based on the flute type and key
    let notes: string[] = [];
    
    if (fluteType === 'custom') {
      notes = [...customNotes]; // Use custom notes defined by user
    } else {
      const presetKey = `${fluteType.charAt(0).toUpperCase() + fluteType.slice(1)} ${fluteKey}`;
      notes = INSTRUMENT_PRESETS[presetKey as keyof typeof INSTRUMENT_PRESETS] || [];
    }
    
    console.log('Setting notes for', presetKey, notes);
    setDisplayNotes(notes);
    
    // Calculate frequencies for each note
    const frequencies: Record<string, number> = {};
    notes.forEach(note => {
      // Convert from minor notation (Em4) to standard notation (E4)
      const stdNote = note.replace('m', '');
      frequencies[note] = adjustFrequency(NOTE_FREQUENCIES[stdNote] || 0);
    });
    
    setNoteFrequencies(frequencies);
    setChamberNames(CHAMBER_NAMES[fluteType as keyof typeof CHAMBER_NAMES] || CHAMBER_NAMES.innato);
    
    // Reset selected chamber to first option when changing flute type
    setSelectedChamber(CHAMBER_NAMES[fluteType as keyof typeof CHAMBER_NAMES]?.[0] || 'ALL');
  }, [fluteType, fluteKey, customNotes, baseFrequency]);
  
  // Adjust frequency based on base frequency (A4)
  const adjustFrequency = (freq: number): number => {
    if (baseFrequency === 440) return freq;
    return freq * (baseFrequency / 440);
  };
  
  // Add a custom note
  const addCustomNote = () => {
    if (editingCustomNote && !customNotes.includes(editingCustomNote)) {
      // Validate note format (e.g. "Am4", "Bbm3", etc.)
      const isValidNote = /^[A-G][b#]?m[0-9]$/.test(editingCustomNote);
      
      if (isValidNote) {
        setCustomNotes([...customNotes, editingCustomNote]);
        setEditingCustomNote('');
      } else {
        alert('Please enter a valid note format (e.g., "Am4", "Bbm3")');
      }
    }
  };
  
  // Remove a custom note
  const removeCustomNote = (note: string) => {
    setCustomNotes(customNotes.filter(n => n !== note));
  };
  
  // Find closest note to a given frequency
  const findClosestNote = (freq: number): { note: string; cents: number } => {
    let closestNote = '';
    let minCentsDiff = Infinity;
    let closestCents = 0;
    
    // Search in our display notes first
    for (const note of displayNotes) {
      const noteFreq = noteFrequencies[note];
      if (!noteFreq) continue;
      
      // Calculate cents difference (logarithmic scale)
      const cents = 1200 * Math.log2(freq / noteFreq);
      const absCents = Math.abs(cents);
      
      if (absCents < minCentsDiff) {
        minCentsDiff = absCents;
        closestNote = note;
        closestCents = cents;
      }
    }
    
    // If no match found or difference is too large, check all possible notes
    if (!closestNote || minCentsDiff > 100) {
      for (const [note, noteFreq] of Object.entries(NOTE_FREQUENCIES)) {
        const adjustedFreq = adjustFrequency(noteFreq);
        const cents = 1200 * Math.log2(freq / adjustedFreq);
        const absCents = Math.abs(cents);
        
        if (absCents < minCentsDiff) {
          minCentsDiff = absCents;
          // Convert to minor notation (E4 -> Em4)
          closestNote = note.replace(/([A-G][b#]?)(\d)/, '$1m$2');
          closestCents = cents;
        }
      }
    }
    
    return { note: closestNote, cents: closestCents };
  };
  
  // Start microphone
  const startMicrophone = async () => {
    if (isActive) return;
    
    try {
      console.log("Starting microphone...");
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      
      console.log("Microphone access granted!");
      streamRef.current = stream;
      
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Resume context if needed
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Create source node from mic input
      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = sourceNode;
      
      // Create script processor for audio processing
      const processorNode = audioContext.createScriptProcessor(2048, 1, 1);
      processorNodeRef.current = processorNode;
      
      // Connect audio graph
      sourceNode.connect(processorNode);
      processorNode.connect(audioContext.destination);
      
      // Set up audio processing function
      processorNode.onaudioprocess = (e) => {
        const inputBuffer = e.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Calculate signal strength (RMS)
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setRmsLevel(rms);
        
        // Only process if signal is strong enough
        if (rms < sensitivityThreshold) {
          // Signal too weak, clear active note
          if (currentFreq !== null) {
            setCurrentFreq(null);
            setActiveNote('');
            setCents(0);
          }
          return;
        }
        
        // Detect pitch using autocorrelation
        const frequency = detectPitch(inputData, audioContext.sampleRate);
        
        if (frequency && frequency >= 130 && frequency <= 1400) {
          // Find closest note
          const { note, cents } = findClosestNote(frequency);
          
          // Update UI
          setCurrentFreq(frequency);
          setActiveNote(note);
          setCents(cents);
        }
      };
      
      // Set active state
      setIsActive(true);
      console.log("Audio processing started");
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check your browser permissions.");
    }
  };
  
  // Stop microphone and clean up
  const stopMicrophone = () => {
    console.log("Stopping microphone...");
    
    // Clean up processor node
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current.onaudioprocess = null;
      processorNodeRef.current = null;
    }
    
    // Clean up source node
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    
    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    // Reset state
    setIsActive(false);
    setCurrentFreq(null);
    setCents(0);
    setActiveNote('');
    setRmsLevel(0);
    
    console.log("Microphone stopped");
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isActive) {
        stopMicrophone();
      }
    };
  }, [isActive]);
  
  // Calculate meter position from cents
  const getMeterPosition = () => {
    const clampedCents = Math.max(-50, Math.min(50, cents));
    return ((clampedCents + 50) / 100) * 100; // Convert to percentage (0-100)
  };
  
  // Reset to defaults
  const resetToDefaults = () => {
    setFluteType('innato');
    setFluteKey('Em4');
    setBaseFrequency(440);
    setSensitivityThreshold(0.0001);
    setCustomNotes([]);
  };
  
  // Handle flute type change
  const handleFluteTypeChange = (newType: string) => {
    setFluteType(newType);
    // Set a default key for the new type
    if (newType !== 'custom') {
      setFluteKey(FLUTE_KEYS[newType as keyof typeof FLUTE_KEYS][0].value);
    }
  };
  
  // UI for the tuner
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <Music className="mr-2 h-6 w-6 text-indigo-600" />
        Stonewhistle Workshop Tuner
      </h1>
      
      <div className="mb-6 flex justify-between items-center">
        <div className="text-lg font-medium">
          {presetKey} • {baseFrequency}Hz
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            {isActive ? (
              <div className="flex flex-col items-center">
                {currentFreq ? (
                  <>
                    <div className="text-4xl font-semibold mb-1">{activeNote}</div>
                    <div className="text-sm text-gray-500 mb-2">
                      {currentFreq.toFixed(1)} Hz • {cents > 0 ? '+' : ''}{Math.round(cents)} cents
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 mb-2">Waiting for sound...</div>
                )}
                
                {/* Volume Level Meter */}
                <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
                  <div 
                    className="h-full rounded-full bg-indigo-500" 
                    style={{ width: `${Math.min(rmsLevel * 5000, 100)}%` }}
                  />
                </div>
                
                {/* Cents Meter */}
                <div className="w-full h-12 relative bg-gray-100 rounded-full mb-2">
                  <div className="absolute inset-0 flex justify-center items-center">
                    <span className="absolute left-1/4 text-xs text-gray-500">-</span>
                    <span className="absolute right-1/4 text-xs text-gray-500">+</span>
                    <span className="absolute text-xs text-gray-500">0</span>
                  </div>
                  
                  {currentFreq && (
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-indigo-600" 
                      style={{
                        left: `${getMeterPosition()}%`,
                        transform: 'translateX(-50%)',
                        transition: 'left 0.1s ease-out'
                      }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <Volume2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <div className="text-lg mb-2">Microphone inactive</div>
                <div className="text-sm">Click the button below to start listening</div>
              </div>
            )}
          </div>
          
          <div className="text-center">
            {!isActive ? (
              <Button
                onClick={startMicrophone}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Mic className="h-4 w-4 mr-2" />
                Start Microphone
              </Button>
            ) : (
              <Button
                onClick={stopMicrophone}
                className="bg-red-600 hover:bg-red-700"
              >
                <MicOff className="h-4 w-4 mr-2" />
                Stop Microphone
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Note Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Notes</CardTitle>
          <CardDescription>Available notes for this instrument</CardDescription>
          
          {/* Chamber Selectors */}
          <div className="mt-2 flex flex-wrap gap-2">
            {chamberNames.map((chamber) => (
              <Button
                key={chamber}
                variant={selectedChamber === chamber ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedChamber(chamber)}
              >
                {chamber}
              </Button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
            {displayNotes.map((note, index) => {
              const isActiveNote = activeNote === note && currentFreq !== null;
              const freq = noteFrequencies[note] || 0;
              
              return (
                <div 
                  key={`${note}-${index}`} 
                  className={`
                    p-3 rounded text-center
                    ${isActiveNote ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'bg-gray-50'}
                  `}
                >
                  <div className={`text-base font-medium ${isActiveNote ? 'text-indigo-700' : 'text-gray-700'}`}>
                    {note}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {freq.toFixed(1)} Hz
                  </div>
                </div>
              );
            })}
            
            {displayNotes.length === 0 && (
              <div className="col-span-full text-center py-6 text-gray-500">
                No notes available. Please add notes in settings.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tuner Settings</DialogTitle>
            <DialogDescription>
              Configure the tuner for your specific instrument
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="instrument" className="mt-4">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="instrument">Instrument</TabsTrigger>
              <TabsTrigger value="custom">Custom Notes</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            {/* Instrument Tab */}
            <TabsContent value="instrument" className="mt-4 space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fluteType">Flute Type</Label>
                  <Select
                    value={fluteType}
                    onValueChange={handleFluteTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select flute type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FLUTE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {fluteType !== 'custom' && (
                  <div className="space-y-2">
                    <Label htmlFor="fluteKey">Fundamental Note</Label>
                    <Select
                      value={fluteKey}
                      onValueChange={setFluteKey}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select key" />
                      </SelectTrigger>
                      <SelectContent>
                        {FLUTE_KEYS[fluteType as keyof typeof FLUTE_KEYS]?.map(key => (
                          <SelectItem key={key.value} value={key.value}>
                            {key.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="baseFrequency">Concert Pitch</Label>
                  <Select
                    value={baseFrequency.toString()}
                    onValueChange={value => setBaseFrequency(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tuning frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {TUNING_FREQUENCIES.map(freq => (
                        <SelectItem key={freq.value} value={freq.value.toString()}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            
            {/* Custom Notes Tab */}
            <TabsContent value="custom" className="mt-4 space-y-4">
              <div className="flex flex-col">
                <Label htmlFor="customNotes" className="mb-2">Custom Notes</Label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Enter note (e.g. Em4)"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={editingCustomNote}
                    onChange={(e) => setEditingCustomNote(e.target.value)}
                  />
                  <Button variant="secondary" onClick={addCustomNote}>Add</Button>
                </div>
                
                {customNotes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {customNotes.map(note => (
                      <div
                        key={note}
                        className="flex items-center px-3 py-1 bg-gray-100 rounded-md"
                      >
                        <span className="mr-2">{note}</span>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeCustomNote(note)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No custom notes added yet.</div>
                )}
                
                <div className="mt-4 text-sm text-gray-500">
                  <p>Format: [Note][Accidental][m][Octave]</p>
                  <p>Examples: Am4, C#m3, Ebm5, Gm3</p>
                </div>
              </div>
            </TabsContent>
            
            {/* Advanced Tab */}
            <TabsContent value="advanced" className="mt-4 space-y-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between mb-1">
                    <Label htmlFor="sensitivity">Microphone Sensitivity</Label>
                    <span className="text-xs text-gray-500">{sensitivityThreshold.toExponential(4)}</span>
                  </div>
                  <Slider
                    id="sensitivity"
                    min={0.00001}
                    max={0.001}
                    step={0.00001}
                    value={[sensitivityThreshold]}
                    onValueChange={([value]) => setSensitivityThreshold(value)}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button variant="outline" onClick={resetToDefaults} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end mt-4 space-x-2">
            <Button variant="default" onClick={() => setSettingsOpen(false)}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StandaloneTuner;