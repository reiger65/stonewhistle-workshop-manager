import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

/**
 * Hook to automatically sync Shopify orders on app initialization
 */
export function useAutoSync() {
  const { toast } = useToast();
  const [isInitialSync, setIsInitialSync] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Auto-sync on app load
  useEffect(() => {
    const syncOrders = async () => {
      if (!isInitialSync) return;

      try {
        setSyncStatus('syncing');
        const response = await fetch('/api/import-shopify', { method: 'POST' });
        
        if (response.ok) {
          const data = await response.json();
          setSyncStatus('success');
          
          // Invalidate orders cache to fetch the latest
          queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
          queryClient.invalidateQueries({ queryKey: ['/api/order-items'] });
          
          if (data.newOrdersCount > 0) {
            toast({
              title: 'Orders Synced',
              description: `Successfully imported ${data.newOrdersCount} new orders from Shopify.`,
              variant: 'default',
            });
          }
        } else {
          setSyncStatus('error');
          const errorData = await response.json();
          toast({
            title: 'Sync Failed',
            description: errorData.message || 'Failed to sync orders from Shopify.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        setSyncStatus('error');
        toast({
          title: 'Sync Error',
          description: 'There was an error syncing orders. Please try again later.',
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