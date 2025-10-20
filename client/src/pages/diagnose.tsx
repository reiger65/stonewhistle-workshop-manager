import React, { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

// Status van orders
type OrderStatus = 'ordered' | 'building' | 'validated' | 'testing' | 'shipping' | 'delivered' | 'cancelled';

// Simpele definitie van status mapping
const STATUS_MAPPING: Record<string, string> = {
  'ordered': 'ordered',
  'parts': 'parts',
  'prepared': 'prepared',
  'build': 'building',
  'building': 'building',
  'dry': 'dry',
  'terrasigillata': 'terrasigillata',
  'firing': 'firing',
  'smokefiring': 'smokefiring',
  'smoothing': 'smoothing',
  'tuning1': 'tuning1',
  'waxing': 'waxing',
  'tuning2': 'tuning2',
  'bagging': 'bagging',
  'boxing': 'boxing',
  'labeling': 'labeling',
  'testing': 'testing',
  'validated': 'validated'
};

// Versimpelde item definitie
interface OrderItem {
  id: number;
  orderId: number;
  serialNumber?: string;
  specifications?: Record<string, any>;
  statusChangeDates?: Record<string, string>;
  isArchived?: boolean;
}

// Versimpelde Order definitie
interface Order {
  id: number;
  orderNumber?: string;
  status: OrderStatus;
  archived?: boolean;
}

export default function DiagnosePage() {
  const [diagnoseResult, setDiagnoseResult] = useState<string>('');
  const [hasDryItems, setHasDryItems] = useState(0);
  const [hasTsItems, setHasTsItems] = useState(0);
  const [hasSmItems, setHasSmItems] = useState(0);
  const [hasStatusChangeDates, setHasStatusChangeDates] = useState(0);
  const [activeItems, setActiveItems] = useState(0);
  
  // Fetch order items
  const { data: orderItems, isLoading: orderItemsLoading } = useQuery<OrderItem[]>({
    queryKey: ['/api/order-items'],
  });
  
  // Fetch orders
  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });
  
  // Diagnose functie
  const runDiagnose = () => {
    if (!orderItems || !orders) {
      setDiagnoseResult('Geen data beschikbaar om te diagnosticeren.');
      return;
    }
    
    const results = [];
    let totalItems = 0;
    let itemsWithStatusChangeDates = 0;
    let itemsWithDryStatus = 0;
    let itemsWithTsStatus = 0;
    let itemsWithSmStatus = 0;
    let nonArchivedItems = 0;
    
    // Check alle items
    orderItems.forEach(item => {
      totalItems++;
      
      // Tel niet-gearchiveerde items
      if (!item.isArchived) {
        nonArchivedItems++;
      }
      
      // Tel items met statusChangeDates
      if (item.statusChangeDates && Object.keys(item.statusChangeDates).length > 0) {
        itemsWithStatusChangeDates++;
        
        // Check op specifieke statussen
        if ('dry' in item.statusChangeDates) {
          itemsWithDryStatus++;
        }
        
        if ('terrasigillata' in item.statusChangeDates) {
          itemsWithTsStatus++;
        }
        
        if ('smokefiring' in item.statusChangeDates) {
          itemsWithSmStatus++;
        }
      }
    });
    
    // Stel resultaten in
    setHasStatusChangeDates(itemsWithStatusChangeDates);
    setHasDryItems(itemsWithDryStatus);
    setHasTsItems(itemsWithTsStatus);
    setHasSmItems(itemsWithSmStatus);
    setActiveItems(nonArchivedItems);
    
    // Bouw diagnose resultaat
    results.push(`Totaal aantal items: ${totalItems}`);
    results.push(`Aantal actieve (niet-gearchiveerde) items: ${nonArchivedItems}`);
    results.push(`Aantal items met statusChangeDates: ${itemsWithStatusChangeDates}`);
    results.push(`Aantal items met 'dry' status: ${itemsWithDryStatus}`);
    results.push(`Aantal items met 'terrasigillata' (TS) status: ${itemsWithTsStatus}`);
    results.push(`Aantal items met 'smokefiring' (SM) status: ${itemsWithSmStatus}`);
    
    // Toon voorbeelden van statusChangeDates
    if (itemsWithStatusChangeDates > 0) {
      const exampleItems = orderItems
        .filter(item => item.statusChangeDates && Object.keys(item.statusChangeDates).length > 0)
        .slice(0, 3);
        
      results.push('\n--- VOORBEELDEN VAN STATUSCHANGEDATES ---');
      exampleItems.forEach(item => {
        results.push(`Item ${item.serialNumber} heeft deze statusChangeDates:`);
        results.push(JSON.stringify(item.statusChangeDates, null, 2));
      });
    }
    
    // Controleer op specifieke TS of SM items
    const tsItems = orderItems.filter(item => 
      item.statusChangeDates && 'terrasigillata' in item.statusChangeDates
    ).slice(0, 3);
    
    if (tsItems.length > 0) {
      results.push('\n--- VOORBEELDEN VAN ITEMS MET TS STATUS ---');
      tsItems.forEach(item => {
        results.push(`Item ${item.serialNumber} heeft TS status op: ${item.statusChangeDates?.terrasigillata}`);
      });
    } else {
      results.push('\nGEEN ITEMS MET TS STATUS GEVONDEN!');
    }
    
    // Set diagnose resultaat
    setDiagnoseResult(results.join('\n'));
  };
  
  return (
    <MainLayout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Filter Diagnose Tool</h1>
        
        <div className="mb-4">
          <Button onClick={runDiagnose} disabled={orderItemsLoading || ordersLoading}>
            Diagnose Uitvoeren
          </Button>
        </div>
        
        {(orderItemsLoading || ordersLoading) && (
          <div className="mb-4">Data wordt geladen...</div>
        )}
        
        {!orderItemsLoading && !ordersLoading && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Basisstatistieken:</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-4">
              <div className="bg-white p-4 rounded border">
                <div className="text-lg font-semibold">{orderItems?.length || 0}</div>
                <div className="text-sm text-gray-500">Totaal aantal items</div>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <div className="text-lg font-semibold">{activeItems}</div>
                <div className="text-sm text-gray-500">Actieve items</div>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <div className="text-lg font-semibold">{hasStatusChangeDates}</div>
                <div className="text-sm text-gray-500">Items met statusChangeDates</div>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <div className="text-lg font-semibold">{orders?.length || 0}</div>
                <div className="text-sm text-gray-500">Totaal aantal orders</div>
              </div>
            </div>
            
            <h2 className="text-lg font-semibold mt-4">Status statistieken:</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-4 rounded border">
                <div className="text-lg font-semibold">{hasDryItems}</div>
                <div className="text-sm text-gray-500">Items met 'dry' status</div>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <div className="text-lg font-semibold">{hasTsItems}</div>
                <div className="text-sm text-gray-500">Items met 'TS' status</div>
              </div>
              
              <div className="bg-white p-4 rounded border">
                <div className="text-lg font-semibold">{hasSmItems}</div>
                <div className="text-sm text-gray-500">Items met 'SM' status</div>
              </div>
            </div>
          </div>
        )}
        
        {diagnoseResult && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Diagnose Resultaat:</h2>
            <pre className="bg-black text-white p-4 rounded overflow-auto max-h-96 whitespace-pre-wrap">
              {diagnoseResult}
            </pre>
          </div>
        )}
      </div>
    </MainLayout>
  );
}