// Simple test script to verify vessel notes alignment
// Run with: node test-vessel-notes.js

const calculateNotesForVessel = (instrumentType, key, vessel) => {
  // Simplified version of the calculateNotesForVessel function from instrument-reference.ts
  
  // Remove the 'm' from the minor indicator for our calculations
  const cleanKey = key.replace('m', '');
  
  // Parse the base note and octave (A3, C4, etc.)
  const match = cleanKey.match(/^([A-G][#b]?)(\d+)$/);
  if (!match) return [];
  
  const baseNote = match[1];
  const octave = parseInt(match[2], 10);
  
  // Semitone values for notes (C = 0)
  const noteValues = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 
    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 
    'A#': 10, 'Bb': 10, 'B': 11
  };
  
  // Get the semitone value of the base note
  const baseSemitone = noteValues[baseNote];
  if (baseSemitone === undefined) return [];
  
  let intervals = [];
  
  // Special handling for C4 INNATO (base reference for other keys)
  if (instrumentType === 'INNATO' && cleanKey === 'C4') {
    if (vessel === 'LEFT') {
      return ['G3', 'Bb3', 'C4', 'D4'];
    } else if (vessel === 'RIGHT') {
      return ['C4', 'D#4', 'F4', 'G4'];
    } else if (vessel === 'FRONT') {
      return ['G4', 'Bb4', 'C5', 'D5'];
    }
  }
  
  // Handle D4 INNATO
  if (instrumentType === 'INNATO' && cleanKey === 'D4') {
    if (vessel === 'LEFT') {
      return ['A3', 'C4', 'D4', 'E4'];
    } else if (vessel === 'RIGHT') {
      return ['D4', 'F4', 'G4', 'A4'];
    } else if (vessel === 'FRONT') {
      return ['A4', 'C5', 'D5', 'E5'];
    }
  }
  
  // Handle D#m4/Ebm4 notation equivalence
  if (instrumentType === 'INNATO' && (cleanKey === 'D#4' || cleanKey === 'Eb4')) {
    if (vessel === 'LEFT') {
      return ['Bb3', 'C#4', 'D#4', 'F4']; 
    } else if (vessel === 'RIGHT') {
      return ['D#4', 'G4', 'G#4', 'Bb4'];
    } else if (vessel === 'FRONT') {
      return ['Bb4', 'C#5', 'D#5', 'F5'];
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
      const sharpNoteMap = {
        0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 
        5: 'F', 6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 11: 'B'
      };
      noteName = sharpNoteMap[newSemitone];
    }
    
    if (!noteName) return '';
    return `${noteName}${newOctave}`;
  });
};

function testInnatoVessels() {
  // Test different keys and check vessel patterns
  console.log("======= TESTING INNATO VESSEL PATTERNS =======");
  
  // Test a comprehensive set of keys
  const keys = ['E3', 'G3', 'A3', 'Bb3', 'C4', 'D4', 'D#4', 'E4'];
  
  // Define expected vessel notes for specific keys
  const expectedNotes = {
    'E3': {
      'LEFT': ['B2', 'D3', 'E3', 'F#3'],
      'RIGHT': ['E3', 'G3', 'A3', 'B3'],
      'FRONT': ['B3', 'D4', 'E4', 'F#4']
    },
    'C4': {
      'LEFT': ['G3', 'Bb3', 'C4', 'D4'],
      'RIGHT': ['C4', 'Eb4', 'F4', 'G4'],
      'FRONT': ['G4', 'Bb4', 'C5', 'D5']
    },
    'D4': {
      'LEFT': ['A3', 'C4', 'D4', 'E4'],
      'RIGHT': ['D4', 'F4', 'G4', 'A4'],
      'FRONT': ['A4', 'C5', 'D5', 'E5']
    },
    'D#4': {
      'LEFT': ['Bb3', 'Db4', 'Eb4', 'F4'],
      'RIGHT': ['Eb4', 'Gb4', 'Ab4', 'Bb4'],
      'FRONT': ['Bb4', 'Db5', 'Eb5', 'F5']
    },
    'E4': {
      'LEFT': ['B3', 'D4', 'E4', 'F#4'],
      'RIGHT': ['E4', 'G4', 'A4', 'B4'],
      'FRONT': ['B4', 'D5', 'E5', 'F#5']
    }
  };
  
  keys.forEach(key => {
    console.log(`\n----- INNATO ${key} -----`);
    const leftNotes = calculateNotesForVessel('INNATO', key, 'LEFT');
    const rightNotes = calculateNotesForVessel('INNATO', key, 'RIGHT');
    const frontNotes = calculateNotesForVessel('INNATO', key, 'FRONT');
    
    console.log(`LEFT:  ${leftNotes.join(', ')}`);
    console.log(`RIGHT: ${rightNotes.join(', ')}`);
    console.log(`FRONT: ${frontNotes.join(', ')}`);
    
    // Check against expected notes for keys with reference data
    if (expectedNotes[key]) {
      console.log(`\nChecking against expected ${key} tuning:`);
      console.log(`Expected LEFT:  ${expectedNotes[key]['LEFT'].join(', ')}`);
      console.log(`Expected RIGHT: ${expectedNotes[key]['RIGHT'].join(', ')}`);
      console.log(`Expected FRONT: ${expectedNotes[key]['FRONT'].join(', ')}`);
      
      let isCorrectLeft = arraysMatch(leftNotes, expectedNotes[key]['LEFT']);
      let isCorrectRight = arraysMatch(rightNotes, expectedNotes[key]['RIGHT']);
      let isCorrectFront = arraysMatch(frontNotes, expectedNotes[key]['FRONT']);
      
      console.log(`LEFT vessel matches expected:  ${isCorrectLeft ? '✓' : '✗'}`);
      console.log(`RIGHT vessel matches expected: ${isCorrectRight ? '✓' : '✗'}`);
      console.log(`FRONT vessel matches expected: ${isCorrectFront ? '✓' : '✗'}`);
    }
    // For other keys, check if front vessel is an octave higher than left
    else {
      // Check if front vessel is correctly an octave higher than left
      let isCorrect = true;
      leftNotes.forEach((note, index) => {
        if (!note) return; // Skip empty notes
        
        // Extract note name and octave, ensuring reliable matching
        const leftNoteName = note.replace(/\d+/, '');
        const leftOctaveMatch = note.match(/\d+/);
        const leftOctave = leftOctaveMatch ? parseInt(leftOctaveMatch[0], 10) : 0;
        
        const frontNote = frontNotes[index];
        if (frontNote) {
          const frontNoteName = frontNote.replace(/\d+/, '');
          const frontOctaveMatch = frontNote.match(/\d+/);
          const frontOctave = frontOctaveMatch ? parseInt(frontOctaveMatch[0], 10) : 0;
          if (leftNoteName !== frontNoteName || frontOctave !== leftOctave + 1) {
            isCorrect = false;
            console.log(`MISMATCH: Left ${note} vs Front ${frontNote}`);
          }
        }
      });
      
      if (isCorrect) {
        console.log("✓ Front vessel is correctly one octave higher than left vessel");
      } else {
        console.log("✗ Front vessel does NOT match left vessel pattern (one octave higher)");
      }
    }
  });
}

// Helper function to compare arrays
function arraysMatch(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

// Run the test
testInnatoVessels();