/**
 * Centralized reference for all instrument data
 * This file serves as the single source of truth for all instrument specifications
 */

export type FluteType = 'INNATO' | 'NATEY' | 'DOUBLE' | 'ZEN_M' | 'ZEN_L' | 'OVA';

export type Fingering = {
  note: string;
  frequency: number; // Base frequency at A4=440Hz
};

export type VesselNotes = {
  LEFT?: string[];
  RIGHT?: string[];
  FRONT?: string[];
  CHAMBER1?: string[];
  CHAMBER2?: string[];
  SINGLE?: string[];
};

export type NoteAdjustment = {
  note: string;      // Specific note to adjust (e.g., 'Bb3')
  cents: number;     // Adjustment in cents (+/-)
  vessel?: string;   // Optional vessel/chamber identifier
  description?: string; // Optional explanation for the adjustment
};

export type IntervalAdjustment = {
  interval: string;  // Type of interval (e.g., 'minor3rd', 'perfect4th', 'minor7th')
  cents: number;     // Adjustment in cents (+/-)
  description?: string; // Optional explanation for the adjustment
};

export type InstrumentVariant = {
  key: string;          // Key of the flute, e.g., 'Cm4'
  defaultFrequency: string; // Default tuning frequency
  notes: VesselNotes;   // Notes for each vessel/chamber
  range?: string;       // Optional description of range
  noteAdjustments?: NoteAdjustment[]; // Specific note adjustments
  intervalAdjustments?: IntervalAdjustment[]; // Interval-based adjustments
};

export interface InstrumentReference {
  id: FluteType;        // Instrument type identifier
  name: string;         // Display name
  description: string;  // Brief description
  vessels: number;      // Number of vessels/chambers
  variants: InstrumentVariant[];  // All available key variants
  defaultKey: string;   // Default key for this instrument type
  availableFrequencies: string[]; // Available tuning frequencies
}

// Standard tuning frequencies available for all instruments
export const FREQUENCIES = ['440 Hz', '432 Hz', '425 Hz', '420 Hz'];

// Note frequencies at concert pitch A4=440Hz
export const NOTE_FREQUENCIES: Record<string, number> = {
  'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60, 'F0': 21.83, 'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50, 'Bb0': 29.14, 'B0': 30.87,
  'C1': 32.70, 'C#1': 34.65, 'D1': 36.71, 'D#1': 38.89, 'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00, 'G#1': 51.91, 'A1': 55.00, 'Bb1': 58.27, 'B1': 61.74,
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'Bb2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'Bb5': 932.33, 'B5': 987.77,
  'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66, 'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98, 'G#6': 1661.22, 'A6': 1760.00, 'Bb6': 1864.66, 'B6': 1975.53,
  'C7': 2093.00, 'C#7': 2217.46, 'D7': 2349.32, 'D#7': 2489.02, 'E7': 2637.02, 'F7': 2793.83, 'F#7': 2959.96, 'G7': 3135.96, 'G#7': 3322.44, 'A7': 3520.00, 'Bb7': 3729.31, 'B7': 3951.07,
  'C8': 4186.01, 'C#8': 4434.92, 'D8': 4698.63, 'D#8': 4978.03, 'E8': 5274.04, 'F8': 5587.65, 'F#8': 5919.91, 'G8': 6271.93, 'G#8': 6644.88, 'A8': 7040.00, 'Bb8': 7458.62, 'B8': 7902.13
};

/**
 * Helper function to generate the instrument reference object
 */
