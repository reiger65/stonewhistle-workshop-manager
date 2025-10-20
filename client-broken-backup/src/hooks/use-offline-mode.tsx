import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { syncPendingChanges, saveOrderChanges, saveItemChanges } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import type { Order, OrderItem } from '@shared/schema';

// Define the context shape
interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  updateOrder: (id: number, data: Partial<Order>) => Promise<void>;
  updateOrderItem: (id: number, data: Partial<OrderItem>) => Promise<void>;
  createOrder: (data: Partial<Order>) => Promise<void>;
  createOrderItem: (data: Partial<OrderItem>) => Promise<void>;
  triggerSync: () => Promise<boolean>;
}

// Create the context
const OfflineContext = createContext<OfflineContextType | null>(null);

// Create the provider component
export function OfflineModeProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState<number>(0);
  
  // Update pending changes count
  const updatePendingChangesCount = useCallback(async () => {
    try {
      // Get pending changes count from IndexedDB
      if (!('indexedDB' in window)) {
        console.error('IndexedDB is not supported in this browser');
        setPendingChanges(0);
        return;
      }

      // Use a promise-based approach to open the database
      const openDB = () => {
        return new Promise<IDBDatabase>((resolve, reject) => {
          const request = window.indexedDB.open('workshop-db', 1);
          
          request.onerror = (event) => {
            reject('Error opening IndexedDB');
          };
          
          request.onsuccess = (event) => {
            const db = request.result;
            resolve(db);
          };
          
          // Create object stores if they don't exist (first time opening)
          request.onupgradeneeded = (event) => {
            const db = request.result;
            // Check if object stores exist before creating them
            if (!db.objectStoreNames.contains('pendingOrders')) {
              db.createObjectStore('pendingOrders', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('pendingItems')) {
              db.createObjectStore('pendingItems', { keyPath: 'id' });
            }
          };
        });
      };
      
      // Count items in an object store
      const countItems = (db: IDBDatabase, storeName: string) => {
        return new Promise<number>((resolve, reject) => {
          const transaction = db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const countRequest = store.count();
          
          countRequest.onsuccess = () => {
            resolve(countRequest.result);
          };
          
          countRequest.onerror = () => {
            reject(`Error counting items in ${storeName}`);
          };
        });
      };
      
      // Execute the counting process
      try {
        const db = await openDB();
        const orderCount = await countItems(db, 'pendingOrders');
        const itemCount = await countItems(db, 'pendingItems');
        
        const totalCount = orderCount + itemCount;
        setPendingChanges(totalCount);
        
        // Close the database connection
        db.close();
      } catch (dbError) {
        console.error('Database operation error:', dbError);
        setPendingChanges(0);
      }
    } catch (error) {
      console.error('Error counting pending changes:', error);
      // In case of error, we'll set a fallback value
      setPendingChanges(0);
    }
  }, []);
  
  // Handle online status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const toastId = toast({
        title: 'Back online',
        description: 'Your changes will be synchronized with the server.',
      });
      
      // Trigger sync automatically when back online
      triggerSync().then(success => {
        if (success) {
          toast({
            title: 'Sync complete',
            description: 'All your offline changes have been synchronized.',
          });
        } else {
          toast({
            title: 'Sync issues',
            description: 'Some changes could not be synchronized. Please try manual sync.',
            variant: 'destructive',
          });
        }
      });
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'You are offline',
        description: 'Changes will be saved locally and synchronized when you reconnect.',
        variant: 'destructive',
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setIsOnline(navigator.onLine);
    updatePendingChangesCount();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast, updatePendingChangesCount]);
  
  // Handle order updates
  const updateOrder = useCallback(async (id: number, data: Partial<Order>) => {
    try {
      // If online, update directly
      if (isOnline) {
        const response = await fetch(`/api/orders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update order');
        }
      }
      
      // Always save to IndexedDB for offline support
      await saveOrderChanges(id, 'update', data);
      await updatePendingChangesCount();
      
      toast({
        title: 'Order updated',
        description: isOnline 
          ? 'Order has been updated successfully.' 
          : 'Order has been saved locally and will sync when online.',
      });
    } catch (error) {
      console.error('Error updating order:', error);
      
      // If network error, still save locally
      if (!isOnline) {
        await saveOrderChanges(id, 'update', data);
        await updatePendingChangesCount();
        
        toast({
          title: 'Order saved locally',
          description: 'Changes will sync when you are back online.',
        });
      } else {
        toast({
          title: 'Error updating order',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      }
    }
  }, [isOnline, toast, updatePendingChangesCount]);
  
  // Handle order item updates
  const updateOrderItem = useCallback(async (id: number, data: Partial<OrderItem>) => {
    try {
      // If online, update directly
      if (isOnline) {
        const response = await fetch(`/api/items/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update order item');
        }
      }
      
      // Always save to IndexedDB for offline support
      await saveItemChanges(id, 'update', data);
      await updatePendingChangesCount();
      
      toast({
        title: 'Item updated',
        description: isOnline 
          ? 'Item has been updated successfully.' 
          : 'Item has been saved locally and will sync when online.',
      });
    } catch (error) {
      console.error('Error updating order item:', error);
      
      // If network error, still save locally
      if (!isOnline) {
        await saveItemChanges(id, 'update', data);
        await updatePendingChangesCount();
        
        toast({
          title: 'Item saved locally',
          description: 'Changes will sync when you are back online.',
        });
      } else {
        toast({
          title: 'Error updating item',
          description: 'Please try again later.',
          variant: 'destructive',
        });
      }
    }
  }, [isOnline, toast, updatePendingChangesCount]);
  
  // Handle creating new orders
  const createOrder = useCallback(async (data: Partial<Order>) => {
    try {
      let newId = -1; // Temporary ID for offline mode
      
      // If online, create directly
      if (isOnline) {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create order');
        }
        
        const result = await response.json();
        newId = result.id;
      } else {
        // Generate temporary negative ID for offline
        newId = -Math.floor(Math.random() * 1000000);
      }
      
      // Always save to IndexedDB for offline support
      await saveOrderChanges(newId, 'create', { ...data, id: newId });
      await updatePendingChangesCount();
      
      toast({
        title: 'Order created',
        description: isOnline 
          ? 'Order has been created successfully.' 
          : 'Order has been saved locally and will sync when online.',
      });
    } catch (error) {
      console.error('Error creating order:', error);
      
      toast({
        title: 'Error creating order',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  }, [isOnline, toast, updatePendingChangesCount]);
  
  // Handle creating new order items
  const createOrderItem = useCallback(async (data: Partial<OrderItem>) => {
    try {
      let newId = -1; // Temporary ID for offline mode
      
      // If online, create directly
      if (isOnline) {
        const response = await fetch('/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create order item');
        }
        
        const result = await response.json();
        newId = result.id;
      } else {
        // Generate temporary negative ID for offline
        newId = -Math.floor(Math.random() * 1000000);
      }
      
      // Always save to IndexedDB for offline support
      await saveItemChanges(newId, 'create', { ...data, id: newId });
      await updatePendingChangesCount();
      
      toast({
        title: 'Item created',
        description: isOnline 
          ? 'Item has been created successfully.' 
          : 'Item has been saved locally and will sync when online.',
      });
    } catch (error) {
      console.error('Error creating item:', error);
      
      toast({
        title: 'Error creating item',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  }, [isOnline, toast, updatePendingChangesCount]);
  
  // Manual sync trigger
  const triggerSync = useCallback(async (): Promise<boolean> => {
    if (!isOnline) {
      toast({
        title: 'Cannot sync',
        description: 'You are currently offline. Please connect to the internet and try again.',
        variant: 'destructive',
      });
      return false;
    }
    
    setIsSyncing(true);
    
    try {
      const success = await syncPendingChanges();
      
      if (success) {
        setLastSyncTime(new Date());
        await updatePendingChangesCount();
        
        toast({
          title: 'Sync completed',
          description: 'All changes have been synchronized with the server.',
        });
      } else {
        toast({
          title: 'Sync incomplete',
          description: 'Some changes could not be synchronized. Please try again later.',
          variant: 'destructive',
        });
      }
      
      setIsSyncing(false);
      return success;
    } catch (error) {
      console.error('Error during sync:', error);
      
      toast({
        title: 'Sync failed',
        description: 'An error occurred during synchronization. Please try again later.',
        variant: 'destructive',
      });
      
      setIsSyncing(false);
      return false;
    }
  }, [isOnline, toast, updatePendingChangesCount]);
  
  // Context value
  const contextValue: OfflineContextType = {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingChanges,
    updateOrder,
    updateOrderItem,
    createOrder,
    createOrderItem,
    triggerSync,
  };
  
  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
}

// Custom hook to use the offline context
export function useOfflineMode() {
  const context = useContext(OfflineContext);
  
  if (!context) {
    throw new Error('useOfflineMode must be used within an OfflineModeProvider');
  }
  
  return context;
}