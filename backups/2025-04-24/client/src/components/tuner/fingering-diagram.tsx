import React from 'react';

export type Fingering = {
  leftUpper: boolean;
  leftLower: boolean;
  rightUpper: boolean;
  rightLower: boolean;
  frontLeft: boolean;
  frontRight: boolean;
};

export type FluteType = 'INNATO' | 'NATEY' | 'DOUBLE' | 'innato' | 'natey' | 'double';

interface FingeringDiagramProps {
  fluteType: FluteType;
  detectedNote: string;
  centsOffset: number;
  size?: "small" | "large";
}

export default function FingeringDiagram({
  fluteType,
  detectedNote,
  centsOffset,
  size = "large"
}: FingeringDiagramProps) {
  // SVG configuration based on size
  const svgConfig = {
    small: {
      size: 180,
      centerCircleRadius: 24,
      holeRadius: 8,
      outerCircleRadius: 50,
      lineThickness: 1.5,
      fontSize: 11,
      labelFontSize: 9,
      noteOffset: 20,
      armLengthRatio: 0.34
    },
    large: {
      size: 280,
      centerCircleRadius: 40,
      holeRadius: 12,
      outerCircleRadius: 80,
      lineThickness: 2,
      fontSize: 18,
      labelFontSize: 11,
      noteOffset: 32,
      armLengthRatio: 0.27
    }
  };

  const config = svgConfig[size];
  const center = config.size / 2;
  
  // Calculate positions for the holes - more balanced spacing
  const leftChamberX = center - config.outerCircleRadius * 0.65;
  const rightChamberX = center + config.outerCircleRadius * 0.65;
  const backChamberY = center - config.outerCircleRadius * 0.5;
  const frontChamberY = center + config.outerCircleRadius * 0.65;
  
  // Format note color based on cents offset
  const getNoteColor = () => {
    if (!detectedNote || detectedNote === '—') return '#888888';
    if (Math.abs(centsOffset) < 5) return '#22c55e'; // Green when very close
    if (Math.abs(centsOffset) < 15) return '#84cc16'; // Light green when close
    if (Math.abs(centsOffset) < 30) return '#eab308'; // Yellow when somewhat off
    return '#ef4444'; // Red when way off
  };
  
  // Format cents display
  const formatCents = () => {
    if (!detectedNote || detectedNote === '—') return '';
    const prefix = centsOffset > 0 ? '+' : '';
    return `${prefix}${centsOffset}¢`;
  };

  // Get instrument color for theming
  const getInstrumentColor = () => {
    const lowerType = fluteType.toLowerCase();
    if (lowerType.includes('innato')) return '#4f46e5'; // indigo-600
    if (lowerType.includes('natey')) return '#f59e0b'; // amber-500
    if (lowerType.includes('double')) return '#8b5cf6'; // purple-600
    return '#64748b'; // slate-500 (default for unknown types)
  };

  return (
    <div className="tuner-diagram w-full aspect-square max-w-[280px] mx-auto">
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${config.size} ${config.size}`}
        className="overflow-visible"
      >
        {/* Drop shadow for outer circle */}
        <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.1"/>
        </filter>
        
        {/* Outer circle (flute body) */}
        <circle
          cx={center}
          cy={center}
          r={config.outerCircleRadius}
          fill="#fafafa"
          stroke="#e2e8f0"
          strokeWidth={config.lineThickness}
          filter="url(#dropShadow)"
        />
        
        {/* Central circle for detected note - with gradient */}
        <defs>
          <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f9fafb" />
          </radialGradient>
        </defs>
        
        <circle
          cx={center}
          cy={center}
          r={config.centerCircleRadius}
          fill="url(#centerGradient)"
          stroke="#e2e8f0"
          strokeWidth={config.lineThickness}
        />
        
        {/* Chamber connections with more subtle connectors */}
        {/* Left chamber */}
        <line
          x1={center}
          y1={center}
          x2={leftChamberX}
          y2={backChamberY}
          stroke="#d1d5db"
          strokeWidth={config.lineThickness * 0.8}
        />
        <circle
          cx={leftChamberX}
          cy={backChamberY}
          r={config.holeRadius}
          fill="#ffffff"
          stroke="#d1d5db"
          strokeWidth={config.lineThickness * 0.8}
        />
        <text
          x={leftChamberX}
          y={backChamberY - config.holeRadius - 2}
          textAnchor="middle"
          fontSize={config.labelFontSize}
          fill="#64748b"
          fontWeight="500"
        >
          Left
        </text>
        
        {/* Right chamber */}
        <line
          x1={center}
          y1={center}
          x2={rightChamberX}
          y2={backChamberY}
          stroke="#d1d5db"
          strokeWidth={config.lineThickness * 0.8}
        />
        <circle
          cx={rightChamberX}
          cy={backChamberY}
          r={config.holeRadius}
          fill="#ffffff"
          stroke="#d1d5db"
          strokeWidth={config.lineThickness * 0.8}
        />
        <text
          x={rightChamberX}
          y={backChamberY - config.holeRadius - 2}
          textAnchor="middle"
          fontSize={config.labelFontSize}
          fill="#64748b"
          fontWeight="500"
        >
          Right
        </text>
        
        {/* Front chamber */}
        <line
          x1={center}
          y1={center}
          x2={center}
          y2={frontChamberY}
          stroke="#d1d5db"
          strokeWidth={config.lineThickness * 0.8}
        />
        <circle
          cx={center}
          cy={frontChamberY}
          r={config.holeRadius}
          fill="#ffffff"
          stroke="#d1d5db"
          strokeWidth={config.lineThickness * 0.8}
        />
        <text
          x={center}
          y={frontChamberY + config.holeRadius + 8}
          textAnchor="middle"
          fontSize={config.labelFontSize}
          fill="#64748b"
          fontWeight="500"
        >
          Front
        </text>
        
        {/* Detected note with better styling */}
        <text 
          x={center} 
          y={center - 4} 
          textAnchor="middle" 
          dominantBaseline="middle" 
          fontSize={config.fontSize * 1.6} 
          fontWeight="bold"
          fill={getNoteColor()}
          style={{ letterSpacing: '0.5px' }}
        >
          {detectedNote || "—"}
        </text>
        
        {/* Cents offset */}
        <text 
          x={center} 
          y={center + 14} 
          textAnchor="middle" 
          dominantBaseline="middle" 
          fontSize={config.fontSize * 0.9} 
          fill={getNoteColor()}
          fontWeight="medium"
        >
          {formatCents()}
        </text>
      </svg>
    </div>
  );
}