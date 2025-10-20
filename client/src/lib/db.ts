import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Order, OrderItem, ProductionNote, MaterialInventory, InstrumentInventory } from '@shared/schema';

// Define the database schema
interface WorkshopDB extends DBSchema {
  orders: {
    key: number;
    value: Order;
    indexes: {
      'by-order-number': string;
      'by-status': string;
      'by-shopify-id': string;
    };
  };
  orderItems: {
    key: number;
    value: OrderItem;
    indexes: {
      'by-order-id': number;
      'by-serial-number': string;
      'by-status': string;
    };
  };
  productionNotes: {
    key: number;
    value: ProductionNote;
    indexes: {
      'by-order-id': number;
      'by-item-id': number;
    };
  };
  materialsInventory: {
    key: number;
    value: MaterialInventory;
    indexes: {
      'by-type': string;
    };
  };
  instrumentsInventory: {
    key: number;
    value: InstrumentInventory;
    indexes: {
      'by-type': string;
      'by-serial-number': string;
    };
  };
  pendingOrders: {
    key: number;
    value: {
      id: number;
      operation: 'update' | 'create' | 'delete';
      data: Partial<Order>;
      timestamp: number;
    };
  };
  pendingItems: {
    key: number;
    value: {
      id: number;
      operation: 'update' | 'create' | 'delete';
      data: Partial<OrderItem>;
      timestamp: number;
    };
  };
  pendingNotes: {
    key: number;
    value: {
      id: number;
      operation: 'update' | 'create' | 'delete';
      data: Partial<ProductionNote>;
      timestamp: number;
    };
  };
  pendingMaterials: {
    key: number;
    value: {
      id: number;
      operation: 'update' | 'create' | 'delete';
      data: Partial<MaterialInventory>;
      timestamp: number;
    };
  };
  pendingInstruments: {
    key: number;
    value: {
      id: number;
      operation: 'update' | 'create' | 'delete';
      data: Partial<InstrumentInventory>;
      timestamp: number;
    };
  };
  syncLog: {
    key: number;
    value: {
      timestamp: number;
      action: string;
      status: 'success' | 'error';
      details?: string;
    };
  };
}

// Singleton pattern to ensure only one database connection
let dbPromise: Promise<IDBPDatabase<WorkshopDB>> | null = null;

/**
 * Initialize or get the IndexedDB database
 */
