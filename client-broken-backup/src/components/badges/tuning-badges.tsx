import React from 'react';

// Common badge style constants
const BADGE_HEIGHT = '32px';
const BADGE_FONT_SIZE = '15pt';
const BADGE_FONT_FAMILY = '"PT Sans Narrow", sans-serif';
const BADGE_BORDER_RADIUS = '4px';
const TUNING_BADGE_BG = '#e5e7eb'; // Lighter gray (gray-200)

// A component for frequency badges (432/440 Hz)
export const FrequencyBadge: React.FC<{ frequency: string }> = ({ frequency }) => {
  // Determine styling based on frequency
  const getBgColor = () => {
    if (frequency === '432') {
      return '#22c55e'; // Green
    } else if (frequency === '440') {
      return '#ef4444'; // Red
    } else {
      return '#000000'; // Black for unknown
    }
  };

  // Create styles with consistent height and other shared properties
  const styleObj: React.CSSProperties = {
    backgroundColor: getBgColor(),
    background: getBgColor(),
    color: 'white',
    fontFamily: BADGE_FONT_FAMILY,
    fontWeight: 900, // Extra bold
    fontSize: BADGE_FONT_SIZE,
    padding: '0 8px',
    borderRadius: BADGE_BORDER_RADIUS,
    width: '45px', // Fixed width for consistent appearance
    textAlign: 'center' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: BADGE_HEIGHT,
    boxSizing: 'border-box'
  };

  // We'll use inline styles with a style attribute to ensure they take precedence
  return (
    <div 
      style={styleObj}
      data-frequency={frequency}
      className={`frequency-badge frequency-${frequency}`}
    >
      {frequency || '—'}
    </div>
  );
};

// Component for tuning note badges (A3, C4, etc.)
export const TuningBadge: React.FC<{ tuningNote: string; onClick?: () => void }> = ({ 
  tuningNote,
  onClick 
}) => {
  // Create styles with consistent height and other shared properties
  const styleObj: React.CSSProperties = {
    backgroundColor: TUNING_BADGE_BG, // Light gray from constants
    background: TUNING_BADGE_BG,
    color: 'black',
    fontFamily: BADGE_FONT_FAMILY,
    fontWeight: 900, // Extra bold
    fontSize: BADGE_FONT_SIZE,
    padding: '0 8px',
    borderRadius: BADGE_BORDER_RADIUS,
    width: '55px', // Fixed width for consistent appearance
    textAlign: 'center' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: BADGE_HEIGHT,
    cursor: onClick ? 'pointer' : 'default',
    boxSizing: 'border-box'
  };

  // We'll use inline styles with a style attribute to ensure they take precedence
  return (
    <div 
      style={styleObj}
      onClick={onClick}
      data-tuning-note={tuningNote}
      className={`tuning-badge ${onClick ? 'hover:bg-gray-800' : ''}`}
    >
      {tuningNote || '—'}
    </div>
  );
};

// Combined badge that shows instrument type and tuning note together
// Interface for mold information from API
interface MoldInfo {
  id: number;
  name: string;
  instrumentType: string;
  size?: string;
  material?: string;
}

