import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

interface MoldInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instrumentType: string;
  tuningNote: string;
  orderNotes?: string;
  itemSpecifications?: Record<string, any>;
}

export function MoldInfoDialog({ open, onOpenChange, instrumentType, tuningNote, orderNotes, itemSpecifications }: MoldInfoDialogProps) {
  const [molds, setMolds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (open && instrumentType && tuningNote) {
      setIsLoading(true);
      setError(null);
      
      // Fetch the molds required for this instrument and tuning
      fetch(`/api/instrument-molds/${instrumentType}/${tuningNote}`)
        .then(res => {
          if (!res.ok) {
            if (res.status === 404) {
              throw new Error(`No mold mapping found for ${instrumentType} ${tuningNote}`);
            }
            throw new Error('Failed to fetch molds');
          }
          return res.json();
        })
        .then(data => {
          setMolds(data);
        })
        .catch(err => {
          console.error('Error fetching molds:', err);
          setError(err.message || 'Failed to load molds');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, instrumentType, tuningNote]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Molds for {instrumentType} {tuningNote}</DialogTitle>
          <DialogDescription>
            These molds are required to build this instrument
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-4 text-center text-destructive">
            {error}
          </div>
        ) : molds.length === 0 ? (
          <div className="py-4 text-center">
            No molds defined for this instrument and tuning. Please set up mold mappings in Settings.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Opmerkingen sectie */}
            {(orderNotes || itemSpecifications?.notes || itemSpecifications?.note || itemSpecifications?.comments || itemSpecifications?.remark) && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
                <h3 className="text-sm font-semibold text-amber-800 mb-1">Opmerkingen voor dit instrument:</h3>
                <div className="text-sm text-amber-900">
                  {itemSpecifications?.notes || itemSpecifications?.note || itemSpecifications?.comments || itemSpecifications?.remark || orderNotes}
                </div>
              </div>
            )}
            
            {/* Mold tabel */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Order</TableHead>
                    <TableHead>Mold Name</TableHead>
                    <TableHead>Last Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {molds.map((mold, index) => (
                    <TableRow key={mold.id || index}>
                      <TableCell className="font-medium">{mold.orderIndex || index + 1}</TableCell>
                      <TableCell>
                        {mold.name}
                        {mold.instrumentType !== instrumentType && (
                          <span className="ml-2 inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            Shared from {mold.instrumentType}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {mold.lastUsed ? new Date(mold.lastUsed).toLocaleDateString() : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}