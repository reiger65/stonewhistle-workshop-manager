import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MacCompatibleTuner from '@/components/tuner/mac-compatible-tuner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BasicTunerTest() {
  const [selectedInstrument, setSelectedInstrument] = React.useState('innato');
  const [selectedTuning, setSelectedTuning] = React.useState('Cm4');
  const [selectedFrequency, setSelectedFrequency] = React.useState('440 Hz');
  
  // Map of instrument types to their available tunings
  const tuningOptions = {
    'innato': ['Em4', 'Ebm4', 'Dm4', 'C#m4', 'Cm4', 'Bm3', 'Bbm3', 'Am3', 'G#m3', 'Gm3', 'F#m3', 'Fm3', 'Em3'],
    'natey': ['Am4', 'G#m4', 'Gm4', 'F#m4', 'Fm4', 'Em4', 'Ebm4', 'Dm4', 'C#m4', 'Cm4', 'Bm3', 'Bbm3', 'Am3', 'G#m3', 'Gm3'],
    'double': ['C#m4', 'Cm4', 'Bm3', 'Bbm3', 'Am3', 'G#m3', 'Gm3'],
    'zen': ['Em3', 'Gm3']
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Advanced Tuner Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Instrument Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Instrument Type</h3>
              <RadioGroup 
                value={selectedInstrument} 
                onValueChange={setSelectedInstrument}
                className="flex flex-wrap gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="innato" id="innato" />
                  <Label htmlFor="innato">Innato</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="natey" id="natey" />
                  <Label htmlFor="natey">Natey</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="double" id="double" />
                  <Label htmlFor="double">Double</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="zen" id="zen" />
                  <Label htmlFor="zen">ZEN</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tuning" className="block mb-2">Tuning Key</Label>
                <Select value={selectedTuning} onValueChange={setSelectedTuning}>
                  <SelectTrigger id="tuning">
                    <SelectValue placeholder="Select tuning" />
                  </SelectTrigger>
                  <SelectContent>
                    {tuningOptions[selectedInstrument as keyof typeof tuningOptions]?.map((tuning) => (
                      <SelectItem key={tuning} value={tuning}>
                        {tuning}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="frequency" className="block mb-2">Frequency</Label>
                <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="440 Hz">A 440 Hz</SelectItem>
                    <SelectItem value="432 Hz">A 432 Hz</SelectItem>
                    <SelectItem value="425 Hz">A 425 Hz</SelectItem>
                    <SelectItem value="420 Hz">A 420 Hz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mac-Compatible Tuner</CardTitle>
        </CardHeader>
        <CardContent>
          <MacCompatibleTuner 
            instrumentType={selectedInstrument}
            tuningNote={selectedTuning}
            frequency={selectedFrequency}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Make sure your microphone is connected and working</li>
            <li>Allow microphone access when prompted</li>
            <li>Try making sounds with consistent pitch (like whistling)</li>
            <li>For Innato flutes, the left vessel notes are: G3, Bb3, C4, D4</li>
            <li>For Innato flutes, the right vessel notes are: C4, Eb4, F4, G4</li>
            <li>For Innato flutes, the front vessel notes are: G4, Bb4, C5, D5</li>
            <li>If you don't see any notes detected, check browser console for errors</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}