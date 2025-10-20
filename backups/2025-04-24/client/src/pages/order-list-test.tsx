import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Order, OrderItem } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function OrderListTest() {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allOrderItems, setAllOrderItems] = useState<OrderItem[]>([]);
  const [itemsByOrder, setItemsByOrder] = useState<Record<number, OrderItem[]>>({});
  
  // Fetch orders
  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders');
      const data = await response.json();
      return data;
    }
  });
  
  // Fetch order items
  const { data: orderItems, isLoading: isLoadingItems } = useQuery({
    queryKey: ['/api/order-items'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/order-items');
      const data = await response.json();
      return data;
    }
  });
  
  // Set our state when data loads
  useEffect(() => {
    if (orders) {
      setAllOrders(orders);
    }
  }, [orders]);
  
  useEffect(() => {
    if (orderItems) {
      setAllOrderItems(orderItems);
      
      // Group order items by order ID
      const grouped = orderItems.reduce((acc, item) => {
        acc[item.orderId] = acc[item.orderId] || [];
        acc[item.orderId].push(item);
        return acc;
      }, {} as Record<number, OrderItem[]>);
      
      setItemsByOrder(grouped);
    }
  }, [orderItems]);
  
  // Display loading state
  if (isLoadingOrders || isLoadingItems) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Order List Test</h1>
        <p>Loading orders...</p>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Order List Test</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Order Information</h2>
        <p>Total Orders: {allOrders.length}</p>
        <p>Total Order Items: {allOrderItems.length}</p>
        <p>Orders with Multiple Items: {Object.values(itemsByOrder).filter(items => items.length > 1).length}</p>
      </div>
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-2">Orders with Multiple Items</h2>
        
        {Object.entries(itemsByOrder)
          .filter(([_, items]) => items.length > 1)
          .map(([orderId, items]) => {
            const order = allOrders.find(o => o.id === Number(orderId));
            if (!order) return null;
            
            return (
              <div key={orderId} className="border rounded p-4 bg-gray-50">
                <h3 className="font-bold">
                  Order {order.orderNumber} - {items.length} items
                </h3>
                
                <div className="mt-2 space-y-2">
                  {items.map((item, index) => (
                    <div key={item.id} className="bg-white p-2 rounded border">
                      <p>
                        <strong>Serial #:</strong> {item.serialNumber} (Item {index + 1})
                      </p>
                      <p><strong>Type:</strong> {item.itemType}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}