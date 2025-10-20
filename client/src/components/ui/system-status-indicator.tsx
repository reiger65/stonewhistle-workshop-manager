/**
 * Systeem Status Indicator Component
 * 
 * Dit component toont een draaiend icoontje wanneer er achtergrondtaken bezig zijn,
 * zoals Shopify synchronisatie of database backups.
 */

import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useSystemStatus, initSystemStatus, hasActiveProcess } from '@/lib/system-status';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function SystemStatusIndicator() {
  const { status, connected } = useSystemStatus();
  
  // Initialiseer de system status bij component mount
  useEffect(() => {
    initSystemStatus();
  }, []);
  
  // Controleer of er actieve processen zijn
  const isActive = status && hasActiveProcess();
  
  // Als er geen actieve processen zijn, toon niets
  if (!isActive) return null;
  
  // Extraheer de actieve processen en hun berichten
  const activeProcesses = status ? Object.values(status.activeProcesses).filter(
    (process: any) => ['started', 'in_progress'].includes(process.status)
  ) : [];
  
  const tooltipMessage = activeProcesses.length > 0
    ? activeProcesses.map((p: any) => p.message).join('\n')
    : 'Verbinden met server...';
    
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md cursor-pointer">
            <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default SystemStatusIndicator;