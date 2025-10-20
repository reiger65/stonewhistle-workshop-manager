import { useEffect, useState } from 'react';
import { WifiOff, Upload, Check } from 'lucide-react';
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const { isOnline, pendingChanges, triggerSync, isSyncing } = useOfflineMode();
  const [isVisible, setIsVisible] = useState(false);
  
  // Always show indicator when offline or when there are pending changes
  useEffect(() => {
    if (!isOnline || pendingChanges > 0) {
      setIsVisible(true);
    } else {
      // Auto-hide after 3 seconds if we're online with no pending changes
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingChanges]);
  
  // Don't render anything if there's nothing to show
  if (isOnline && pendingChanges === 0 && !isVisible) {
    return null;
  }
  
  return (
    <div 
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg transition-all duration-300",
        isOnline 
          ? pendingChanges > 0 
            ? "bg-amber-500 text-amber-950" 
            : "bg-green-500 text-green-950" 
          : "bg-red-500 text-white"
      )}
    >
      {!isOnline && (
        <>
          <WifiOff size={16} />
          <span>Offline</span>
        </>
      )}
      
      {isOnline && pendingChanges > 0 && (
        <>
          <span className="flex items-center gap-2">
            {isSyncing ? (
              <span className="animate-spin">
                <Upload size={16} />
              </span>
            ) : (
              <Upload size={16} />
            )}
            <span>{pendingChanges} change{pendingChanges !== 1 ? 's' : ''} pending</span>
            {!isSyncing && (
              <button
                onClick={() => triggerSync()}
                className="ml-1 rounded-full bg-white bg-opacity-20 px-2 py-0.5 text-xs hover:bg-opacity-30"
              >
                Sync now
              </button>
            )}
          </span>
        </>
      )}
      
      {isOnline && pendingChanges === 0 && (
        <>
          <Check size={16} />
          <span>All synced</span>
        </>
      )}
    </div>
  );
}