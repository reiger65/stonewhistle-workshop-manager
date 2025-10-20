import { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { OptimizedTextarea } from '@/components/ui/optimized-textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';

interface OrderNotesEditorProps {
  orderId: number;
  initialNotes: string;
  lastUpdated?: Date | string | null;
  onClose?: () => void;
}

// Pure functie, apart van render cycle, verbetert performance
function isEqual(prevProps: OrderNotesEditorProps, nextProps: OrderNotesEditorProps) {
  return (
    prevProps.orderId === nextProps.orderId && 
    prevProps.initialNotes === nextProps.initialNotes
  );
}

// Memoized component om re-renders te voorkomen
const OrderNotesEditor = memo(function OrderNotesEditorInner({
  orderId,
  initialNotes,
  lastUpdated,
  onClose
}: OrderNotesEditorProps) {
  // Lokale state voor directe feedback
  const [notes, setNotes] = useState(initialNotes || '');
  const [internalValue, setInternalValue] = useState(notes);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Reset state wanneer order verandert
  useEffect(() => {
    setNotes(initialNotes || '');
    setInternalValue(initialNotes || '');
  }, [orderId, initialNotes]);

  // Debounce effect om state bij te werken wanneer gebruiker stopt met typen
  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalValue !== notes) {
        setNotes(internalValue);
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [internalValue, notes]);
  
  const updateNotesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        'PATCH',
        `/api/orders/${orderId}`,
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
      if (onClose) {
        onClose();
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update production notes",
      });
    }
  });
  
  // Deze functie wordt niet meer gebruikt - OptimizedTextarea handelt nu de onChange
  
  const handleSaveNotes = () => {
    updateNotesMutation.mutate();
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Production Notes</h3>
      <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
        <OptimizedTextarea 
          value={internalValue} 
          onChange={(value) => setInternalValue(value)}
          rows={3} 
          className="w-full p-3 focus:ring-primary border-none dark:bg-gray-800 font-mono text-sm" 
          placeholder="Add production notes here..."
          debounceMs={50}
        />
        <div className="bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 p-3 flex justify-between items-center">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Last updated {formatDate(lastUpdated)}
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
  );
}, isEqual);

export default OrderNotesEditor;