export function getInstrumentReferences(): InstrumentReference[] {
  // INNATO reference data
  const innatoKeys = [
    'Em4', 'D#m4', 'Dm4', 'C#m4', 'Cm4', 
    'Bm3', 'Bbm3', 'Am3', 'G#m3', 'Gm3', 
    'F#m3', 'Fm3', 'Em3'
  ];
  
  // Define specific notes for Cm4
  const innatoCm4Notes: VesselNotes = {
    LEFT: ['G3', 'Bb3', 'C4', 'D4'],
    RIGHT: ['C4', 'D#4', 'F4', 'G4'],
    FRONT: ['G4', 'Bb4', 'C5', 'D5']
  };
  
  // Define adjustments for Innato Cm4
  const innatoCm4Adjustments = {
    noteAdjustments: [
      { note: 'Bb3', cents: 10, vessel: 'LEFT', description: 'Bb3 on left vessel needs to be raised slightly' },
      { note: 'D#4', cents: 10, vessel: 'RIGHT', description: 'Minor 3rd interval (D#4) needs to be raised by 10 cents' }
    ],
    intervalAdjustments: [
      { interval: 'minor3rd', cents: 10, description: 'All minor 3rd intervals raised by 10 cents' },
      { interval: 'perfect4th', cents: 10, description: 'All perfect 4th intervals raised by 10 cents' },
      { interval: 'minor7th', cents: 10, description: 'All minor 7th intervals raised by 10 cents' }
    ]
  };
  
  // Define specific notes for D#m4 (Eb minor) - updated to match actual instrument
  const innatoDsharpM4Notes: VesselNotes = {
    LEFT: ['Bb3', 'C#4', 'D#4', 'F4'],
    RIGHT: ['D#4', 'G4', 'G#4', 'Bb4'],
    FRONT: ['Bb4', 'C#5', 'D#5', 'F5']
  };
  
  // Define adjustments for Innato D#m4
  const innatoDsharpM4Adjustments = {
    noteAdjustments: [
      { note: 'Bb3', cents: 10, vessel: 'LEFT', description: 'Bb3 on left vessel needs to be raised slightly' },
      { note: 'G4', cents: 10, vessel: 'RIGHT', description: 'Perfect 4th interval (G4) needs to be raised by 10 cents' },
      { note: 'G#4', cents: 10, vessel: 'RIGHT', description: 'Minor 3rd interval (G#4) needs to be raised by 10 cents' }
    ],
    intervalAdjustments: [
      { interval: 'minor3rd', cents: 10, description: 'All minor 3rd intervals raised by 10 cents' },
      { interval: 'perfect4th', cents: 10, description: 'All perfect 4th intervals raised by 10 cents' },
      { interval: 'minor7th', cents: 10, description: 'All minor 7th intervals raised by 10 cents' }
    ]
  };
  
  // Define an alias for D#m4 using Ebm4 notation (for consistency)
  const innatoEbm4Notes: VesselNotes = innatoDsharpM4Notes;
  const innatoEbm4Adjustments = innatoDsharpM4Adjustments;
  
  // NATEY reference data
  const nateyKeys = [
    'Am4', 'G#m4', 'Gm4', 'F#m4', 'Fm4', 'Em4', 'D#m4', 
    'Dm4', 'C#m4', 'Cm4', 'Bm3', 'Bbm3', 'Am3', 'G#m3', 'Gm3'
  ];
  
  // Example of Natey notes pattern
  const nateyCm4Notes: VesselNotes = {
    SINGLE: ['C4', 'D#4', 'F4', 'G4', 'Bb4', 'C5', 'D5', 'D#5']
  };
  
  // DOUBLE reference data
  const doubleKeys = [
    'C#m4', 'Cm4', 'Bm3', 'Bbm3', 'Am3', 'G#m3', 'Gm3'
  ];
  
  // Double flute Cm4 notes for both chambers (same notes)
  const doubleCm4Notes: VesselNotes = {
    CHAMBER1: ['C4', 'D#4', 'F4', 'G4', 'Bb4', 'C5'],
    CHAMBER2: ['C4', 'D#4', 'F4', 'G4', 'Bb4', 'C5']
  };
  
  // ZEN flute data
  // ZEN M is tuned in G minor (G3)
  // Pattern: root, minor 3rd, 4th, 5th, minor 7th, octave
  const zenMNotes: VesselNotes = {
    SINGLE: ['G3', 'Bb3', 'C4', 'D4', 'F4', 'G4']
  };
  
  // Define adjustments for ZEN M
  const zenMAdjustments = {
    noteAdjustments: [
      { note: 'Bb3', cents: 10, vessel: 'SINGLE', description: 'Minor 3rd interval (Bb3) needs to be raised by 10 cents' },
      { note: 'C4', cents: 10, vessel: 'SINGLE', description: 'Perfect 4th interval (C4) needs to be raised by 10 cents' },
      { note: 'F4', cents: 10, vessel: 'SINGLE', description: 'Minor 7th interval (F4) needs to be raised by 10 cents' }
    ],
    intervalAdjustments: [
      { interval: 'minor3rd', cents: 10, description: 'All minor 3rd intervals raised by 10 cents' },
      { interval: 'perfect4th', cents: 10, description: 'All perfect 4th intervals raised by 10 cents' },
      { interval: 'minor7th', cents: 10, description: 'All minor 7th intervals raised by 10 cents' }
    ]
  };
  
  // ZEN L is tuned in E minor (E3)
  // Pattern: root, minor 3rd, 4th, 5th, minor 7th, octave
  const zenLNotes: VesselNotes = {
    SINGLE: ['E3', 'G3', 'A3', 'B3', 'D4', 'E4']
  };
  
  // Define adjustments for ZEN L
  const zenLAdjustments = {
    noteAdjustments: [
      { note: 'G3', cents: 10, vessel: 'SINGLE', description: 'Minor 3rd interval (G3) needs to be raised by 10 cents' },
      { note: 'A3', cents: 10, vessel: 'SINGLE', description: 'Perfect 4th interval (A3) needs to be raised by 10 cents' },
      { note: 'D4', cents: 10, vessel: 'SINGLE', description: 'Minor 7th interval (D4) needs to be raised by 10 cents' }
    ],
    intervalAdjustments: [
      { interval: 'minor3rd', cents: 10, description: 'All minor 3rd intervals raised by 10 cents' },
      { interval: 'perfect4th', cents: 10, description: 'All perfect 4th intervals raised by 10 cents' },
      { interval: 'minor7th', cents: 10, description: 'All minor 7th intervals raised by 10 cents' }
    ]
  };
  
  // OVA flute data
  // OVA is typically tuned in A minor (Am4)
  // Pattern: root, minor 3rd, 4th, 5th, minor 7th, octave
  const ovaKeys = ['Am4', 'G#m4', 'Gm4', 'F#m4', 'Fm4'];
  
  // Define OVA notes for Am4
  const ovaAm4Notes: VesselNotes = {
    SINGLE: ['A4', 'C5', 'D5', 'E5', 'G5', 'A5']
  };
  
  // D#m4 is explicitly included in the innatoKeys array
  
  return [
    {
      id: 'INNATO',
      name: 'INNATO',
      description: 'A three-chambered vessel flute tuned to a minor scale',
      vessels: 3,
      variants: innatoKeys.map(key => {
        return {
          key,
          defaultFrequency: '440 Hz',
          notes: 
            key === 'Cm4' ? innatoCm4Notes : 
            key === 'D#m4' ? innatoDsharpM4Notes : 
            key === 'Ebm4' ? innatoEbm4Notes : // Handle Eb notation as well
            {}, // Other keys will be calculated algorithmically
          noteAdjustments: 
            key === 'Cm4' ? innatoCm4Adjustments.noteAdjustments :
            key === 'D#m4' ? innatoDsharpM4Adjustments.noteAdjustments :
            key === 'Ebm4' ? innatoEbm4Adjustments.noteAdjustments :
            [{ note: 'Bb3', cents: 10, vessel: 'LEFT', description: 'Bb3 common adjustment across all Innato flutes' }],
          intervalAdjustments:
            key === 'Cm4' ? innatoCm4Adjustments.intervalAdjustments :
            key === 'D#m4' ? innatoDsharpM4Adjustments.intervalAdjustments :
            key === 'Ebm4' ? innatoEbm4Adjustments.intervalAdjustments :
            [
              { interval: 'minor3rd', cents: 10, description: 'All minor 3rd intervals raised by 10 cents' },
              { interval: 'perfect4th', cents: 10, description: 'All perfect 4th intervals raised by 10 cents' },
              { interval: 'minor7th', cents: 10, description: 'All minor 7th intervals raised by 10 cents' }
            ]
        };
      }),
      defaultKey: 'Cm4',
      availableFrequencies: FREQUENCIES
    },
    {
      id: 'NATEY',
      name: 'NATEY',
      description: 'A single vessel flute with 8 notes in minor scale',
      vessels: 1,
      variants: nateyKeys.map(key => ({
        key,
        defaultFrequency: '440 Hz',
        notes: key === 'Cm4' ? nateyCm4Notes : {} // Only example key defined for now
      })),
      defaultKey: 'Am4',
      availableFrequencies: FREQUENCIES
    },
    {
      id: 'DOUBLE',
      name: 'DOUBLE',
      description: 'A dual-chamber flute with identical notes in each chamber',
      vessels: 2,
      variants: doubleKeys.map(key => ({
        key,
        defaultFrequency: '440 Hz',
        notes: key === 'Cm4' ? doubleCm4Notes : {} // Only example key defined for now
      })),
      defaultKey: 'C#m4',
      availableFrequencies: FREQUENCIES
    },
    {
      id: 'ZEN_M',
      name: 'ZEN M',
      description: 'A single-vessel flute tuned to G minor',
      vessels: 1,
      variants: [
        {
          key: 'Gm3',
          defaultFrequency: '440 Hz',
          notes: zenMNotes,
          noteAdjustments: zenMAdjustments.noteAdjustments,
          intervalAdjustments: zenMAdjustments.intervalAdjustments
        }
      ],
      defaultKey: 'Gm3',
      availableFrequencies: FREQUENCIES
    },
    {
      id: 'ZEN_L',
      name: 'ZEN L',
      description: 'A single-vessel flute tuned to E minor',
      vessels: 1,
      variants: [
        {
          key: 'Em3',
          defaultFrequency: '440 Hz',
          notes: zenLNotes,
          noteAdjustments: zenLAdjustments.noteAdjustments,
          intervalAdjustments: zenLAdjustments.intervalAdjustments
        }
      ],
      defaultKey: 'Em3',
      availableFrequencies: FREQUENCIES
    },
    {
      id: 'OVA',
      name: 'OVA',
      description: 'A single-vessel flute with a higher pitch range',
      vessels: 1,
      variants: ovaKeys.map(key => ({
        key,
        defaultFrequency: '440 Hz',
        notes: key === 'Am4' ? ovaAm4Notes : {} // Only example key defined for now
      })),
      defaultKey: 'Am4',
      availableFrequencies: FREQUENCIES
    }
  ];
}

