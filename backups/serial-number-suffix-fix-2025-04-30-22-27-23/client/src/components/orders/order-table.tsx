import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Order, OrderItem } from '@shared/schema';
import { formatDate, getStatusIcon } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';

// Helper function to safely render specifications
function renderSpecifications(specifications: unknown): React.ReactNode {
  if (!specifications || typeof specifications !== 'object') {
    return null;
  }
  
  try {
    return Object.entries(specifications as Record<string, unknown>).map(([key, value]) => (
      <div key={key} className="text-xs">
        <span className="font-medium">{key}:</span> {String(value)}
      </div>
    ));
  } catch (error) {
    console.error('Failed to render specifications:', error);
    return <div className="text-xs text-gray-500">Unable to display specifications</div>;
  }
}

interface OrderTableProps {
  orders: Order[];
  onOrderClick: (order: Order) => void;
}

export function OrderTable({ orders, onOrderClick }: OrderTableProps) {
  // State for storing items for each order
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  
  // Create a mapping of order statuses
  const orderStatusColumns = [
    'ordered',
    'validated',
    'building',
    'testing',
    'firing',
    'smoothing',
    'tuning1',
    'waxing',
    'tuning2',
    'bagging',
    'boxing',
    'labeling',
    'shipping',
    'delivered'
  ];

  // Fetch order items when an order is expanded
  const { data: orderItems = [] } = useQuery({
    queryKey: ['orders', expandedOrderId, 'items'],
    queryFn: getQueryFn<OrderItem[]>({ on401: 'returnNull' }),
    enabled: expandedOrderId !== null
  });

  // Function to check if a status is complete for an order
  const isStatusComplete = (order: Order, status: string) => {
    // Get the index of the current status and the status we're checking
    const statusList = orderStatusColumns;
    const currentStatusIndex = statusList.indexOf(order.status);
    const checkStatusIndex = statusList.indexOf(status);
    
    // If the current status index is greater than or equal to the check status index,
    // then the check status is complete
    return currentStatusIndex >= checkStatusIndex;
  };

  return (
    <div className="w-full overflow-auto border rounded-md">
      <Table className="min-w-max">
        <TableHeader className="bg-[#1F5B61] text-white">
          <TableRow className="border-b-0">
            <TableHead className="w-12 text-white"></TableHead>
            <TableHead className="w-32 text-white">Order #</TableHead>
            <TableHead className="w-40 text-white">Date</TableHead>
            <TableHead className="w-48 text-white">Customer</TableHead>
            <TableHead className="w-40 text-white">Type</TableHead>
            {orderStatusColumns.map(status => (
              <TableHead key={status} className="text-center w-16 text-white">
                {getStatusIcon(status)}
              </TableHead>
            ))}
            <TableHead className="w-32 text-white">Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(order => (
            <React.Fragment key={order.id}>
              <TableRow 
                className={`cursor-pointer hover:bg-muted/60 ${order.id % 2 === 0 ? 'bg-white' : 'bg-gray-100'} border-b-2 border-gray-200`}
                onClick={() => onOrderClick(order)}
              >
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedOrderId(expandedOrderId === order.id ? null : order.id);
                    }}
                  >
                    {expandedOrderId === order.id ? '−' : '+'}
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>{formatDate(order.orderDate)}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{order.orderType}</TableCell>
                
                {orderStatusColumns.map(status => (
                  <TableCell key={status} className="text-center">
                    {isStatusComplete(order, status) ? (
                      <Checkbox checked className="mx-auto" />
                    ) : (
                      <div className="h-4 w-4 mx-auto" />
                    )}
                  </TableCell>
                ))}
                
                <TableCell className="truncate max-w-[120px]">
                  {order.notes}
                </TableCell>
              </TableRow>
              
              {/* Expanded row for order items */}
              {expandedOrderId === order.id && (
                <TableRow className="bg-[#F5F5F0] border-l-4 border-[#1F5B61]">
                  <TableCell colSpan={5 + orderStatusColumns.length + 1} className="p-0">
                    <div className="p-4">
                      <h4 className="text-sm font-medium mb-2 text-[#1F5B61]">Order Items</h4>
                      <Table>
                        <TableHeader className="bg-[#1F5B61]/90 text-white">
                          <TableRow className="border-b-0">
                            <TableHead className="text-white">Serial #</TableHead>
                            <TableHead className="text-white">Type</TableHead>
                            <TableHead className="text-white">Status</TableHead>
                            <TableHead className="text-white">Specifications</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orderItems.map(item => (
                            <TableRow key={item.id} className={item.id % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <TableCell className="font-medium">{item.serialNumber}</TableCell>
                              <TableCell>{item.itemType}</TableCell>
                              <TableCell>{getStatusIcon(item.status)}</TableCell>
                              <TableCell>
                                {item.specifications && typeof item.specifications === 'object' ? 
                                  Object.entries(item.specifications as Record<string, unknown>).map(([key, value]) => (
                                    <div key={key} className="text-xs">
                                      <span className="font-medium">{key}:</span> {String(value)}
                                    </div>
                                  ))
                                  : null
                                }
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
          
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={5 + orderStatusColumns.length + 1} className="h-24 text-center">
                No orders found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}