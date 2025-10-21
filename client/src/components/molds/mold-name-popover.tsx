import { useState, useEffect } from 'react';
import { Loader2, X as XIcon, Package } from 'lucide-react';
import { createPortal } from 'react-dom';
import { getColorCodeFromSpecifications } from '@/lib/color-utils';

interface MoldNamePopoverProps {
  children: React.ReactNode;
  instrumentType: string;
  tuningNote: string;
  frequency?: string; // Allow passing frequency directly
  customerName?: string; // Full customer name
  orderNumber?: string; // Order number without suffix
  serialNumber?: string; // Complete serial number with suffix (e.g. SW-1505-1)
  itemPosition?: string; // Position of item in order (e.g. "1/10")
  orderNotes?: string; // Order notes/comments for builders
  itemSpecifications?: Record<string, any>; // Full specifications object for this item
  onOpenMoldInfo?: () => void; // Function to open the mold info dialog
}

export function MoldNamePopover({ children, instrumentType, tuningNote, frequency, customerName, orderNumber, serialNumber, itemPosition, orderNotes, itemSpecifications, onOpenMoldInfo }: MoldNamePopoverProps) {
  const [molds, setMolds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Convert tuning note for API lookup
  const getSafeApiTuningNote = (note: string, type: string): string => {
    if (!note) return "";
    
    // Standardize note based on instrument type
    const lowerType = type.toLowerCase();
    
    console.log(`Getting safe API tuning note for: ${type} ${note}`);
    
    // ALL flute types need to have the 'm' removed for database lookup
    // The key difference is in the DISPLAY - NATEY shows with 'm', but database stores without it
    if (note.includes('m')) {
      const match = note.match(/([A-G])(#|b)?m([1-6])/i);
      if (match) {
        const [_, noteLetter, accidental, octave] = match;
        const correctedNote = `${noteLetter}${accidental || ''}${octave}`;
        console.log(`DB LOOKUP: Removing 'm' suffix for lookup: ${note} -> ${correctedNote}`);
        return correctedNote;
      }
    }
    
    // If no 'm' was found or pattern didn't match, return as is
    console.log(`DB LOOKUP: Using note as is for lookup: ${note}`);
    return note;
  };
  
  // Safety check to ensure these values are always strings
  const safeInstrumentType = instrumentType || "Unknown";
  // Apply proper conversion for the tuning note
  const safeTuningNote = getSafeApiTuningNote(tuningNote || "", safeInstrumentType);
  const safeFrequency = frequency || "";
  
  // Get the customer's name - using full name as requested
  const customerDisplayName = customerName || "";
  
  useEffect(() => {
    // This ensures our component is mounted before the portal is created
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Format instrument type for display
  const formatInstrumentName = (name: string): string => {
    const lowerName = name.toLowerCase();
    
    // Special case for INNATO cards - needs to be checked first
    if (lowerName.includes('innato') && lowerName.includes('card')) {
      console.log('Found INNATO card, displaying as CARDS');
      return 'CARDS';
    }
    
    // Regular instrument types
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
  

  
  // Check if this instrument type has molds
  const instrumentHasMolds = (type: string): boolean => {
    const lowerType = type.toLowerCase();
    // Natey, Double, Innato, and ZEN flutes have molds
    return lowerType.includes('natey') || 
           lowerType.includes('double') || 
           lowerType.includes('innato') ||
           lowerType.includes('zen');
  };
  
  // Return appropriate message based on instrument type
  const getMoldErrorMessage = (type: string): string => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('natey')) {
      return "Natey flute molds need to be configured in Settings → Mold Mappings";
    } else if (lowerType.includes('double')) {
      return "Double flute molds need to be configured in Settings → Mold Mappings";
    } else if (lowerType.includes('zen')) {
      return "ZEN flute molds need to be configured in Settings → Mold Mappings";
    } else if (lowerType.includes('ova')) {
      return "OVA flutes don't use molds";
    } else {
      return "Mold information not found for this instrument";
    }
  };

  useEffect(() => {
    if (open && instrumentType && tuningNote) {
      // Check if we should fetch molds for this instrument type
      if (!instrumentHasMolds(safeInstrumentType)) {
        // Skip fetching for instruments that don't have molds (like OVA)
        setMolds([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      // Fetch the molds required for this instrument and tuning
      // URL encode the tuning note to handle special characters like # properly
      const encodedTuningNote = encodeURIComponent(safeTuningNote);
      const apiUrl = `/api/instrument-molds/${safeInstrumentType}/${encodedTuningNote}`;
      console.log(`Making API request to: ${apiUrl}`);
      console.log(`- instrumentType: ${safeInstrumentType}`);
      console.log(`- tuningNote: ${safeTuningNote} (encoded: ${encodedTuningNote})`);
      console.log(`- frequency: ${safeFrequency || 'not provided'}`);
      
      fetch(apiUrl)
        .then(res => {
          if (!res.ok) {
            if (res.status === 404) {
              console.error(`API returned 404 for ${safeInstrumentType}/${encodedTuningNote}`);
              throw new Error(`No molds found`);
            }
            throw new Error('Failed to load');
          }
          return res.json();
        })
        .then(data => {
          // Respect the mold sizes configured in settings/molds
          // (No special handling needed as the correct values come from the API)
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
  }, [open, safeInstrumentType, safeTuningNote]);
  
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
  
  // Portal element for the modal
  const modal = mounted && open && (
    createPortal(
      <div className="fixed inset-0 flex items-center justify-center z-[9999]">
        <div 
          className="fixed inset-0 bg-black/30" 
          onClick={handleClose}
          style={{ backdropFilter: 'blur(2px)' }}
        />
        <div 
          className="w-[550px] max-h-[90vh] overflow-y-auto rounded-lg shadow-lg bg-white border border-gray-200 relative z-[10000]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with instrument and tuning info */}
          <div 
            className="p-4 flex justify-between items-center" 
            style={{ backgroundColor: getInstrumentColor(safeInstrumentType), color: 'white' }}
          >
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold">
                {formatInstrumentName(safeInstrumentType)} {tuningNote}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full opacity-70 hover:bg-white/20 transition-all hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white/50 p-1.5"
              aria-label="Close"
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          
          {/* Content area - simplified to focus on molds */}
          <div className="p-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="py-6 text-center">
                <div className="text-xl font-medium text-gray-500">No molds available</div>
                <p className="text-sm text-gray-400 mt-1">{getMoldErrorMessage(safeInstrumentType)}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Simplified mold info section */}
                {instrumentHasMolds(safeInstrumentType) && (
                  <section>
                    <h4 className="text-2xl font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2 flex items-center">
                      <Package className="mr-2 h-5 w-5 text-gray-700" />
                      Molds
                    </h4>
                    
                    {molds.length === 0 ? (
                      <div className="py-6 text-center bg-gray-50 rounded-lg">
                        <div className="text-base font-medium text-gray-500">No molds found for this instrument</div>
                        <p className="text-sm text-gray-400 mt-1">Configure molds in Settings → Mold Mappings</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {/* Filter molds based on instrument type */}
                        {(() => {
                          // Each instrument size has its own specific mold(s) with specific display formats
                          // The display must exactly match what's shown in the settings screenshots
                          
                          // Create a copy of the mold list which we'll modify for display
                          let moldsToShow = [];
                          
                          if (safeInstrumentType.toLowerCase().includes('innato')) {
                            // For INNATO instruments, collect all mold sizes and combine them
                            const moldSizes = molds.map(m => m.size).join(" ");
                            if (molds.length > 0) {
                              // Create a single mold with the combined sizes as its display name
                              moldsToShow = [{
                                ...molds[0],
                                displayName: moldSizes
                              }];
                            }
                          } 
                          else if (safeInstrumentType.toLowerCase().includes('natey')) {
                            // For NATEY, just display the size from the database
                            // The user will update the mold sizes directly in settings
                            if (molds.length > 0) {
                              moldsToShow = [{
                                ...molds[0],
                                displayName: molds[0].size
                              }];
                            }
                          } 
                          else if (safeInstrumentType.toLowerCase().includes('double')) {
                            // For DOUBLE, show "DOUBLE L" or "DOUBLE M"
                            if (molds.length > 0) {
                              const size = molds[0].size === "14" ? "L" : "M";
                              moldsToShow = [{
                                ...molds[0],
                                displayName: `DOUBLE ${size}`
                              }];
                            }
                          } 
                          else if (safeInstrumentType.toLowerCase().includes('zen')) {
                            // For ZEN, show "ZEN L" or "ZEN M"
                            if (molds.length > 0) {
                              // The size is actually in the tuning_note field for ZEN
                              // Use the tuning_note directly if available, or fall back to the mold name
                              let sizeLabel;
                              
                              if (safeTuningNote && (safeTuningNote === 'M' || safeTuningNote === 'L')) {
                                // Use tuning_note if it's M or L
                                sizeLabel = safeTuningNote;
                              } else if (molds[0].name && molds[0].name.includes(' ')) {
                                // Try to extract size from name (like "ZEN M" or "ZEN L")
                                const nameParts = molds[0].name.split(' ');
                                sizeLabel = nameParts[nameParts.length - 1];
                              } else {
                                // Last resort fallback
                                sizeLabel = 'L';
                              }
                              
                              moldsToShow = [{
                                ...molds[0],
                                displayName: `ZEN ${sizeLabel}`
                              }];
                            }
                          }
                          else if (safeInstrumentType.toLowerCase().includes('ova')) {
                            // For OvA, show full name as is
                            moldsToShow = molds.slice(0, 1);
                          }
                          else {
                            // For any other type, just show the first mold
                            moldsToShow = molds.slice(0, 1);
                          }
                          
                          return moldsToShow.map((mold, index) => {
                            // Determine if this mold is for left, right or front vessel
                            const moldPosition = mold.name.toLowerCase().includes('left') ? 'Left Vessel' : 
                                                mold.name.toLowerCase().includes('right') ? 'Right Vessel' :
                                                mold.name.toLowerCase().includes('front') ? 'Front Vessel' : 
                                                '';
                            
                            // We're using our custom display name if available
                            // Otherwise fall back to the original name
                            const displayName = mold._displayName || mold.name;
                            
                            return (
                              <div 
                                key={mold.id || index}
                                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                              >
                                {/* Show position label if available */}
                                {moldPosition && (
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                    {moldPosition}
                                  </div>
                                )}
                                
                                <div className="text-center mb-5 mt-2">
                                  <span className="mold-number text-[70pt] font-bold text-gray-800 px-5 py-2 inline-block tracking-tight leading-none">
                                    {mold.displayName || mold.name}
                                  </span>
                                </div>
                                
                                {mold.size && !safeInstrumentType.toLowerCase().includes('natey') && (
                                  <div className="flex items-center justify-end">
                                    <span className="px-2 py-1 bg-indigo-50 text-indigo-800 rounded-md text-sm font-medium">
                                      Size: {mold.size}
                                    </span>
                                  </div>
                                )}
                                
                                {mold.material && (
                                  <div className="text-sm text-gray-600 mt-2">
                                    Material: <span className="font-medium">{mold.material}</span>
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </section>
                )}

                {/* Label Section */}
                <section className="mt-6">
                  <h4 className="text-xl font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 text-gray-700" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="12" x="3" y="4" rx="2" ry="2"></rect>
                      <line x1="8" x2="16" y1="2" y2="2"></line>
                      <line x1="12" x2="12" y1="10" y2="16"></line>
                    </svg>
                    Label
                  </h4>
                  
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 font-medium relative">
                    {itemPosition && 
                      <div className="absolute top-2 right-2 text-base font-semibold bg-gray-200 px-2 py-1 rounded-md">
                        {itemPosition}
                      </div>
                    }
                    <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-base">
                      <div className="text-right text-gray-600">Name:</div>
                      <div className="text-left font-bold col-span-2">{customerDisplayName || 'Customer'}</div>
                      
                      <div className="text-right text-gray-600">Order:</div>
                      <div className="text-left font-bold col-span-2">
                        {(() => {
                          // Format: orderNum without SW- prefix
                          if (orderNumber) {
                            const orderNum = orderNumber.replace('SW-', '');
                            
                            // Only add suffix for orders with multiple items
                            if (itemPosition && itemPosition.includes('/') && itemPosition.split('/')[1] !== '1') {
                              // Get the first digit of itemPosition (before the "/")
                              const itemPos = itemPosition.split('/')[0];
                              return `${orderNum}-${itemPos}`;
                            }
                            
                            // For single orders, just show the order number without suffix
                            return orderNum;
                          }
                          
                          // Fallback for rare cases where orderNumber is missing
                          return '?';
                        })()}
                      </div>
                      
                      <div className="text-right text-gray-600">Flute:</div>
                      <div className="text-left font-bold col-span-2">{formatInstrumentName(safeInstrumentType)}</div>
                      
                      <div className="text-right text-gray-600">Tuning:</div>
                      <div className="text-left font-bold col-span-2">{tuningNote}</div>
                      
                      <div className="text-right text-gray-600">Frequency:</div>
                      <div className="text-left font-bold col-span-2">{safeFrequency || '440 Hz'}</div>
                      
                      <div className="text-right text-gray-600">Color code:</div>
                      <div className="text-left font-bold col-span-2">{getColorCodeFromSpecifications(itemSpecifications, safeInstrumentType)}</div>
                    </div>
                  </div>
                </section>
                
                {/* Order notes section - only display if there are notes */}
                {orderNotes && orderNotes.trim() !== '' && (
                  <section className="mt-4">
                    <h4 className="text-xl font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5 text-gray-700" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 3v4a1 1 0 0 0 1 1h4"></path>
                        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"></path>
                        <path d="M9 9h1"></path>
                        <path d="M9 13h6"></path>
                        <path d="M9 17h6"></path>
                      </svg>
                      Order Notes
                    </h4>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-sm">
                      <div className="text-base whitespace-pre-wrap">
                        {orderNotes}
                      </div>
                    </div>
                  </section>
                )}

              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    )
  );
  
  return (
    <div className="inline-flex relative cursor-pointer" onClick={handleClick}>
      {children}
      {modal}
    </div>
  );
}