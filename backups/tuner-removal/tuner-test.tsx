import React from 'react';
import VesselBasedTuner from '@/components/tuner/vessel-based-tuner';
import { TunerSettingsProvider } from '@/hooks/use-tuner-settings';

export default function TunerTest() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Vessel-Based Tuner Test</h1>
      
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <TunerSettingsProvider>
          <VesselBasedTuner 
            fluteType="INNATO"
            tuningKey="Cm4" 
            frequency="440"
          />
        </TunerSettingsProvider>
      </div>
    </div>
  );
}