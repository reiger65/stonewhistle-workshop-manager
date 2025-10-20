import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { OrderColumn } from '@/components/orders/order-column';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Order, OrderItem } from '@shared/schema';

export default function Production() {
  const [filter, setFilter] = useState({
    orderType: 'all',
    instrument: 'all',
    timeframe: 'all'
  });
  
  // Fetch all orders
  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ['/api/orders'],
  });
  
  // Group orders by status
  const ordersByStatus = {
    ordered: [] as Order[],
    validated: [] as Order[],
    building: [] as Order[],
    firing: [] as Order[],
    smoothing: [] as Order[],
    tuning1: [] as Order[],
    waxing: [] as Order[],
    tuning2: [] as Order[]
  };
  
  // Apply filters and group orders
  const filteredOrders = (allOrders as Order[]).filter((order: Order) => {
    // Only include active production orders (not completed or shipped)
    if (order.status === 'completed' || order.status === 'shipped' || order.status === 'cancelled') {
      return false;
    }
    
    // Apply type filter
    if (filter.orderType !== 'all' && order.orderType !== filter.orderType) {
      return false;
    }
    
    // For now, we don't have instrument data in the order itself
    // In a real implementation, we would filter by instrument type
    
    return true;
  });
  
  // Group orders by status
  filteredOrders.forEach((order: Order) => {
    if (ordersByStatus[order.status as keyof typeof ordersByStatus]) {
      ordersByStatus[order.status as keyof typeof ordersByStatus].push(order);
    }
  });
  
  // Handle status change
  const handleStatusChange = (orderId: number, newStatus: string) => {
    // This will be handled by the mutation in OrderCard component
    // We don't need to do anything here as the query will be invalidated
  };

  return (
    <MainLayout>
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <Select 
            value={filter.orderType} 
            onValueChange={(value) => setFilter({...filter, orderType: value})}
          >
            <SelectTrigger className="touch-target w-full px-4 py-3 rounded-lg">
              <SelectValue placeholder="All Order Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Order Types</SelectItem>
              <SelectItem value="retail">Retail Orders</SelectItem>
              <SelectItem value="reseller">Reseller Orders</SelectItem>
              <SelectItem value="custom">Custom Orders</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <Select 
            value={filter.instrument} 
            onValueChange={(value) => setFilter({...filter, instrument: value})}
          >
            <SelectTrigger className="touch-target w-full px-4 py-3 rounded-lg">
              <SelectValue placeholder="All Instruments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Instruments</SelectItem>
              <SelectItem value="INNATO">INNATO</SelectItem>
              <SelectItem value="NATEY">NATEY</SelectItem>
              <SelectItem value="DOUBLE">DOUBLE</SelectItem>
              <SelectItem value="ZEN">ZEN</SelectItem>
              <SelectItem value="OVA">OvA</SelectItem>
              <SelectItem value="CARDS">CARDS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <Select 
            value={filter.timeframe} 
            onValueChange={(value) => setFilter({...filter, timeframe: value})}
          >
            <SelectTrigger className="touch-target w-full px-4 py-3 rounded-lg">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last Quarter</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" className="touch-target bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 px-5 py-3 rounded-lg flex items-center">
          <Filter className="mr-1 h-4 w-4" />
          <span>More Filters</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
        <OrderColumn 
          title="Parts Build (O)" 
          status="ordered" 
          orders={ordersByStatus.ordered || []}
          onStatusChange={handleStatusChange}
        />
        
        <OrderColumn 
          title="Part Together (V)" 
          status="validated" 
          orders={ordersByStatus.validated || []}
          onStatusChange={handleStatusChange}
        />
        
        <OrderColumn 
          title="Build & Drying"
          status="building" 
          orders={ordersByStatus.building || []}
          onStatusChange={handleStatusChange}
        />
        
        <OrderColumn 
          title="Firing (🔥)"
          status="firing" 
          orders={ordersByStatus.firing || []}
          onStatusChange={handleStatusChange}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto mt-6">
        <OrderColumn 
          title="Smokefire (SM)" 
          status="smoothing" 
          orders={ordersByStatus.smoothing || []}
          onStatusChange={handleStatusChange}
        />
        
        <OrderColumn 
          title="First Tuning (T1)" 
          status="tuning1" 
          orders={ordersByStatus.tuning1 || []}
          onStatusChange={handleStatusChange}
        />
        
        <OrderColumn 
          title="Waxing (WAX)"
          status="waxing" 
          orders={ordersByStatus.waxing || []}
          onStatusChange={handleStatusChange}
        />
        
        <OrderColumn 
          title="Second Tuning (T2)"
          status="tuning2" 
          orders={ordersByStatus.tuning2 || []}
          onStatusChange={handleStatusChange}
        />
      </div>
    </MainLayout>
  );
}
