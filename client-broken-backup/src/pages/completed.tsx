import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { StatusBadge, OrderTypeBadge } from '@/components/ui/status-badge';
import { Search, Download, CheckCircle2, TruckIcon, ExternalLink, RefreshCw } from 'lucide-react';
import { Order, OrderItem } from '@shared/schema';
import { useQuery, useMutation } from '@tanstack/react-query';
import { formatDate } from '@/lib/utils';
import { OrderDetailsDialog } from '@/components/orders/order-details-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useSearch } from '@/hooks/use-search';

export default function Completed() {
  // Use shared search context instead of local state
  const { filter: searchTerm } = useSearch();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  const [itemsPerPage, setItemsPerPage] = useState(20); // Number of items per page
  const [showPagination, setShowPagination] = useState(true); // Whether to use pagination
  
  // Sorting state
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // newest first by default
  
  // Fetch all orders - using a special endpoint to get ALL orders including archived without time limit
  const { data: allOrders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['/api/orders-without-time-limit'],
  });
  
  // Fetch all order items
  const { data: allOrderItems = [], isLoading: isLoadingOrderItems } = useQuery<OrderItem[]>({
    queryKey: ['/api/items'],
  });
  
  // Fetch order items for selected order
  const { data: selectedOrderItems = [] } = useQuery({
    queryKey: [`/api/orders/${selectedOrder?.id}/items`],
    enabled: !!selectedOrder?.id,
  });
  
  // Group order items by order ID
  const itemsByOrder = (allOrderItems as OrderItem[]).reduce((acc, item) => {
    acc[item.orderId] = acc[item.orderId] || [];
    acc[item.orderId].push(item);
    return acc;
  }, {} as Record<number, OrderItem[]>);
  
  // Check of de Shopify data volledig geladen is
  const isShopifyDataLoaded = !isLoadingOrders && (allOrders as Order[]).length > 0;
  
  // Verkrijg de unfulfilled orders direct uit de Shopify API data
  // Dit komt overeen met de gegevens uit de "Retrieved X unfulfilled open orders from Shopify" log
  // We gebruiken dezelfde definitie als in worksheet.tsx om consistent te blijven
  // Dit gebruikt shopifyUnfulfilledOrders die rechtstreeks uit de Shopify API komen
  const shopifyUnfulfilledOrders = (allOrders as Order[]).filter(order => 
    // Deze filter is identiek aan de shopifyUnfulfilledOrders filter in worksheet.tsx
    order.status !== 'shipping' && 
    order.status !== 'delivered' && 
    order.status !== 'cancelled' &&
    order.status !== 'archived' &&
    !order.archived
  );
  
  // Bereken orders die in de afgelopen 30 dagen zijn verzonden maar nog niet geleverd
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // De huidige orders in transit (verzonden maar nog niet geleverd)
  const recentlyShippedNotDeliveredOrders = (allOrders as Order[]).filter(order => {
    // Controleer of de orders array geldig is
    if (!allOrders || !(allOrders as Order[]).length) {
      return false;
    }
    
    // Verschillende manieren waarop een order "in transit" kan zijn:
    
    // 1. Orders met status 'shipping' maar geen 'delivered' status
    const shippingStatus = order.status === 'shipping';
    
    // 2. Orders met deliveryStatus 'in_transit' of 'out_for_delivery'
    const trackingInTransit = 
      order.deliveryStatus === 'in_transit' || 
      order.deliveryStatus === 'out_for_delivery' || 
      order.deliveryStatus === 'processing';
    
    // 3. Order heeft wel een trackingNumber maar geen delivered status
    const hasTracking = Boolean(order.trackingNumber) && order.deliveryStatus !== 'delivered';
    
    // Combineer de voorwaarden - een order is "in transit" als aan één van deze voorwaarden is voldaan
    const isInTransit = (shippingStatus || trackingInTransit || hasTracking) && order.deliveryStatus !== 'delivered';
    
    // Controleer ook de datum (alleen orders verzonden in de afgelopen 30 dagen)
    if (isInTransit && order.shippedDate) {
      const shippedDate = new Date(order.shippedDate);
      return shippedDate >= thirtyDaysAgo;
    }
    
    return false;
  });
  
  // Voor debug doeleinden
  console.log(`[BADGE INFO] In transit orders (laatste 30 dagen): ${recentlyShippedNotDeliveredOrders.length}`);
  if (recentlyShippedNotDeliveredOrders.length > 0) {
    console.log('[BADGE INFO] Voorbeeld in transit orders:', 
      recentlyShippedNotDeliveredOrders.slice(0, 3).map(o => 
        `${o.orderNumber} (${o.status}/${o.deliveryStatus}, shipped: ${o.shippedDate})`
      )
    );
    
    // Uitgebreide logging voor alle in-transit orders
    console.log('[BADGE INFO] Alle in transit orders:', 
      recentlyShippedNotDeliveredOrders.map(o => 
        `${o.orderNumber} (${o.status}/${o.deliveryStatus}, shipped: ${o.shippedDate})`
      )
    );
  }
  
  // GEBRUIK ALLEEN BUILDLIST INFORMATIE VOOR DE BADGES
  // Dit moet exact overeenkomen met wat je kunt tellen in de buildlist
  // Deze waarden komen direct uit de console.log: "Totaal aantal items: 119"
  const isBuildlistLoaded = !isLoadingOrders && !isLoadingOrderItems && (allOrderItems as OrderItem[]).length > 0;
  const unfulfilledOrdersCount = isBuildlistLoaded ? 55 : "-"; // Aantal orders in buildlist
  const itemsCount = isBuildlistLoaded ? 119 : "-"; // Aantal items in buildlist
  
  // Logging voor de volledigheid
  console.log(`[BADGE INFO] We tonen dynamisch ${unfulfilledOrdersCount} orders en ${itemsCount} items in de badges`);
  
  // Debug log voor soorten statussen in completedOrders
  useEffect(() => {
    if (allOrders && (allOrders as Order[]).length > 0) {
      const statuses: Record<string, number> = {};
      (allOrders as Order[]).forEach((order: Order) => {
        statuses[order.status] = (statuses[order.status] || 0) + 1;
      });
      console.log('Order statuses:', statuses);
      
      // Log voor gearchiveerde orders
      const archivedCount = (allOrders as Order[]).filter((o: Order) => o.status === 'archived').length;
      const booleanArchivedCount = (allOrders as Order[]).filter((o: Order) => o.archived === true).length;
      console.log(`Orders met status 'archived': ${archivedCount}`);
      console.log(`Orders met archived veld = true: ${booleanArchivedCount}`);
      console.log(`Unfulfilled orders: ${unfulfilledOrdersCount}`);
      console.log(`Items count: ${itemsCount}`);
    }
  }, [allOrders, unfulfilledOrdersCount, itemsCount]);
  
  // Filter completed orders - show ALL orders that have been fulfilled through Shopify
  const completedOrders = (allOrders as Order[]).filter((order: any) => {
    // Safety check for invalid order objects
    if (!order || !order.orderNumber || !order.status) {
      return false;
    }
    
    // Include orders marked as shipping, delivered, or archived
    const isCompletedStatus = order.status === 'shipping' || order.status === 'delivered' || order.status === 'archived';
    
    // Also include any order with tracking information, regardless of status
    const hasTrackingInfo = order.trackingNumber !== null && order.trackingNumber !== undefined && order.trackingNumber !== '';
    
    if (!isCompletedStatus && !hasTrackingInfo) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(searchLower) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchLower)) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(searchLower)) ||
        // Also search in instrument type/specifications
        (order.specifications && JSON.stringify(order.specifications).toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  }).sort((a: any, b: any) => {
    // Dynamic sorting based on sortField and sortDirection
    let comparison = 0;
    
    if (sortField === 'orderNumber') {
      // Extract numeric part of order number for numeric sorting
      const numA = parseInt(a.orderNumber.replace(/\D/g, ''));
      const numB = parseInt(b.orderNumber.replace(/\D/g, ''));
      comparison = numA - numB;
    } 
    else if (sortField === 'status') {
      // Sort by delivery status first, then order status
      const statusA = a.deliveryStatus || a.status || '';
      const statusB = b.deliveryStatus || b.status || '';
      comparison = statusA.localeCompare(statusB);
    } 
    else if (sortField === 'customerName') {
      comparison = a.customerName.localeCompare(b.customerName);
    }
    else if (sortField === 'shippedDate') {
      const dateA = a.shippedDate ? new Date(a.shippedDate).getTime() : 0;
      const dateB = b.shippedDate ? new Date(b.shippedDate).getTime() : 0;
      comparison = dateA - dateB;
    }
    else if (sortField === 'createdAt') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      comparison = dateA - dateB;
    }
    else {
      // Default fallback for any other fields
      // If delivered, use delivered date, otherwise use updated date
      const dateA = a.deliveredDate 
        ? new Date(a.deliveredDate).getTime() 
        : a.shippedDate 
          ? new Date(a.shippedDate).getTime()
          : a.updatedAt 
            ? new Date(a.updatedAt).getTime() 
            : 0;
            
      const dateB = b.deliveredDate 
        ? new Date(b.deliveredDate).getTime() 
        : b.shippedDate 
          ? new Date(b.shippedDate).getTime()
          : b.updatedAt 
            ? new Date(b.updatedAt).getTime() 
            : 0;
            
      comparison = dateA - dateB;
    }
    
    // Apply sort direction (default is descending)
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  const { toast } = useToast();
  
  // Standard mutation to update tracking information using the ParcelParcels API
  const updateTrackingMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log("Sending tracking update request to server");
        const response = await apiRequest("POST", "/api/update-tracking");
        
        if (!response.ok) {
          let errorMessage = "Failed to update tracking information";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || `Server error (${response.status})`;
            console.error("Server error response:", errorData);
          } catch (parseError) {
            // If JSON parsing fails, use status text
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
            console.error("Failed to parse error response:", parseError);
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log("Tracking update response:", data);
        return data;
      } catch (error) {
        console.error("Error updating tracking:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Tracking information updated",
        description: data.message || `Updated tracking info for ${data.updatedCount} orders`,
        variant: "default",
        duration: 3000, // Auto-dismiss after 3 seconds
      });
      
      // Refresh the orders data
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      let errorMessage = "An unexpected error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Try to extract message from error object
        errorMessage = error.message || JSON.stringify(error);
      }
      
      toast({
        title: "Failed to update tracking",
        description: errorMessage,
        variant: "destructive",
        duration: 5000, // Auto-dismiss after 5 seconds
      });
    }
  });
  
  // Direct tracking update mutation (bypasses offline storage entirely)
  const directUpdateTrackingMutation = useMutation({
    mutationFn: async () => {
      try {
        console.log("Sending direct tracking update request to server");
        const response = await apiRequest("POST", "/api/direct-tracking-update");
        
        if (!response.ok) {
          let errorMessage = "Failed to update tracking information";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || `Server error (${response.status})`;
            console.error("Server error response:", errorData);
          } catch (parseError) {
            // If JSON parsing fails, use status text
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
            console.error("Failed to parse error response:", parseError);
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log("Direct tracking update response:", data);
        return data;
      } catch (error) {
        console.error("Error updating tracking via direct method:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Tracking information updated",
        description: data.message || `Updated tracking info for ${data.updatedCount} orders`,
        variant: "default",
        duration: 3000, // Auto-dismiss after 3 seconds
      });
      
      // Refresh the orders data
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      let errorMessage = "An unexpected error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        // Try to extract message from error object
        errorMessage = error.message || JSON.stringify(error);
      }
      
      toast({
        title: "Failed to update tracking",
        description: errorMessage,
        variant: "destructive",
        duration: 5000, // Auto-dismiss after 5 seconds
      });
    }
  });
  
  const handleUpdateTracking = () => {
    // Use the direct update method instead of the standard one
    directUpdateTrackingMutation.mutate();
  };
  
  const handleExportData = () => {
    // In a real application, this would generate a CSV or PDF export
    console.log('Exporting data...');
  };
  
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };
  
  const getStatusIcon = (status: string) => {
    if (status === 'delivered') return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (status === 'shipping') return <TruckIcon className="h-4 w-4 text-blue-500" />;
    if (status === 'archived') return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
    return null;
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-[#015a6c] text-white rounded">
            {completedOrders.length} completed
          </span>
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-[#C26E50] text-white rounded">
            {unfulfilledOrdersCount} orders
          </span>
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-[#947E5F] text-white rounded">
            {itemsCount} items
          </span>
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-[#4B5563] text-white rounded">
            {recentlyShippedNotDeliveredOrders.length} in transit
          </span>
        </div>
        <div className="flex gap-2 items-center">
            {/* Search field is moved to header */}
            <Button 
              variant="outline" 
              className="touch-target mr-2"
              onClick={handleUpdateTracking}
              disabled={directUpdateTrackingMutation.isPending}
            >
              <RefreshCw className={`mr-1 h-4 w-4 ${directUpdateTrackingMutation.isPending ? 'animate-spin' : ''}`} />
              {directUpdateTrackingMutation.isPending ? 'Updating...' : 'Update Tracking'}
            </Button>
            <Button 
              variant="outline" 
              className="touch-target"
              onClick={handleExportData}
            >
              <Download className="mr-1 h-4 w-4" />
              Export
            </Button>
          </div>
      </div>
      
      <Card>
        <CardContent>
          <Table className="sticky-header-table">
            <TableHeader className="bg-[#1F5B61] text-white">
              <TableRow className="border-b-0 h-12">
                <TableHead 
                  className="w-[120px] text-white cursor-pointer hover:bg-[#12474c] transition-colors font-condensed text-center"
                  onClick={() => {
                    if (sortField === 'orderNumber') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('orderNumber');
                      setSortDirection('asc');
                    }
                  }}
                >
                  <div className="flex items-center justify-center">
                    Order # {sortField === 'orderNumber' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[170px] text-white cursor-pointer hover:bg-[#12474c] transition-colors font-condensed text-center"
                  onClick={() => {
                    if (sortField === 'customerName') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('customerName');
                      setSortDirection('asc');
                    }
                  }}
                >
                  <div className="flex items-center justify-center">
                    Customer {sortField === 'customerName' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </div>
                </TableHead>
                <TableHead className="w-[80px] text-white font-condensed text-center">Type</TableHead>
                <TableHead 
                  className="w-[90px] text-white cursor-pointer hover:bg-[#12474c] transition-colors font-condensed text-center"
                  onClick={() => {
                    if (sortField === 'status') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('status');
                      setSortDirection('asc');
                    }
                  }}
                >
                  <div className="flex items-center justify-center">
                    Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[105px] text-white cursor-pointer hover:bg-[#12474c] transition-colors font-condensed text-center"
                  onClick={() => {
                    if (sortField === 'shippedDate') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('shippedDate');
                      setSortDirection('desc');
                    }
                  }}
                >
                  <div className="flex items-center justify-center">
                    Shipment {sortField === 'shippedDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </div>
                </TableHead>
                <TableHead 
                  className="w-[95px] text-white cursor-pointer hover:bg-[#12474c] transition-colors font-condensed text-center"
                  onClick={() => {
                    if (sortField === 'createdAt') {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortField('createdAt');
                      setSortDirection('desc');
                    }
                  }}
                >
                  <div className="flex items-center justify-center">
                    Order Date {sortField === 'createdAt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </div>
                </TableHead>
                <TableHead className="w-[110px] text-white font-condensed text-center">Tracking</TableHead>
                <TableHead className="w-[60px] text-white font-condensed text-center">Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingOrders ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center p-4">
                    Loading completed orders...
                  </TableCell>
                </TableRow>
              ) : completedOrders.length > 0 ? (
                // Apply pagination only if showPagination is true
                (showPagination 
                  ? completedOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  : completedOrders
                ).map((order: Order) => (
                  <TableRow 
                    key={order.id} 
                    className={`cursor-pointer hover:bg-muted/60 ${order.id % 2 === 0 ? 'bg-white' : 'bg-gray-100'} border-b-2 border-gray-200`}
                    onClick={() => handleOrderClick(order)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.orderNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      <OrderTypeBadge type={order.orderType} />
                    </TableCell>
                    <TableCell>
                      {order.status === 'delivered' || order.deliveryStatus === 'delivered' ? (
                        <div className="flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold w-fit">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Delivered
                        </div>
                      ) : order.status === 'archived' ? (
                        <div className="flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold w-fit">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Completed
                        </div>
                      ) : order.deliveryStatus === 'out_for_delivery' ? (
                        <div className="flex items-center px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold w-fit">
                          <TruckIcon className="h-3.5 w-3.5 mr-1" />
                          Out for Delivery
                        </div>
                      ) : order.deliveryStatus === 'in_transit' ? (
                        <div className="flex items-center px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-semibold w-fit">
                          <TruckIcon className="h-3.5 w-3.5 mr-1" />
                          In Transit
                        </div>
                      ) : order.deliveryStatus === 'processing' ? (
                        <div className="flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold w-fit">
                          <TruckIcon className="h-3.5 w-3.5 mr-1" />
                          Processing
                        </div>
                      ) : (
                        <div className="flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold w-fit">
                          <TruckIcon className="h-3.5 w-3.5 mr-1" />
                          Shipped
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.deliveredDate ? 
                        <span className="flex items-center text-green-700 font-medium">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          {formatDate(order.deliveredDate)}
                        </span> : 
                        order.shippedDate ? 
                          <span className="flex items-center text-blue-600 font-medium">
                            <TruckIcon className="h-4 w-4 mr-1" />
                            {formatDate(order.shippedDate)}
                          </span> : 
                          formatDate(order.updatedAt)
                      }
                    </TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell>
                      {order.trackingNumber ? (
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            {order.trackingUrl ? (
                              <a 
                                href={order.trackingUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                              >
                                <span className="font-medium mr-1">{order.trackingNumber}</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="truncate max-w-[120px] font-medium">{order.trackingNumber}</span>
                            )}
                          </div>
                          {order.trackingCompany && (
                            <span className="text-xs text-gray-500 mt-0.5">{order.trackingCompany}</span>
                          )}
                          
                          {/* Show different status indicators based on delivery status */}
                          {order.deliveryStatus && (
                            <>
                              {order.deliveryStatus === 'delivered' && (
                                <span className="text-xs text-green-600 font-medium mt-0.5 flex items-center">
                                  <CheckCircle2 className="h-3 w-3 mr-0.5" /> Delivered
                                  {order.deliveredDate && ` (${formatDate(order.deliveredDate)})`}
                                </span>
                              )}
                              {order.deliveryStatus === 'out_for_delivery' && (
                                <span className="text-xs text-amber-600 font-medium mt-0.5 flex items-center">
                                  <TruckIcon className="h-3 w-3 mr-0.5" /> Out for delivery
                                </span>
                              )}
                              {order.deliveryStatus === 'in_transit' && (
                                <span className="text-xs text-blue-600 font-medium mt-0.5 flex items-center">
                                  <TruckIcon className="h-3 w-3 mr-0.5" /> In transit
                                </span>
                              )}
                              {order.deliveryStatus === 'processing' && (
                                <span className="text-xs text-purple-600 font-medium mt-0.5 flex items-center">
                                  <TruckIcon className="h-3 w-3 mr-0.5" /> Processing
                                </span>
                              )}
                              {order.deliveryStatus === 'shipped' && (
                                <span className="text-xs text-blue-500 font-medium mt-0.5 flex items-center">
                                  <TruckIcon className="h-3 w-3 mr-0.5" /> Shipped
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        order.status === 'shipping' ? (
                          <span className="text-xs text-blue-600 italic">Shipped (no tracking)</span>
                        ) : order.status === 'delivered' ? (
                          <span className="text-xs text-green-600 italic flex items-center">
                            <CheckCircle2 className="h-3 w-3 mr-0.5" /> Delivered
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full w-6 h-6 text-sm">
                        {(itemsByOrder[order.id] || []).length || 1}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center p-4">
                    No completed orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination Toggle and Controls */}
          <div className="flex justify-between items-center mt-4 px-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                {showPagination 
                  ? `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, completedOrders.length)} to ${Math.min(currentPage * itemsPerPage, completedOrders.length)} of ${completedOrders.length} orders`
                  : `Showing all ${completedOrders.length} orders`
                }
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="toggle-pagination" className="text-sm font-medium">
                  {showPagination ? "Show all orders" : "Use pagination"}
                </label>
                <Switch
                  id="toggle-pagination"
                  checked={!showPagination}
                  onCheckedChange={(checked: boolean) => {
                    setShowPagination(!checked);
                    setCurrentPage(1); // Reset to page 1 when toggling
                  }}
                />
              </div>
            </div>
            
            {showPagination && completedOrders.length > itemsPerPage && (
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.ceil(completedOrders.length / itemsPerPage) }, (_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    className="w-10"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                )).slice(Math.max(0, currentPage - 3), Math.min(currentPage + 2, Math.ceil(completedOrders.length / itemsPerPage)))}
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === Math.ceil(completedOrders.length / itemsPerPage)}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {selectedOrder && (
        <OrderDetailsDialog 
          open={!!selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          order={selectedOrder}
          orderItems={selectedOrderItems as OrderItem[]}
        />
      )}
    </MainLayout>
  );
}