export function getDB(): Promise<IDBPDatabase<WorkshopDB>> {
  if (!dbPromise) {
    dbPromise = openDB<WorkshopDB>('workshop-db', 1, {
      upgrade(db) {
        // Create the stores if they don't exist
        
        // Orders store
        if (!db.objectStoreNames.contains('orders')) {
          const orderStore = db.createObjectStore('orders', { keyPath: 'id' });
          orderStore.createIndex('by-order-number', 'orderNumber', { unique: true });
          orderStore.createIndex('by-status', 'status');
          orderStore.createIndex('by-shopify-id', 'shopifyOrderId');
        }
        
        // Order items store
        if (!db.objectStoreNames.contains('orderItems')) {
          const itemsStore = db.createObjectStore('orderItems', { keyPath: 'id' });
          itemsStore.createIndex('by-order-id', 'orderId');
          itemsStore.createIndex('by-serial-number', 'serialNumber', { unique: true });
          itemsStore.createIndex('by-status', 'status');
        }
        
        // Production notes store
        if (!db.objectStoreNames.contains('productionNotes')) {
          const notesStore = db.createObjectStore('productionNotes', { keyPath: 'id' });
          notesStore.createIndex('by-order-id', 'orderId');
          notesStore.createIndex('by-item-id', 'itemId');
        }
        
        // Materials inventory store
        if (!db.objectStoreNames.contains('materialsInventory')) {
          const materialsStore = db.createObjectStore('materialsInventory', { keyPath: 'id' });
          materialsStore.createIndex('by-type', 'materialType');
        }
        
        // Instruments inventory store
        if (!db.objectStoreNames.contains('instrumentsInventory')) {
          const instrumentsStore = db.createObjectStore('instrumentsInventory', { keyPath: 'id' });
          instrumentsStore.createIndex('by-type', 'instrumentType');
          instrumentsStore.createIndex('by-serial-number', 'serialNumber', { unique: true });
        }
        
        // Pending changes stores
        if (!db.objectStoreNames.contains('pendingOrders')) {
          db.createObjectStore('pendingOrders', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('pendingItems')) {
          db.createObjectStore('pendingItems', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('pendingNotes')) {
          db.createObjectStore('pendingNotes', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('pendingMaterials')) {
          db.createObjectStore('pendingMaterials', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('pendingInstruments')) {
          db.createObjectStore('pendingInstruments', { keyPath: 'id' });
        }
        
        // Sync log store
        if (!db.objectStoreNames.contains('syncLog')) {
          db.createObjectStore('syncLog', { keyPath: 'id', autoIncrement: true });
        }
      }
    });
  }
  
  return dbPromise;
}

/**
 * Log a sync action to the database
 */
export async function logSync(action: string, status: 'success' | 'error', details?: string): Promise<void> {
  const db = await getDB();
  await db.add('syncLog', {
    timestamp: Date.now(),
    action,
    status,
    details
  });
}

/**
 * Save pending changes to be synced later
 */
export async function saveOrderChanges(id: number, operation: 'update' | 'create' | 'delete', data: Partial<Order>): Promise<void> {
  const db = await getDB();
  await db.put('pendingOrders', {
    id,
    operation,
    data,
    timestamp: Date.now()
  });
}

/**
 * Save pending item changes to be synced later
 */
export async function saveItemChanges(id: number, operation: 'update' | 'create' | 'delete', data: Partial<OrderItem>): Promise<void> {
  const db = await getDB();
  await db.put('pendingItems', {
    id,
    operation,
    data,
    timestamp: Date.now()
  });
}

/**
 * Process all pending changes when online
 */
export async function syncPendingChanges(): Promise<boolean> {
  const db = await getDB();
  const isOnline = navigator.onLine;
  
  if (!isOnline) {
    console.log('Cannot sync changes - offline');
    return false;
  }
  
  try {
    // Process pending order changes
    const pendingOrders = await db.getAll('pendingOrders');
    
    for (const pending of pendingOrders) {
      try {
        if (pending.operation === 'create') {
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pending.data)
          });
          
          if (response.ok) {
            await db.delete('pendingOrders', pending.id);
            await logSync('create-order', 'success');
          }
        } else if (pending.operation === 'update') {
          const response = await fetch(`/api/orders/${pending.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pending.data)
          });
          
          if (response.ok) {
            await db.delete('pendingOrders', pending.id);
            await logSync('update-order', 'success');
          }
        } else if (pending.operation === 'delete') {
          const response = await fetch(`/api/orders/${pending.id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            await db.delete('pendingOrders', pending.id);
            await logSync('delete-order', 'success');
          }
        }
      } catch (error) {
        console.error(`Failed to sync order ${pending.id}:`, error);
        await logSync('sync-order', 'error', String(error));
      }
    }
    
    // Process pending item changes
    const pendingItems = await db.getAll('pendingItems');
    
    for (const pending of pendingItems) {
      try {
        if (pending.operation === 'create') {
          const response = await fetch('/api/order-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pending.data)
          });
          
          if (response.ok) {
            await db.delete('pendingItems', pending.id);
            await logSync('create-item', 'success');
          }
        } else if (pending.operation === 'update') {
          const response = await fetch(`/api/order-items/${pending.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pending.data)
          });
          
          if (response.ok) {
            await db.delete('pendingItems', pending.id);
            await logSync('update-item', 'success');
          }
        } else if (pending.operation === 'delete') {
          const response = await fetch(`/api/order-items/${pending.id}`, {
            method: 'DELETE'
          });
          
          if (response.ok) {
            await db.delete('pendingItems', pending.id);
            await logSync('delete-item', 'success');
          }
        }
      } catch (error) {
        console.error(`Failed to sync item ${pending.id}:`, error);
        await logSync('sync-item', 'error', String(error));
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing pending changes:', error);
    await logSync('sync-all', 'error', String(error));
    return false;
  }
}

/**
 * Clear all data from IndexedDB (used for testing or reset)
 */
export async function clearDatabase(): Promise<void> {
  const db = await getDB();
  
  // Delete all data from each store
  await Promise.all([
    db.clear('orders'),
    db.clear('orderItems'),
    db.clear('productionNotes'),
    db.clear('materialsInventory'),
    db.clear('instrumentsInventory'),
    db.clear('pendingOrders'),
    db.clear('pendingItems'),
    db.clear('pendingNotes'),
    db.clear('pendingMaterials'),
    db.clear('pendingInstruments'),
    db.clear('syncLog')
  ]);
  
  console.log('IndexedDB database cleared');
}