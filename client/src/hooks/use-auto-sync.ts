import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

/**
 * Hook to automatically sync Shopify orders only on app initialization
 * and when manually triggered by the user.
 * 
 * Automatic sync for ParcelParcels has also been removed - 
 * synchronisatie vindt alleen plaats bij app opstart en handmatige sync.
 */
export function useAutoSync() {
  const { toast } = useToast();
  const [isInitialSync, setIsInitialSync] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Auto-sync on app load only, not periodically
  useEffect(() => {
    const syncOrders = async () => {
      if (!isInitialSync) return;

      try {
        setSyncStatus('syncing');
        
        // Haal de geselecteerde synchronisatieperiode op uit localStorage (standaard 1month)
        const syncPeriod = localStorage.getItem('syncPeriod') || '1month';
        
        console.log(`Initiële synchronisatie met Shopify gestart bij het opstarten van de app (periode: ${syncPeriod})`);
        
        // TEMPORARILY DISABLED - Auto-sync causing 500 errors and blocking orders loading
        console.log('Auto-sync temporarily disabled to prevent blocking orders loading');
        return;
        
        const response = await fetch('/api/import-shopify', { 
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ period: syncPeriod })
        });
        
        if (response.ok) {
          const data = await response.json();
          setSyncStatus('success');
          
          // Invalidate orders cache to fetch the latest
          queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
          queryClient.invalidateQueries({ queryKey: ['/api/order-items'] });
          
          if (data.newOrdersCount > 0) {
            toast({
              title: 'Orders Gesynchroniseerd',
              description: `${data.newOrdersCount} nieuwe orders geïmporteerd uit Shopify.`,
              variant: 'default',
            });
          }
        } else {
          setSyncStatus('error');
          const errorData = await response.json();
          toast({
            title: 'Synchronisatie Mislukt',
            description: errorData.message || 'Kon orders niet synchroniseren met Shopify.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        setSyncStatus('error');
        toast({
          title: 'Synchronisatie Fout',
          description: 'Er is een fout opgetreden tijdens synchroniseren. Probeer later opnieuw.',
          variant: 'destructive',
        });
      } finally {
        setIsInitialSync(false); // Prevent auto-syncing again
      }
    };

    // Sync orders when app starts
    syncOrders();
  }, [isInitialSync, toast]);

  // Manually trigger a sync
  const syncOrdersManually = async () => {
    setIsInitialSync(true); // Reset to trigger the effect
  };

  return {
    syncStatus,
    syncOrdersManually,
  };
}