/**
 * Helper functions to get commonly needed information
 */

// Get all available keys for a particular instrument type
export function getKeysForInstrumentType(instrumentType: FluteType): string[] {
  const instruments = getInstrumentReferences();
  const instrument = instruments.find(inst => inst.id === instrumentType);
  if (!instrument) return [];
  return instrument.variants.map(variant => variant.key);
}

// Get the default key for an instrument type
export function getDefaultKeyForInstrumentType(instrumentType: FluteType): string {
  const instruments = getInstrumentReferences();
  const instrument = instruments.find(inst => inst.id === instrumentType);
  if (!instrument) return 'Cm4'; // Fallback
  return instrument.defaultKey;
}

// Get vessel notes based on instrument type, key, and vessel/chamber
export function getVesselNotesForKey(
  instrumentType: FluteType,
  key: string,
  vessel: keyof VesselNotes
): string[] {
  // Special case for D#m4/Ebm4 - handle both notations explicitly
  if (key === 'Ebm4') {
    key = 'D#m4';
  }
  
  const instruments = getInstrumentReferences();
  const instrument = instruments.find(inst => inst.id === instrumentType);
  if (!instrument) {
    return [];
  }
  
  const variant = instrument.variants.find(v => v.key === key);
  
  if (!variant || !variant.notes || !variant.notes[vessel]) {
    // If the specific notes aren't defined yet, calculate them algorithmically
    return calculateNotesForVessel(instrumentType, key, vessel);
  }
  
  return variant.notes[vessel] || [];
}

