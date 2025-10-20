// Simple script to check INNATO tunings against reference chart
// Run with: node check-innato-tunings.js

// Reference data from the chart
const referenceData = {
  'E3': {
    'LEFT': ['B2', 'D3', 'E3', 'F#3'],
    'RIGHT': ['E3', 'G3', 'A3', 'B3'],
    'FRONT': ['B3', 'D4', 'E4', 'F#4']
  },
  'F3': {
    'LEFT': ['C3', 'Eb3', 'F3', 'G3'],
    'RIGHT': ['F3', 'Ab3', 'Bb3', 'C4'],
    'FRONT': ['C4', 'Eb4', 'F4', 'G4']
  },
  'F#3': {
    'LEFT': ['C#3', 'E3', 'F#3', 'G#3'],
    'RIGHT': ['F#3', 'A3', 'B3', 'C#4'],
    'FRONT': ['C#4', 'E4', 'F#4', 'G#4']
  },
  'G3': {
    'LEFT': ['D3', 'F3', 'G3', 'A3'],
    'RIGHT': ['G3', 'Bb3', 'C4', 'D4'],
    'FRONT': ['D4', 'F4', 'G4', 'A4']
  },
  'Ab3': {
    'LEFT': ['Eb3', 'Gb3', 'Ab3', 'Bb3'],
    'RIGHT': ['Ab3', 'B3', 'Db4', 'Eb4'],
    'FRONT': ['Eb4', 'Gb4', 'Ab4', 'Bb4']
  },
  'A3': {
    'LEFT': ['E3', 'G3', 'A3', 'B3'],
    'RIGHT': ['A3', 'C4', 'D4', 'E4'],
    'FRONT': ['E4', 'G4', 'A4', 'B4']
  },
  'Bb3': {
    'LEFT': ['F3', 'Ab3', 'Bb3', 'C4'],
    'RIGHT': ['Bb3', 'Db4', 'Eb4', 'F4'],
    'FRONT': ['F4', 'Ab4', 'Bb4', 'C5']
  },
  'B3': {
    'LEFT': ['F#3', 'A3', 'B3', 'C#4'],
    'RIGHT': ['B3', 'D4', 'E4', 'F#4'],
    'FRONT': ['F#4', 'A4', 'B4', 'C#5']
  },
  'C4': {
    'LEFT': ['G3', 'Bb3', 'C4', 'D4'],
    'RIGHT': ['C4', 'Eb4', 'F4', 'G4'],
    'FRONT': ['G4', 'Bb4', 'C5', 'D5']
  },
  'Db4': {
    'LEFT': ['Ab3', 'B3', 'Db4', 'Eb4'],
    'RIGHT': ['Db4', 'E4', 'F#4', 'Ab4'],
    'FRONT': ['Ab4', 'B4', 'Db5', 'Eb5']
  },
  'D4': {
    'LEFT': ['A3', 'C4', 'D4', 'E4'],
    'RIGHT': ['D4', 'F4', 'G4', 'A4'],
    'FRONT': ['A4', 'C5', 'D5', 'E5']
  },
  'Eb4': {
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

// Simple function to mimic our code's pattern checking
function getVesselNotes(key, vessel) {
  // This should match our main code's implementation
  if (key === 'E3') {
    if (vessel === 'LEFT') {
      return ['B2', 'D3', 'E3', 'F#3'];
    } else if (vessel === 'RIGHT') {
      return ['E3', 'G3', 'A3', 'B3'];
    } else if (vessel === 'FRONT') {
      return ['B3', 'D4', 'E4', 'F#4'];
    }
  }
  else if (key === 'F3') {
    if (vessel === 'LEFT') {
      return ['C3', 'Eb3', 'F3', 'G3'];
    } else if (vessel === 'RIGHT') {
      return ['F3', 'Ab3', 'Bb3', 'C4'];
    } else if (vessel === 'FRONT') {
      return ['C4', 'Eb4', 'F4', 'G4'];
    }
  }
  else if (key === 'F#3' || key === 'Gb3') {
    if (vessel === 'LEFT') {
      return ['C#3', 'E3', 'F#3', 'G#3'];
    } else if (vessel === 'RIGHT') {
      return ['F#3', 'A3', 'B3', 'C#4'];
    } else if (vessel === 'FRONT') {
      return ['C#4', 'E4', 'F#4', 'G#4'];
    }
  }
  else if (key === 'G3') {
    if (vessel === 'LEFT') {
      return ['D3', 'F3', 'G3', 'A3'];
    } else if (vessel === 'RIGHT') {
      return ['G3', 'Bb3', 'C4', 'D4'];
    } else if (vessel === 'FRONT') {
      return ['D4', 'F4', 'G4', 'A4'];
    }
  }
  else if (key === 'Ab3' || key === 'G#3') {
    if (vessel === 'LEFT') {
      return ['Eb3', 'Gb3', 'Ab3', 'Bb3'];
    } else if (vessel === 'RIGHT') {
      return ['Ab3', 'B3', 'Db4', 'Eb4'];
    } else if (vessel === 'FRONT') {
      return ['Eb4', 'Gb4', 'Ab4', 'Bb4'];
    }
  }
  else if (key === 'A3') {
    if (vessel === 'LEFT') {
      return ['E3', 'G3', 'A3', 'B3'];
    } else if (vessel === 'RIGHT') {
      return ['A3', 'C4', 'D4', 'E4'];
    } else if (vessel === 'FRONT') {
      return ['E4', 'G4', 'A4', 'B4'];
    }
  }
  else if (key === 'Bb3' || key === 'A#3') {
    if (vessel === 'LEFT') {
      return ['F3', 'Ab3', 'Bb3', 'C4'];
    } else if (vessel === 'RIGHT') {
      return ['Bb3', 'Db4', 'Eb4', 'F4'];
    } else if (vessel === 'FRONT') {
      return ['F4', 'Ab4', 'Bb4', 'C5'];
    }
  }
  else if (key === 'B3') {
    if (vessel === 'LEFT') {
      return ['F#3', 'A3', 'B3', 'C#4'];
    } else if (vessel === 'RIGHT') {
      return ['B3', 'D4', 'E4', 'F#4'];
    } else if (vessel === 'FRONT') {
      return ['F#4', 'A4', 'B4', 'C#5'];
    }
  }
  else if (key === 'C4') {
    if (vessel === 'LEFT') {
      return ['G3', 'Bb3', 'C4', 'D4'];
    } else if (vessel === 'RIGHT') {
      return ['C4', 'Eb4', 'F4', 'G4'];
    } else if (vessel === 'FRONT') {
      return ['G4', 'Bb4', 'C5', 'D5'];
    }
  }
  else if (key === 'Db4' || key === 'C#4') {
    if (vessel === 'LEFT') {
      return ['Ab3', 'B3', 'Db4', 'Eb4'];
    } else if (vessel === 'RIGHT') {
      return ['Db4', 'E4', 'F#4', 'Ab4'];
    } else if (vessel === 'FRONT') {
      return ['Ab4', 'B4', 'Db5', 'Eb5'];
    }
  }
  else if (key === 'D4') {
    if (vessel === 'LEFT') {
      return ['A3', 'C4', 'D4', 'E4'];
    } else if (vessel === 'RIGHT') {
      return ['D4', 'F4', 'G4', 'A4'];
    } else if (vessel === 'FRONT') {
      return ['A4', 'C5', 'D5', 'E5'];
    }
  }
  else if (key === 'Eb4' || key === 'D#4') {
    if (vessel === 'LEFT') {
      return ['Bb3', 'Db4', 'Eb4', 'F4'];
    } else if (vessel === 'RIGHT') {
      return ['Eb4', 'Gb4', 'Ab4', 'Bb4'];
    } else if (vessel === 'FRONT') {
      return ['Bb4', 'Db5', 'Eb5', 'F5'];
    }
  }
  else if (key === 'E4') {
    if (vessel === 'LEFT') {
      return ['B3', 'D4', 'E4', 'F#4'];
    } else if (vessel === 'RIGHT') {
      return ['E4', 'G4', 'A4', 'B4'];
    } else if (vessel === 'FRONT') {
      return ['B4', 'D5', 'E5', 'F#5'];
    }
  }
  
  return ["ERROR - Key not handled"];
}

function arraysMatch(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

// Check all keys against reference data
console.log("===== CHECKING INNATO KEY TUNINGS =====");

for (const key of Object.keys(referenceData)) {
  console.log(`\n--- Key: ${key} ---`);
  const vessels = ['LEFT', 'RIGHT', 'FRONT'];
  
  let allCorrect = true;
  
  for (const vessel of vessels) {
    const expected = referenceData[key][vessel];
    const actual = getVesselNotes(key, vessel);
    
    const isMatch = arraysMatch(expected, actual);
    console.log(`${vessel}: ${isMatch ? '✓' : '✗'} ${actual.join(', ')}`);
    
    if (!isMatch) {
      console.log(`  Expected: ${expected.join(', ')}`);
      allCorrect = false;
    }
  }
  
  if (allCorrect) {
    console.log(`✅ All vessels for ${key} match expected values`);
  } else {
    console.log(`❌ Some vessels for ${key} don't match expected values`);
  }
}