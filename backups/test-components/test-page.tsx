import React, { useState, useEffect } from 'react';
import { TestComponent } from '@/components/test-component';

export default function TestPage() {
  const [boxSize, setBoxSize] = useState<string>('default');
  const [showDropdown, setShowDropdown] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());
  
  // Force update the component every 2 seconds to bypass any caching
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toISOString());
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  // Available box sizes including Envelope
  const boxSizes = ['15x15x15', '20x20x20', '30x12x12', '30x30x30', '35x35x35', '40x40x40', '50x50x50', 'Envelope', '-'];
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-3xl bg-white p-6 rounded-md shadow-md">
        <h1 className="text-2xl font-bold mb-6">🧪 Dropdown Test Page</h1>
        <p className="text-sm text-gray-500 mb-4">Last updated: {currentTime}</p>
        
        <div className="border-2 border-red-600 p-4 rounded-md bg-red-50 mb-6">
          <h2 className="text-xl font-bold text-red-800">TESTING INSTRUCTIONS</h2>
          <p className="text-md font-medium mt-2">
            We're verifying if the "Envelope" option is correctly showing in all dropdown boxes. 
            We're seeing cache issues with the app - try refreshing if the option is missing.
          </p>
        </div>
        
        <div className="space-y-6">
          <div className="border-2 border-blue-400 p-4 rounded-md bg-blue-50">
            <h2 className="text-lg font-semibold mb-2">Test #1: Native Dropdown</h2>
            <p className="text-sm text-gray-500 mb-4">Testing if Envelope shows up in the dropdown</p>
            
            <button 
              className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-md" 
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {showDropdown ? 'Hide Dropdown' : 'Show Dropdown'}
            </button>
            
            {showDropdown && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Box Size Dropdown:</h3>
                  <p className="text-xs text-gray-600 mb-2">Available sizes: {JSON.stringify(boxSizes)}</p>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={boxSize}
                    onChange={(e) => setBoxSize(e.target.value)}
                  >
                    {boxSizes.map(size => (
                      <option key={`option-${size}`} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              <p>Selected box size: <span className="font-bold">{boxSize}</span></p>
            </div>
          </div>
          
          <div className="border-2 border-green-400 p-4 rounded-md bg-green-50">
            <h2 className="text-lg font-semibold mb-2">Test #2: Direct Hardcoded Options</h2>
            <div>
              <h3 className="font-medium mb-2">Hardcoded Box Sizes:</h3>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={boxSize}
                onChange={(e) => setBoxSize(e.target.value)}
              >
                <option value="15x15x15">15x15x15</option>
                <option value="20x20x20">20x20x20</option>
                <option value="30x12x12">30x12x12</option>
                <option value="30x30x30">30x30x30</option>
                <option value="35x35x35">35x35x35</option>
                <option value="40x40x40">40x40x40</option>
                <option value="50x50x50">50x50x50</option>
                <option value="Envelope">Envelope</option>
                <option value="-">-</option>
              </select>
            </div>
          </div>
          
          <div className="border-2 border-purple-400 p-4 rounded-md bg-purple-50">
            <h2 className="text-lg font-semibold mb-2">Test #3: Imported Component</h2>
            <TestComponent />
          </div>
        </div>
      </div>
    </div>
  );
}