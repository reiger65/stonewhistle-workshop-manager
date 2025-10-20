import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readExcelFile(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const result = {};

    // Get all sheet names
    const sheetNames = workbook.SheetNames;
    console.log('Available sheets:', sheetNames);

    // Read each sheet
    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length > 0) {
        // Print first few rows of data for preview
        console.log(`\nSheet: ${sheetName} - ${jsonData.length} rows`);
        console.log('First row sample:', JSON.stringify(jsonData[0], null, 2));
        
        // Find columns related to instrument types and sizes
        const firstRow = jsonData[0];
        const columns = Object.keys(firstRow);
        console.log('Columns:', columns);
      } else {
        console.log(`\nSheet: ${sheetName} - Empty or no structured data`);
      }
      
      result[sheetName] = jsonData;
    });

    // Look for specific instrument type data
    let instrumentTypes = [];
    let instrumentSizes = [];
    
    // Check main sheet for type information
    const mainSheet = result[sheetNames[0]];
    if (mainSheet && mainSheet.length) {
      // Try to identify columns that might contain instrument types and sizes
      const sampleRow = mainSheet[0];
      const typeColumns = Object.keys(sampleRow).filter(col => 
        col.toLowerCase().includes('type') || 
        col.toLowerCase().includes('instru') || 
        col.toLowerCase().includes('model')
      );
      
      const sizeColumns = Object.keys(sampleRow).filter(col => 
        col.toLowerCase().includes('size') || 
        col.toLowerCase().includes('dim')
      );
      
      if (typeColumns.length) {
        console.log('\nPotential instrument type columns:', typeColumns);
        const typeColumn = typeColumns[0];
        instrumentTypes = [...new Set(mainSheet.map(row => row[typeColumn]))].filter(Boolean);
        console.log('Unique instrument types:', instrumentTypes);
      }
      
      if (sizeColumns.length) {
        console.log('\nPotential instrument size columns:', sizeColumns);
        const sizeColumn = sizeColumns[0];
        instrumentSizes = [...new Set(mainSheet.map(row => row[sizeColumn]))].filter(Boolean);
        console.log('Unique instrument sizes:', instrumentSizes);
      }
    }
    
    // If no specific type/size columns were found, try general approach
    if (instrumentTypes.length === 0) {
      console.log('\nTrying to infer instrument types from data...');
      // Look for common instrument naming patterns across all sheets
      sheetNames.forEach(sheetName => {
        const sheetData = result[sheetName];
        if (!sheetData || !sheetData.length) return;
        
        // Check all columns in each row
        sheetData.forEach(row => {
          Object.values(row).forEach(value => {
            if (typeof value === 'string' && 
                (value.toLowerCase().includes('flute') || 
                 value.toLowerCase().includes('whistle'))) {
              instrumentTypes.push(value);
            }
          });
        });
      });
      
      // Remove duplicates
      instrumentTypes = [...new Set(instrumentTypes)];
      console.log('Inferred instrument types:', instrumentTypes);
    }
    
    return {
      sheets: result,
      instrumentTypes,
      instrumentSizes
    };
  } catch (error) {
    console.error('Error reading Excel file:', error);
    return null;
  }
}

// Read both Excel files
const filePath1 = path.join(__dirname, 'attached_assets', 'buildlist.xlsx');
const filePath2 = path.join(__dirname, 'attached_assets', 'buildlist (1).xlsx');

console.log('Reading file 1:', filePath1);
const result1 = readExcelFile(filePath1);

console.log('\n\nReading file 2:', filePath2);
const result2 = readExcelFile(filePath2);