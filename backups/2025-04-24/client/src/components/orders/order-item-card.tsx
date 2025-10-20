import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, OrderTypeBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';
import { formatDate, getDeadlineClass, cn } from '@/lib/utils';
import { Order, OrderItem } from '@shared/schema';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { OrderDetailsDialog } from './order-details-dialog';
import { useToast } from '@/hooks/use-toast';
import { Edit, ArrowRight, CheckCircle2 } from 'lucide-react';

interface OrderItemCardProps {
  item: OrderItem;
  parentOrder: Order;
  onStatusChange?: (orderId: number, newStatus: string) => void;
}

export function OrderItemCard({ item, parentOrder, onStatusChange }: OrderItemCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fixed width for cards to match combined width of instrument + tuning + frequency badges
  const CARD_FIXED_WIDTH = '175px';

  // Move order to next status
  const moveOrderMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await apiRequest(
        'PATCH',
        `/api/orders/${parentOrder.id}/status`,
        { status: newStatus }
      );
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully",
      });
      if (onStatusChange) {
        onStatusChange(parentOrder.id, data.status);
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update order status",
      });
    }
  });

  // Complete order mutation
  const completeOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        'PATCH',
        `/api/orders/${parentOrder.id}/status`,
        { status: 'completed' }
      );
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order Completed",
        description: "Order has been marked as completed",
      });
      if (onStatusChange) {
        onStatusChange(parentOrder.id, data.status);
      }
    }
  });

  const handleMoveOrder = () => {
    // Determine the next status based on current status according to Excel workflow
    const statusFlow = [
      'ordered', 'validated', 'building', 'testing', 'firing', 
      'smoothing', 'tuning1', 'waxing', 'tuning2', 'bagging', 
      'boxing', 'labeling', 'shipping', 'delivered', 'completed'
    ];
    const currentIndex = statusFlow.indexOf(parentOrder.status);
    
    if (currentIndex >= 0 && currentIndex < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIndex + 1];
      moveOrderMutation.mutate(nextStatus);
    }
  };

  const handleCompleteOrder = () => {
    completeOrderMutation.mutate();
  };

  const calculateProgress = (): number => {
    const statusProgress: Record<string, number> = {
      ordered: 5,
      validated: 15,
      building: 25,
      testing: 35,
      firing: 45,
      smoothing: 55,
      tuning1: 65,
      waxing: 75,
      tuning2: 85,
      bagging: 90,
      boxing: 95,
      labeling: 98,
      shipping: 99,
      delivered: 100,
      completed: 100
    };
    
    // If there's a progress value explicitly set, use that
    if (parentOrder.progress && parentOrder.progress > 0) {
      return parentOrder.progress;
    }
    
    // Otherwise use the status-based progress
    return statusProgress[parentOrder.status] || 0;
  };

  const progress = calculateProgress();
  const isReadyToShip = parentOrder.status === 'labeling' || parentOrder.status === 'shipping';
  const deadlineClass = getDeadlineClass(parentOrder.deadline);

  return (
    <>
      <Card className="touch-target bg-white dark:bg-gray-800 shadow-sm border dark:border-gray-700 overflow-hidden">
        <CardContent className="p-0">
          {isReadyToShip && (
            <div className="absolute top-0 right-0 m-2">
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium rounded-full">
                <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-400 rounded-full mr-1"></span>
                Ready to Ship
              </span>
            </div>
          )}
          
          <div className={cn("p-3", isReadyToShip && "pt-10")}>
            {/* Item Information */}
            <div className="mb-2 flex justify-between">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Serial #</span>
                <h4 className="font-medium">{item.serialNumber}</h4>
              </div>
              <OrderTypeBadge type={parentOrder.orderType} />
            </div>
            
            {/* Order Information */}
            <div className="mb-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">From Order</span>
              <p className="font-medium">{parentOrder.orderNumber}</p>
            </div>
            
            {/* Item Type & Customer Info */}
            <div className="mb-2 flex justify-between">
              <div style={{ width: CARD_FIXED_WIDTH }}>
                <span className="text-xs text-gray-500 dark:text-gray-400">Type</span>
                <p className="font-medium text-center">{item.itemType}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Customer</span>
                <p className="font-medium truncate">{parentOrder.customerName}</p>
              </div>
            </div>
            
            {/* Deadline & Tuning Info */}
            <div className="flex justify-between items-center mb-2">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Deadline</span>
                <p className={deadlineClass}>{formatDate(parentOrder.deadline)}</p>
              </div>
              {item.tuningType && (
                <div style={{ width: '55px' }}>  {/* Match tuning badge width */}
                  <span className="text-xs text-gray-500 dark:text-gray-400">Tuning</span>
                  <p className="font-medium text-center">{item.tuningType}</p>
                </div>
              )}
            </div>
            
            {/* Item Specifications */}
            {item.specifications && typeof item.specifications === 'object' && (
              <div className="bg-gray-50 dark:bg-gray-800/80 border dark:border-gray-700 rounded-md p-2 mb-2 text-xs">
                {Object.entries(item.specifications as Record<string, string>)
                  .filter(([key, value]) => value && value !== '')
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between mb-1 last:mb-0">
                      <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                      <span className="font-medium ml-2">{value}</span>
                    </div>
                  ))}
              </div>
            )}
            
            {/* Parent Order Notes */}
            {parentOrder.notes && (
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border dark:border-yellow-700 rounded-md p-2 mb-2">
                <p className="text-xs text-yellow-700 dark:text-yellow-200">{parentOrder.notes}</p>
              </div>
            )}
            
            {/* Progress Bar */}
            {parentOrder.status !== 'completed' && parentOrder.status !== 'delivered' && (
              <>
                <Progress value={progress} className="h-2 mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
                  {progress === 100 ? 'Complete' : `${progress}% complete`}
                </p>
              </>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 p-0 flex">
          <Button 
            variant="ghost" 
            className="flex-1 py-2 rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium text-primary"
            onClick={() => setIsDetailsOpen(true)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Details
          </Button>
          <div className="border-r dark:border-gray-700"></div>
          {parentOrder.status === 'delivered' ? (
            <Button 
              variant="ghost" 
              className="flex-1 py-2 rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium text-secondary"
              onClick={handleCompleteOrder}
              disabled={completeOrderMutation.isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Complete
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              className="flex-1 py-2 rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300"
              onClick={handleMoveOrder}
              disabled={moveOrderMutation.isPending}
            >
              <ArrowRight className="h-4 w-4 mr-1" />
              Move
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <OrderDetailsDialog 
        open={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        order={parentOrder}
        orderItems={[item]}
      />
    </>
  );
}