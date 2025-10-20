import React, { useState } from 'react';
import { Music, ArrowLeft } from 'lucide-react';
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
  { label: 'Innato (3 chambers)', value: 'innato' },
  { label: 'Natey (single chamber)', value: 'natey' },
  { label: 'Double (2 chambers)', value: 'double' },
  { label: 'ZEN (small ocarina)', value: 'zen' }
];

// Available keys for the different flute types
const FLUTE_KEYS = {
  'innato': [
    { label: 'Em4', value: 'Em4' },
    { label: 'Ebm4', value: 'Ebm4' },
    { label: 'Dm4', value: 'Dm4' },
    { label: 'C#m4', value: 'C#m4' },
    { label: 'Cm4', value: 'Cm4' },
    { label: 'Bm3', value: 'Bm3' },
    { label: 'Bbm3', value: 'Bbm3' },
    { label: 'Am3', value: 'Am3' },
    { label: 'G#m3', value: 'G#m3' },
    { label: 'Gm3', value: 'Gm3' },
    { label: 'F#m3', value: 'F#m3' },
    { label: 'Fm3', value: 'Fm3' },
    { label: 'Em3', value: 'Em3' }
  ],
  'natey': [
    { label: 'Am4', value: 'Am4' },
    { label: 'G#m4', value: 'G#m4' },
    { label: 'Gm4', value: 'Gm4' },
    { label: 'F#m4', value: 'F#m4' },
    { label: 'Fm4', value: 'Fm4' },
    { label: 'Em4', value: 'Em4' },
    { label: 'Ebm4', value: 'Ebm4' },
    { label: 'Dm4', value: 'Dm4' },
    { label: 'C#m4', value: 'C#m4' },
    { label: 'Cm4', value: 'Cm4' },
    { label: 'Bm3', value: 'Bm3' },
    { label: 'Bbm3', value: 'Bbm3' },
    { label: 'Am3', value: 'Am3' },
    { label: 'G#m3', value: 'G#m3' },
    { label: 'Gm3', value: 'Gm3' }
  ],
  'double': [
    { label: 'C#m4', value: 'C#m4' },
    { label: 'Cm4', value: 'Cm4' },
    { label: 'Bm3', value: 'Bm3' },
    { label: 'Bbm3', value: 'Bbm3' },
    { label: 'Am3', value: 'Am3' },
    { label: 'G#m3', value: 'G#m3' },
    { label: 'Gm3', value: 'Gm3' }
  ],
  'zen': [
    { label: 'Gm3', value: 'Gm3' }, // ZEN M
    { label: 'Em3', value: 'Em3' }  // ZEN L
  ]
};

/**
 * BasicStandaloneTuner component
 * A simplified standalone version of the tuner application
 */
const BasicStandaloneTuner: React.FC = () => {
  // Parse URL parameters
  const parseQueryParams = () => {
    const params = new URLSearchParams(window.location.search);
    const instrType = params.get('instrumentType') || 'innato';
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
  const availableKeys = FLUTE_KEYS[instrumentType as keyof typeof FLUTE_KEYS] || FLUTE_KEYS.innato;
  
  // Handle instrument type change
  const handleInstrumentTypeChange = (value: string) => {
    setInstrumentType(value);
    
    // Set default key for the selected instrument type
    if (FLUTE_KEYS[value as keyof typeof FLUTE_KEYS]) {
      setTuningKey(FLUTE_KEYS[value as keyof typeof FLUTE_KEYS][0].value);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Music className="mr-2 h-6 w-6 text-indigo-600" />
          Stonewhistle Tuner
        </h1>
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Workshop
          </Button>
        </Link>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Tuner Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Instrument Type</label>
              <Select
                value={instrumentType}
                onValueChange={handleInstrumentTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select instrument type" />
                </SelectTrigger>
                <SelectContent>
                  {FLUTE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tuning Key</label>
              <Select
                value={tuningKey}
                onValueChange={setTuningKey}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tuning key" />
                </SelectTrigger>
                <SelectContent>
                  {availableKeys.map(key => (
                    <SelectItem key={key.value} value={key.value}>
                      {key.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Concert Pitch</label>
              <Select
                value={baseFrequency}
                onValueChange={setBaseFrequency}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {TUNING_FREQUENCIES.map(freq => (
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
      
      <Card>
        <CardContent className="p-4">
          <MacCompatibleTuner 
            instrumentType={instrumentType} 
            tuningNote={tuningKey} 
            frequency={baseFrequency}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicStandaloneTuner;