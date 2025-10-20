import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { FileText, X, ExternalLink, CheckCircle2, TruckIcon } from 'lucide-react';
import { formatDate, getStatusIcon, getStatusLabel } from '@/lib/utils';
import { Order, OrderItem } from '@shared/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface OrderDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  order: Order;
  orderItems: OrderItem[];
}

// Helper functions for calculating waiting time
const getDaysSinceOrder = (orderDate: Date | string | null) => {
  if (!orderDate) return "—";
  
  const orderTimestamp = new Date(orderDate).getTime();
  const currentTimestamp = new Date().getTime();
  const daysDiff = Math.floor((currentTimestamp - orderTimestamp) / (24 * 60 * 60 * 1000));
  
  return daysDiff;
}

const getWaitingColorClass = (days: number): string => {
  if (days < 30) {
    return 'bg-green-100 text-green-800'; // Green for < 30 days
  } else if (days < 60) {
    return 'bg-yellow-100 text-yellow-800'; // Yellow for 30-60 days
  } else if (days < 90) {
    return 'bg-orange-200 text-orange-800'; // Orange for 60-90 days
  } else if (days < 120) {
    return 'bg-red-100 text-red-800'; // Red for 90-120 days
  } else {
    return 'bg-red-600 text-white font-bold'; // Signal red for orders waiting 120+ days
  }
}

