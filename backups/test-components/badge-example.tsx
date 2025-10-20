import React, { useState } from 'react';
import { CombinedInstrumentTuningBadge, TuningBadge, FrequencyBadge } from '@/components/badges/tuning-badges';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function BadgeExample() {
  // Sample data
  const tuningNotes = ['A3', 'Bb3', 'B3', 'C4', 'C#4', 'D4', 'Eb4', 'E4', 'F4', 'F#4', 'G4', 'G#4'];
  const frequencies = ['432', '440'];
  const instrumentTypes = ['INNATO', 'NATEY', 'DOUBLE', 'ZEN', 'OVA', 'CARDS'];
  
  // State for demo options
  const [isClickable, setIsClickable] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState('INNATO');
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">New Badge Design</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Combined Instrument + Tuning Badge</CardTitle>
            <CardDescription>
              New badge that combines instrument type and tuning note, with frequency as a separate badge
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-slate-500 mb-2">Select instrument type:</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {instrumentTypes.map(type => (
                  <button
                    key={type}
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      selectedInstrument === type 
                        ? 'bg-slate-800 text-white' 
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                    onClick={() => setSelectedInstrument(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-2">432 Hz:</p>
                <div className="flex flex-wrap gap-3 mb-4">
                  {tuningNotes.slice(0, 6).map(note => (
                    <div key={note} className="flex items-center gap-2">
                      <CombinedInstrumentTuningBadge 
                        instrumentType={selectedInstrument}
                        tuningNote={note}
                        frequency="432"
                        onClick={isClickable ? () => alert(`Clicked ${selectedInstrument} ${note}`) : undefined}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-slate-500 mb-2">440 Hz:</p>
                <div className="flex flex-wrap gap-3 mb-4">
                  {tuningNotes.slice(0, 6).map(note => (
                    <div key={note} className="flex items-center gap-2">
                      <CombinedInstrumentTuningBadge 
                        instrumentType={selectedInstrument}
                        tuningNote={note}
                        frequency="440"
                        onClick={isClickable ? () => alert(`Clicked ${selectedInstrument} ${note}`) : undefined}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>All Instruments Showcase</CardTitle>
            <CardDescription>
              See how different instrument types look with the same tuning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {instrumentTypes.map(type => (
                <div key={type} className="border-b pb-3 last:border-0">
                  <p className="text-sm text-slate-500 mb-2">{type}:</p>
                  <div className="flex flex-wrap gap-3">
                    {['C4', 'D4', 'E4'].map(note => (
                      <div key={`${type}-${note}`} className="flex items-center gap-2">
                        <CombinedInstrumentTuningBadge 
                          instrumentType={type}
                          tuningNote={note}
                          frequency={note === 'C4' ? '432' : '440'}
                          onClick={isClickable ? () => alert(`Clicked ${type} ${note}`) : undefined}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Current vs New Badge System</CardTitle>
          <CardDescription>
            Comparison between current separate badges and new combined badges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Current System:</h3>
              <div className="flex flex-col gap-4">
                {['C4', 'E4', 'G4'].map(note => (
                  <div key={note} className="flex items-center gap-2">
                    <div className="w-20 text-sm text-slate-500">INNATO {note}:</div>
                    <div className="px-3 py-1 bg-blue-600 text-white rounded-md">INNATO</div>
                    <TuningBadge tuningNote={note} />
                    <FrequencyBadge frequency="432" />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">New System:</h3>
              <div className="flex flex-col gap-4">
                {['C4', 'E4', 'G4'].map(note => (
                  <div key={note} className="flex items-center gap-2">
                    <div className="w-20 text-sm text-slate-500">INNATO {note}:</div>
                    <CombinedInstrumentTuningBadge 
                      instrumentType="INNATO"
                      tuningNote={note}
                      frequency="432"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Badge Options</CardTitle>
            <CardDescription>
              Toggle interactive features of the badges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="clickable-mode"
                  checked={isClickable}
                  onCheckedChange={setIsClickable}
                />
                <Label htmlFor="clickable-mode">Make Badges Clickable</Label>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Implementation Notes</CardTitle>
            <CardDescription>
              How to use the new combined badges in your code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="jsx">
              <TabsList className="mb-4">
                <TabsTrigger value="jsx">JSX</TabsTrigger>
                <TabsTrigger value="typescript">TypeScript Props</TabsTrigger>
              </TabsList>
              
              <TabsContent value="jsx" className="p-4 bg-slate-50 rounded-md">
                <pre className="text-sm overflow-auto">{`// New combined badge with corner frequency marker
<CombinedInstrumentTuningBadge 
  instrumentType="INNATO" 
  tuningNote="C4"
  frequency="432"
/>

// For ZEN flutes with L/M sizing
<CombinedInstrumentTuningBadge 
  instrumentType="ZEN" 
  tuningNote="L"
  frequency="440"
/>

// For CARDS (no tuning or frequency)
<CombinedInstrumentTuningBadge 
  instrumentType="CARDS"
/>

// For OvA with 64Hz
<CombinedInstrumentTuningBadge 
  instrumentType="OVA" 
  tuningNote="F#"
  frequency="64"
/>
`}</pre>
              </TabsContent>
              
              <TabsContent value="typescript" className="p-4 bg-slate-50 rounded-md">
                <pre className="text-sm overflow-auto">{`// Props interface
interface CombinedInstrumentTuningBadgeProps {
  instrumentType: string;  // INNATO, NATEY, ZEN, etc.
  tuningNote?: string;     // The musical note (A3, C4, etc.) or "L"/"M" for ZEN
  frequency?: string;      // "432", "440", or "64" for OvA
  onClick?: () => void;    // Optional click handler
}

// The badge will automatically:
// - Hide tuning for CARDS
// - Hide frequency for CARDS
// - Show L/M for ZEN flutes
// - Show frequency as a corner badge
// - Format instrument names correctly
`}</pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}