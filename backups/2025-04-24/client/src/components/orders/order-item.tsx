import { OrderItem as OrderItemType } from '@shared/schema';
import { StatusBadge } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';

interface OrderItemProps {
  item: OrderItemType;
}

export function OrderItem({ item }: OrderItemProps) {
  return (
    <div className="mb-2 pb-2 border-b dark:border-gray-700 last:border-b-0 last:mb-0 last:pb-0">
      <div className="flex justify-between">
        <span className="text-sm font-medium">{item.itemType}</span>
        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
          {item.serialNumber}
        </span>
      </div>
      
      {item.specifications && typeof item.specifications === 'object' && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {Object.entries(item.specifications as Record<string, string>)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')}
        </p>
      )}
      
      {item.status && item.status !== 'materials_prep' && (
        <div className="mt-1 flex justify-between items-center">
          <StatusBadge status={item.status} className="text-xs py-0 px-1.5" />
          {item.progress ? (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {item.progress}% complete
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
