import React, { useState } from 'react';
import { ChevronLeft, Music } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MacCompatibleTuner from '@/components/tuner/mac-compatible-tuner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Available tuning frequencies
const TUNING_FREQUENCIES = [
  { label: 'A = 420 Hz', value: '420' },
  { label: 'A = 432 Hz', value: '432' },
  { label: 'A = 440 Hz (Standard)', value: '440' },
  { label: 'A = 444 Hz', value: '444' }
];

// Types of chambered flutes
const FLUTE_TYPES = [
  { label: 'Innato (3 chambers)', value: 'INNATO' },
  { label: 'Natey (single chamber)', value: 'NATEY' },
  { label: 'Double (2 chambers)', value: 'DOUBLE' },
  { label: 'ZEN (single chamber)', value: 'ZEN' }
];

// Available keys for the different flute types
const FLUTE_KEYS = {
  'INNATO': [
    { label: 'Cm4', value: 'Cm4' },
    { label: 'C#m4', value: 'C#m4' },
    { label: 'Dm4', value: 'Dm4' },
    { label: 'D#m4', value: 'D#m4' },
    { label: 'Em4', value: 'Em4' }
  ],
  'NATEY': [
    { label: 'Am4', value: 'Am4' },
    { label: 'Gm4', value: 'Gm4' },
    { label: 'Fm4', value: 'Fm4' },
    { label: 'Em4', value: 'Em4' }
  ],
  'DOUBLE': [
    { label: 'C#m4', value: 'C#m4' },
    { label: 'Cm4', value: 'Cm4' },
    { label: 'Bm3', value: 'Bm3' }
  ],
  'ZEN': [
    { label: 'Gm3', value: 'Gm3' },
    { label: 'Em3', value: 'Em3' }
  ]
};

/**
 * Enhanced Standalone Tuner
 * A simplified standalone version of the tuner application
 */
const EnhancedStandaloneTuner: React.FC = () => {
  // Parse URL parameters
  const parseQueryParams = () => {
    const params = new URLSearchParams(window.location.search);
    const instrType = params.get('instrumentType') || 'INNATO';
    const key = params.get('tuningKey') || 'Cm4';
    const frequency = params.get('frequency') || '440';
    
    return { instrType, key, frequency };
  };
  
  const urlParams = parseQueryParams();
  
  // Settings state - initialized with URL params if available
  const [instrumentType, setInstrumentType] = useState<string>(urlParams.instrType);
  const [tuningKey, setTuningKey] = useState<string>(urlParams.key);
  const [baseFrequency, setBaseFrequency] = useState<string>(urlParams.frequency);
  
  // Get the available keys for the current instrument type
  const availableKeys = FLUTE_KEYS[instrumentType as keyof typeof FLUTE_KEYS] || FLUTE_KEYS.INNATO;
  
  // Handle instrument type change
  const handleInstrumentTypeChange = (value: string) => {
    setInstrumentType(value);
    
    // Set default key for the selected instrument type
    if (FLUTE_KEYS[value as keyof typeof FLUTE_KEYS]) {
      setTuningKey(FLUTE_KEYS[value as keyof typeof FLUTE_KEYS][0].value);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <Music className="mr-2 h-6 w-6 text-indigo-600" />
        Stonewhistle Workshop Tuner
        <Link href="/workshop">
          <a className="ml-auto text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Workshop
          </a>
        </Link>
      </h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tuner Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Instrument Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Instrument Type</label>
              <Select
                value={instrumentType}
                onValueChange={handleInstrumentTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select instrument" />
                </SelectTrigger>
                <SelectContent>
                  {FLUTE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Tuning Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tuning Key</label>
              <Select
                value={tuningKey}
                onValueChange={setTuningKey}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select key" />
                </SelectTrigger>
                <SelectContent>
                  {availableKeys.map((key) => (
                    <SelectItem key={key.value} value={key.value}>
                      {key.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Frequency */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Concert Pitch</label>
              <Select
                value={baseFrequency}
                onValueChange={setBaseFrequency}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {TUNING_FREQUENCIES.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tuner Component */}
      <div className="mt-6">
        <MacCompatibleTuner
          instrumentType={instrumentType}
          tuningNote={tuningKey}
          frequency={baseFrequency}
          allowSelections={true}
          standalone={true}
        />
      </div>
    </div>
  );
};

export default EnhancedStandaloneTuner;