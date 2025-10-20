import { useState, useEffect } from 'react';
import { Loader2, X as XIcon, Music, Ruler, Package } from 'lucide-react';
import { createPortal } from 'react-dom';

interface MoldNamePopoverProps {
  children: React.ReactNode;
  instrumentType: string;
  tuningNote: string;
  frequency?: string; // Allow passing frequency directly
}

export function MoldNamePopover({ children, instrumentType, tuningNote, frequency }: MoldNamePopoverProps) {
  const [molds, setMolds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Safety check to ensure these values are always strings
  const safeInstrumentType = instrumentType || "Unknown";
  
  // For all flute types, we now preserve the 'm' designation for minor tunings
  let safeTuningNote = tuningNote || "";
  
  // No sanitization needed - we now preserve minor designations for all instrument types
  if (safeTuningNote) {
    console.log(`Using exact tuning note for ${safeInstrumentType}: ${safeTuningNote}`);
  }
  
  const safeFrequency = frequency || "";
  
  useEffect(() => {
    // This ensures our component is mounted before the portal is created
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Format instrument type for display
  const formatInstrumentName = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('innato')) return 'INNATO';
    if (lowerName.includes('natey')) return 'NATEY';
    if (lowerName.includes('double')) return 'DOUBLE';
    if (lowerName.includes('zen')) return 'ZEN';
    if (lowerName.includes('ova')) return 'OVA';
    if (lowerName.includes('cards')) return 'CARDS';
    return name.toUpperCase();
  };
  
  // Get the background color based on instrument type
  const getInstrumentColor = (type: string): string => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('innato')) return '#4f46e5'; // indigo-600
    if (lowerType.includes('natey')) return '#f59e0b'; // amber-500
    if (lowerType.includes('double')) return '#8b5cf6'; // purple-600
    if (lowerType.includes('zen')) return '#0d9488'; // teal-600
    if (lowerType.includes('ova')) return '#ec4899'; // pink-600
    if (lowerType.includes('cards')) return '#f43f5e'; // rose-500
    return '#64748b'; // slate-500 (default for unknown types)
  };
  
  useEffect(() => {
    if (open && instrumentType && tuningNote) {
      // Add debug log 
      console.log(`Opened popover for: instrumentType='${safeInstrumentType}', tuningNote='${safeTuningNote}'`);
      console.log(`Title string analysis: contains '432'=${safeInstrumentType.includes('432') || safeTuningNote.includes('432')}`);
      
      setIsLoading(true);
      setError(null);
      
      // Fetch the molds required for this instrument and tuning
      fetch(`/api/instrument-molds/${safeInstrumentType}/${safeTuningNote}`)
        .then(res => {
          if (!res.ok) {
            if (res.status === 404) {
              throw new Error(`No molds found`);
            }
            throw new Error('Failed to load');
          }
          return res.json();
        })
        .then(data => {
          setMolds(data);
        })
        .catch(err => {
          console.error('Error fetching molds:', err);
          setError(err.message || 'Failed to load');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, instrumentType, tuningNote]);
  
  // Handle click event to toggle the popover
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
  };
  
  // Handle click on close button to close the popover
  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
  };
  
  return (
    <div 
      className="inline-flex relative cursor-pointer"
      style={{ zIndex: 30 }}
      onClick={handleClick}
    >
      <div className="inline-block cursor-pointer" onClick={handleClick}>
        {children}
      </div>
      
      {/* Custom modal dialog that's always at the top of the screen and centered */}
      {mounted && open && (
        <div className="fixed inset-0 flex justify-center z-[9999]" style={{ alignItems: 'flex-start' }}>
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={handleClose}
            style={{ backdropFilter: 'blur(2px)' }}
          />
          <div 
            className="w-[550px] max-h-[70vh] overflow-y-auto shadow-xl bg-white border border-gray-200 rounded-lg cursor-default p-0 relative z-[10000] mt-[80px]"
          >
          {/* Header with instrument and tuning info */}
          <div 
            className="p-5 flex justify-between items-center" 
            style={{ backgroundColor: getInstrumentColor(safeInstrumentType), color: 'white' }}
          >
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold tracking-tight">
                {formatInstrumentName(safeInstrumentType)} {safeTuningNote}
              </h3>
              <p className="text-sm opacity-90 mt-1">Technical Specifications and Measurements</p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full opacity-70 hover:bg-white/20 transition-all hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 disabled:pointer-events-none p-2"
              aria-label="Close"
            >
              <XIcon className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          
          {/* Content area */}
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="py-6 text-center">
                <div className="text-xl font-medium text-gray-500">No molds available</div>
                <p className="text-sm text-gray-400 mt-1">Mold information not found for this instrument</p>
              </div>
            ) : molds.length === 0 ? (
              <div className="py-6 text-center">
                <div className="text-xl font-medium text-gray-500">No molds available</div>
                <p className="text-sm text-gray-400 mt-1">Mold information not found for this instrument</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Mold sizes section */}
                <section>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2 border-b border-gray-200 pb-1 flex items-center">
                    <Package className="mr-2 h-4 w-4 text-gray-600" />
                    Mold Sizes
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {molds.map((mold, index) => (
                      <div 
                        key={mold.id || index}
                        className="bg-gray-50 p-3 rounded-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-4xl font-bold text-gray-800">{mold.name}</span>
                          {mold.instrumentType !== instrumentType && (
                            <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-md font-semibold">
                              Shared: {mold.instrumentType}
                            </span>
                          )}
                        </div>
                        {mold.size && (
                          <div className="text-lg text-gray-600 mt-1">
                            Size: <span className="font-medium">{mold.size}</span>
                          </div>
                        )}
                        {mold.material && (
                          <div className="text-lg text-gray-600">
                            Material: <span className="font-medium">{mold.material}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
                
                {/* Tuning Notes section */}
                <section>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2 border-b border-gray-200 pb-1 flex items-center">
                    <Music className="mr-2 h-4 w-4 text-gray-600" />
                    Tuning Notes
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    {(() => {
                      // Determine which instrument type we're dealing with
                      const lowerType = safeInstrumentType.toLowerCase();
                      
                      if (lowerType.includes('innato')) {
                        // Log debugging info for INNATO
                        console.log('INNATO details:', { 
                          safeTuningNote, 
                          safeInstrumentType,
                          contains432: safeTuningNote.includes("432") || safeInstrumentType.includes("432"),
                          contains440: safeTuningNote.includes("440") || safeInstrumentType.includes("440") 
                        });
                        
                        // Extract frequency information from the props 
                        const getFrequencyInfo = () => {
                          // First check the direct frequency prop if available
                          if (safeFrequency) {
                            console.log(`Using direct frequency prop: ${safeFrequency}`);
                            if (safeFrequency.includes("432")) {
                              return { value: "432 Hz", className: "bg-green-200 text-green-800" };
                            } else if (safeFrequency.includes("440")) {
                              return { value: "440 Hz", className: "bg-red-200 text-red-800" };
                            }
                          }
                          
                          // Then check exact matches in the strings
                          if (safeTuningNote === "432" || safeInstrumentType === "432") {
                            return { value: "432 Hz", className: "bg-green-200 text-green-800" };
                          }
                          
                          // Then check for substring matches
                          if (safeTuningNote.includes("432") || safeInstrumentType.includes("432")) {
                            return { value: "432 Hz", className: "bg-green-200 text-green-800" };
                          }
                           
                          // If we need to determine from the database or other means, we'll default to 440 Hz
                          // In a production environment, this would need to come from a data source
                          return { value: "440 Hz", className: "bg-red-200 text-red-800" };
                        };
                        
                        const frequencyData = getFrequencyInfo();
                        
                        return (
                          <div className="space-y-2">
                            <div>
                              <h5 className="text-lg font-semibold text-gray-700">Innato Flute</h5>
                              
                              <div className="mt-1">
                                <div className="text-base font-medium text-gray-700">Key: {safeTuningNote.charAt(0)} minor</div>
                                <div className="text-base text-gray-600">Frequency: <span className={`px-2 py-0.5 rounded ${frequencyData.className}`}>{frequencyData.value}</span></div>
                                {/* Include debug info for troubleshooting */}
                                {process.env.NODE_ENV === 'development' && (
                                  <div className="mt-0.5 text-xs text-gray-400">
                                    Debug: Type={safeInstrumentType}, Tuning={safeTuningNote}
                                  </div>
                                )}
                                
                                <div className="mt-1 border-t border-gray-200 pt-1">
                                  <div className="text-base font-medium text-gray-700">Chamber Ranges:</div>
                                  <div className="grid grid-cols-3 gap-x-2 gap-y-1 mt-1">
                                    {(() => {
                                      // Define a function to get chamber notes based on tuning
                                      const getChamberNotes = (note: string) => {
                                        const baseNote = note.charAt(0);
                                        
                                        // Map of notes for each tuning
                                        const noteMap: Record<string, {
                                          leftBack: string,
                                          rightBack: string,
                                          front: string
                                        }> = {
                                          'A': {
                                            leftBack: 'A2, C3, D3, E3',
                                            rightBack: 'A2, C3, D3, E3',
                                            front: 'A3, C4, D4, E4'
                                          },
                                          'A3': {
                                            leftBack: 'A2, C3, D3, E3',
                                            rightBack: 'A2, C3, D3, E3',
                                            front: 'A3, C4, D4, E4'
                                          },
                                          'B': {
                                            leftBack: 'B2, D3, E3, F#3',
                                            rightBack: 'B2, D3, E3, F#3',
                                            front: 'B3, D4, E4, F#4'
                                          },
                                          'C': {
                                            leftBack: 'C3, Eb3, F3, G3',
                                            rightBack: 'C3, Eb3, F3, G3',
                                            front: 'C4, Eb4, F4, G4'
                                          },
                                          'D': {
                                            leftBack: 'D3, F3, G3, A3',
                                            rightBack: 'D3, F3, G3, A3',
                                            front: 'D4, F4, G4, A4'
                                          },
                                          'E': {
                                            leftBack: 'E3, G3, A3, B3',
                                            rightBack: 'E3, G3, A3, B3',
                                            front: 'E4, G4, A4, B4'
                                          },
                                          'F': {
                                            leftBack: 'F3, Ab3, Bb3, C4',
                                            rightBack: 'F3, Ab3, Bb3, C4',
                                            front: 'F4, Ab4, Bb4, C5'
                                          },
                                          'G': {
                                            leftBack: 'G3, Bb3, C4, D4',
                                            rightBack: 'G3, Bb3, C4, D4',
                                            front: 'G4, Bb4, C5, D5'
                                          }
                                        };
                                        
                                        return noteMap[baseNote] || {
                                          leftBack: 'Varies by tuning',
                                          rightBack: 'Varies by tuning',
                                          front: 'Varies by tuning'
                                        };
                                      };
                                      
                                      const chamberNotes = getChamberNotes(safeTuningNote);
                                      
                                      return (
                                        <>
                                          <div className="text-sm text-gray-700 p-2 bg-gray-50 rounded border border-gray-100">
                                            <span className="font-bold block mb-0.5 text-xs text-gray-600">Left Back:</span> 
                                            <span className="font-semibold">{chamberNotes.leftBack}</span>
                                          </div>
                                          <div className="text-sm text-gray-700 p-2 bg-gray-50 rounded border border-gray-100">
                                            <span className="font-bold block mb-0.5 text-xs text-gray-600">Right Back:</span>
                                            <span className="font-semibold">{chamberNotes.rightBack}</span>
                                          </div>
                                          <div className="text-sm text-gray-700 p-2 bg-gray-50 rounded border border-gray-100">
                                            <span className="font-bold block mb-0.5 text-xs text-gray-600">Front:</span>
                                            <span className="font-semibold">{chamberNotes.front}</span>
                                          </div>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      } else if (lowerType.includes('double')) {
                        return (
                          <div className="space-y-2">
                            <div>
                              <h5 className="text-lg font-semibold text-gray-700">Double Flute</h5>
                              
                              <div className="mt-2">
                                <div className="text-lg font-medium text-gray-700">Key: C minor</div>
                                <div className="text-lg text-gray-600">Frequency: <span className="px-2 py-1 bg-red-200 text-red-800 rounded">440 Hz</span></div>
                                
                                <div className="mt-2 border-t border-gray-200 pt-2">
                                  <div className="text-lg font-medium text-gray-700">Playing Techniques:</div>
                                  <div className="grid grid-cols-1 gap-2 mt-2">
                                    <div className="p-2 bg-gray-50 rounded text-lg">
                                      <span className="font-semibold">Stereo Play:</span> Both flutes together for wide sound
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded text-lg">
                                      <span className="font-semibold">Drone + Melody:</span> One side plays a drone, other a melody
                                    </div>
                                    <div className="p-2 bg-gray-50 rounded text-lg">
                                      <span className="font-semibold">Alternating Melody:</span> Switch melodies between sides
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      } else if (lowerType.includes('natey')) {
                        // Determine key and notes based on tuning note
                        const getNateyInfo = (note: string) => {
                          // Map each tuning to its key and scale notes
                          const noteMap: {[key: string]: {key: string, scale: string}} = {
                            'C': {key: 'C minor', scale: 'C, Eb, F, G, Bb, C2, D, Eb'},
                            'Cm4': {key: 'C minor', scale: 'C, Eb, F, G, Bb, C2, D, Eb'},
                            'D': {key: 'D minor', scale: 'D, F, G, A, C, D2, E, F'},
                            'Dm4': {key: 'D minor', scale: 'D, F, G, A, C, D2, E, F'},
                            'E': {key: 'E minor', scale: 'E4, G4, A4, B4, E5'},
                            'E4': {key: 'E minor', scale: 'E4, G4, A4, B4, E5'},
                            'Em4': {key: 'E minor', scale: 'E4, G4, A4, B4, E5'},
                            'F': {key: 'F minor', scale: 'F, Ab, Bb, C, Eb, F2, G, Ab'},
                            'Fm4': {key: 'F minor', scale: 'F, Ab, Bb, C, Eb, F2, G, Ab'},
                            'G': {key: 'G minor', scale: 'G, Bb, C, D, F, G2, A, Bb'},
                            'Gm4': {key: 'G minor', scale: 'G, Bb, C, D, F, G2, A, Bb'},
                            'A': {key: 'A minor', scale: 'A, C, D, E, G, A2, B, C'},
                            'Am4': {key: 'A minor', scale: 'A, C, D, E, G, A2, B, C'},
                            'B': {key: 'B minor', scale: 'B, D, E, F#, A, B2, C#, D'},
                            'Bm4': {key: 'B minor', scale: 'B, D, E, F#, A, B2, C#, D'}
                          };
                          
                          // Get the note designator (handle special cases like Am4 and E4)
                          const baseNote = note.includes('m') || note.includes('4') ? note : note.charAt(0);
                          return noteMap[baseNote] || {key: `${baseNote} minor`, scale: 'Scale notes not available'};
                        };
                        
                        const nateyInfo = getNateyInfo(safeTuningNote);
                        
                        // Log debugging info
                        console.log('NATEY details:', { 
                          safeTuningNote, 
                          safeInstrumentType,
                          contains432: safeTuningNote.includes("432") || safeInstrumentType.includes("432"),
                          contains440: safeTuningNote.includes("440") || safeInstrumentType.includes("440") 
                        });
                        
                        // Extract frequency information 
                        const getFrequencyInfo = () => {
                          // First check the direct frequency prop if available
                          if (safeFrequency) {
                            console.log(`Using direct frequency prop for NATEY: ${safeFrequency}`);
                            if (safeFrequency.includes("432")) {
                              return { value: "432 Hz", className: "bg-green-200 text-green-800" };
                            } else if (safeFrequency.includes("440")) {
                              return { value: "440 Hz", className: "bg-red-200 text-red-800" };
                            }
                          }
                          
                          // Then check exact matches in the strings
                          if (safeTuningNote === "432" || safeInstrumentType === "432") {
                            return { value: "432 Hz", className: "bg-green-200 text-green-800" };
                          }
                          // Then check for substring matches
                          if (safeTuningNote.includes("432") || safeInstrumentType.includes("432")) {
                            return { value: "432 Hz", className: "bg-green-200 text-green-800" };
                          }
                          
                          // Default to 440 Hz for Natey flutes unless specified
                          return { value: "440 Hz", className: "bg-red-200 text-red-800" };
                        };
                        
                        const frequencyDisplay = getFrequencyInfo();
                        
                        return (
                          <div className="space-y-2">
                            <div>
                              <h5 className="text-lg font-semibold text-gray-700">Natey Flute</h5>
                              
                              <div className="mt-1">
                                <div className="text-base font-medium text-gray-700">Key: {nateyInfo.key}</div>
                                <div className="text-base text-gray-600">Frequency: <span className={`px-2 py-0.5 rounded ${frequencyDisplay.className}`}>{frequencyDisplay.value}</span></div>
                                
                                <div className="mt-1 border-t border-gray-200 pt-1">
                                  <div className="text-base font-medium text-gray-700">Scale:</div>
                                  <div className="p-2 bg-gray-50 rounded text-sm mt-1">{nateyInfo.scale}</div>
                                </div>
                                
                                <div className="mt-1 border-t border-gray-200 pt-1">
                                  <div className="text-base font-medium text-gray-700">Note:</div>
                                  <div className="text-sm text-gray-600">Cannot be overblown into second octave.</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      } else if (lowerType.includes('zen')) {
                        // Log debugging info for ZEN flutes
                        console.log('ZEN details:', { 
                          safeTuningNote, 
                          safeInstrumentType
                        });
                        
                        return (
                          <div className="space-y-2">
                            <div>
                              <h5 className="text-lg font-semibold text-gray-700">ZEN Flute</h5>
                              <div className="mt-1">
                                <div className="text-base font-medium text-gray-700">Tuning: {safeTuningNote.includes('L') ? 'Low' : 'Medium'}</div>
                                {/* ZEN flutes do not display frequencies */}
                              </div>
                            </div>
                          </div>
                        );
                      } else if (lowerType.includes('ova')) {
                        return (
                          <div className="space-y-2">
                            <div>
                              <h5 className="text-lg font-semibold text-gray-700">OvA Flute</h5>
                              <div className="mt-1">
                                <div className="text-base font-medium text-gray-700">Tuning: {safeTuningNote}</div>
                                <div className="text-base text-gray-600">Frequency: <span className="px-2 py-0.5 bg-purple-200 text-purple-800 rounded">64 Hz</span></div>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <p className="text-lg text-gray-500 italic">Tuning information not available for this instrument type.</p>
                        );
                      }
                    })()}
                  </div>
                </section>
                
                {/* Future section: Drill Sizes & Mouthpiece Sticks */}
                <section className="opacity-75">
                  <h4 className="text-lg font-semibold text-gray-700 mb-2 border-b border-gray-200 pb-1 flex items-center">
                    <Ruler className="mr-2 h-4 w-4 text-gray-600" />
                    Drill Sizes & Mouthpiece Sticks
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <Package className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-lg text-gray-700 font-medium">Coming Soon</p>
                          <p className="text-md text-gray-500">Technical specifications for drill sizes and mouthpiece measurements will be added in a future update.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}