// Custom hook for fetching mold information
const useMoldInfo = (instrumentType: string, tuningNote: string) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [molds, setMolds] = React.useState<MoldInfo[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const timeoutRef = React.useRef<number | null>(null);
  
  // Clean tuning note for database lookup - remove 'm' from notes like Am4 -> A4
  // Database stores ALL flute types without 'm' suffix (e.g., C#4, not C#m4)
  const getSafeApiTuningNote = (note: string, type: string): string => {
    if (!note) return "";
    
    console.log(`Original tuning note for API lookup: ${note} (${type})`);
    
    // IMPORTANT: Database stores all flute entries WITHOUT the 'm' suffix
    // This applies to NATEY flutes too, even though they display with the 'm' in the UI
    if (note.includes('m')) {
      const match = note.match(/([A-G])(#|b)?m([1-6])/);
      if (match) {
        const [_, noteLetter, accidental, octave] = match;
        const cleanedNote = `${noteLetter}${accidental || ''}${octave}`;
        console.log(`DB LOOKUP: Removed 'm' suffix: ${note} -> ${cleanedNote}`);
        return cleanedNote;
      }
    }
    
    // If it doesn't have 'm' or pattern doesn't match, return as is
    console.log(`DB LOOKUP: Using note as is: ${note}`);
    return note;
  };
  
  // Sanitize tuning note for API lookup
  const safeTuningNote = getSafeApiTuningNote(tuningNote, instrumentType);
  
  React.useEffect(() => {
    if (isOpen && instrumentType && tuningNote) {
      setIsLoading(true);
      setError(null);
      
      // Use normalized instrumentType for API lookup (case insensitive)
      const normalizedType = instrumentType.toUpperCase();
      
      console.log(`Making API request to: /api/instrument-molds/${normalizedType}/${safeTuningNote}`);
      console.log(`- instrumentType: ${normalizedType}`);
      console.log(`- tuningNote: ${tuningNote} (encoded: ${encodeURIComponent(safeTuningNote)})`);
      
      fetch(`/api/instrument-molds/${normalizedType}/${safeTuningNote}`)
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
  }, [isOpen, instrumentType, tuningNote, safeTuningNote]);
  
  // Return everything needed for the popover
  return { isOpen, setIsOpen, isLoading, molds, error, timeoutRef };
};

export const CombinedInstrumentTuningBadge: React.FC<{ 
  instrumentType: string; 
  tuningNote?: string;
  frequency?: string;
  onClick?: () => void 
}> = ({ 
  instrumentType,
  tuningNote,
  frequency,
  onClick 
}) => {
  // Format instrument type for display
  const getDisplayInstrumentType = (type: string): string => {
    const lowerType = type.toLowerCase();
    
    // EERSTE CHECK: Is dit een bekend serienummer waar we een instrumenttype voor willen forceren?
    if (typeof window !== 'undefined' && window.location.pathname.includes('worksheet')) {
      // We kunnen alleen serienummers controleren op de worksheet pagina
      // Zoek het serienummer in de DOM door te kijken naar naastgelegen elementen
      
      // Find the item's serial number, either from a parent element data-attribute
      // or from a nearby element with the serial number text
      const itemElement = document.activeElement?.closest('[data-serial-number]');
      const serialNumber = itemElement?.getAttribute('data-serial-number');
      
      if (serialNumber) {
        console.log(`Checking fixed type mapping for serialNumber ${serialNumber}`);
        
        // Lookup tabel voor serienummer → instrument type mapping
        // OPMERKING: Dit zou idealiter uit de database moeten komen
        // maar voor urgente fixes kunnen we het hier hardcoden
        // Verwijderd hardcoded mappings, we vertrouwen nu volledig op de database waardes
        // die via enrichOrderItemWithDatabaseSpecs worden toegepast
        const serialNumberMappings: Record<string, { type: string, tuning?: string }> = {};
        
        if (serialNumberMappings[serialNumber]) {
          const mappedInfo = serialNumberMappings[serialNumber];
          console.log(`BADGE: Serienummer ${serialNumber} heeft vastgelegd type ${mappedInfo.type}`);
          
          // Als dit serienummer een vaste mapping heeft, override het tuningNote met onze waarde
          if (mappedInfo.tuning && tuningNote !== mappedInfo.tuning) {
            // Dit zorgt ervoor dat ook de tuningNote altijd correct wordt weergegeven
            console.log(`BADGE TUNING OVERRIDE: ${serialNumber} wijzig tuning van ${tuningNote} naar ${mappedInfo.tuning}`);
            // We kunnen tuningNote niet direct wijzigen omdat het een parameter is, 
            // maar we kunnen het lokaal opslaan voor gebruik in deze component
            window.setTimeout(() => {
              try {
                const tuningElement = document.querySelector(`[data-serial-number="${serialNumber}"] .tuning-badge`);
                if (tuningElement) {
                  console.log(`BADGE TUNING UPDATE: Element gevonden voor ${serialNumber}, update naar ${mappedInfo.tuning}`);
                  tuningElement.textContent = mappedInfo.tuning || '';
                }
              } catch (err) {
                console.error('Fout bij updaten van tuning element:', err);
              }
            }, 50);
          }
          
          return mappedInfo.type;
        }
      }
    }
    
    // Special case for INNATO without a key - show as CARDS
    if (lowerType.includes('innato') && !tuningNote) {
      console.log('INNATO without tuning note - displaying as CARDS');
      return 'CARDS';
    }
    
    // Special case for INNATO cards - show as CARDS
    if (lowerType.includes('innato') && lowerType.includes('card')) {
      console.log('Found INNATO card, displaying as CARDS');
      return 'CARDS';
    }
    
    // Regular instrument types
    if (lowerType.includes('innato')) return 'INNATO';
    if (lowerType.includes('natey')) return 'NATEY';
    if (lowerType.includes('double')) return 'DOUBLE';
    if (lowerType.includes('zen')) return 'ZEN';
    if (lowerType.includes('ova')) return 'OVA';
    if (lowerType.includes('cards')) return 'CARDS';
    
    return type.toUpperCase();
  };
  
  // Display text function - no longer needed, keeping for reference
  const getDisplayText = (type: string): string => {
    return type; // Return original text
  };
  
  // The display instrument type may be different from the passed instrumentType
  const displayInstrumentType = getDisplayInstrumentType(instrumentType);
  
  // Get instrument type background color
  const getInstrumentColor = (type: string): string => {
    const lowerType = type.toLowerCase();
    
    // Special case for CARDS (or INNATO without tuning key)
    if (displayInstrumentType === 'CARDS') {
      return '#ef4444'; // Bright red (red-500)
    }
    
    if (lowerType.includes('innato')) return '#4f46e5'; // indigo-600
    if (lowerType.includes('natey')) return '#f59e0b'; // amber-500
    if (lowerType.includes('double')) return '#8b5cf6'; // purple-600
    if (lowerType.includes('zen')) return '#0d9488'; // teal-600
    if (lowerType.includes('ova')) return '#ec4899'; // pink-600
    if (lowerType.includes('cards')) return '#ef4444'; // Red to match above
    return '#64748b'; // slate-500 (default for unknown types)
  };
  
  // Determine if we should show the tuning part
  const shouldShowTuning = () => {
    // CARDS type doesn't have tuning
    if (displayInstrumentType === 'CARDS') {
      return false;
    }
    // If no tuning is provided, don't show it
    if (!tuningNote) {
      return false;
    }
    return true;
  };
  
  // Handle special cases for tuning representation with improved centering
  const formatTuningDisplay = () => {
    let displayText = tuningNote || '—';
    
    // Bepaal het correcte weergaveformaat op basis van het type instrument
    // Voor elke instrumenttype hebben we specifieke regels:
    
    // REGEL 1: NATEY fluiten MOETEN altijd 'm' tonen, ongeacht wat er in de database staat
    // Bijvoorbeeld: A4 -> Am4, C4 -> Cm4, etc.
    if (instrumentType.toLowerCase().includes('natey') && tuningNote) {
      // Controleer of het al een 'm' heeft
      if (tuningNote.includes('m')) {
        // Heeft al 'm', gebruik zoals het is
        displayText = tuningNote;
        console.log(`NATEY display: keeping 'm' in ${tuningNote}`);
      } else {
        // Heeft geen 'm', voeg het toe voor het octaafnummer
        const match = tuningNote.match(/([A-G])(#|b)?([1-6])/);
        if (match) {
          const [_, noteLetter, accidental, octave] = match;
          displayText = `${noteLetter}${accidental || ''}m${octave}`;
          console.log(`NATEY display: adding 'm' to ${tuningNote} -> ${displayText}`);
        }
      }
    }
    
    // REGEL 2: INNATO fluiten MOGEN NOOIT 'm' tonen, zelfs als het in de database staat
    // Bijvoorbeeld: Am3 -> A3, Cm4 -> C4, etc.
    else if (instrumentType.toLowerCase().includes('innato') && tuningNote) {
      // Controleer of het een 'm' heeft die verwijderd moet worden
      if (tuningNote.includes('m')) {
        const match = tuningNote.match(/([A-G])(#|b)?m([1-6])/);
        if (match) {
          const [_, noteLetter, accidental, octave] = match;
          displayText = `${noteLetter}${accidental || ''}${octave}`;
          console.log(`INNATO display: removing 'm' from ${tuningNote} -> ${displayText}`);
        }
      } else {
        // Heeft geen 'm', gebruiken zoals het is
        displayText = tuningNote;
        console.log(`INNATO display: keeping as is ${tuningNote}`);
      }
    }
    
    // REGEL 3: ZEN fluiten kunnen 'L' of 'M' als tuning hebben
    else if (instrumentType.toLowerCase().includes('zen')) {
      displayText = tuningNote || '—';
    }
    
    // REGEL 4: OVA fluiten die 64Hz hebben
    else if (instrumentType.toLowerCase().includes('ova') && tuningNote?.includes('64')) {
      displayText = tuningNote;
    }
    
    // Return with text wrapped in a centered span for better alignment
    return (
      <span style={{ 
        display: 'inline-block', 
        textAlign: 'center', 
        width: '100%',
        lineHeight: '32px' // Match badge height for vertical centering
      }}>
        {displayText}
      </span>
    );
  };
  
  // Style constants
  const instrumentColor = getInstrumentColor(instrumentType);
  const hasTuning = shouldShowTuning();
  
  // Container style with combined border radius
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    borderRadius: BADGE_BORDER_RADIUS,
    overflow: 'hidden',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    height: BADGE_HEIGHT,
    cursor: onClick ? 'pointer' : 'default'
  };
  
  // Instrument type side style
  const instrumentStyle: React.CSSProperties = {
    backgroundColor: instrumentColor,
    color: 'white',
    fontFamily: BADGE_FONT_FAMILY,
    fontWeight: 700,
    fontSize: '14pt',
    padding: '0 4px',
    width: displayInstrumentType === 'CARDS' ? '130px' : '70px', // Wider for CARDS type
    textAlign: 'center',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    boxSizing: 'border-box',
    borderRight: hasTuning ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
    borderTopLeftRadius: BADGE_BORDER_RADIUS,
    borderBottomLeftRadius: BADGE_BORDER_RADIUS,
    borderTopRightRadius: hasTuning ? 0 : BADGE_BORDER_RADIUS,
    borderBottomRightRadius: hasTuning ? 0 : BADGE_BORDER_RADIUS
  };
  
  // Tuning note side style
  const tuningStyle: React.CSSProperties = {
    backgroundColor: TUNING_BADGE_BG, // Light gray from constants
    color: 'black',
    fontFamily: BADGE_FONT_FAMILY,
    fontWeight: 900, // Extra bold
    fontSize: BADGE_FONT_SIZE,
    padding: '0 4px',
    width: '60px', // Fixed width for all tuning badges for consistency
    textAlign: 'center',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    boxSizing: 'border-box',
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: BADGE_BORDER_RADIUS,
    borderBottomRightRadius: BADGE_BORDER_RADIUS
  };

  // Format instrument name to be short and consistent
  const formatInstrumentName = (name: string): string => {
    const lowerName = name.toLowerCase();
    // Keep instrument names without the 'm' in their name - the tuning note will have the 'm'
    if (lowerName.includes('innato')) return 'INNATO';
    if (lowerName.includes('natey')) return 'NATEY';
    if (lowerName.includes('double')) return 'DOUBLE';
    if (lowerName.includes('zen')) return 'ZEN';
    if (lowerName.includes('ova')) return 'OVA';
    if (lowerName.includes('cards')) return 'CARDS';
    return name.toUpperCase();
  };

  // Frequency corner badge style
  const getFrequencyColor = (freq?: string) => {
    if (!freq) return '';
    if (freq === '432') return '#22c55e'; // Green
    if (freq === '440') return '#ef4444'; // Red
    if (freq === '64') return '#8b5cf6';  // Purple for OvA 64Hz
    return '#000000'; // Black for unknown
  };
  
  const frequencyColor = getFrequencyColor(frequency);
  // Frequency labels weergeven:
  // 1. Niet voor CARDS (geen instrumenten)
  // 2. Niet voor ZEN fluiten (special case)
  // 3. Niet voor OVA fluiten (behalve 64Hz)
  // 4. Voor 432Hz altijd tonen (verplichte vermelding)
  // 5. Voor 440Hz altijd tonen op alle normale instrumenten
  
  // Aanpak met DEFAULT FREQUENCY op basis van instrument type:
  // - Alle INNATO, NATEY en DOUBLE fluiten zijn 440Hz tenzij expliciet 432Hz
  // - Dit is een eenvoudiger en robuustere aanpak dan database-aanpassingen
  const isInnato = instrumentType?.toLowerCase().includes('innato');
  const isNatey = instrumentType?.toLowerCase().includes('natey'); 
  const isDouble = instrumentType?.toLowerCase().includes('double');
  const isZen = instrumentType?.toLowerCase().includes('zen');
  const isOva = instrumentType?.toLowerCase().includes('ova');
  const isCards = instrumentType?.toLowerCase().includes('cards');
  
  // Expliciet opgegeven frequentie heeft altijd voorrang
  const has432Hz = frequency === '432';
  
  // NIEUWE LOGICA: Als het INNATO, NATEY of DOUBLE is en NIET expliciet 432Hz, dan is het 440Hz
  const has440Hz = frequency === '440' || 
                 (instrumentType && instrumentType.includes('440Hz')) ||
                 ((isInnato || isNatey || isDouble) && !has432Hz);
  
  // Als we 440Hz hebben gedetecteerd maar geen frequency veld, stel frequency in
  const effectiveFrequency = has440Hz ? '440' : frequency;
  
  // DEBUG: Log frequentie voor problemen
  if (has440Hz) {
    console.log(`440Hz instrument gevonden: ${instrumentType} met frequentie=${effectiveFrequency}`);
  }
  
  // Structurele conditie voor weergave frequenties
  const hasFrequency = 
    // Reguliere conditie: verberg alleen frequenties voor speciale instrumenten
    ((effectiveFrequency || has440Hz) && 
     // Moet een bekende frequentie zijn
     (effectiveFrequency === '432' || effectiveFrequency === '440' || has440Hz) &&
     // Niet weergeven voor deze speciale instrumenttypen
     !instrumentType.toLowerCase().includes('cards') &&
     !instrumentType.toLowerCase().includes('zen') &&
     !instrumentType.toLowerCase().includes('ova')) ||
    // OVA met 64Hz altijd tonen (speciale uitzondering)
    (instrumentType.toLowerCase().includes('ova') && effectiveFrequency === '64');
    
  // Logging voor 440Hz badges
  if (has440Hz) {
    console.log(`🔍 440Hz badge voor ${instrumentType} - Zichtbaar: ${hasFrequency}`);
  }
  
  // Extra debug log voor frequentie badges
  console.log(`Badge frequentie: ${instrumentType} - Freq: ${frequency} - Zichtbaar: ${hasFrequency}`);
  
  
  // Vertical frequency badge with 90-degree rotated text
  const frequencyBadgeStyle: React.CSSProperties = hasFrequency ? {
    position: 'absolute',
    top: '0',
    right: '-16px', // Position it to the right of the main badge
    backgroundColor: frequencyColor,
    color: 'white',
    fontFamily: BADGE_FONT_FAMILY,
    fontWeight: 700,
    fontSize: '10pt',
    padding: '6px 0', // Padding top/bottom instead of left/right
    width: '16px', // Narrow width (was minWidth)
    height: '100%', // Full height of parent
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0 4px 4px 0', // Only round the right corners
    boxShadow: '1px 0 2px rgba(0, 0, 0, 0.1)',
    zIndex: 0
  } : {};
  
  // Update container style to accommodate the frequency badge
  const updatedContainerStyle = {
    ...containerStyle,
    position: 'relative' as const,
  };
  
  // Update tuning style to have relative positioning
  const updatedTuningStyle = {
    ...tuningStyle,
    position: 'relative' as const,
    paddingRight: hasFrequency ? '18px' : tuningStyle.padding,
  };
  
  // Reposition frequency badge to be attached to the tuning part
  const updatedFrequencyBadgeStyle = {
    ...frequencyBadgeStyle,
    right: '0',  // Attach to right side of tuning part
    top: '0',    // Align with top of tuning part
    height: '100%', // Full height of tuning part
    zIndex: 1,
  };
  
  // Disabling the built-in mold info popover since we're using MoldNamePopover instead
  // We don't need the setIsOpen function anymore since we've removed the second popover
  const { isLoading, molds, error } = useMoldInfo(
    instrumentType, 
    tuningNote || ''
  );
  
  // We no longer need these handlers as the popover functionality is handled by MoldNamePopover
  const handleMouseEnter = () => {
    // No action needed
  };
  
  const handleMouseLeave = () => {
    // No action needed
  };
  
  // Generate popover content
  const renderPopoverContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-1">
          <div className="h-4 w-4 animate-spin text-white">Loading...</div>
        </div>
      );
    }
    
    if (error || molds.length === 0) {
      return (
        <div className="py-2 text-center text-xl font-medium text-white">
          No molds
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {molds.map((mold, index) => (
          <div 
            key={mold.id || index}
            className="py-1 flex items-center flex-wrap"
          >
            <span className="text-2xl font-bold text-white">{mold.name}</span>
            {mold.instrumentType !== instrumentType && (
              <span className="ml-2 text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded-md font-semibold">
                Shared: {mold.instrumentType}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="relative">
      <div 
        style={updatedContainerStyle}
        onClick={onClick}
        className={`combined-instrument-tuning-badge cursor-pointer hover:opacity-90`}
        title="Click to see attached mold sizes"
        role="button"
        tabIndex={0}
        aria-label={`Click to show mold information for ${instrumentType} ${tuningNote || ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          style={instrumentStyle}
          data-instrument-type={instrumentType}
          className="instrument-part"
        >
          {getDisplayText(displayInstrumentType)}
        </div>
        
        {hasTuning && (
          <div
            style={updatedTuningStyle}
            data-tuning-note={tuningNote}
            className="tuning-part"
          >
            {formatTuningDisplay()}
            
            {hasFrequency && (
              <div
                style={updatedFrequencyBadgeStyle}
                data-frequency={effectiveFrequency}
                className={`frequency-vertical-badge freq-${effectiveFrequency}`}
              >
                <div style={{ 
                  transform: 'rotate(90deg)',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.5px',
                  fontSize: '9pt'
                }}>
                  {effectiveFrequency}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Removed second popover - using MoldNamePopover instead */}
    </div>
  );
};