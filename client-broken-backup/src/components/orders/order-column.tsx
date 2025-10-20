import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderCard } from './order-card';
import { OrderItemCard } from './order-item-card';
import { AddOrderDialog } from './add-order-dialog';
import { Order, OrderItem } from '@shared/schema';
import { Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface OrderColumnProps {
  title: string;
  status: string;
  orders: Order[];
  onStatusChange?: (orderId: number, newStatus: string) => void;
}

export function OrderColumn({ title, status, orders, onStatusChange }: OrderColumnProps) {
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  // Fetch all order items
  const { data: allOrderItems = [] } = useQuery({
    queryKey: ['/api/items'],
  });
  
  // Filter items that belong to the orders in this column
  useEffect(() => {
    if (allOrderItems && orders) {
      // Get all order IDs for orders in this column
      const orderIds = orders.map(order => order.id);
      
      // Filter items that belong to those orders
      const filteredItems = (allOrderItems as OrderItem[]).filter(
        item => orderIds.includes(item.orderId)
      );
      
      setOrderItems(filteredItems);
    }
  }, [allOrderItems, orders]);
  
  // Count all items, not just orders
  const itemCount = orderItems.length;
  
  return (
    <div className="min-w-[280px] flex flex-col bg-gray-100 dark:bg-gray-900 rounded-xl p-3">
      <div className="flex justify-between items-center mb-3 p-2">
        <h3 className="font-semibold text-lg">{title}</h3>
        <span className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md text-sm">
          {itemCount}
        </span>
      </div>
      
      <div className="overflow-y-auto max-h-[calc(100vh-220px)] space-y-3">
        {orderItems.map((item) => {
          // Find the parent order for this item
          const parentOrder = orders.find(order => order.id === item.orderId);
          if (!parentOrder) return null;
          
          return (
            <OrderItemCard 
              key={item.id} 
              item={item}
              parentOrder={parentOrder}
              onStatusChange={onStatusChange}
            />
          );
        })}
        
        {orderItems.length === 0 && (
          <Card className="bg-white/50 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-700">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No items in this stage</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <Button 
        variant="outline" 
        className="touch-target mt-3 w-full py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 hover:text-gray-600"
        onClick={() => setIsAddOrderOpen(true)}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Order
      </Button>
      
      <AddOrderDialog 
        open={isAddOrderOpen} 
        onClose={() => setIsAddOrderOpen(false)} 
        initialStatus={status}
      />
    </div>
  );
}
