const fs = require('fs');
const filePath = 'client/src/pages/worksheet.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// Replace the MoldNamePopover usage with direct CombinedInstrumentTuningBadge
content = content.replace(/<MoldNamePopover[^>]*>\s*<CombinedInstrumentTuningBadge([^>]*)>\s*<\/CombinedInstrumentTuningBadge>\s*<\/MoldNamePopover>/g, 
  '<CombinedInstrumentTuningBadge$1></CombinedInstrumentTuningBadge>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed worksheet.tsx');