/**
 * Algorithmic note calculation for keys that don't have specific note mappings
 */
function calculateNotesForVessel(
  instrumentType: FluteType,
  key: string,
  vessel: keyof VesselNotes
): string[] {
  // Remove the 'm' from the minor indicator for our calculations
  const cleanKey = key.replace(/m/g, '');
  
  // Parse the base note and octave
  const match = cleanKey.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) {
    return [];
  }
  
  const baseNote = match[1];
  const octave = parseInt(match[2], 10);
  
  // Semitone values for notes (C = 0)
  const noteValues: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 
    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 
    'A#': 10, 'Bb': 10, 'B': 11
  };
  
  // Get the semitone value of the base note
  const baseSemitone = noteValues[baseNote];
  if (baseSemitone === undefined) return [];
  
  let intervals: number[] = [];
  
  // Special handling for INNATO flutes by key
  // E3 (lowest key)
  if (instrumentType === 'INNATO' && cleanKey === 'E3') {
    if (vessel === 'LEFT') {
      return ['B2', 'D3', 'E3', 'F#3'];
    } else if (vessel === 'RIGHT') {
      return ['E3', 'G3', 'A3', 'B3'];
    } else if (vessel === 'FRONT') {
      return ['B3', 'D4', 'E4', 'F#4'];
    }
  }
  
  // F3
  if (instrumentType === 'INNATO' && cleanKey === 'F3') {
    if (vessel === 'LEFT') {
      return ['C3', 'Eb3', 'F3', 'G3'];
    } else if (vessel === 'RIGHT') {
      return ['F3', 'Ab3', 'Bb3', 'C4'];
    } else if (vessel === 'FRONT') {
      return ['C4', 'Eb4', 'F4', 'G4'];
    }
  }
  
  // F#3/Gb3
  if (instrumentType === 'INNATO' && (cleanKey === 'F#3' || cleanKey === 'Gb3')) {
    if (vessel === 'LEFT') {
      return ['C#3', 'E3', 'F#3', 'G#3'];
    } else if (vessel === 'RIGHT') {
      return ['F#3', 'A3', 'B3', 'C#4'];
    } else if (vessel === 'FRONT') {
      return ['C#4', 'E4', 'F#4', 'G#4'];
    }
  }
  
  // G3
  if (instrumentType === 'INNATO' && cleanKey === 'G3') {
    if (vessel === 'LEFT') {
      return ['D3', 'F3', 'G3', 'A3'];
    } else if (vessel === 'RIGHT') {
      return ['G3', 'Bb3', 'C4', 'D4'];
    } else if (vessel === 'FRONT') {
      return ['D4', 'F4', 'G4', 'A4'];
    }
  }
  
  // G#3/Ab3
  if (instrumentType === 'INNATO' && (cleanKey === 'G#3' || cleanKey === 'Ab3')) {
    if (vessel === 'LEFT') {
      return ['Eb3', 'Gb3', 'Ab3', 'Bb3'];
    } else if (vessel === 'RIGHT') {
      return ['Ab3', 'B3', 'Db4', 'Eb4'];
    } else if (vessel === 'FRONT') {
      return ['Eb4', 'Gb4', 'Ab4', 'Bb4'];
    }
  }
  
  // A3
  if (instrumentType === 'INNATO' && cleanKey === 'A3') {
    if (vessel === 'LEFT') {
      return ['E3', 'G3', 'A3', 'B3'];
    } else if (vessel === 'RIGHT') {
      return ['A3', 'C4', 'D4', 'E4'];
    } else if (vessel === 'FRONT') {
      return ['E4', 'G4', 'A4', 'B4'];
    }
  }
  
  // Bb3/A#3
  if (instrumentType === 'INNATO' && (cleanKey === 'Bb3' || cleanKey === 'A#3')) {
    if (vessel === 'LEFT') {
      return ['F3', 'Ab3', 'Bb3', 'C4'];
    } else if (vessel === 'RIGHT') {
      return ['Bb3', 'Db4', 'Eb4', 'F4'];
    } else if (vessel === 'FRONT') {
      return ['F4', 'Ab4', 'Bb4', 'C5'];
    }
  }
  
  // B3
  if (instrumentType === 'INNATO' && cleanKey === 'B3') {
    if (vessel === 'LEFT') {
      return ['F#3', 'A3', 'B3', 'C#4'];
    } else if (vessel === 'RIGHT') {
      return ['B3', 'D4', 'E4', 'F#4'];
    } else if (vessel === 'FRONT') {
      return ['F#4', 'A4', 'B4', 'C#5'];
    }
  }
  
  // C4 (base reference key)
  if (instrumentType === 'INNATO' && cleanKey === 'C4') {
    if (vessel === 'LEFT') {
      return ['G3', 'Bb3', 'C4', 'D4'];
    } else if (vessel === 'RIGHT') {
      return ['C4', 'Eb4', 'F4', 'G4'];
    } else if (vessel === 'FRONT') {
      return ['G4', 'Bb4', 'C5', 'D5'];
    }
  }
  
  // C#4/Db4
  if (instrumentType === 'INNATO' && (cleanKey === 'C#4' || cleanKey === 'Db4')) {
    if (vessel === 'LEFT') {
      return ['Ab3', 'B3', 'Db4', 'Eb4'];
    } else if (vessel === 'RIGHT') {
      return ['Db4', 'E4', 'F#4', 'Ab4'];
    } else if (vessel === 'FRONT') {
      return ['Ab4', 'B4', 'Db5', 'Eb5'];
    }
  }
  
  // D4
  if (instrumentType === 'INNATO' && cleanKey === 'D4') {
    if (vessel === 'LEFT') {
      return ['A3', 'C4', 'D4', 'E4'];
    } else if (vessel === 'RIGHT') {
      return ['D4', 'F4', 'G4', 'A4'];
    } else if (vessel === 'FRONT') {
      return ['A4', 'C5', 'D5', 'E5'];
    }
  }
  
  // D#4/Eb4
  if (instrumentType === 'INNATO' && (cleanKey === 'D#4' || cleanKey === 'Eb4')) {
    if (vessel === 'LEFT') {
      return ['Bb3', 'Db4', 'Eb4', 'F4']; 
    } else if (vessel === 'RIGHT') {
      return ['Eb4', 'Gb4', 'Ab4', 'Bb4'];
    } else if (vessel === 'FRONT') {
      return ['Bb4', 'Db5', 'Eb5', 'F5'];
    }
  }
  
  // E4 (highest key)
  if (instrumentType === 'INNATO' && cleanKey === 'E4') {
    if (vessel === 'LEFT') {
      return ['B3', 'D4', 'E4', 'F#4'];
    } else if (vessel === 'RIGHT') {
      return ['E4', 'G4', 'A4', 'B4'];
    } else if (vessel === 'FRONT') {
      return ['B4', 'D5', 'E5', 'F#5'];
    }
  }
  
  // Define intervals based on instrument type and vessel for other keys
  if (instrumentType === 'INNATO') {
    if (vessel === 'LEFT') {
      // Intervals consistent with C4 LEFT vessel pattern:
      // Perfect 5th below, minor 3rd below, root, major 2nd above
      intervals = [-7, -3, 0, 2]; 
    } else if (vessel === 'RIGHT') {
      // Intervals consistent with C4 RIGHT vessel pattern:
      // Root, minor 3rd above, perfect 4th above, perfect 5th above
      intervals = [0, 3, 5, 7]; 
    } else if (vessel === 'FRONT') {
      // FRONT vessel is the same as LEFT vessel but one octave higher
      intervals = [5, 9, 12, 14];
    }
  } else if (instrumentType === 'NATEY' && vessel === 'SINGLE') {
    // Natey pattern: root, minor 3rd, 4th, 5th, minor 7th, octave, 9th, minor 10th
    intervals = [0, 3, 5, 7, 10, 12, 14, 15];
  } else if (instrumentType === 'DOUBLE' && (vessel === 'CHAMBER1' || vessel === 'CHAMBER2')) {
    // Double flute pattern: root, minor 3rd, 4th, 5th, minor 7th, octave
    intervals = [0, 3, 5, 7, 10, 12];
  } else if ((instrumentType === 'ZEN_M' || instrumentType === 'ZEN_L') && vessel === 'SINGLE') {
    // ZEN flute pattern: root, minor 3rd, 4th, 5th, minor 7th, octave
    intervals = [0, 3, 5, 7, 10, 12];
  } else if (instrumentType === 'OVA' && vessel === 'SINGLE') {
    // OVA flute pattern: root, minor 3rd, 4th, 5th, minor 7th, octave
    intervals = [0, 3, 5, 7, 10, 12];
  }
  
  // Calculate the notes based on intervals
  return intervals.map(interval => {
    // Calculate the new semitone value (0-11) with proper handling of negative intervals
    let totalSemitones = baseSemitone + interval;
    
    // Handle negative semitone values for proper modulo
    let newSemitone = ((totalSemitones % 12) + 12) % 12;
    
    // Calculate the octave adjustment with correct handling of negative intervals
    let octaveAdjust = Math.floor(totalSemitones / 12);
    if (totalSemitones < 0 && totalSemitones % 12 !== 0) {
      octaveAdjust -= 1; // Adjust for negative intervals that don't divide evenly
    }
    
    let newOctave = octave + octaveAdjust;
    
    // Find the note name for this semitone - prefer sharp notation except for Bb
    let noteName;
    
    // Special case for Bb (use flat notation)
    if (newSemitone === 10) {
      noteName = 'Bb';
    } else {
      // For all other notes, prefer sharp notation
      const sharpNoteMap: Record<number, string> = {
        0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 
        5: 'F', 6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 11: 'B'
      };
      noteName = sharpNoteMap[newSemitone];
    }
    
    if (!noteName) return '';
    return `${noteName}${newOctave}`;
  });
}