export function OrderDetailsDialog({ open, onClose, order, orderItems }: OrderDetailsDialogProps) {
  const [notes, setNotes] = useState(order.notes || '');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const statusTimeline = [
    { status: 'materials_prep', label: 'Materials Preparation', icon: 'inventory_2' },
    { status: 'crafting', label: 'Crafting', icon: 'construction' },
    { status: 'firing', label: 'Firing/Kilning', icon: 'local_fire_department' },
    { status: 'tuning_testing', label: 'Tuning and Testing', icon: 'music_note' },
    { status: 'completed', label: 'Completed', icon: 'check_circle' },
    { status: 'shipped', label: 'Shipped', icon: 'local_shipping' }
  ];
  
  const updateNotesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        'PATCH',
        `/api/orders/${order.id}`,
        { notes }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Notes Updated",
        description: "Production notes have been updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update production notes",
      });
    }
  });
  
  const handleSaveNotes = () => {
    updateNotesMutation.mutate();
  };
  
  const getCurrentStatusIndex = () => {
    return statusTimeline.findIndex(item => item.status === order.status);
  };
  
  // Get mock stage dates for demo
  const getStatusDate = (statusIndex: number) => {
    if (statusIndex > getCurrentStatusIndex()) {
      return null;
    }
    
    const orderDate = order.orderDate ? new Date(order.orderDate) : new Date();
    const date = new Date(orderDate);
    date.setDate(date.getDate() + (statusIndex * 3) + 2);
    return date;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex justify-between items-center py-4 px-6 border-b dark:border-gray-700">
          <DialogTitle className="text-xl font-semibold">Order #{order.orderNumber}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Order Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Order Date</span>
                  <p className="font-medium">{formatDate(order.orderDate)}</p>
                  <div className="mt-1 flex items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Waiting Time:</span>
                    {typeof getDaysSinceOrder(order.orderDate) === 'number' && (
                      <span className={`text-sm px-2 py-0.5 rounded font-medium ${getWaitingColorClass(getDaysSinceOrder(order.orderDate) as number)}`}>
                        {getDaysSinceOrder(order.orderDate)} days
                      </span>
                    )}
                  </div>
                </div>
                {order.shopifyOrderId && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Shopify Order ID</span>
                    <p className="font-medium">#{order.shopifyOrderId}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Order Type</span>
                  <p className="font-medium capitalize">{order.orderType}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                  <div className="flex items-center mt-1">
                    <StatusBadge status={order.status} />
                    <span className="ml-2 text-sm">{order.progress ? `(${order.progress}% complete)` : ''}</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Deadline</span>
                  <p className="font-medium text-accent">{formatDate(order.deadline)}</p>
                </div>
                
                {/* Show shipping information for shipping/delivered orders */}
                {(order.status === 'shipping' || order.status === 'delivered') && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Shipping Information</h4>
                    {order.trackingNumber ? (
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Tracking Number</span>
                          <div className="flex items-center mt-1">
                            {order.trackingUrl ? (
                              <a 
                                href={order.trackingUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                              >
                                <span className="font-medium">{order.trackingNumber}</span>
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            ) : (
                              <span className="font-medium">{order.trackingNumber}</span>
                            )}
                          </div>
                        </div>
                        
                        {order.trackingCompany && (
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Carrier</span>
                            <p className="font-medium">{order.trackingCompany}</p>
                          </div>
                        )}

                        {/* Show delivery status information */}
                        {order.deliveryStatus && (
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                            <div className="mt-1">
                              {order.deliveryStatus === 'delivered' && (
                                <span className="text-sm text-green-600 font-medium flex items-center">
                                  <CheckCircle2 className="h-4 w-4 mr-1" /> Delivered
                                  {order.deliveredDate && ` (${formatDate(order.deliveredDate)})`}
                                </span>
                              )}
                              {order.deliveryStatus === 'out_for_delivery' && (
                                <span className="text-sm text-amber-600 font-medium flex items-center">
                                  <TruckIcon className="h-4 w-4 mr-1" /> Out for delivery
                                </span>
                              )}
                              {order.deliveryStatus === 'in_transit' && (
                                <span className="text-sm text-blue-600 font-medium flex items-center">
                                  <TruckIcon className="h-4 w-4 mr-1" /> In transit
                                </span>
                              )}
                              {order.deliveryStatus === 'processing' && (
                                <span className="text-sm text-purple-600 font-medium flex items-center">
                                  <TruckIcon className="h-4 w-4 mr-1" /> Processing
                                </span>
                              )}
                              {order.deliveryStatus === 'shipped' && (
                                <span className="text-sm text-blue-500 font-medium flex items-center">
                                  <TruckIcon className="h-4 w-4 mr-1" /> Shipped
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No tracking information available</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Customer Information</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
                  <p className="font-medium">{order.customerName}</p>
                </div>
                {order.customerEmail && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                    <p className="font-medium">{order.customerEmail}</p>
                  </div>
                )}
                {order.customerPhone && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Phone</span>
                    <p className="font-medium">{order.customerPhone}</p>
                  </div>
                )}
                {order.notes && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Notes</span>
                    <p className="font-medium">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Item Details</h3>
            <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Serial #</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Specifications</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {orderItems.length > 0 ? (
                    orderItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{item.serialNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{item.itemType}</td>
                        <td className="px-6 py-4 text-sm">
                          {item.specifications && typeof item.specifications === 'object' && 
                            Object.entries(item.specifications as Record<string, string>).map(([key, value]) => (
                              <p key={key}>{key}: {value}</p>
                            ))
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No items found for this order
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Production Timeline</h3>
            <div className="relative">
              <div className="absolute h-full w-0.5 bg-gray-200 dark:bg-gray-700 left-5"></div>
              
              {statusTimeline.map((status, index) => {
                const isCurrentOrPast = index <= getCurrentStatusIndex();
                const statusDate = getStatusDate(index);
                
                return (
                  <div key={status.status} className={`relative flex items-start mb-4 ${!isCurrentOrPast ? 'opacity-50' : ''}`}>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center z-10 ${
                      isCurrentOrPast 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      <span className="material-icons">{status.icon}</span>
                    </div>
                    <div className="ml-6 pt-1">
                      <div className="font-medium">{status.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {statusDate 
                          ? `Completed on ${formatDate(statusDate)}` 
                          : index === getCurrentStatusIndex()
                            ? `In progress${order.deadline ? ` (Target: ${formatDate(order.deadline)})` : ''}`
                            : 'Estimated ' + (order.deadline ? formatDate(order.deadline) : 'upcoming')
                        }
                      </div>
                      {index === getCurrentStatusIndex() && (
                        <div className="text-sm mt-1">
                          {status.status === 'materials_prep' && 'Clay prepared, glaze mixed, tools selected'}
                          {status.status === 'crafting' && 'Basic form complete, adding finger holes and mouthpiece'}
                          {status.status === 'firing' && 'Kiln firing in progress'}
                          {status.status === 'tuning_testing' && 'Fine tuning sound quality'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">Production Notes</h3>
            <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                rows={3} 
                className="w-full p-3 focus:ring-primary border-none dark:bg-gray-800" 
                placeholder="Add production notes here..."
              />
              <div className="bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 p-3 flex justify-between items-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Last updated {formatDate(order.updatedAt)}
                </div>
                <Button 
                  onClick={handleSaveNotes} 
                  className="touch-target px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm"
                  disabled={updateNotesMutation.isPending}
                >
                  Save Notes
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="border-t dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
          <Button variant="outline" className="touch-target text-gray-700 dark:text-gray-300">
            <FileText className="mr-1 h-4 w-4" />
            Print Order
          </Button>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="touch-target">
              Close
            </Button>
            <Button 
              className="touch-target bg-primary hover:bg-primary/90 text-white"
              disabled={updateNotesMutation.isPending}
              onClick={handleSaveNotes}
            >
              Update Order
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
