// ESM script voor het bijwerken van worksheet.tsx
import fs from 'fs';
import path from 'path';

const filePath = './client/src/pages/worksheet.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Voeg orderNotes en itemSpecifications properties toe aan alle MoldNamePopover componenten
content = content.replace(
  /<MoldNamePopover\s+customerName={order\.customerName}\s+orderNumber={order\.orderNumber}\s+serialNumber={item\.serialNumber}\s+itemPosition={`\${index\+1}\/\${allOrderItems\.filter\(i => i\.orderId === order\.id\)\.length}`}\s+instrumentType={instrumentType}\s+tuningNote={tuningNote \|\| ''}\s+frequency={freqValue}/g,
  '<MoldNamePopover customerName={order.customerName} orderNumber={order.orderNumber} serialNumber={item.serialNumber} itemPosition={`${index+1}/${allOrderItems.filter(i => i.orderId === order.id).length}`} instrumentType={instrumentType} tuningNote={tuningNote || \'\'} frequency={freqValue} orderNotes={order.notes || \'\'} itemSpecifications={item.specifications || {}}'
);

fs.writeFileSync(filePath, content);
console.log('Worksheet.tsx is bijgewerkt met orderNotes en itemSpecifications parameters.');