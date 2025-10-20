// Dit script lost het probleem op waarbij ordergetallen verkeerd worden weergegeven in de MoldNamePopover
import fs from 'fs';

const filePath = './client/src/components/molds/mold-name-popover-new.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Pas de code aan om te voorkomen dat serialNumber verkeerd wordt weergegeven
// (bijv. 1542-2 wordt weergegeven als 1542-10)
content = content.replace(
  /\{serialNumber \? \s*serialNumber\.replace\('SW-', ''\) : \s*orderNumber \? orderNumber\.replace\('SW-', ''\) : ''\}/,
  `{
    serialNumber ? 
      serialNumber : 
      orderNumber ? orderNumber : ''
  }`
);

fs.writeFileSync(filePath, content);
console.log("Order nummer weergave is gerepareerd in MoldNamePopover.");