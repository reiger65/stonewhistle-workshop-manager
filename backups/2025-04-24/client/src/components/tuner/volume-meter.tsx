import React from 'react';

interface VolumeMeterProps {
  volume: number;
  minDb?: number;
  maxDb?: number;
  compact?: boolean;
}

export function VolumeMeter({ 
  volume, 
  minDb = -70, 
  maxDb = -10,
  compact = true
}: VolumeMeterProps) {
  // Apply a scaling factor to make the volume meter more responsive
  // This helps with microphone sensitivity differences
  const amplifiedVolume = volume * 5;
  
  // Convert volume to dB scale (logarithmic)
  // Avoid log(0) by using a small value if volume is 0
  const safeVolume = amplifiedVolume > 0 ? amplifiedVolume : 0.000001;
  const db = 20 * Math.log10(safeVolume);
  
  // Clamp dB value to min/max range
  const clampedDb = Math.max(minDb, Math.min(maxDb, db));
  
  // Convert to percentage for display (0-100%)
  const percentage = ((clampedDb - minDb) / (maxDb - minDb)) * 100;
  
  // Determine color based on volume level
  const getColor = () => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 75) return 'bg-orange-400';
    if (percentage > 50) return 'bg-yellow-400';
    return 'bg-emerald-500';
  };
  
  if (compact) {
    // Tiny version of the meter with minimal UI
    return (
      <div className="w-full">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-100 ${getColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
  
  // Full size version with labels
  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>Level</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-100 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}