/**
 * Get note adjustment in cents for a specific instrument, key, and note
 * Returns the cents adjustment or 0 if no specific adjustment is found
 */
export function getNoteAdjustment(
  instrumentType: FluteType,
  key: string,
  note: string,
  vessel?: string
): number {
  // Handle D#m4/Ebm4 equivalence
  if (key === 'Ebm4') {
    key = 'D#m4';
  }
  
  const instruments = getInstrumentReferences();
  const instrument = instruments.find(inst => inst.id === instrumentType);
  if (!instrument) return 0;
  
  const variant = instrument.variants.find(v => v.key === key);
  if (!variant || !variant.noteAdjustments) return 0;
  
  // First try to find a vessel-specific adjustment
  if (vessel) {
    const specificAdjustment = variant.noteAdjustments.find(
      adj => adj.note === note && adj.vessel === vessel
    );
    if (specificAdjustment) return specificAdjustment.cents;
  }
  
  // If no vessel is specified or no vessel-specific adjustment found, 
  // try to find a generic note adjustment
  const genericAdjustment = variant.noteAdjustments.find(
    adj => adj.note === note && !adj.vessel
  );
  
  return genericAdjustment ? genericAdjustment.cents : 0;
}

/**
 * Get interval adjustment in cents for a specific instrument and key
 * Returns the cents adjustment or 0 if no specific adjustment is found
 */
