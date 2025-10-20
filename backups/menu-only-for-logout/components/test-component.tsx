import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function TestComponent() {
  const [count, setCount] = useState(0);
  const [boxSize, setBoxSize] = useState('default');
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
    <div className="p-4 border-2 border-red-500 rounded-md mb-6 bg-red-50">
      <h2 className="text-xl font-bold mb-2">🔴 TESTING DROPDOWN FIXES - Version 4</h2>
      <p className="mb-2">Last updated: {currentTime}</p>
      <p className="mb-2 text-red-600 font-bold">This test component should show the "Envelope" option in both dropdowns.</p>
      <p className="mb-4">Current count: {count}</p>
      <Button onClick={() => setCount(prev => prev + 1)} className="mb-4">Increment</Button>
      
      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold">Box Size Options (should include Envelope):</h3>
        <div className="p-2 bg-yellow-100 rounded-md">
          <p className="font-mono text-sm">{JSON.stringify(boxSizes)}</p>
        </div>
        
        <div className="space-y-3">
          <div className="border p-3 rounded-md border-blue-300 bg-blue-50">
            <h4 className="font-medium mb-2">1. HTML Select Test</h4>
            <select 
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={boxSize}
              onChange={(e) => setBoxSize(e.target.value)}
            >
              {boxSizes.map(size => (
                <option key={`option-${size}`} value={size}>{size}</option>
              ))}
            </select>
          </div>
          
          <div className="border p-3 rounded-md border-green-300 bg-green-50">
            <h4 className="font-medium mb-2">2. Shadcn Select Test</h4>
            <Select
              value={boxSize}
              onValueChange={setBoxSize}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a box size" />
              </SelectTrigger>
              <SelectContent>
                {boxSizes.map(size => (
                  <SelectItem key={`select-${size}`} value={size}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="border p-3 rounded-md border-purple-300 bg-purple-50">
            <h4 className="font-medium mb-2">3. Direct Options Test</h4>
            <select 
              className="w-full border border-gray-300 rounded-md px-3 py-2"
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
        
        <div className="mt-4 p-3 bg-gray-100 rounded-md">
          <p>Selected box size: <span className="font-bold">{boxSize}</span></p>
        </div>
      </div>
    </div>
  );
}