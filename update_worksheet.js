const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'client/src/pages/worksheet.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Voeg de orderNotes en itemSpecifications toe aan beide instanties van MoldNamePopover
content = content.replace(
  /<MoldNamePopover customerName={order\.customerName} orderNumber={order\.orderNumber} serialNumber={item\.serialNumber} itemPosition={} \s+instrumentType={instrumentType} \s+tuningNote={tuningNote \|\| ''} \s+frequency={freqValue}/g,
  '<MoldNamePopover \n                                  customerName={order.customerName} \n                                  orderNumber={order.orderNumber} \n                                  serialNumber={item.serialNumber} \n                                  itemPosition={} \n                                  instrumentType={instrumentType} \n                                  tuningNote={tuningNote || ""} \n                                  frequency={freqValue}\n                                  orderNotes={order.notes || ""}\n                                  itemSpecifications={item.specifications || {}}'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Worksheet.tsx is bijgewerkt met orderNotes en itemSpecifications parameters!');