export function getIntervalAdjustment(
  instrumentType: FluteType,
  key: string,
  interval: string
): number {
  // Handle D#m4/Ebm4 equivalence
  if (key === 'Ebm4') {
    key = 'D#m4';
  }
  
  const instruments = getInstrumentReferences();
  const instrument = instruments.find(inst => inst.id === instrumentType);
  if (!instrument) return 0;
  
  const variant = instrument.variants.find(v => v.key === key);
  if (!variant || !variant.intervalAdjustments) return 0;
  
  const adjustment = variant.intervalAdjustments.find(
    adj => adj.interval === interval
  );
  
  return adjustment ? adjustment.cents : 0;
}

/**
 * Get all note adjustments for a specific instrument and key
 * Returns all note adjustment objects for display or processing
 */
export function getAllNoteAdjustments(
  instrumentType: FluteType,
  key: string
): NoteAdjustment[] {
  // Handle D#m4/Ebm4 equivalence
  if (key === 'Ebm4') {
    key = 'D#m4';
  }
  
  const instruments = getInstrumentReferences();
  const instrument = instruments.find(inst => inst.id === instrumentType);
  if (!instrument) return [];
  
  const variant = instrument.variants.find(v => v.key === key);
  if (!variant || !variant.noteAdjustments) return [];
  
  return [...variant.noteAdjustments];
}

