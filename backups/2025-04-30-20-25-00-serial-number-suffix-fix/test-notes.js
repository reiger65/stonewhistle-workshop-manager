// Simple test script to check note calculations
const { calculateNotesForVessel } = require('./shared/instrument-reference');

// Test A3 tuning for INNATO
console.log("INNATO A3 Left vessel notes:");
const leftVesselA3 = calculateNotesForVessel('INNATO', 'A3', 'LEFT');
console.log(leftVesselA3);

// Test C4 tuning for INNATO
console.log("\nINNATO C4 Left vessel notes:");
const leftVesselC4 = calculateNotesForVessel('INNATO', 'C4', 'LEFT');
console.log(leftVesselC4);

// Test both for comparison
console.log("\nComparison of vessels:");
console.log("A3 LEFT: ", leftVesselA3);
console.log("C4 LEFT: ", leftVesselC4);