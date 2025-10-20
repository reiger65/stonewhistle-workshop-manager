import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Excel file
const filePath = path.join(__dirname, 'attached_assets', 'buildlist.xlsx');

try {
  // Read the Excel file
  const workbook = xlsx.readFile(filePath);
  
  // Get the first sheet name
  const sheetName = workbook.SheetNames[0];
  
  // Get the sheet
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert the sheet to JSON
  const jsonData = xlsx.utils.sheet_to_json(worksheet);
  
  // Print the data in a formatted way
  console.log(`Found ${jsonData.length} rows in sheet "${sheetName}"`);
  console.log('\nSheet Structure (first row):\n');
  if (jsonData.length > 0) {
    console.log(JSON.stringify(Object.keys(jsonData[0]), null, 2));
  }
  
  console.log('\nSample Data (first 5 rows):\n');
  console.log(JSON.stringify(jsonData.slice(0, 5), null, 2));
  
  // Log the sheet names in the workbook
  console.log('\nAll sheets in the workbook:');
  workbook.SheetNames.forEach(name => {
    const sheet = workbook.Sheets[name];
    const rows = xlsx.utils.sheet_to_json(sheet).length;
    console.log(`- "${name}" (${rows} rows)`);
  });
  
} catch (error) {
  console.error('Error reading Excel file:', error.message);
}