/**
 * Get all interval adjustments for a specific instrument and key
 * Returns all interval adjustment objects for display or processing
 */
export function getAllIntervalAdjustments(
  instrumentType: FluteType,
  key: string
): IntervalAdjustment[] {
  // Handle D#m4/Ebm4 equivalence
  if (key === 'Ebm4') {
    key = 'D#m4';
  }
  
  const instruments = getInstrumentReferences();
  const instrument = instruments.find(inst => inst.id === instrumentType);
  if (!instrument) return [];
  
  const variant = instrument.variants.find(v => v.key === key);
  if (!variant || !variant.intervalAdjustments) return [];
  
  return [...variant.intervalAdjustments];
}

/**
 * Gets a human-readable description of all adjustments for an instrument/key
 * Useful for displaying adjustment info in the UI
 */
export function getAdjustmentDescriptions(
  instrumentType: FluteType,
  key: string
): string[] {
  const noteAdjustments = getAllNoteAdjustments(instrumentType, key);
  const intervalAdjustments = getAllIntervalAdjustments(instrumentType, key);
  
  const descriptions: string[] = [];
  
  // Add note adjustment descriptions
  noteAdjustments.forEach(adj => {
    const vesselInfo = adj.vessel ? ` on ${adj.vessel} vessel` : '';
    descriptions.push(`${adj.note}${vesselInfo}: ${adj.cents > 0 ? '+' : ''}${adj.cents} cents${adj.description ? ` (${adj.description})` : ''}`);
  });
  
  // Add interval adjustment descriptions
  intervalAdjustments.forEach(adj => {
    descriptions.push(`${adj.interval}: ${adj.cents > 0 ? '+' : ''}${adj.cents} cents${adj.description ? ` (${adj.description})` : ''}`);
  });
  
  return descriptions;
}

