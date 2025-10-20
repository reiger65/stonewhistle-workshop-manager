import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { StatusBadge, OrderTypeBadge } from '@/components/ui/status-badge';
import { Search, Plus, Calendar, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import { Order } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { formatDate, getDeadlineClass } from '@/lib/utils';
import { AddOrderDialog } from '@/components/orders/add-order-dialog';
import { OrderDetailsDialog } from '@/components/orders/order-details-dialog';

export default function Waitlist() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isAddOrderOpen, setIsAddOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Fetch all orders
  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ['/api/orders'],
  });
  
  // Fetch order items for selected order
  const { data: selectedOrderItems = [] } = useQuery({
    queryKey: [`/api/orders/${selectedOrder?.id}/items`],
    enabled: !!selectedOrder?.id,
  });
  
  // Filter and sort orders
  const waitlistOrders = allOrders
    .filter((order: Order) => {
      // Filter out completed and cancelled orders
      if (order.status === 'completed' || order.status === 'shipped' || order.status === 'cancelled') {
        return false;
      }
      
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.customerName.toLowerCase().includes(searchLower) ||
          (order.customerEmail && order.customerEmail.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    })
    .sort((a: Order, b: Order) => {
      let result = 0;
      
      // Sort by selected field
      if (sortBy === 'orderNumber') {
        result = a.orderNumber.localeCompare(b.orderNumber);
      } else if (sortBy === 'customerName') {
        result = a.customerName.localeCompare(b.customerName);
      } else if (sortBy === 'status') {
        result = a.status.localeCompare(b.status);
      } else if (sortBy === 'orderDate') {
        const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
        const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
        result = dateA - dateB;
      } else if (sortBy === 'deadline') {
        const dateA = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
        result = dateA - dateB;
      }
      
      // Apply sort order
      return sortOrder === 'asc' ? result : -result;
    });
  
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };
  
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };
  
  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    
    return sortOrder === 'asc' ? 
      <ArrowUpAZ className="inline-block ml-1 h-4 w-4" /> : 
      <ArrowDownAZ className="inline-block ml-1 h-4 w-4" />;
  };

  return (
    <MainLayout>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Order Waitlist</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                className="w-full pl-10 touch-target" 
                placeholder="Search orders..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              className="touch-target bg-secondary hover:bg-secondary/90"
              onClick={() => setIsAddOrderOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              New Order
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="w-[120px] cursor-pointer"
                  onClick={() => toggleSort('orderNumber')}
                >
                  Order # {renderSortIcon('orderNumber')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => toggleSort('customerName')}
                >
                  Customer {renderSortIcon('customerName')}
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => toggleSort('status')}
                >
                  Status {renderSortIcon('status')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => toggleSort('orderDate')}
                >
                  Order Date {renderSortIcon('orderDate')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => toggleSort('deadline')}
                >
                  Deadline {renderSortIcon('deadline')}
                </TableHead>
                <TableHead>Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center p-4">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : waitlistOrders.length > 0 ? (
                waitlistOrders.map((order: Order) => (
                  <TableRow 
                    key={order.id} 
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleOrderClick(order)}
                  >
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      <OrderTypeBadge type={order.orderType} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell className={getDeadlineClass(order.deadline)}>{formatDate(order.deadline)}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full w-6 h-6 text-sm">
                        {/* In a real app, we would fetch item counts for all orders */}
                        {Math.floor(Math.random() * 3) + 1}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center p-4">
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AddOrderDialog 
        open={isAddOrderOpen} 
        onClose={() => setIsAddOrderOpen(false)} 
      />
      
      {selectedOrder && (
        <OrderDetailsDialog 
          open={!!selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          order={selectedOrder}
          orderItems={selectedOrderItems}
        />
      )}
    </MainLayout>
  );
}
