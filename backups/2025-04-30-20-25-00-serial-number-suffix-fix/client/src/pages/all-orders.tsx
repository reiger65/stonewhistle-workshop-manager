import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/main-layout';
import { OrderTable } from '@/components/orders/order-table';
import { OrderDetailsDialog } from '@/components/orders/order-details-dialog';
import { AddOrderDialog } from '@/components/orders/add-order-dialog';
import { Button } from '@/components/ui/button';
import { Order, OrderItem } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { syncShopifyOrders } from '@/lib/shopify';
import { Loader2, RefreshCw, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';

export default function AllOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [craftsperson, setCraftsperson] = useState<string>('all');

  // Fetch all orders
  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: getQueryFn<Order[]>({ on401: 'returnNull' })
  });

  // Fetch order items for the selected order
  const { data: orderItems = [] } = useQuery({
    queryKey: ['/api/orders', selectedOrder?.id, '/items'],
    queryFn: getQueryFn<OrderItem[]>({ on401: 'returnNull' }),
    enabled: selectedOrder !== null
  });

  // Mutation for syncing Shopify orders
  const { mutate: syncOrders, isPending: isSyncing } = useMutation({
    mutationFn: syncShopifyOrders,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: 'Success',
          description: data.message,
        });
        // Refresh orders list
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      } else {
        toast({
          title: 'Error',
          description: data.message,
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to sync orders: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Handle order click to open details dialog
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setOpenDetailsDialog(true);
  };

  // Filter orders based on current filters
  const filteredOrders = allOrders.filter((order: Order) => {
    // Filter by order type
    if (filterType !== 'all' && order.orderType !== filterType) {
      return false;
    }
    
    // Search by order number or customer name
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Workshop Orders</h1>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button 
              onClick={() => setOpenAddDialog(true)}
              className="w-full sm:w-auto"
            >
              Add Order
            </Button>
            
            <Button
              variant="outline"
              onClick={() => syncOrders()}
              disabled={isSyncing}
              className="w-full sm:w-auto"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync with Shopify
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-2 w-full md:w-auto">
            <Select
              value={filterType}
              onValueChange={setFilterType}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Order Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Order Types</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="reseller">Reseller</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={craftsperson}
              onValueChange={setCraftsperson}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Craftsperson" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Craftspeople</SelectItem>
                <SelectItem value="alan">Alan</SelectItem>
                <SelectItem value="svaram">Svaram</SelectItem>
                <SelectItem value="ivo">Ivo</SelectItem>
                <SelectItem value="mita">Mita</SelectItem>
                <SelectItem value="hans">Hans</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative w-full md:w-auto flex-grow md:flex-grow-0 md:min-w-[300px]">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search orders..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="table">Spreadsheet View</TabsTrigger>
            <TabsTrigger value="kanban">Kanban View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="table" className="w-full">
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <OrderTable 
                orders={filteredOrders}
                onOrderClick={handleOrderClick}
              />
            )}
          </TabsContent>
          
          <TabsContent value="kanban">
            <div className="text-center p-6 border rounded-md bg-muted/10">
              <p>Kanban view is available in the "Production" page.</p>
              <Button variant="link" onClick={() => window.location.href = '/production'}>
                Go to Production View
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Order Details Dialog */}
      {selectedOrder && (
        <OrderDetailsDialog
          open={openDetailsDialog}
          onClose={() => setOpenDetailsDialog(false)}
          order={selectedOrder}
          orderItems={orderItems}
        />
      )}
      
      {/* Add Order Dialog */}
      <AddOrderDialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
      />
    </MainLayout>
  );
}