/**
 * Calculate note frequency adjusted for selected concert pitch
 * and including any cents adjustments
 */
export function getNoteFrequency(
  note: string, 
  frequencyOption?: string, 
  instrumentType?: FluteType,
  key?: string,
  vessel?: string
): number {
  // Default to 440Hz if no frequency option is provided
  const freqOption = frequencyOption || '440 Hz';
  
  // Get base frequency (remove Hz and trim)
  const baseFrequency = parseInt(freqOption.replace(/\s*Hz/, ''), 10) || 440;
  
  // Get the standard frequency at A4=440Hz
  const stdFrequency = NOTE_FREQUENCIES[note] || 0;
  
  // Calculate the base frequency adjustment for the selected concert pitch
  let frequency = stdFrequency * (baseFrequency / 440);
  
  // Apply cents adjustment if instrument context is provided
  if (instrumentType && key) {
    const centsAdjustment = getNoteAdjustment(instrumentType, key, note, vessel);
    if (centsAdjustment !== 0) {
      // Apply cents adjustment (1 cent = 1/100 of a semitone, where a semitone = 2^(1/12) frequency ratio)
      frequency *= Math.pow(2, centsAdjustment / 1200);
    }
  }
  
  return frequency;
}

/**
 * Determines if a note has any special tuning adjustments 
 * Useful for highlighting adjusted notes in the UI
 */
export function hasNoteAdjustment(
  instrumentType: FluteType,
  key: string,
  note: string,
  vessel?: string
): boolean {
  return getNoteAdjustment(instrumentType, key, note, vessel) !== 0;
}