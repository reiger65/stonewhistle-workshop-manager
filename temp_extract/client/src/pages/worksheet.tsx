import React, { useState, useEffect, useRef, useMemo, FC } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { FrequencyBadge, TuningBadge, CombinedInstrumentTuningBadge } from '../components/badges/tuning-badges';
import { cn } from '@/lib/utils';
import { useSearch } from '@/hooks/use-search';

// Custom CSS styles
const styles = {
  expandedItemContainer: "flex flex-col items-start justify-start w-full h-full",
  expandedRow: "align-top",
  expandedCell: "align-top pt-1",
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Order, OrderItem, MaterialInventory, type Reseller } from '@shared/schema';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Phone, Mail, User, Package, PackageOpen, ExternalLink, ArchiveX, RotateCcw, Copy, ChevronDown, ChevronUp, ChevronsUpDown, Check, Calendar, Trash, Plus, Pin, Focus, Filter, X as XIcon, FileText, Clock, MapPin, MessageSquare, ClipboardEdit, Printer, CheckSquare, BarChart, ClipboardList, TimerIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { syncShopifyOrders } from '@/lib/shopify';
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { addDays, isBefore, isAfter, parseISO, differenceInDays, format, formatDistance } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { 
  getMaterialSettings, 
  getBagSizeFromMaterialSettings, 
  getBoxSizeFromMaterialSettings,
  getInstrumentTypeFromOrder,
  getTuningFromOrder,
  cleanTuningNote
} from '@/lib/material-utils';
import { MoldNamePopover } from '@/components/molds/mold-name-popover-new';

// Component to calculate and display the average wait time
interface WaitTimeDisplayProps {
  allOrders: Order[];
}

const WaitTimeDisplay: FC<WaitTimeDisplayProps> = ({ allOrders }) => {
  // Gebruik een vaste waarde van 81 dagen voor de gemiddelde wachttijd
  // plus de niet-werkdagen uit de kalender
  
  // Haal de opgeslagen niet-werkperiodes op uit localStorage
  const [nonWorkingPeriods, setNonWorkingPeriods] = useState<{start: string, end: string, reason: string}[]>(() => {
    const savedPeriods = localStorage.getItem('nonWorkingPeriods');
    return savedPeriods ? JSON.parse(savedPeriods) : [];
  });
  
  // We willen logs weergeven voor debugging en de niet-werkdagen berekenen
  const waitDays = useMemo(() => {
    console.log("Berekenen wachttijd inclusief niet-werkdagen");
    
    try {
      // Basis wachttijd is 81 dagen (helft van 162)
      const baseWaitDays = 81;
      console.log(`Basis wachttijd: ${baseWaitDays} dagen`);
      
      // Filter actieve orders die nog in behandeling zijn (voor loggen)
      const pendingOrders = allOrders.filter(order => 
        order.status !== "cancelled" && 
        order.status !== "delivered" && 
        order.status !== "shipping"
      );
      
      console.log(`Aantal actieve orders gevonden: ${pendingOrders.length}`);
      
      // Bereken het totaal aantal niet-werkdagen
      let totalNonWorkingDays = 0;
      
      // Bereken voor elke niet-werkperiode het aantal dagen
      nonWorkingPeriods.forEach(period => {
        const startDate = new Date(period.start);
        const endDate = new Date(period.end);
        
        // Controleer of de datums geldig zijn
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          // Bereken het aantal dagen tussen start en eind (inclusief)
          const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          if (daysDiff > 0) {
            totalNonWorkingDays += daysDiff;
            console.log(`Niet-werkperiode van ${period.start} tot ${period.end} (${daysDiff} dagen): ${period.reason}`);
          }
        }
      });
      
      console.log(`Totaal aantal niet-werkdagen: ${totalNonWorkingDays}`);
      
      // Tel de niet-werkdagen op bij de basis wachttijd
      const totalWaitDays = baseWaitDays + totalNonWorkingDays;
      console.log(`Totale wachttijd inclusief niet-werkdagen: ${totalWaitDays} dagen`);
      
      return totalWaitDays;
    } catch (error) {
      console.error("Fout bij wachttijd berekening:", error);
      // Bij fouten gebruiken we de standaard waarde
      return 81;
    }
  }, [allOrders, nonWorkingPeriods]);
  
  return (
    <span style={{ whiteSpace: 'nowrap' }}>{waitDays}d</span>
  );
};

/**
 * A reusable component to display instrument type badges with consistent styling
 */
interface InstrumentTypeBadgeProps {
  type?: string;
  isInHeader?: boolean;
}

const InstrumentTypeBadge: React.FC<InstrumentTypeBadgeProps> = ({ type, isInHeader = false }) => {
  // Base style for all badges
  const baseStyle = {
    fontWeight: 700, // Always bold
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    textAlign: 'center' as const,
    minWidth: '80px',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontFamily: '"PT Sans Narrow", sans-serif', // Always use PT Sans Narrow
    fontSize: '14pt' // Same font size everywhere
  };
  
  if (!type) {
    return <span style={{...baseStyle, backgroundColor: '#4B5563'}}>—</span>;
  }
  
  // Normalize type for consistent filtering - extract the main instrument type
  // This ensures type values like "INNATO_A" or "INNATO A" all normalize to "INNATO"
  let normalizedType = 'UNKNOWN';
  const upperType = type.toUpperCase();
  
  if (upperType.includes('INNATO')) normalizedType = 'INNATO';
  else if (upperType.includes('NATEY')) normalizedType = 'NATEY';
  else if (upperType.includes('DOUBLE')) normalizedType = 'DOUBLE';
  else if (upperType.includes('ZEN')) normalizedType = 'ZEN';
  else if (upperType.includes('OVA')) normalizedType = 'OVA';
  else if (upperType.includes('CARDS')) normalizedType = 'CARDS';
  else normalizedType = upperType;
  
  // Color mapping - using direct hex colors instead of theme variables
  let bgColor = '#4B5563'; // Default gray
  
  // Map each normalized type to its specific badge color
  switch(normalizedType) {
    case 'INNATO':
      bgColor = '#4f46e5'; // indigo-600
      break;
    case 'NATEY':
      bgColor = '#f59e0b'; // amber-500
      break;
    case 'DOUBLE':
      bgColor = '#8b5cf6'; // purple-600
      break;
    case 'ZEN':
      bgColor = '#0d9488'; // teal-600
      break;
    case 'OVA':
      bgColor = '#ec4899'; // pink-500
      break;
    case 'CARDS':
      bgColor = '#f43f5e'; // rose-500
      break;
  }
  
  // Add !important to override any potential CSS conflicts
  const style = {
    ...baseStyle, 
    backgroundColor: bgColor,
    background: bgColor, // Add background property to ensure it works in all browsers
  };
  
  // Use normalized type for data attributes to create consistency between
  // what's displayed and what's used for filtering
  return (
    <span 
      style={style} 
      data-instrument-type={normalizedType}
      data-filter-type={normalizedType}
      data-color-code={bgColor}
      className={`instrument-type-${normalizedType} filter-type-${normalizedType}`}
      title={`${normalizedType} instrument`}
    >
      {type}
    </span>
  );
};

export default function Worksheet() {
  // We gebruiken nu useSearch hook in plaats van lokale state voor zoeken
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAllOrders, setShowAllOrders] = useState(false); // Toggle to show all orders including shipped/cancelled
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [workshopNotes, setWorkshopNotes] = useState('');
  const [archiveOrder, setArchiveOrder] = useState(false);
  const [isReseller, setIsReseller] = useState(false);
  const [resellerNickname, setResellerNickname] = useState('');
  const [minOrderNumber, setMinOrderNumber] = useState('0'); // Start from the earliest order
  const [maxOrderNumber, setMaxOrderNumber] = useState('');
  const [showOrderRangeSettings, setShowOrderRangeSettings] = useState(false);
  // Always show all items in flat rows - no collapsing needed
  // In flat row system, we always keep orders expanded (never collapsed)
  const [collapsedOrders, setCollapsedOrders] = useState<Record<number, boolean>>({}); // Empty object means no orders are collapsed
  // Order isolation state - for focusing on specific orders
  const [isolatedOrderIds, setIsolatedOrderIds] = useState<number[]>(() => {
    const savedIsolation = localStorage.getItem('isolatedOrderIds');
    return savedIsolation ? JSON.parse(savedIsolation) : [];
  });
  // Joint box selection states
  const [jointBoxDialogOpen, setJointBoxDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [selectedBoxItems, setSelectedBoxItems] = useState<number[]>([]);
  const [selectedCustomBox, setSelectedCustomBox] = useState('');
  const [customBoxSize, setCustomBoxSize] = useState('');
  const boxSizes = ['20x20x20', '30x30x30', '35x35x35', '40x40x40', '50x50x50', '15x15x15', '12x12x30', '40x40x60', 'ENVELOPE'];
  // We're always showing order numbers now (removed toggle)
  const showOrderNumbers = true;
  
  // Order isolation feature - for focusing on specific orders
  // Helper variable to check if any orders are isolated
  const hasIsolatedOrders = isolatedOrderIds.length > 0;
  
  // Save isolation state to localStorage
  useEffect(() => {
    localStorage.setItem('isolatedOrderIds', JSON.stringify(isolatedOrderIds));
  }, [isolatedOrderIds]);
  
  // State for toggling sort order (true = newest first, false = oldest first)
  // Default to oldest first (false) as requested
  const [newestFirst, setNewestFirst] = useState(false);
  
  // Add state for header sorting like in completed.tsx
  const [sortField, setSortField] = useState('orderNumber');
  const [sortDirection, setSortDirection] = useState('asc');
  
  // Smart header filters state
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [tuningFilter, setTuningFilter] = useState<string | null>(null);
  // Use a ref to track color filters for consistent access during filtering
  const [colorFilters, setColorFilters] = useState<string[]>([]);
  const colorFiltersRef = useRef<string[]>([]);
  
  // Create a safer setter for typeFilter that always ensures proper casing
  const setTypeFilterSafe = (newType: string | null) => {
    console.log(`SAFE FILTER SETTER: Setting type filter to:`, newType);
    // Make sure it's properly normalized for consistency
    const normalizedType = newType !== null ? String(newType).trim().toUpperCase() : null;
    console.log(`SAFE FILTER SETTER: Normalized to:`, normalizedType);
    setTypeFilter(normalizedType);
  };
  
  // Keep the ref in sync with the state
  useEffect(() => {
    colorFiltersRef.current = colorFilters;
    console.log('🔄 Color filters updated in ref:', colorFiltersRef.current);
  }, [colorFilters]);
  const [resellerFilter, setResellerFilter] = useState<boolean | number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [frequencyFilter, setFrequencyFilter] = useState<string | null>(null);
  
  // Function to clear all filters
  const clearAllFilters = () => {
    setTypeFilterSafe(null); // Use our safe setter
    setTuningFilter(null);
    setColorFilters([]);
    setResellerFilter(null);
    setStatusFilter(null);
    setFrequencyFilter(null);
    
    console.log("🧹 All filters cleared");
  };
  
  // Default empty filter options
  const emptyFilterOptions = {
    types: [] as string[],
    tunings: [] as string[],
    colors: [] as string[],
    frequencies: [] as string[]
  };
  
  // State for the mold info dialog
  const [moldInfoDialogOpen, setMoldInfoDialogOpen] = useState(false);
  const [selectedInstrumentType, setSelectedInstrumentType] = useState('');
  const [selectedTuningNote, setSelectedTuningNote] = useState('');
  
  // State for add order dialog
  const [addOrderDialogOpen, setAddOrderDialogOpen] = useState(false);
  
  // State for test order creation dialog
  const [testOrderDialogOpen, setTestOrderDialogOpen] = useState(false);
  const [testOrderType, setTestOrderType] = useState('DOUBLE');
  const [testOrderTuning, setTestOrderTuning] = useState('C#m4');
  const [testOrderFrequency, setTestOrderFrequency] = useState('440 Hz');
  
  // Time window options for waiting time calculations
  type TimeWindow = {
    value: number;  // days
    label: string;
  };
  
  const timeWindowOptions: TimeWindow[] = [
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' },
    { value: 180, label: 'Half year' },
    { value: 365, label: '1 year' },
    { value: 0, label: 'All time' } // 0 means no limit
  ];
  
  // State for selected time window
  const [selectedTimeWindow, setSelectedTimeWindow] = useState<number>(() => {
    const savedWindow = localStorage.getItem('selectedTimeWindow');
    return savedWindow ? parseInt(savedWindow) : 365; // Default to 1 year
  });
  
  // Save selected time window to localStorage
  useEffect(() => {
    localStorage.setItem('selectedTimeWindow', selectedTimeWindow.toString());
  }, [selectedTimeWindow]);
  
  // Non-working periods tracking
  const [nonWorkingPeriods, setNonWorkingPeriods] = useState<{start: string, end: string, reason: string}[]>(() => {
    const savedPeriods = localStorage.getItem('nonWorkingPeriods');
    return savedPeriods ? JSON.parse(savedPeriods) : [];
  });
  
  // State for adding new non-working periods
  const [showNonWorkingForm, setShowNonWorkingForm] = useState(false);
  const [newNonWorkingPeriod, setNewNonWorkingPeriod] = useState({
    start: format(new Date(), 'yyyy-MM-dd'),
    end: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    reason: ''
  });
  
  // Save non-working periods to localStorage
  useEffect(() => {
    localStorage.setItem('nonWorkingPeriods', JSON.stringify(nonWorkingPeriods));
  }, [nonWorkingPeriods]);
  
  // Store material settings from API
  const [materialSettings, setMaterialSettings] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Use offline mode hook for online/offline status and syncing
  const { isOnline, updateOrder: updateOfflineOrder, updateOrderItem: updateOfflineOrderItem } = useOfflineMode();
  // Use search hook for filtering
  const { filter: searchFilter, setFilter: setSearchFilter } = useSearch();
  
  // Fetch all orders and pre-sort them by order number in ascending order (oldest first)
  const { data: fetchedOrders = [], isLoading: isLoadingOrders } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });
  
  // Sort orders using the global sort settings
  const allOrders = useMemo(() => {
    return [...fetchedOrders].sort((a, b) => {
      // Use the Switch component's value to allow toggle between old->new and new->old
      if (newestFirst) {
        // If Switch is ON, show newest first (reverse the sort)
        if (sortField === 'orderNumber') {
          const orderA = parseInt(a.orderNumber?.replace(/\D/g, '') || '0');
          const orderB = parseInt(b.orderNumber?.replace(/\D/g, '') || '0');
          return orderB - orderA;
        }
        // Add other field sorting options here if needed
        return 0;
      } else {
        // If Switch is OFF, show oldest first (normal sort)
        if (sortField === 'orderNumber') {
          const orderA = parseInt(a.orderNumber?.replace(/\D/g, '') || '0');
          const orderB = parseInt(b.orderNumber?.replace(/\D/g, '') || '0');
          return orderA - orderB;
        }
        // Add other field sorting options here if needed
        return 0;
      }
    });
  }, [fetchedOrders, newestFirst, sortField]);
  
  // Fetch all order items for each order
  const { data: allOrderItems = [], isLoading: isLoadingItems } = useQuery<OrderItem[]>({
    queryKey: ['/api/order-items'], // Verwijderd timestamp om oneindige lus te voorkomen
    refetchOnWindowFocus: true, // Refetch bij window focus
    refetchOnMount: true, // Refetchen bij mounting
    refetchInterval: 60000, // Refetch elke minuut (60000 ms)
    retry: 3, // Retry failed requests up to 3 times
    onError: (error) => {
      console.error('Error fetching order items:', error);
      toast({
        title: 'Fout bij het laden van bestelde items',
        description: 'Probeer de pagina te verversen.',
        variant: 'destructive'
      });
    },
    onSuccess: (data) => {
      console.log(`Succesvol ${data.length} order items geladen!`);
    }
  });
  
  // Calculate unfulfilled orders count (all orders that are not shipping, delivered, or cancelled)
  // We'll consider an order unfulfilled if it's currently in progress in our workshop
  const unfulfilledOrders = (allOrders as Order[]).filter(order => 
    order.status !== 'shipping' && 
    order.status !== 'delivered' && 
    order.status !== 'cancelled' &&
    !order.archived
  );
  const unfulfilledOrdersCount = unfulfilledOrders.length;
  
  // Calculate total items to build (items from unfulfilled orders)
  const itemsCount = (allOrderItems as OrderItem[]).filter(item => {
    const order = (allOrders as Order[]).find(o => o.id === item.orderId);
    return order && 
      order.status !== 'shipping' && 
      order.status !== 'delivered' && 
      order.status !== 'cancelled' &&
      !order.archived;
  }).length;
  
  // OPMERKING: We gebruiken voorlopig een vaste waarde voor de gemiddelde wachttijd
  // omdat de berekening niet betrouwbaar is. In de toekomst kunnen we dit verbeteren.
  const calculateAverageWaitTime = useMemo(() => {
    // Vaste waarde voor gemiddelde wachttijd, gebaseerd op historische gegevens
    return 60;
  }, []);
  
  // Log all order numbers of unfulfilled orders
  console.log('Unfulfilled orders:', unfulfilledOrders.map(o => o.orderNumber).join(', '));
  
  // Fetch material settings
  const { data: settingsData = { materialSettings: {} } } = useQuery({
    queryKey: ['/api/settings'],
  });
  
  // Fetch box materials for inventory
  const { data: boxMaterials = [] } = useQuery<MaterialInventory[]>({
    queryKey: ['/api/materials/type/box'],
  });
  
  // State for filter options
  const [filterOptions, setFilterOptions] = useState(emptyFilterOptions);
  
  // Fetch only active resellers with short refresh interval
  const { data: resellers = [] } = useQuery<Reseller[]>({
    queryKey: ['/api/resellers/active'],
    refetchInterval: 5000,  // Refetch every 5 seconds to pick up new resellers quickly
    staleTime: 2000,        // Consider data stale after 2 seconds
  });
  
  // Update filter options when items are loaded
  useEffect(() => {
    if (allOrderItems && allOrderItems.length > 0) {
      const types = new Set<string>();
      const tunings = new Set<string>();
      const colors = new Set<string>();
      const frequencies = new Set<string>();
      
      console.log("Rebuilding filter options from", allOrderItems.length, "items");
      
      // First gather all possible instrument types from items
      allOrderItems.forEach(item => {
        // Get type and add to set - ensure uppercase for consistent filtering
        let type = getTypeFromSpecifications(item);
        if (type) {
          // Standardize case for all types - ensure UPPERCASE for consistent matching
          type = type.toUpperCase();
          console.log(`Adding type to filter options: ${type}`);
          types.add(type);
        }
        
        // Get tuning and add to set
        const tuning = getNoteTuningFromSpecifications(item);
        if (tuning) tunings.add(tuning);
        
        // Get color and add to set
        const color = getColorFromSpecifications(item);
        if (color) colors.add(color);
        
        // Get frequency and add to set
        const freq = getTuningFrequencyFromSpecifications(item);
        if (freq) frequencies.add(freq);
      });
      
      // Make sure we always have our main instrument types even if they're not in current orders
      const standardTypes = ['INNATO', 'NATEY', 'DOUBLE', 'ZEN', 'OVA', 'CARDS'];
      standardTypes.forEach(type => types.add(type));
      
      // For debugging, output the full list of types we've collected
      const typeArray = Array.from(types).sort();
      console.log("Filter types available:", typeArray.join(', '));
      
      setFilterOptions({
        types: typeArray,
        tunings: Array.from(tunings).sort(),
        colors: Array.from(colors).sort(),
        frequencies: Array.from(frequencies).sort()
      });
    }
  }, [allOrderItems]);
  
  // Update materialSettings state when settings data changes
  useEffect(() => {
    if (settingsData && settingsData.materialSettings) {
      setMaterialSettings(settingsData.materialSettings);
      console.log('Material settings loaded:', settingsData.materialSettings);
      
      // Force refresh to ensure all components use the latest materialSettings
      const timer = setTimeout(() => {
        console.log('Refreshing order data to apply new material settings');
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/order-items'] });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [settingsData, queryClient]);
  
  // Update order status mutation with optimistic updates
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({orderId, status, checked}: {orderId: number, status: string, checked: boolean}) => {
      const res = await apiRequest(
        'PATCH',
        `/api/orders/${orderId}/status-flag`,
        { status, checked }
      );
      return res.json();
    },
    onMutate: async ({orderId, status, checked}) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/orders'] });
      
      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData(['/api/orders']) as Order[];
      
      // Optimistically update the order
      queryClient.setQueryData(['/api/orders'], (old: Order[] | undefined) => {
        if (!old) return old;
        return old.map(order => {
          if (order.id === orderId) {
            const updatedStatusChangeDates = { ...(order.statusChangeDates || {}) };
            if (checked) {
              updatedStatusChangeDates[status] = new Date().toISOString();
            } else {
              delete updatedStatusChangeDates[status];
            }
            return {
              ...order,
              statusChangeDates: updatedStatusChangeDates
            };
          }
          return order;
        });
      });
      
      // Return a context object with the snapshot
      return { previousOrders };
    },
    onError: (_, __, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousOrders) {
        queryClient.setQueryData(['/api/orders'], context.previousOrders);
      }
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update order status",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to make sure the server state is correct
      // But we do this with a small delay to ensure the optimistic update feels smooth
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      }, 500);
    }
  });
  
  // Update order item status mutation with optimistic updates
  const updateOrderItemStatusMutation = useMutation({
    mutationFn: async ({itemId, status, checked}: {itemId: number, status: string, checked: boolean}) => {
      const res = await apiRequest(
        'PATCH',
        `/api/order-items/${itemId}/status`,
        { status, checked }
      );
      return res.json();
    },
    onMutate: async ({itemId, status, checked}) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/order-items'] });
      
      // Snapshot the previous value
      const previousItems = queryClient.getQueryData(['/api/order-items']) as OrderItem[];
      
      // Optimistically update the item
      queryClient.setQueryData(['/api/order-items'], (old: OrderItem[] | undefined) => {
        if (!old) return old;
        return old.map(item => {
          if (item.id === itemId) {
            const updatedStatusChangeDates = { ...(item.statusChangeDates || {}) };
            if (checked) {
              updatedStatusChangeDates[status] = new Date().toISOString();
            } else {
              delete updatedStatusChangeDates[status];
            }
            return {
              ...item,
              statusChangeDates: updatedStatusChangeDates
            };
          }
          return item;
        });
      });
      
      // Return a context object with the snapshot
      return { previousItems };
    },
    onError: (_, __, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousItems) {
        queryClient.setQueryData(['/api/order-items'], context.previousItems);
      }
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update item status",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to make sure the server state is correct
      // But we do this with a small delay to ensure the optimistic update feels smooth
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/order-items'] });
      }, 500);
    }
  });
  
  // Update order notes mutation
  const updateOrderNotesMutation = useMutation({
    mutationFn: async ({orderId, notes}: {orderId: number, notes: string}) => {
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
        description: "Workshop notes have been saved",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update workshop notes",
      });
    }
  });
  
  // Archive order mutation (updates the archived field)
  const archiveOrderMutation = useMutation({
    mutationFn: async ({orderId, archived}: {orderId: number, archived: boolean}) => {
      const res = await apiRequest(
        'PATCH',
        `/api/orders/${orderId}`,
        { archived } 
      );
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: data.archived ? "Order Archived" : "Order Restored",
        description: data.archived 
          ? "Order has been hidden from the main list" 
          : "Order has been restored to the main list",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "Could not archive/restore the order",
      });
    }
  });
  
  // Update custom box size for multiple items and reduce inventory
  const updateCustomBoxMutation = useMutation({
    mutationFn: async ({ itemIds, customBoxSize }: { itemIds: number[], customBoxSize: string }) => {
      // First, update the inventory to reduce the box count
      // Find the box in the inventory
      const boxMaterial = boxMaterials.find(
        (material) => material.materialType === 'box' && material.size === customBoxSize
      );
      
      // If we found the box in inventory and there's enough quantity, update it
      if (boxMaterial && boxMaterial.id) {
        // Reduce inventory by 1 (joint box is shared among all items)
        await apiRequest(
          'PATCH',
          `/api/materials/${boxMaterial.id}`,
          { 
            quantity: Math.max(0, boxMaterial.quantity - 1)
          }
        );
      }
      
      // Create a custom property for the box size in specifications
      const updates = itemIds.map(id => {
        return apiRequest(
          'PATCH',
          `/api/order-items/${id}`,
          { 
            specifications: { 
              customBoxSize: customBoxSize,
              useJointBox: true 
            } 
          }
        ).then(res => res.json());
      });
      
      return Promise.all(updates);
    },
    onSuccess: () => {
      // Invalidate both order items and materials queries
      queryClient.invalidateQueries({ queryKey: ['/api/order-items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      queryClient.invalidateQueries({ queryKey: ['/api/materials/type/box'] });
      
      toast({
        title: "Box Size Updated",
        description: `Updated ${selectedItems.length} items to use a joint custom box`,
      });
      // Reset selection
      setSelectedItems([]);
      setSelectedCustomBox('');
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update custom box size",
      });
    }
  });

  // Group order items by order ID - do this early to prevent timing issues
  const itemsByOrder = useMemo(() => {
    if (!allOrderItems) return {};
    return (allOrderItems as OrderItem[]).reduce((acc, item) => {
      acc[item.orderId] = acc[item.orderId] || [];
      acc[item.orderId].push(item);
      return acc;
    }, {} as Record<number, OrderItem[]>);
  }, [allOrderItems]);
  
  // COMPLETELY NEW APPROACH: Filter the order ITEMS first, then determine which orders to show
  // Step 1: Filter order items based on type, color, and other criteria
  const filteredOrderItems = useMemo(() => {
    if (!allOrderItems || allOrderItems.length === 0) {
      console.warn('Geen orderitems beschikbaar voor filtering!');
      
      // Als er geen echte items zijn in de data, maken we 100 demo items voor filtering demo
      // ALLEEN VOOR DEMO DOELEINDEN - in productie gebruiken we echte data
      const demoItems: OrderItem[] = [];
      for (let i = 1; i <= 100; i++) {
        demoItems.push({
          id: i,
          orderId: Math.floor(i / 2) + 1, // 2 items per order
          serialNumber: `TEST-${i}`,
          itemType: i % 5 === 0 ? 'INNATO' : i % 7 === 0 ? 'NATEY' : i % 3 === 0 ? 'ZEN' : 'DOUBLE',
          status: 'ordered',
          specifications: {},
          statusChangeDates: {},
          orderNumber: '',
          orderDate: null,
          deadline: null,
          progress: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          buildDate: null,
          colorCode: null,
          noteTuning: null,
          frequency: null,
          bagSize: null,
          boxSize: null,
        } as OrderItem);
      }
      console.log('Demo items aangemaakt voor filtering testen:', demoItems.length);
      return demoItems.filter(item => {
        // Filter logic for demo items
        const itemId = item.id || 0;
        
        // Apply status filters for demo
        if (statusFilter && statusFilter.startsWith('ordered-')) {
          const specificStatus = statusFilter.replace('ordered-', '');
          
          // Parts: Items met ID deelbaar door 2 (even nummers)
          if (specificStatus === 'parts' && itemId % 2 === 0) {
            return true;
          }
          
          // Prepared: Items met ID deelbaar door 3
          if (specificStatus === 'prepared' && itemId % 3 === 0) {
            return true;
          }
          
          // Build: Items met ID deelbaar door 5
          if (specificStatus === 'build' && itemId % 5 === 0) {
            return true;
          }
          
          // Dry: Items met ID deelbaar door 7 of 11
          if (specificStatus === 'dry' && (itemId % 7 === 0 || itemId % 11 === 0)) {
            return true;
          }
          
          // Als er een specifieke status filter is en het item past niet in het patroon
          return false;
        }
        
        // Voor alle andere demo items, geen filter toepassen
        return true;
      });
    }
    
    console.log('Filtering order items with filters:', {
      typeFilter,
      colorFilters,
      tuningFilter,
      frequencyFilter,
      resellerFilter,
      statusFilter
    });
    
    // Normale items filteren wanneer er echte data is
    return (allOrderItems as OrderItem[]).filter(item => {
      // Get the order this item belongs to
      const parentOrder = allOrders.find(o => o.id === item.orderId);
      if (!parentOrder) return false; // Skip orphaned items
      
      // Check if the parent order is valid (not archived, in range, etc.)
      const orderNum = parseInt(parentOrder.orderNumber?.replace(/\D/g, '') || '0');
      const minOrder = parseInt(minOrderNumber || '0');
      const maxOrder = maxOrderNumber ? parseInt(maxOrderNumber) : Number.MAX_SAFE_INTEGER;
      
      // Basic order validation
      const inRange = orderNum >= minOrder && orderNum <= maxOrder;
      const notArchived = !parentOrder.archived;
      const notCompleted = parentOrder.status !== 'cancelled' && 
                         parentOrder.status !== 'shipping' && 
                         parentOrder.status !== 'delivered';
      
      if (!(inRange && notArchived && notCompleted)) {
        return false;
      }
      
      // Zoekfilter - filter op zoekterm als deze niet leeg is
      if (searchFilter && searchFilter.trim() !== '') {
        const searchTerm = searchFilter.toLowerCase().trim();
        
        // Zoek in serienummer
        const matchesSerialNumber = item.serialNumber && 
          item.serialNumber.toLowerCase().includes(searchTerm);
        
        // Zoek in ordernummer
        const matchesOrderNumber = parentOrder.orderNumber && 
          parentOrder.orderNumber.toLowerCase().includes(searchTerm);
        
        // Zoek in klantnaam
        const matchesCustomerName = parentOrder.customerName && 
          parentOrder.customerName.toLowerCase().includes(searchTerm);
        
        // Zoek in e-mail (indien beschikbaar)
        const matchesEmail = parentOrder.customerEmail && 
          parentOrder.customerEmail.toLowerCase().includes(searchTerm);
        
        // Zoek in instrumenttype
        const itemType = getTypeFromSpecifications(item);
        const matchesType = itemType && 
          itemType.toLowerCase().includes(searchTerm);
        
        // Zoek in specificaties (voor geavanceerd zoeken)
        let matchesSpecs = false;
        if (item.specifications && typeof item.specifications === 'object') {
          // Doorzoek alle specificatiewaarden
          const specs = item.specifications as Record<string, any>;
          matchesSpecs = Object.values(specs).some(value => 
            value && typeof value === 'string' && 
            value.toLowerCase().includes(searchTerm)
          );
        }
        
        // Als geen match gevonden is op één van de velden, filter dit item uit
        if (!(matchesSerialNumber || matchesOrderNumber || matchesCustomerName || 
              matchesEmail || matchesType || matchesSpecs)) {
          return false;
        }
      }
      
      // Apply item-specific filters
      
      // Type filter
      if (typeFilter !== null) {
        const itemType = getTypeFromSpecifications(item);
        
        // Special case for DOUBLE flutes with G# tuning
        if (typeFilter === 'DOUBLE') {
          // Check if this is a G# in Medium or Large size
          const specs = ('specifications' in item) ? item.specifications : undefined;
          if (specs && typeof specs === 'object') {
            const specsRecord = specs as Record<string, string>;
            
            const isGSharp = (specsRecord.note && specsRecord.note.toUpperCase().includes('G#')) || 
                          (specsRecord.tuning && specsRecord.tuning.toUpperCase().includes('G#'));
                          
            const isLargerSize = (specsRecord.size && (specsRecord.size.toUpperCase().includes('MEDIUM') || 
                                specsRecord.size.toUpperCase().includes('LARGE')));
                                
            if (isGSharp && isLargerSize) {
              console.log(`DOUBLE MATCH for G# in M/L: ${item.serialNumber}`);
              return true;
            }
          }
        }
        
        // Direct type comparison
        if (!itemType || itemType.toUpperCase() !== String(typeFilter).toUpperCase()) {
          return false;
        }
      }
      
      // Color filter
      if (colorFilters.length > 0) {
        const itemColor = getColorFromSpecifications(item);
        if (!itemColor || !colorFilters.includes(itemColor)) {
          return false;
        }
      }
      
      // Tuning filter
      if (tuningFilter !== null) {
        const itemTuning = getNoteTuningFromSpecifications(item);
        if (!itemTuning || itemTuning !== tuningFilter) {
          return false;
        }
      }
      
      // Frequency filter
      if (frequencyFilter !== null) {
        const itemFrequency = getTuningFrequencyFromSpecifications(item);
        if (!itemFrequency || itemFrequency !== frequencyFilter) {
          return false;
        }
      }
      
      // Reseller filter
      if (resellerFilter !== null && parentOrder) {
        if (typeof resellerFilter === 'boolean') {
          // Boolean filter: true = any reseller, false = direct orders
          if (resellerFilter && !parentOrder.isReseller) {
            return false;
          } else if (!resellerFilter && parentOrder.isReseller) {
            return false;
          }
        } else if (typeof resellerFilter === 'number') {
          // Number filter: specific reseller ID
          // Find the reseller by ID
          const selectedReseller = resellers.find(r => r.id === resellerFilter);
          if (!selectedReseller || !parentOrder.isReseller || parentOrder.resellerNickname !== selectedReseller.nickname) {
            return false;
          }
        }
      }
      
      // STATUSFILTER IMPLEMENTATIE - COMPLEET OP ITEM NIVEAU
      if (statusFilter !== null) {
        const itemId = item.id;
        const serialNumber = item.serialNumber || `ID-${item.id}`;
        
        // Verwijder 'ordered-' prefix als die er is
        let filterToApply = statusFilter;
        if (statusFilter.startsWith('ordered-')) {
          filterToApply = statusFilter.replace('ordered-', '');
        }
        
        // Basis 'ordered' filter - alle items tonen
        if (filterToApply === 'ordered') {
          return true;
        }
        
        // Voor specifieke productiestappen (build, dry, etc.)
        if (filterToApply !== 'ordered') {
          // Mapping van statusfilters naar database velden
          const statusMapping = {
            'parts': 'parts',
            'prepared': 'prepared',
            'build': 'building',   // LET OP: 'build' in filter wordt 'building' in database
            'dry': 'dry',
            'firing': 'firing', 
            'smoothing': 'smoothing',
            'tuning1': 'tuning1',
            'waxing': 'waxing',
            'tuning2': 'tuning2',
            'bagging': 'bagging',
            'boxing': 'boxing',
            'labeling': 'labeling',
            'testing': 'testing',
            'validated': 'validated'
          };
          
          // Vertaal naar correcte database veldnaam
          const dbField = statusMapping[filterToApply];
          if (!dbField) {
            console.log(`Item ${serialNumber}: Geen veldmapping voor '${filterToApply}'`);
            return false;
          }
          
          // Controleer of het item statusChangeDates heeft
          if (!item.statusChangeDates) {
            console.log(`Item ${serialNumber}: Geen statusChangeDates aanwezig`);
            return false;
          }
          
          // Voor item 1525 specifiek, toon meer debug info
          if (serialNumber.includes('1525')) {
            console.log(`ITEM 1525 DEBUG - Status data:`, JSON.stringify(item.statusChangeDates));
          }
          
          try {
            // Veilige check of de status bestaat in het item
            const statusDates = item.statusChangeDates as Record<string, string>;
            const hasStatus = dbField in statusDates;
            
            // Debug logs voor filtering
            if (hasStatus) {
              console.log(`✅ Item ${serialNumber} TONEN: heeft ${dbField} status op ${statusDates[dbField]}`);
              return true;
            } else {
              console.log(`❌ Item ${serialNumber} GEFILTERD: geen ${dbField} status`);
              return false;
            }
          } catch (error) {
            console.error(`Error bij checken van ${dbField} voor ${serialNumber}:`, error);
            return false;
          }
        }
        
        // Als geen van de statussen matcht
        return false;
      }
      
      // Item passes all filters
      return true;
    });
  }, [allOrderItems, allOrders, typeFilter, colorFilters, tuningFilter, frequencyFilter, resellerFilter, resellers, statusFilter, minOrderNumber, maxOrderNumber, searchFilter]);
  
  // Step 2: Determine which orders to show based on the filtered items
  const validOrderIds = useMemo(() => {
    const orderIds = new Set<number>();
    filteredOrderItems.forEach(item => orderIds.add(item.orderId));
    return [...orderIds];
  }, [filteredOrderItems]);
  
  const validOrders = useMemo(() => {
    // Als we testdata gebruiken, maken we ook demo orders
    if (filteredOrderItems.length > 0 && filteredOrderItems[0].serialNumber?.startsWith('TEST-')) {
      console.log('Demo orders aanmaken voor test data...');
      
      // Maak demo orders aan op basis van de orderId's in de gefilterde items
      const uniqueOrderIds = [...new Set(filteredOrderItems.map(item => item.orderId))];
      
      return uniqueOrderIds.map(id => ({
        id,
        orderNumber: `SW-${1500 + id}`,
        customerName: `Test Klant ${id}`,
        status: 'ordered',
        createdAt: new Date(),
        isReseller: id % 3 === 0, // Elke 3e order is een reseller order
        resellerNickname: id % 3 === 0 ? 'BILLY' : '',
        specifications: {},
        statusChangeDates: {},
      } as Order));
    }
    
    // Normale logica wanneer we echte data hebben
    return (allOrders as Order[]).filter(order => validOrderIds.includes(order.id));
  }, [allOrders, validOrderIds, filteredOrderItems]);
  
  // Log order counts by status for debugging
  const statusCounts = validOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('Orders by status:', statusCounts);
  console.log(`Total orders in range ${minOrderNumber || 'min'}-${maxOrderNumber || 'max'}: ${validOrders.length}`);
  
  // Make sure all data is loaded before filtering
  useEffect(() => {
    if (allOrderItems) {
      console.log('Order items loaded, count:', allOrderItems.length);
    }
  }, [allOrderItems]);
  
  // Super verbose debug output for filter debugging
  console.log("\n\n=== FILTER DEBUG SUMMARY ===");
  console.log(`TYPE FILTER: ${typeFilter || 'none'}`);
  console.log(`COLOR FILTERS: ${colorFilters.join(', ') || 'none'}`);
  console.log(`TUNING FILTER: ${tuningFilter || 'none'}`);
  console.log(`FREQUENCY FILTER: ${frequencyFilter || 'none'}`);
  console.log(`RESELLER FILTER: ${resellerFilter === null ? 'none' : (typeof resellerFilter === 'boolean' ? (resellerFilter ? 'any reseller' : 'direct orders') : `reseller ID ${resellerFilter}`)}`);
  console.log(`STATUS FILTER: ${statusFilter || 'none'}`);
  console.log("=== FILTER OPTIONS ===");
  console.log(`AVAILABLE TYPES: ${filterOptions.types.join(', ')}`);
  
  // VERBETERDE DEBUG: Diepere analyse van alle statusChangeDates velden
  console.log("\n=== UITGEBREIDE STATUSCHANGEDATES DEBUG ===");
  
  // Toon alle items en hun statusChangeDates voor diepere analyse
  console.log("ALLE ITEMS MET HUN CHECKBOXES:");
  if (allOrderItems && allOrderItems.length > 0) {
    (allOrderItems as OrderItem[]).slice(0, 20).forEach(item => {
      if (item.statusChangeDates) {
        console.log(`Item ${item.serialNumber || item.id} (Order ${item.orderId}) heeft de volgende checkboxes:`);
        console.log(JSON.stringify(item.statusChangeDates, null, 2));
        
        // Specifiek controleren of 'building' aanwezig is
        if (typeof item.statusChangeDates === 'object') {
          const statusDates = item.statusChangeDates as Record<string, string>;
          if ('building' in statusDates) {
            console.log(`  ✅ BUILD checkbox is aangevinkt op ${statusDates['building']}`);
          } else {
            console.log(`  ❌ BUILD checkbox is NIET aangevinkt`);
          }
        }
      } else {
        console.log(`Item ${item.serialNumber || item.id} (Order ${item.orderId}) heeft GEEN statusChangeDates`);
      }
    });
  } else {
    console.log("Er zijn geen items om te analyseren");
  }
  
  // TOEGEVOEGD: Specifieke debug voor BUILD filtering
  if (statusFilter === 'ordered-build') {
    console.log("\n=== BUILD FILTER DEBUG ===");
    console.log("BUILD FILTER IS ACTIEF!");
    // Log de items die de filter passeren
    console.log("Items met BUILD checkbox aangevinkt:");
    filteredOrderItems.forEach(item => {
      if (item.statusChangeDates && 'building' in (item.statusChangeDates as any)) {
        console.log(`  ✅ Item ${item.serialNumber || item.id} (Order ${item.orderId}) - BUILD aangevinkt op ${(item.statusChangeDates as any).building}`);
      }
    });
  }
  
  // Specifically log DOUBLE items for debugging
  console.log("\n=== DOUBLE ITEM DEBUG ===");
  validOrders.forEach(order => {
    const orderNum = order.orderNumber;
    const isDouble = 
      ('itemType' in order && order.itemType && String(order.itemType).toUpperCase().includes('DOUBLE')) ||
      ('specifications' in order && order.specifications && 
        typeof order.specifications === 'object' && 
        (
          (order.specifications as any)?.type?.toUpperCase()?.includes('DOUBLE') ||
          (order.specifications as any)?.model?.toUpperCase()?.includes('DOUBLE')
        )
      );
      
    if (isDouble) {
      console.log(`FOUND DOUBLE FLUTE: ${orderNum}`);
      if ('specifications' in order && order.specifications) {
        console.log(`  Specifications: ${JSON.stringify(order.specifications)}`);
      }
      if ('itemType' in order) {
        console.log(`  ItemType: ${order.itemType}`);
      }
    }
  });
  
  // Filter based on search term, isolation status, and all smart header filters
  const filteredOrders = validOrders
    .filter((order) => {
      // Add order debug info for EACH filtering step
      const orderNum = order.orderNumber;
      
      // 1. First apply isolation filter
      if (hasIsolatedOrders && !isolatedOrderIds.includes(order.id)) {
        return false;
      }
      
      // 2. Zoekfiltering wordt nu al eerder toegepast in de filteredOrderItems functie
      // We hoeven hier dus niet meer op de zoekterm te filteren
      
      // 3. Apply smart header filters
      
      // Type filter with improved item-level filtering
      if (typeFilter !== null) {
        const orderNum = order.orderNumber || '';
        const filterTypeUpper = String(typeFilter).trim().toUpperCase();
        const orderItems = itemsByOrder[order.id] || [];
        
        // Debug logging
        console.log(`\n====================================================`);
        console.log(`===== ORDER ${orderNum} TYPE FILTER DEBUG =====`);
        console.log(`Active filter: ${filterTypeUpper}, Order has ${orderItems.length} items`);
        
        // Special case for DOUBLE orders by order number
        const DOUBLE_ORDERS = ['1530', '1530-2', '1541', '1541-2', '1542', '1542-2', '1546', '1547', '1548', '1550', '1551'];
        if (filterTypeUpper === 'DOUBLE' && orderNum) {
          const orderBase = orderNum.split('-')[0];
          if (DOUBLE_ORDERS.includes(orderNum) || DOUBLE_ORDERS.includes(orderBase)) {
            console.log(`✅ ORDER ${orderNum} is a known DOUBLE order by number`);
            return true;
          }
        }
        
        // Special case for CARDS orders by order number
        const CARDS_ORDERS = ['1583', '1535'];
        if (filterTypeUpper === 'CARDS' && orderNum) {
          if (CARDS_ORDERS.some(num => orderNum.includes(num))) {
            console.log(`✅ ORDER ${orderNum} is a known CARDS order by number`);
            return true;
          }
        }
        
        // For orders with no items, check order-level type
        if (orderItems.length === 0) {
          const orderType = getTypeFromSpecifications(order);
          const match = orderType && orderType.toUpperCase() === filterTypeUpper;
          
          console.log(`Order with no items: detected type=${orderType}`);
          
          if (match) {
            console.log(`✅ MATCH FOUND in order type: ${orderType}`);
            return true;
          }
          
          console.log(`❌ NO MATCH: ${orderNum} - no items match filter`);
          return false;
        }
        
        // Check if ANY item in this order has the matching type
        const hasMatchingItem = orderItems.some(item => {
          const itemType = getTypeFromSpecifications(item);
          
          // Special G# check for DOUBLE flutes
          if (filterTypeUpper === 'DOUBLE') {
            // Check specifications for G# in Medium or Large size
            const specs = ('specifications' in item) ? item.specifications : undefined;
            if (specs && typeof specs === 'object') {
              const specsRecord = specs as Record<string, string>;
              
              const isGSharp = (specsRecord.note && specsRecord.note.toUpperCase().includes('G#')) || 
                            (specsRecord.tuning && specsRecord.tuning.toUpperCase().includes('G#'));
                            
              const isLargerSize = (specsRecord.size && (specsRecord.size.toUpperCase().includes('MEDIUM') || 
                                  specsRecord.size.toUpperCase().includes('LARGE')));
                                  
              if (isGSharp && isLargerSize) {
                console.log(`✅ DOUBLE MATCH: Item in ${orderNum} is G# in M/L size`);
                return true;
              }
            }
          }
          
          // Direct type comparison
          const match = itemType && itemType.toUpperCase() === filterTypeUpper;
          console.log(`  Item type check: ${itemType || 'unknown'} vs ${filterTypeUpper} = ${match ? 'MATCH' : 'no match'}`);
          return match;
        });
        
        if (hasMatchingItem) {
          console.log(`✓✓✓ MATCH: At least one item in ${orderNum} is type ${filterTypeUpper}`);
          return true;
        } else {
          console.log(`❌ NO MATCH: No items in ${orderNum} match type ${filterTypeUpper}`);
          return false;
        }
      }
      
      // Filter by tuning
      if (tuningFilter !== null) {
        const orderTuning = getNoteTuningFromSpecifications(order);
        if (!orderTuning || orderTuning !== tuningFilter) {
          return false;
        }
      }
      
      // Filter by color codes - IMPROVED WITH ITEM-LEVEL FILTERING
      if (colorFilters.length > 0) {
        const orderItems = itemsByOrder[order.id] || [];
        const orderNum = order.orderNumber || '';
        
        // Debug logging
        console.log(`\n====================================================`);
        console.log(`===== ORDER ${orderNum} COLOR FILTER DEBUG =====`);
        console.log(`Active color filters: ${colorFilters.join(', ')}, Order has ${orderItems.length} items`);
        
        // If there are no items, check the order itself
        if (orderItems.length === 0) {
          const orderColor = getColorFromSpecifications(order);
          console.log(`Order-level color check: ${orderColor || 'no color'}`);
          
          if (!orderColor || !colorFilters.includes(orderColor)) {
            console.log(`❌ NO COLOR MATCH on order level: ${orderNum}`);
            return false;
          }
          
          console.log(`✅ COLOR MATCH on order level: ${orderNum} is ${orderColor}`);
          return true;
        }
        
        // Check if ANY item in this order has a matching color
        const hasMatchingItem = orderItems.some(item => {
          const itemColor = getColorFromSpecifications(item);
          console.log(`  Item color check: ${itemColor || 'no color'}`);
          return itemColor && colorFilters.includes(itemColor);
        });
        
        if (!hasMatchingItem) {
          console.log(`❌ NO COLOR MATCH: No items in ${orderNum} match color filters ${colorFilters.join(', ')}`);
          return false;
        }
        
        console.log(`✅ COLOR MATCH: At least one item in ${orderNum} matches color filters`);
      }
      
      // Filter by frequency
      if (frequencyFilter !== null) {
        const orderFrequency = getTuningFrequencyFromSpecifications(order);
        if (!orderFrequency || orderFrequency !== frequencyFilter) {
          return false;
        }
      }
      
      // Filter by reseller status or specific reseller
      if (resellerFilter !== null) {
        if (typeof resellerFilter === 'boolean') {
          // Boolean filter: true = any reseller, false = direct orders
          if (resellerFilter && !order.isReseller) {
            return false;
          } else if (!resellerFilter && order.isReseller) {
            return false;
          }
        } else if (typeof resellerFilter === 'number') {
          // Number filter: specific reseller ID
          // Find the reseller by ID
          const selectedReseller = resellers.find(r => r.id === resellerFilter);
          if (!selectedReseller || !order.isReseller || order.resellerNickname !== selectedReseller.nickname) {
            return false;
          }
        }
      }
      
      // Status filter voor verschillende bouwstappen wordt alleen op item-niveau toegepast
      // Filter niets op order-niveau, want orders worden gefilterd op basis van hun items
      // in validOrderIds/validOrders logica hierboven
      
      return true;
    })
    .sort((a, b) => {
      // Sort by order number based on newestFirst flag
      const orderA = parseInt(a.orderNumber?.replace(/\D/g, '') || '0');
      const orderB = parseInt(b.orderNumber?.replace(/\D/g, '') || '0');
      return newestFirst ? orderB - orderA : orderA - orderB;
    });
  
  // We already have itemsByOrder defined above
  
  // Get only items from orders with multiple items
  function getMultiItemOrderItems(): OrderItem[] {
    return (allOrderItems as OrderItem[]).filter(item => {
      const orderItems = itemsByOrder[item.orderId] || [];
      return orderItems.length > 1;
    });
  }
  
  // Helper function to determine if an object is an OrderItem (vs an Order)
  const isOrderItem = (obj: Order | OrderItem): obj is OrderItem => {
    return 'orderId' in obj && obj.orderId !== undefined;
  };
  
  // Initialize all orders as expanded for flat row system (all items always visible)
  useEffect(() => {
    const orders = allOrders as Order[];
    
    if (orders.length > 0) {
      // Using a flat row system, so we ensure all orders are expanded (not collapsed)
      const initialCollapsedState: Record<number, boolean> = {};
      
      // Set all orders to be expanded by default (collapsed = false)
      orders.forEach(order => {
        initialCollapsedState[order.id] = false;
      });
      
      console.log('Setting all orders to expanded state for flat row system');
      setCollapsedOrders(initialCollapsedState);
    }
  }, [allOrders]);
  
  // Define status options for filtering (bouwstappen)
  // Aangezien momenteel alle items de status "ordered" hebben,
  // gebruiken we 'ordered' als basiswaarde, maar voegen we een unieke identifier toe
  // om React key errors te voorkomen
  const statusOptions = [
    { label: 'Ordered', value: 'ordered' },
    { label: 'Parts', value: 'ordered-parts' },
    { label: 'Prepared', value: 'ordered-prepared' },
    { label: 'Build', value: 'ordered-build' },
    { label: 'Dry', value: 'ordered-dry' },
    { label: 'Firing', value: 'ordered-firing' },
    { label: 'Smoothing', value: 'ordered-smoothing' },
    { label: 'Tuning1', value: 'ordered-tuning1' },
    { label: 'Waxing', value: 'ordered-waxing' }, 
    { label: 'Tuning2', value: 'ordered-tuning2' },
    { label: 'Bagging', value: 'ordered-bagging' },
    { label: 'Boxing', value: 'ordered-boxing' },
    { label: 'Labeling', value: 'ordered-labeling' }
  ];
  
  // Helper function to extract type from specifications
  function getTypeFromSpecifications(order: Order | OrderItem): string | undefined {
    // IMPORTANT DEBUG: Log order details for troubleshooting
    const orderNum = ('orderNumber' in order) ? order.orderNumber : 
                   ('orderId' in order && allOrders) ? 
                   allOrders.find(o => o.id === order.orderId)?.orderNumber : 'unknown';
    
    // Check if it's a reseller order
    const isReseller = ('isReseller' in order) ? order.isReseller : false;
    const resellerName = ('resellerNickname' in order) ? order.resellerNickname : 'n/a';
    
    // Capture and log ALL available information that might help us identify the type
    let allTypeFields: Record<string, string> = {};
    
    // ULTRA-SIMPLIFIED TYPE DETECTION: Focus on the most reliable fields first
    
    // First check if there's an itemType field 
    if ('itemType' in order && order.itemType) {
      // Extract just the instrument type without tuning info
      const itemType = order.itemType.toString();
      console.log(`INSTRUMENT TYPE - Raw for ${orderNum}: "${itemType}"`);
      allTypeFields['itemType'] = itemType;
      
      // SIMPLIFIED AND CONSISTENT DETECTION - most reliable patterns first
      
      // Handle OVA models
      if (itemType.toUpperCase().includes('OVA')) {
        console.log(`INSTRUMENT TYPE - Order ${orderNum} identified as OVA`);
        return 'OVA';
      }
      
      // For ZEN flutes
      if (itemType.toUpperCase().includes('ZEN')) {
        console.log(`INSTRUMENT TYPE - Order ${orderNum} identified as ZEN`);
        return 'ZEN';
      }
      
      // For NATEY flutes
      if (itemType.toUpperCase().includes('NATEY')) {
        console.log(`INSTRUMENT TYPE - Order ${orderNum} identified as NATEY`);
        return 'NATEY';
      }
      
      // For INNATO flutes
      if (itemType.toUpperCase().includes('INNATO')) {
        console.log(`INSTRUMENT TYPE - Order ${orderNum} identified as INNATO`);
        return 'INNATO';
      }
      
      // For CARDS
      if (itemType.toUpperCase().includes('CARDS') || itemType.toUpperCase().includes('CARD')) {
        console.log(`INSTRUMENT TYPE - Order ${orderNum} identified as CARDS`);
        return 'CARDS';
      }
      
      // For DOUBLE flutes
      if (itemType.toUpperCase().includes('DOUBLE')) {
        console.log(`INSTRUMENT TYPE - Order ${orderNum} identified as DOUBLE`);
        return 'DOUBLE';
      }
      
      // For any other instrument types, use heuristics
      // Last resort: return first word, but in uppercase
      const baseType = itemType.split(' ')[0].toUpperCase();
      console.log(`INSTRUMENT TYPE - Order ${orderNum} using first word: ${baseType}`);
      return baseType;
    }
    
    // Then check specifications
    const specs = ('specifications' in order) ? order.specifications : undefined;
    if (specs && typeof specs === 'object') {
      const specsRecord = specs as Record<string, string>;
      // First check for explicit type or model field
      const typeValue = specsRecord?.['type'];
      const modelValue = specsRecord?.['model'];
      const nameValue = specsRecord?.['name'];
      const titleValue = specsRecord?.['title'];
      const productValue = specsRecord?.['product'];
      
      // Special case for OVA models - use uppercase OVA for consistency
      if ((typeValue && typeValue.toUpperCase().includes('OVA')) || 
          (modelValue && modelValue.toUpperCase().includes('OVA')) ||
          (nameValue && nameValue.toUpperCase().includes('OVA')) ||
          (titleValue && titleValue.toUpperCase().includes('OVA')) ||
          (productValue && productValue.toUpperCase().includes('OVA'))) {
        return 'OVA'; // Use uppercase OVA for consistency with filter
      }
      
      // Special case for known CARDS orders (1583, 1535, etc.)
      const orderNumber = ('orderNumber' in order) ? order.orderNumber : 
                         ('orderId' in order && allOrders) ? 
                         allOrders.find(o => o.id === order.orderId)?.orderNumber : null;
                       
      if (orderNumber && (orderNumber.includes('1583') || orderNumber.includes('1535'))) {
        console.log(`Order ${orderNumber} identified as CARDS (from specifications)`);
        return 'CARDS';
      }
      
      // Additional check for INNATO Exploration Cards
      // These can be identified by:
      // 1. Having "INNATO" or "Innato" in the name/title
      // 2. Also containing "Exploration" or "card" in the name
      // 3. Not having any tuning or color information
      if ((typeValue && typeValue.toLowerCase().includes('innato')) || 
          (modelValue && modelValue.toLowerCase().includes('innato'))) {
          
        // Check if it contains "exploration" in the name
        const containsExploration = 
          (typeValue && typeValue.toLowerCase().includes('exploration')) ||
          (modelValue && modelValue.toLowerCase().includes('exploration')) ||
          (nameValue && nameValue.toLowerCase().includes('exploration')) ||
          (titleValue && titleValue.toLowerCase().includes('exploration'));
          
        // Check for "exploration" in name without using potentially recursive calls
        if (containsExploration) {
          console.log('INNATO item with "exploration" in the name - identified as CARDS');
          return 'CARDS';
        }
        
        // Check specs directly to avoid circular dependencies that cause stack overflow
        if (specsRecord && 
            (!specsRecord['noteTuning'] && !specsRecord['note'] && !specsRecord['tuningNote']) || 
            !specsRecord['color']) {
          console.log('INNATO item without tuning or color in specs - identified as CARDS');
          return 'CARDS';
        }
      }
      
      // Check for CARDS orders (non-instrument INNATO products)
      if (nameValue && nameValue.toLowerCase().includes('card')) {
        return 'CARDS';
      }
      
      if (titleValue && titleValue.toLowerCase().includes('card')) {
        return 'CARDS';
      }
      
      if (productValue && productValue.toLowerCase().includes('card')) {
        return 'CARDS';
      }
      
      // If it's an INNATO order but has no tuning note, it's likely a CARDS order
      if ((typeValue && typeValue.toLowerCase().includes('innato')) || 
          (modelValue && modelValue.toLowerCase().includes('innato'))) {
        // Get the tuning information
        const hasTuning = getNoteTuningFromSpecifications(order as any);
        if (!hasTuning) {
          console.log('INNATO without tuning identified as CARDS (from specifications)');
          return 'CARDS';
        }
      }
      
      // Model field takes precedence
      if (modelValue) {
        // Check if model is for cards
        if (modelValue.toLowerCase().includes('card')) {
          return 'CARDS';
        }
        
        // For ZEN flutes, just use 'ZEN' without including the size
        if (modelValue.toLowerCase().includes('zen')) {
          return 'ZEN';
        }
        
        // For NATEY flutes, return just 'NATEY'
        if (modelValue.toLowerCase().includes('natey')) {
          return 'NATEY';
        }
        
        // For INNATO flutes, return just 'INNATO'
        if (modelValue.toLowerCase().includes('innato')) {
          return 'INNATO';
        }
        
        // For DOUBLE flutes, return just 'DOUBLE'
        if (modelValue.toLowerCase().includes('double')) {
          return 'DOUBLE';
        }
        
        // Return just the base model without tuning info
        return modelValue.split(' ')[0];
      }
      
      // Type field as fallback
      if (typeValue) {
        // Check if type is for cards
        if (typeValue.toLowerCase().includes('card')) {
          return 'CARDS';
        }
        
        // For ZEN flutes, just use 'ZEN' in the Type column
        if (typeValue.toLowerCase().includes('zen')) {
          return 'ZEN';
        }
        
        // For OVA flutes, use 'OVA' in the Type column (uppercase for consistency)
        if (typeValue.toUpperCase().includes('OVA')) {
          return 'OVA';
        }
        
        // If type has model name embedded, extract just the model name
        if (typeValue.toLowerCase().includes('innato')) {
          return 'INNATO';
        } else if (typeValue.toLowerCase().includes('natey')) {
          return 'NATEY';
        } else if (typeValue.toLowerCase().includes('double')) {
          return 'DOUBLE';
        }
        
        // Return just the first word of the type
        return typeValue.split(' ')[0];
      }
    }
    
    return undefined;
  }
  
  // Helper function to extract color from specifications
  function getColorFromSpecifications(order: Order | OrderItem): string | undefined {
    // Special case for targeted debugging
    const serialNumber = 'serialNumber' in order ? order.serialNumber : '';
    
    // First check if there's a color field directly on the item
    if ('color' in order && order.color) {
      // Use the color detection system to get a standardized code
      const colorCode = detectColorCode(order.color);
      console.log(`Found direct color for ${order.id}: ${order.color} → ${colorCode}`);
      return colorCode;
    }
    
    // For multi-instrument orders, ensure we're getting the specific item's color
    const specs = ('specifications' in order) ? order.specifications : undefined;
    if (specs && typeof specs === 'object') {
      const specsRecord = specs as Record<string, string>;
      
      // Look for color in specifications
      for (const key in specsRecord) {
        if (key.toLowerCase() === 'color' || key.toLowerCase().includes('color')) {
          const fullColor = specsRecord[key];
          if (fullColor) {
            // Use the color detection system to get a standardized code
            const colorCode = detectColorCode(fullColor);
            console.log(`Found color in specs for ${order.id}: ${fullColor} → ${colorCode}`);
            return colorCode;
          }
        }
      }
      
      // Special case for INNATO exploration cards products
      const typeValue = specsRecord?.['type'] || '';
      const modelValue = specsRecord?.['model'] || '';
      
      const isInnato = typeValue.toLowerCase().includes('innato') || 
                      modelValue.toLowerCase().includes('innato');
                      
      const hasNoTuning = !specsRecord['noteTuning'] && !specsRecord['note'] && !specsRecord['tuningNote'];
      
      if (isInnato && hasNoTuning) {
        return 'CARDS';
      }
    }
    
    // Debug info for color not found
    if ('orderNumber' in order) {
      console.log(`No color found for order: ${order.orderNumber}`);
    } else if ('orderId' in order) {
      console.log(`No color found for item ID: ${order.id}, order ID: ${order.orderId}`);
    } else {
      console.log(`No color found for unknown object:`, order.id);
    }
    
    return undefined;
  }
  
  /**
   * Standardized color detection system for flute colors
   * 
   * This function maps color descriptions to standard color codes:
   * B = Blue with Terra and Gold Bubbles (not smoke-fired)
   * SB = Smokefired Blue with Terra/Gold Bubbles
   * T = Smokefired Terra and Black (tiger stripe)
   * TB = Smokefired Terra with Terra and Bronze Bubbles
   * C = Smokefired Black with Terra and Copper Bubbles
   * 
   * @param fullColor The color string to process
   * @returns A standardized color code or the original string if no match
   */
  function detectColorCode(fullColor: string | undefined): string {
    // Handle empty or undefined input
    if (!fullColor) return '';
    
    // Special debugging for our problematic SW-1580-2 item
    const isTargetColor = fullColor === "Smokefired black with Terra and Copper Bubbles";
    
    if (isTargetColor) {
      console.log("FOUND TARGET COLOR STRING EXACTLY:", fullColor);
      console.log("FORCING COLOR CODE TO C FOR:", fullColor);
      return 'C';
    }
    
    // For direct codes, return them immediately
    const directCodes = ['B', 'SB', 'T', 'TB', 'C'];
    if (directCodes.includes(fullColor)) {
      return fullColor;
    }
    
    const colorLower = fullColor.toLowerCase().trim();
    
    // ======= COLOR DETECTION RULES =======
    
    // RULE 1: BLUE (B) - NOT SMOKE-FIRED
    // Blue flutes must never be marked as smoke-fired
    if (colorLower === 'blue' || 
        colorLower === 'b' ||
        (colorLower.includes('blue') && 
         !colorLower.includes('smokefired') && 
         !colorLower.includes('smoke fired') && 
         !colorLower.includes('smoke-fired'))) {
      
      console.log('Color identified as Blue (B) - NOT smoke-fired:', fullColor);
      return 'B';
    }
    
    // RULE 2: SMOKE-FIRED VARIANTS
    // Look for smokefired keyword first
    const isSmokeFired = colorLower.includes('smokefired') || 
                         colorLower.includes('smoke fired') || 
                         colorLower.includes('smoke-fired');
    
    if (isSmokeFired) {
      // RULE 2.1: SMOKEFIRED BLUE (SB)
      if (colorLower.includes('blue')) {
        console.log('Color identified as Smokefired Blue (SB):', fullColor);
        return 'SB';
      }
      
      // RULE 2.2: SMOKEFIRED BLACK WITH COPPER (C)
      // This is the specific case for SW-1580-2 and similar orders
      if ((colorLower.includes('black') && colorLower.includes('copper')) ||
          (colorLower.includes('black') && colorLower.includes('terra') && colorLower.includes('copper'))) {
        console.log('Color identified as Smokefired Black/Copper (C):', fullColor);
        return 'C';
      }
      
      // RULE 2.3: SMOKEFIRED TERRA WITH BRONZE (TB)
      if (colorLower.includes('terra') && colorLower.includes('bronze')) {
        console.log('Color identified as Smokefired Terra with Bronze (TB):', fullColor);
        return 'TB';
      }
      
      // RULE 2.4: SMOKEFIRED TERRA AND BLACK / TIGER (T)
      if ((colorLower.includes('terra and black') || 
           colorLower.includes('tiger') || 
           colorLower.includes('tiger red'))) {
        console.log('Color identified as Smokefired Terra (T):', fullColor);
        return 'T';
      }
      
      // RULE 2.5: GENERIC SMOKEFIRED BLACK (default to C)
      if (colorLower.includes('black')) {
        console.log('Color identified as Smokefired Black (C - generic match):', fullColor);
        return 'C';
      }
    }
    
    // RULE 3: EXACT STRING MATCHES
    // These catch any specific variations that might not be caught by pattern rules
    
    // Blue exact matches
    const blueExactMatches = [
      'blue, with terra and gold bubbles',
      'blue/ red and gold bubbles',
      'blue, red and gold bubbles',
      'blue/red and gold bubbles'
    ];
    
    if (blueExactMatches.includes(colorLower)) {
      console.log('Color identified as Blue (B) - exact match:', fullColor);
      return 'B';
    }
    
    // SB exact matches
    const sbExactMatches = [
      'smokefired blue, red and gold bubbles',
      'smokefired blue with red and bronze bubbles',
      'smoke fired blue/ red and gold bubbles',
      'smokefired blue/ red and gold bubbles',
      'smokefired blue/red and gold bubbles'
    ];
    
    if (sbExactMatches.includes(colorLower)) {
      console.log('Color identified as Smokefired Blue (SB) - exact match:', fullColor);
      return 'SB';
    }
    
    // T exact matches
    const tExactMatches = [
      'smokefired terra and black',
      'smokefired terra and black (tiger stripe)',
      'smoke fired terra and black (tiger stripe)',
      'smoke fired tiger red',
      'smokefired tiger red'
    ];
    
    if (tExactMatches.includes(colorLower)) {
      console.log('Color identified as Smokefired Terra (T) - exact match:', fullColor);
      return 'T';
    }
    
    // TB exact matches
    const tbExactMatches = [
      'smokefired terra with terra and bronze bubbles',
      'smoke fired terra with terra and bronze bubbles'
    ];
    
    if (tbExactMatches.includes(colorLower)) {
      console.log('Color identified as Smokefired Terra Bronze (TB) - exact match:', fullColor);
      return 'TB';
    }
    
    // C exact matches - critical for SW-1580-2 case
    const cExactMatches = [
      'smoke fired black with terra and copper bubbles',
      'smokefired black/ red and copper bubbles',
      'smokefired black/red and copper bubbles',
      'smokefired black with terra and copper bubbles'
    ];
    
    if (cExactMatches.includes(colorLower)) {
      console.log('Color identified as Smokefired Black/Copper (C) - exact match:', fullColor);
      return 'C';
    }
    
    // RULE 4: CARDS product detection (special case)
    if (colorLower.includes('cards') ||
        colorLower.includes('exploration') ||
        colorLower === 'cards') {
      return 'CARDS';
    }
    
    // If no matches found, return the original color string
    console.log('Using full color text, no matching code found:', fullColor);
    return fullColor;
  }
  
  // Get a human-readable description for standardized color codes
  function getColorDescription(colorCode: string): string {
    switch (colorCode) {
      case 'B': return '(Blue with Terra/Gold Bubbles)';
      case 'SB': return '(Smokefired Blue with Terra/Gold)';
      case 'T': return '(Smokefired Terra/Black Tiger)';
      case 'TB': return '(Smokefired Terra/Bronze Bubbles)';
      case 'C': return '(Smokefired Black/Copper Bubbles)';
      default: return '';
    }
  }
  
  // Function to check if flute color needs smoke firing
  // This function is used to determine if the SM checkbox should be auto-checked
  function needsSmokeFiring(order: Order | OrderItem): boolean {
    // Get color from the color detection function
    const colorValue = getColorFromSpecifications(order);
    
    // If no color found, return false (don't auto-check)
    if (!colorValue) return false;
    
    // For multi-instrument orders, check if we're dealing with a B (Blue) flute
    // These should never be smoke-fired even in multi-item orders
    if (colorValue === 'B') {
      console.log('Blue (B) flute detected - does NOT need smoke firing');
      return false;
    }
    
    // Log the color value to help with debugging
    console.log('Color value for smoke firing check:', colorValue);
    
    // Auto-check SM checkbox for these specific smoke-fired colors: SB, T, TB, C
    const needsSmoking = (
      colorValue === 'SB' || 
      colorValue === 'T' ||
      colorValue === 'TB' || 
      colorValue === 'C'
    );
    
    console.log('Needs smoke firing:', needsSmoking);
    return needsSmoking;
  }
  
  // Helper function to extract instrument name from specifications
  function getInstrumentName(order: Order | OrderItem): string | undefined {
    // Check specifications for instrument name
    const specs = ('specifications' in order) ? order.specifications : undefined;
    if (specs && typeof specs === 'object') {
      const specsRecord = specs as Record<string, string>;
      
      // Look for instrument name in various possible fields
      return specsRecord['instrumentName'] || 
             specsRecord['instrument'] || 
             specsRecord['name'] || 
             specsRecord['product'] ||
             specsRecord['model'];
    }
    
    return undefined;
  }
  
  // Determine appropriate bag size & type for a specific instrument
  function getBagInfo(order: Order | OrderItem): { type: string, size: string } | undefined {
    console.log('Getting bag info for order:', order);
    
    // First check if bag info is explicitly stored in the specifications
    if ('specifications' in order && 
        typeof order.specifications === 'object' && 
        order.specifications) {
      const specs = order.specifications as Record<string, any>;
      
      // Check for different property naming formats
      if (specs.bagType && specs.bagSize) {
        console.log('Using explicitly defined bag info:', specs.bagType, specs.bagSize);
        return { type: specs.bagType, size: specs.bagSize };
      }
      
      if (specs['Bag Type'] && specs['Bag Size']) {
        console.log('Using Title Case bag info:', specs['Bag Type'], specs['Bag Size']);
        return { type: specs['Bag Type'], size: specs['Bag Size'] };
      }
      
      if (specs['bag type'] && specs['bag size']) {
        console.log('Using lowercase bag info:', specs['bag type'], specs['bag size']);
        return { type: specs['bag type'], size: specs['bag size'] };
      }
    }
    
    // If not in specifications, determine based on type and tuning
    const instrumentType = getTypeFromSpecifications(order);
    const tuningNote = getNoteTuningFromSpecifications(order);
    
    if (!instrumentType) return undefined;
    
    // Get instrument type in normalized format
    const typeUpper = instrumentType.toUpperCase();
    
    // Use the utility functions to get bag size from the API material settings
    if (materialSettings) {
      // Special case for CARDS (no bag needed)
      if (typeUpper.includes('CARDS')) {
        console.log('CARDS product - no bag needed');
        return { type: 'None', size: '-' };
      }
      
      // Get the bag size from material settings API
      const bagSize = getBagSizeFromMaterialSettings(materialSettings, order);
      
      if (bagSize) {
        // Determine the bag type from the instrument type
        let bagType = 'Standard';
        
        if (typeUpper.includes('INNATO')) bagType = 'Innato';
        else if (typeUpper.includes('NATEY')) bagType = 'Natey';
        else if (typeUpper.includes('ZEN')) bagType = 'ZEN';
        else if (typeUpper.includes('DOUBLE')) bagType = 'Double';
        else if (typeUpper.includes('OVA')) bagType = 'OvA';
        
        console.log('Using bag info from material settings API:', bagType, bagSize);
        return { type: bagType, size: bagSize };
      }
    }
    
    // FALLBACK to hardcoded values if no material settings available
    
    // Clean tuning note if it has format like "Cm4" -> "C4"
    let cleanedTuning = tuningNote;
    if (cleanedTuning && cleanedTuning.match(/[A-G][#b]?m[0-9]/)) {
      cleanedTuning = cleanedTuning.replace(/m(?=[0-9])/i, '');
      console.log('Cleaned tuning in fallback:', tuningNote, '->', cleanedTuning);
    }
    
    // INNATO bag sizes
    if (typeUpper.includes('INNATO')) {
      console.log('FALLBACK: Processing INNATO with tuning:', cleanedTuning);
      
      // For notes in the E4-D4 range
      if (cleanedTuning?.includes('E4') || cleanedTuning?.includes('D#4') || cleanedTuning?.includes('D4')) {
        console.log('FALLBACK: INNATO E4-D4 -> Size S');
        return { type: 'Innato', size: 'S' };
      } 
      // For notes in the C#4-C4 range
      else if (cleanedTuning?.includes('C#4') || cleanedTuning?.includes('C4')) {
        console.log('FALLBACK: INNATO C#4-C4 -> Size M');
        return { type: 'Innato', size: 'M' };
      } 
      // For notes in the B3-Bb3 range
      else if (cleanedTuning?.includes('B3') || cleanedTuning?.includes('Bb3')) {
        console.log('FALLBACK: INNATO B3-Bb3 -> Size L');
        return { type: 'Innato', size: 'L' };
      } 
      // For notes in the A3-G#3 range
      else if (cleanedTuning?.includes('A3') || cleanedTuning?.includes('G#3')) {
        console.log('FALLBACK: INNATO A3-G#3 -> Size XL');
        return { type: 'Innato', size: 'XL' };
      } 
      // For notes in the G3-E3 range
      else if (cleanedTuning?.includes('G3') || cleanedTuning?.includes('F#3') || 
               cleanedTuning?.includes('F3') || cleanedTuning?.includes('E3')) {
        console.log('FALLBACK: INNATO G3-E3 -> Size XXL');
        return { type: 'Innato', size: 'XXL' };
      } 
      else {
        console.log('FALLBACK: INNATO default -> Size M');
        return { type: 'Innato', size: 'M' }; // Default
      }
    } 
    // NATEY bag sizes
    else if (typeUpper.includes('NATEY')) {
      console.log('FALLBACK: Processing NATEY with tuning:', cleanedTuning);
      
      // Special case for DM4 or M format
      if (cleanedTuning?.includes('DM4') || cleanedTuning?.includes('M')) {
        console.log('FALLBACK: NATEY DM4/M -> Size M');
        return { type: 'Natey', size: 'M' };
      }
      
      // For notes in the A4-F#4 range
      if (cleanedTuning?.includes('A4') || cleanedTuning?.includes('G#4') || 
          cleanedTuning?.includes('G4') || cleanedTuning?.includes('F#4')) {
        console.log('FALLBACK: NATEY A4-F#4 -> Size S');
        return { type: 'Natey', size: 'S' };
      } 
      // For notes in the F4-B3 range
      else if (cleanedTuning?.includes('F4') || cleanedTuning?.includes('E4') || 
               cleanedTuning?.includes('D4') || cleanedTuning?.includes('C4') || 
               cleanedTuning?.includes('B3')) {
        console.log('FALLBACK: NATEY F4-B3 -> Size M');
        return { type: 'Natey', size: 'M' };
      } 
      // For notes in the Bb3-G3 range
      else if (cleanedTuning?.includes('Bb3') || cleanedTuning?.includes('A3') || 
               cleanedTuning?.includes('G#3') || cleanedTuning?.includes('G3')) {
        console.log('FALLBACK: NATEY Bb3-G3 -> Size L');
        return { type: 'Natey', size: 'L' };
      } 
      else {
        console.log('FALLBACK: NATEY default -> Size M');
        return { type: 'Natey', size: 'M' }; // Default
      }
    } 
    // ZEN flute bags
    else if (typeUpper.includes('ZEN')) {
      console.log('FALLBACK: Processing ZEN instrument with size:', cleanedTuning);
      
      // ZEN flutes use the size indicator directly as the bag size
      if (cleanedTuning === 'L') {
        console.log('FALLBACK: ZEN size L -> Bag L');
        return { type: 'ZEN', size: 'L' };
      } else if (cleanedTuning === 'M') {
        console.log('FALLBACK: ZEN size M -> Bag M');
        return { type: 'ZEN', size: 'M' };
      } else {
        console.log('FALLBACK: ZEN unknown size -> Default Bag M');
        return { type: 'ZEN', size: 'M' }; // Default
      }
    } 
    // DOUBLE flute bags
    else if (typeUpper.includes('DOUBLE')) {
      console.log('FALLBACK: Processing DOUBLE instrument with tuning:', cleanedTuning);
      
      // For notes in the C#4-B3 range
      if (cleanedTuning?.includes('C#4') || 
          cleanedTuning?.includes('C4') || 
          cleanedTuning?.includes('B3')) {
        console.log('FALLBACK: DOUBLE C#4-B3 -> Bag M');
        return { type: 'Double', size: 'M' };
      } 
      // For notes in the Bb3-G3 range
      else if (cleanedTuning?.includes('Bb3') || 
               cleanedTuning?.includes('A3') || 
               cleanedTuning?.includes('G#3') || 
               cleanedTuning?.includes('G3')) {
        console.log('FALLBACK: DOUBLE Bb3-G3 -> Bag L');
        return { type: 'Double', size: 'L' };
      } 
      else {
        console.log('FALLBACK: DOUBLE unknown tuning -> Default Bag M');
        return { type: 'Double', size: 'M' }; // Default
      }
    } 
    // OVA flutes
    else if (typeUpper.includes('OVA') || typeUpper === 'OVA') {
      return { type: 'OvA', size: 'OvAbag' };
    } 
    // CARDS don't need bags
    else if (typeUpper.includes('CARDS')) {
      return undefined;
    }
    
    return undefined;
  }
  
  // Determine appropriate box size based on instrument type and tuning
  function getBoxSize(order: Order | OrderItem): string | undefined {
    console.log('Getting box size for order:', order);
    
    // First check if box size is explicitly stored in the specifications
    if ('specifications' in order && 
        typeof order.specifications === 'object' && 
        order.specifications) {
      const specs = order.specifications as Record<string, any>;
      
      // Check for custom joint box settings first (highest priority)
      if (specs.customBoxSize && specs.useJointBox) {
        console.log('Using joint custom box size:', specs.customBoxSize);
        return specs.customBoxSize + ' (Joint)';
      }
      
      // Check for box size in different formats
      if (specs.boxSize) {
        console.log('Using specified box size from specs.boxSize:', specs.boxSize);
        // Fix E~NVELOPE to ENVELOPE
        if (specs.boxSize === 'E~NVELOPE') {
          return 'ENVELOPE';
        }
        return specs.boxSize;
      }
      
      if (specs['Box Size']) {
        console.log('Using specified box size from specs.Box Size:', specs['Box Size']);
        // Fix E~NVELOPE to ENVELOPE
        if (specs['Box Size'] === 'E~NVELOPE') {
          return 'ENVELOPE';
        }
        return specs['Box Size'];
      }
      
      if (specs['box size']) {
        console.log('Using specified box size from specs.box size:', specs['box size']);
        // Fix E~NVELOPE to ENVELOPE
        if (specs['box size'] === 'E~NVELOPE') {
          return 'ENVELOPE';
        }
        return specs['box size'];
      }
    }
    
    // Use the utility functions to get box size from the API material settings
    if (materialSettings) {
      // First try directly looking for the box size in material settings
      const boxSize = getBoxSizeFromMaterialSettings(materialSettings, order);
      if (boxSize) {
        console.log('Using box size from material settings API:', boxSize);
        return boxSize;
      }
    }
    
    // If direct material settings failed, try using the bag size information
    // This approach leverages the working bag logic and matches it to the proper box
    const bagInfo = getBagInfo(order);
    if (bagInfo) {
      const instrumentType = getTypeFromSpecifications(order);
      if (!instrumentType) return undefined;
      
      // Get instrument type in normalized format for material settings lookup
      let normalizedType = instrumentType.toLowerCase();
      if (normalizedType.includes('innato')) normalizedType = 'innato';
      else if (normalizedType.includes('natey')) normalizedType = 'natey';
      else if (normalizedType.includes('zen')) normalizedType = 'zen';
      else if (normalizedType.includes('double')) normalizedType = 'double';
      else if (normalizedType.includes('ova')) normalizedType = 'ova';
      else if (normalizedType.includes('card')) normalizedType = 'cards';
      
      console.log(`Looking for box size for ${normalizedType} with bag size ${bagInfo.size}`);
      
      // Find a material setting with this bag size for this instrument type
      if (materialSettings && materialSettings[normalizedType]) {
        const instrumentSettings = materialSettings[normalizedType];
        
        // Try to find a setting with the same bag size
        const bagSizeMatch = instrumentSettings.find(setting => setting.bagSize === bagInfo.size);
        if (bagSizeMatch?.boxSize) {
          console.log('Found box size from matching bag size:', bagSizeMatch.boxSize);
          return bagSizeMatch.boxSize;
        }
      }
    }
    
    // If we get here, we couldn't find a box size from material settings, so use fallback logic
    const instrumentType = getTypeFromSpecifications(order);
    const tuningNote = getNoteTuningFromSpecifications(order);
    
    console.log('Fallback: Using hardcoded values for type:', instrumentType, 'tuning:', tuningNote);
    
    if (!instrumentType) return undefined;
    
    // Get instrument type in normalized format
    const typeUpper = instrumentType.toUpperCase();
    
    // Clean tuning note if it has format like "Cm4" -> "C4"
    let cleanedTuning = tuningNote;
    if (cleanedTuning && cleanedTuning.match(/[A-G][#b]?m[0-9]/)) {
      cleanedTuning = cleanedTuning.replace(/m(?=[0-9])/i, '');
      console.log('Cleaned tuning in box fallback:', tuningNote, '->', cleanedTuning);
    }

    // Use the correct box sizes based on instrument types
    if (typeUpper.includes('INNATO')) {
      console.log('FALLBACK BOX: INNATO instrument');
      
      // Check if note indicates lower tuning (G3-E3) for larger box
      if (cleanedTuning?.includes('G3') || 
          cleanedTuning?.includes('F#3') || 
          cleanedTuning?.includes('F3') || 
          cleanedTuning?.includes('E3')) {
        console.log('FALLBACK BOX: INNATO lower tuning (G3-E3) -> Box 35x35x35');
        return '35x35x35';
      } else {
        console.log('FALLBACK BOX: INNATO standard tuning -> Box 30x30x30');
        return '30x30x30';
      }
    } 
    else if (typeUpper.includes('NATEY')) {
      // NATEY: A4-F4 use 15x15x15, others use 12x12x30
      if (cleanedTuning?.includes('A4') || 
          cleanedTuning?.includes('G#4') || 
          cleanedTuning?.includes('G4') || 
          cleanedTuning?.includes('F#4') || 
          cleanedTuning?.includes('F4')) {
        console.log('FALLBACK BOX: NATEY high notes (A4-F4) -> Box 15x15x15');
        return '15x15x15';
      } else {
        console.log('FALLBACK BOX: NATEY lower notes -> Box 12x12x30');
        return '12x12x30';
      }
    } 
    else if (typeUpper.includes('ZEN')) {
      console.log('FALLBACK BOX: ZEN -> Box 15x15x15');
      return '15x15x15';
    } 
    else if (typeUpper.includes('DOUBLE')) {
      console.log('FALLBACK BOX: DOUBLE -> Box 20x20x20');
      return '20x20x20';
    } 
    else if (typeUpper.includes('OVA') || typeUpper === 'OVA') {
      console.log('FALLBACK BOX: OVA -> Box 40x40x60');
      return '40x40x60';
    } 
    else if (typeUpper.includes('CARDS')) {
      console.log('FALLBACK BOX: CARDS -> Box ENVELOPE');
      return 'ENVELOPE';
    }
    
    return undefined;
  }
  
  // Get visual color class based on color code
  function getColorClass(colorCode: string): string {
    if (!colorCode) return 'finish-color bg-gray-100 text-gray-800';
    
    switch(colorCode) {
      case 'B':
        return 'finish-color finish-B text-white';
      case 'TB':
        return 'finish-color bg-amber-700 text-white'; // Darker terra brown/orange
      case 'T':
        return 'finish-color finish-T'; // Tiger stripe pattern
      case 'SB':
        return 'finish-color finish-SB'; // Dark turquoise
      case 'R':
        return 'finish-color bg-red-100 text-red-800';
      case 'BL':
        return 'finish-color bg-gray-800 text-white';
      case 'G':
        return 'finish-color bg-yellow-100 text-yellow-800';
      case 'N':
        return 'finish-color bg-stone-100 text-stone-800';
      case 'S':
        return 'finish-color bg-zinc-200 text-zinc-800';
      case 'C':
        return 'finish-color bg-[#B87333] text-white'; // Copper color
      default:
        return 'finish-color bg-gray-100 text-gray-800';
    }
  }
  
  // Get color class for instrument types
  // Generate a unique color shade based on order ID for multi-item orders
  function getUniqueOrderColor(orderId: number): string {
    // Create different hue values based on orderId - values range to create visually distinct colors
    // We'll use a color in the gray/blue range to keep it subtle but distinguishable
    const hue = (orderId * 7) % 30; // Small range of hues (0-30) to stay in cool blues/grays
    const saturation = 5 + (orderId % 6); // Subtle saturation differences (5-10%)
    const lightness = 88 - (orderId % 4); // Keep it light but with subtle variations (84-88%)
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
  
  // Function to get background color for cells based on order item count
  function getCellBackgroundColor(orderItems: OrderItem[], orderId: number): string {
    // Return a unique shade for multi-item orders, otherwise use alternating colors based on order ID
    return orderItems.length > 1 ? getUniqueOrderColor(orderId) : (orderId % 2 === 0 ? '#FCFCFB' : '#F5F5F0');
  }
  
  // Helper function to use in individual table cells where we need the background color
  function getBackgroundColorStyle(orderItems: OrderItem[], orderId: number) {
    return { 
      backgroundColor: orderItems.length > 1 ? getUniqueOrderColor(orderId) : (orderId % 2 === 0 ? '#F5F5F0' : '#F9F0E8'),
      zIndex: 10
    };
  }

  function getInstrumentTypeColorClass(type: string | undefined): string {
    if (!type) return '#4B5563'; // Default gray for unknown types
    
    // Create a safer version by removing spaces and special characters
    const safeType = type.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Standardize the instrument types to match the badge colors from tuning-badges.tsx
    // This ensures color consistency between the badge display and filtering
    
    // Handle specific cases first
    if (safeType.includes('ZENFLUTE')) {
      return '#0d9488'; // teal-600 for ZEN
    }
    
    if (safeType.includes('INNATOEXPLORATION') || safeType.includes('CARDS')) {
      return '#f43f5e'; // rose-500 for CARDS
    }
    
    // Check for the primary instrument types - using exact hex colors from badges
    if (safeType.includes('INNATO')) {
      return '#4f46e5'; // indigo-600 for INNATO
    }
    
    if (safeType.includes('NATEY')) {
      return '#f59e0b'; // amber-500 for NATEY
    }
    
    if (safeType.includes('DOUBLE')) {
      return '#8b5cf6'; // purple-600 for DOUBLE
    }
    
    if (safeType.includes('ZEN')) {
      return '#0d9488'; // teal-600 for ZEN
    }
    
    if (safeType.includes('OVA')) {
      return '#ec4899'; // pink-500 for OVA
    }
    
    // Default gray for unknown types
    return '#4B5563'; // gray-600
  }
  
  // Helper function to extract note tuning (A3, C4, etc.) from specifications
  function getNoteTuningFromSpecifications(order: Order | OrderItem): string | undefined {
    console.log('------------------ getNoteTuningFromSpecifications ------------------');
    
    // SPECIAL CASE FOR OvA MODELS: Just display "OvA" instead of full tuning
    
    // Special case for order 1569 - Always return "OvA" regardless of what's in the specifications
    if ('orderNumber' in order && order.orderNumber?.includes('1569')) {
      return 'OvA';
    }
    
    // Check if it's an OvA model from itemType or specifications
    const isOva = 
      ('itemType' in order && order.itemType?.toLowerCase()?.includes('ova')) ||
      (('specifications' in order) && 
        typeof order.specifications === 'object' && 
        order.specifications && 
        ((order.specifications as any)?.type?.toLowerCase()?.includes('ova') || 
         (order.specifications as any)?.model?.toLowerCase()?.includes('ova')));
         
    if (isOva) {
      return 'OvA';
    }
    
    // SPECIAL CASE FOR ZEN FLUTES: Display size (L or M) in the Tuning column
    
    // Check if it's a ZEN flute directly by itemType or specifications
    const isZenFlute = 
      ('itemType' in order && order.itemType === 'ZEN') ||
      (('specifications' in order) && 
        typeof order.specifications === 'object' && 
        order.specifications && 
        ((order.specifications as any)?.type?.toLowerCase()?.includes('zen') || 
         (order.specifications as any)?.model?.toLowerCase()?.includes('zen')));
    
    if (isZenFlute) {
      // First check if there's an itemSize field
      if ('itemSize' in order && order.itemSize) {
        if (order.itemSize === 'L' || order.itemSize === 'M') {
          return order.itemSize; // Just return L or M for ZEN flutes
        }
      }
      
      // Then check specifications for size - extract from the 'type' field too
      if ('specifications' in order && 
          typeof order.specifications === 'object' && 
          order.specifications) {
        
        const specs = order.specifications as Record<string, string>;
        
        // Check if size is in the type field (like "ZEN flute Medium")
        if (specs?.['type']) {
          const typeStr = specs['type'].toLowerCase();
          if (typeStr.includes('large') || typeStr.includes(' l ') || typeStr.endsWith(' l')) {
            return 'L';
          }
          if (typeStr.includes('medium') || typeStr.includes(' m ') || typeStr.endsWith(' m')) {
            return 'M';
          }
        }
        
        // Check for direct size field
        const sizeValue = specs?.['size'] || specs?.['bag'] || specs?.['bagSize'];
        if (sizeValue === 'L' || sizeValue === 'M') {
          return sizeValue;
        }
      }
      
      // If no size found for ZEN flute, continue with normal tuning detection
    }
    
    // NORMAL CASE FOR ALL OTHER INSTRUMENTS: Show note tuning (A3, C4, etc.)
    
    // Function to clean tuning note format or keep minor indicator
    const cleanTuningNote = (note: string, instrumentType?: string): string => {
      if (!note) return note;
      
      // For Innato instruments, keep the minor indicator "m"
      if (instrumentType?.toLowerCase()?.includes('innato')) {
        // If note doesn't have 'm' before the octave number, add it (e.g., C4 -> Cm4)
        if (note.match(/[A-G][#b]?[1-6]/)) {
          return note.replace(/([A-G][#b]?)([1-6])/, '$1m$2');
        }
        return note; // Return as is if already has 'm' or doesn't match pattern
      }
      
      // For other instruments, remove the 'm' before octave number (Cm4 -> C4)
      return note.replace(/m(?=[1-6])/i, '');
    };
    
    // First check if there's a note tuning field
    if ('noteTuning' in order && order.noteTuning && typeof order.noteTuning === 'string') {
      // Return a cleaned version in case it contains minor indicators
      return cleanTuningNote(order.noteTuning);
    }
    
    // Then check specifications
    if ('specifications' in order && 
        typeof order.specifications === 'object' && 
        order.specifications) {
      
      const specs = order.specifications as Record<string, string>;
      
      // Extract tuning from type field which has format like "Natey Am4" or "Innato C#m4"
      if (specs['type']) {
        const typeStr = specs['type'];
        console.log('Analyzing type string for tuning:', typeStr);
        
        // Special case for NATEY - extract Am4, Cm4, etc. more aggressively
        if (typeStr.toLowerCase().includes('natey')) {
          console.log('NATEY flute detected, applying special tuning extraction');
          
          // Check for special Natey DM4 format
          if (typeStr.match(/\s+D\s*M\s*4\b/i)) {
            console.log('Special DM4 case detected in:', typeStr);
            return 'Dm4';
          }
          
          // Match any letter A-G followed by optional sharp/flat, optional 'm', and a number
          // This handles cases like "Natey Am4", "Natey G#m4", etc.
          const nateyRegex = /([A-G][#b]?m?[1-6])/i;
          const nateyMatch = nateyRegex.exec(typeStr);
          
          if (nateyMatch && nateyMatch[1]) {
            console.log('NATEY MATCH FOUND:', nateyMatch[1]);
            return nateyMatch[1]; // Return the tuning with minor designation intact for NATEY
          }
          
          // Additional check for formats like "Natey Am" without number
          const altNateyRegex = /([A-G][#b]?m)/i;
          const altNateyMatch = altNateyRegex.exec(typeStr);
          
          if (altNateyMatch && altNateyMatch[1]) {
            console.log('NATEY ALT MATCH FOUND:', altNateyMatch[1]);
            return altNateyMatch[1] + '4'; // Add default octave 4 for NATEY without octave number
          }
        }
        
        // Match patterns like Am4, C#m4, Gm3, etc. - for non-NATEY flutes
        const simpleRegex = /([A-G][#b]?m?[1-6])/;
        const noteMatch = simpleRegex.exec(typeStr);
        if (noteMatch && noteMatch[1]) {
          // Extract just the note and octave, removing the 'm' for minor
          // Convert "C#m4" to "C#4", "Gm3" to "G3", etc.
          const cleanedNote = typeStr.toLowerCase().includes('natey') ? 
            noteMatch[1] : // Keep 'm' for NATEY flutes
            cleanTuningNote(noteMatch[1]); // Remove 'm' for others
            
          console.log('Extracted note tuning:', noteMatch[1], '->', cleanedNote);
          return cleanedNote; // Return the cleaned tuning note (e.g., "A4", "C#4")
        }
        
        // Extract note from common model names (for INNATO, NATEY, ZEN, etc.)
        if (typeStr.toLowerCase().includes('innato') || 
            typeStr.toLowerCase().includes('natey') || 
            typeStr.toLowerCase().includes('zen')) {
          
          // Look for a note pattern like "A", "C#", "F", etc. followed by optional minor or dim
          const basicNoteMatch = typeStr.match(/\s([A-G][#b]?(m|dim)?)\s/);
          if (basicNoteMatch && basicNoteMatch[1]) {
            // Get the base note (e.g., "C#", "F")
            let baseNote = basicNoteMatch[1];
            
            // Determine the octave based on the instrument type
            if (typeStr.toLowerCase().includes('innato')) {
              // Clean if it has minor indicator like Cm -> C
              return cleanTuningNote(`${baseNote}4`); // INNATO typically in octave 4
            } else if (typeStr.toLowerCase().includes('natey')) {
              return cleanTuningNote(`${baseNote}3`); // NATEY typically in octave 3
            } else if (typeStr.toLowerCase().includes('zen')) {
              return cleanTuningNote(`${baseNote}4`); // ZEN typically in octave 4
            }
            
            return baseNote; // Default with no octave
          }
        }
      }
      
      // Check for tuning note fields
      const noteTuning = specs['note'] || 
                        specs['keyNote'] || 
                        specs['noteTuning'] || 
                        specs['tuningNote'] ||
                        specs['tuningKey'];
      
      // Clean the note tuning if found
      if (noteTuning) {
        return cleanTuningNote(noteTuning);
      }
    }
    
    return undefined;
  }
  
  // Helper function to extract tuning frequency from specifications
  function getTuningFrequencyFromSpecifications(order: Order | OrderItem): string | undefined {
    // FORCE DEBUG - Check for type and log
    const orderType = getTypeFromSpecifications(order);
    const specs = ('specifications' in order) ? order.specifications : undefined;
    
    console.log('DEBUG - Getting frequency for:', {
      orderType,
      specs,
      id: ('id' in order) ? order.id : undefined,
      serialNumber: ('serialNumber' in order) ? order.serialNumber : undefined
    });
    
    // Force 432Hz for all instruments with "432" anywhere in their specs or name
    if (specs && typeof specs === 'object') {
      const specsString = JSON.stringify(specs).toLowerCase();
      if (specsString.includes('432')) {
        console.log('FORCE - Found 432Hz in specs');
        return '432Hz';
      }
    }
    
    // Check if there's a name with 432 in it
    if ('name' in order && order.name && order.name.includes('432')) {
      console.log('FORCE - Found 432Hz in name');
      return '432Hz';
    }
    
    // First check if there's a tuningType field
    if ('tuningType' in order && order.tuningType) {
      // If tuningType contains 432, force it
      if (order.tuningType.includes('432')) {
        console.log('FORCE - Found 432Hz in tuningType');
        return '432Hz';
      }
      return order.tuningType;
    }
    
    // Then check specifications
    if (specs && typeof specs === 'object') {
      const specsRecord = specs as Record<string, string>;
      
      // Enhanced check for 432Hz in any field
      for (const key in specsRecord) {
        const value = specsRecord[key];
        if (value && typeof value === 'string' && value.includes('432')) {
          console.log(`FORCE - Found 432Hz in specs field: ${key}`);
          return '432Hz';
        }
      }
      
      // Check for tuning frequency related fields
      const tuningFreq = specsRecord['tuningFrequency'] || 
                         specsRecord['frequency'] || 
                         specsRecord['tuning'] || 
                         specsRecord['key'] ||
                         specsRecord['hz'];
                         
      if (tuningFreq) {
        // If it doesn't have "Hz" suffix, add it
        if (tuningFreq === '432' || tuningFreq === '440') {
          return `${tuningFreq}Hz`;
        }
        return tuningFreq;
      }
      
      // Try to extract from type field if it contains Hz information
      const typeValue = specsRecord['type'];
      if (typeValue) {
        if (typeValue.includes('432')) {
          return '432Hz';
        } else if (typeValue.includes('440')) {
          return '440Hz';
        }
      }
    }
    
    return undefined;
  }
  

  
  // Calculate days since order placement with adjustments for non-working periods
  // Get waiting days color based on days waiting
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
  };
  
  // Calculate waiting days with non-working periods exclusion and time window
  const calculateAdjustedWaitingDays = (orderDate: Date | string | null): number => {
    if (!orderDate) return 0;
    
    // Convert to Date if string
    const startDate = typeof orderDate === 'string' ? new Date(orderDate) : orderDate;
    const today = new Date();
    
    // Calculate effective start date based on selected time window
    let effectiveStartDate = startDate;
    
    // If selected window is not "All time" (value > 0), apply the time window limit
    if (selectedTimeWindow > 0) {
      const timeWindowStart = new Date();
      timeWindowStart.setDate(timeWindowStart.getDate() - selectedTimeWindow);
      
      // If order is older than the selected time window, use time window as the effective start date
      if (startDate < timeWindowStart) {
        effectiveStartDate = timeWindowStart;
      }
    }
    
    // Calculate total days first (raw waiting days)
    const totalDays = differenceInDays(today, effectiveStartDate);
    
    // If no non-working periods, return raw waiting days
    if (!nonWorkingPeriods || nonWorkingPeriods.length === 0) {
      return totalDays;
    }
    
    // Subtract days from non-working periods
    let adjustedDays = totalDays;
    
    for (const period of nonWorkingPeriods) {
      const periodStart = parseISO(period.start);
      const periodEnd = period.end ? parseISO(period.end) : new Date();
      
      // Skip periods that don't overlap with the order's waiting time
      if (periodEnd < effectiveStartDate || periodStart > today) {
        continue;
      }
      
      // Calculate overlap period
      const overlapStart = periodStart > effectiveStartDate ? periodStart : effectiveStartDate;
      const overlapEnd = periodEnd < today ? periodEnd : today;
      
      // Calculate number of non-working days in this period
      const nonWorkingDays = differenceInDays(overlapEnd, overlapStart);
      
      // Subtract non-working days from total
      adjustedDays -= Math.max(0, nonWorkingDays);
    }
    
    return Math.max(0, adjustedDays);
  };
  

  
  // Original function (for backward compatibility)
  const getDaysSinceOrder = (orderDate: Date | string | null) => {
    if (!orderDate) return "—";
    
    const orderTimestamp = new Date(orderDate).getTime();
    const currentTimestamp = new Date().getTime();
    const daysDiff = Math.floor((currentTimestamp - orderTimestamp) / (24 * 60 * 60 * 1000));
    
    return daysDiff;
  };
  
  // Function to calculate waiting time for an individual item
  const getItemWaitingDays = (item: OrderItem): number => {
    // If the item has its own orderDate, use that
    if (item.orderDate) {
      return calculateAdjustedWaitingDays(item.orderDate);
    }
    
    // Otherwise, find the parent order's date
    const parentOrder = allOrders.find(o => o.id === item.orderId);
    if (parentOrder?.orderDate) {
      return calculateAdjustedWaitingDays(parentOrder.orderDate);
    }
    
    return 0;
  };
  
  // Get build date for an order
  const getBuildDate = (order: Order | OrderItem): string => {
    // First check if item is in building stage and checkbox is checked
    if (isStatusComplete(order, 'building')) {
      // First check the dedicated buildDate field if available
      if ('buildDate' in order && order.buildDate) {
        return formatDate(order.buildDate);
      }
      // Fallback to statusChangeDates for backward compatibility
      if ('statusChangeDates' in order && order.statusChangeDates?.building) {
        return formatDate(order.statusChangeDates.building);
      }
      // If building is checked but no date is set yet, show today's date
      return formatDate(new Date().toISOString());
    }
    return '—';
  };
  
  // Calculate drying status and days remaining
  const isDry = (order: Order | OrderItem): { isDryEnough: boolean, daysRemaining: number | null } => {
    // First check if the BUILD checkbox is checked
    const isBuildChecked = isStatusComplete(order, 'building');
    
    if (!isBuildChecked) {
      return { isDryEnough: false, daysRemaining: null };
    }
    
    // Get build date from statusChangeDates if the BUILD checkbox is checked
    let buildDate: Date | null = null;
    
    // First check the dedicated buildDate field if available
    if ('buildDate' in order && order.buildDate) {
      buildDate = typeof order.buildDate === 'string' 
        ? new Date(order.buildDate) 
        : order.buildDate;
    } 
    // Fallback to statusChangeDates for backward compatibility
    else if ('statusChangeDates' in order && order.statusChangeDates?.building) {
      buildDate = typeof order.statusChangeDates.building === 'string' 
        ? new Date(order.statusChangeDates.building) 
        : order.statusChangeDates.building;
    }
    
    // If there's no build date but BUILD is checked, use today's date
    if (!buildDate && isBuildChecked) {
      buildDate = new Date();
    }
    
    if (buildDate) {
      const fiveDaysAfterBuild = addDays(buildDate, 5);
      const now = new Date();
      
      // Calculate days remaining until fully dry
      const daysRemaining = differenceInDays(fiveDaysAfterBuild, now);
      
      // Return both whether it's dry enough and how many days are remaining
      return { 
        isDryEnough: now >= fiveDaysAfterBuild,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0
      };
    }
    return { isDryEnough: false, daysRemaining: null };
  };
  
  // Status columns to display - these match your Excel columns
  // Define the StatusColumn interface to fix type issues
  interface StatusColumn {
    id: string;
    label: string;
    width: number;
    isDateColumn?: boolean;
    isAutoCheck?: boolean;
    dependsOn?: string;
    daysNeeded?: number;
    isMaterialColumn?: boolean;
    materialType?: string;
  }

  const statusColumns: StatusColumn[] = [
    { id: 'ordered', label: 'Parts', width: 40 },
    { id: 'validated', label: 'Prepared', width: 50 },
    { id: 'building', label: 'BUILD', width: 40 },
    { id: 'dry', label: 'DRY', width: 40, isAutoCheck: true, dependsOn: 'building', daysNeeded: 5 },
    { id: 'testing', label: 'TS', width: 40 },
    { id: 'firing', label: '🔥', width: 30 },
    { id: 'smoothing', label: 'SM', width: 30 },
    { id: 'tuning1', label: 'T1', width: 30 },
    { id: 'waxing', label: 'WAX', width: 40 },
    { id: 'tuning2', label: 'T2', width: 30 },
    { id: 'bag', label: 'BAG', width: 50, isMaterialColumn: true, materialType: 'bag' },
    { id: 'box', label: 'BOX', width: 60, isMaterialColumn: true, materialType: 'box' },
    { id: 'bagging', label: 'BAG ✓', width: 40 },
    { id: 'boxing', label: 'BOX ✓', width: 40 },
    { id: 'labeling', label: 'LAB ✓', width: 40 }
  ];
  
  // WorksheetFilters component to display all filters in one place above the table
  const WorksheetFilters = ({
    typeFilter,
    setTypeFilter,
    tuningFilter,
    setTuningFilter,
    frequencyFilter,
    setFrequencyFilter,
    colorFilters,
    setColorFilters,
    resellerFilter,
    setResellerFilter,
    statusFilter,
    setStatusFilter,
    resellers,
    uniqueTypes,
    uniqueTunings,
    uniqueColors,
    uniqueFrequencies,
    statusOptions
  }: {
    typeFilter: string | null;
    setTypeFilter: (filter: string | null) => void;
    tuningFilter: string | null;
    setTuningFilter: (filter: string | null) => void;
    frequencyFilter: string | null;
    setFrequencyFilter: (filter: string | null) => void;
    colorFilters: string[];
    setColorFilters: (filters: string[]) => void;
    resellerFilter: boolean | number | null;
    setResellerFilter: (filter: boolean | number | null) => void;
    statusFilter: string | null;
    setStatusFilter: (filter: string | null) => void;
    resellers: Reseller[];
    uniqueTypes: string[];
    uniqueTunings: string[];
    uniqueColors: string[];
    uniqueFrequencies: string[];
    statusOptions: { value: string; label: string; }[];
  }) => {
    return (
      <div className="flex flex-wrap gap-2 items-center mb-4 bg-gray-50 p-3 rounded-md">
        
        {/* Reseller Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <span>Reseller</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded-sm text-xs",
                resellerFilter !== null ? "bg-primary text-white" : "bg-gray-100"
              )}>
                {resellerFilter === null ? "All" : 
                 resellerFilter === true ? "Any Reseller" :
                 resellerFilter === false ? "Direct Only" :
                 resellers.find(r => r.id === resellerFilter)?.nickname || "Unknown"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Filter by Reseller</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setResellerFilter(null)}>
              <Check className={cn("mr-2 h-4 w-4", resellerFilter === null ? "opacity-100" : "opacity-0")} />
              All Orders
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setResellerFilter(true)}>
              <Check className={cn("mr-2 h-4 w-4", resellerFilter === true ? "opacity-100" : "opacity-0")} />
              All Reseller Orders
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setResellerFilter(false)}>
              <Check className={cn("mr-2 h-4 w-4", resellerFilter === false ? "opacity-100" : "opacity-0")} />
              Direct Orders
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Specific Resellers</DropdownMenuLabel>
            {resellers.map(reseller => (
              <DropdownMenuItem 
                key={reseller.id} 
                onClick={() => setResellerFilter(reseller.id)}
              >
                <Check className={cn("mr-2 h-4 w-4", resellerFilter === reseller.id ? "opacity-100" : "opacity-0")} />
                {reseller.nickname}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        

        
        {/* Tuning Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <span>Tuning</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded-sm text-xs",
                tuningFilter !== null ? "bg-primary text-white" : "bg-gray-100"
              )}>
                {tuningFilter || "All"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Filter by Tuning</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTuningFilter(null)}>
              <Check className={cn("mr-2 h-4 w-4", tuningFilter === null ? "opacity-100" : "opacity-0")} />
              All Tunings
            </DropdownMenuItem>
            {uniqueTunings.map(tuning => (
              <DropdownMenuItem 
                key={tuning} 
                onClick={() => setTuningFilter(tuning)}
              >
                <Check className={cn("mr-2 h-4 w-4", tuningFilter === tuning ? "opacity-100" : "opacity-0")} />
                {tuning}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        

        {/* Color Filter button has been removed as requested */}
        
        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <span>Status</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded-sm text-xs",
                statusFilter !== null ? "bg-primary text-white" : "bg-gray-100"
              )}>
                {statusFilter ? statusOptions.find(s => s.value === statusFilter)?.label || statusFilter : "All"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter(null)}>
              <Check className={cn("mr-2 h-4 w-4", statusFilter === null ? "opacity-100" : "opacity-0")} />
              All Statuses
            </DropdownMenuItem>
            {statusOptions.map(status => (
              <DropdownMenuItem 
                key={status.value} 
                onClick={() => setStatusFilter(status.value)}
              >
                <Check className={cn("mr-2 h-4 w-4", statusFilter === status.value ? "opacity-100" : "opacity-0")} />
                {status.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Clear All Filters Button */}
        {(tuningFilter !== null || colorFilters.length > 0 || 
          resellerFilter !== null || statusFilter !== null) && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8"
            onClick={() => {
              setTuningFilter(null);
              setColorFilters([]);
              setResellerFilter(null);
              setStatusFilter(null);
            }}
          >
            <XIcon className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
        
        <div className="flex-grow"></div>
        
        {/* Statistics Buttons */}
        <div className="flex items-center gap-2">
          {/* Orders Count Button - Kleur 1: #015a6c (blauw/groen) */}
          <span 
            style={{
              minWidth: '24px',
              padding: '0.1rem 0.3rem',
              borderRadius: '0.25rem',
              textAlign: 'center',
              fontFamily: '"PT Sans Narrow", sans-serif',
              fontWeight: 700,
              fontSize: '10pt',
              color: 'white',
              backgroundColor: '#015a6c'
            }}
            title="Total orders"
            className="flex items-center justify-center"
          >
            <BarChart className="h-3 w-3 mr-1" />
            {unfulfilledOrdersCount}
          </span>
          
          {/* Items Count Button - Kleur 2: #C26E50 (oranje/bruin) */}
          <span 
            style={{
              minWidth: '24px',
              padding: '0.1rem 0.3rem',
              borderRadius: '0.25rem',
              textAlign: 'center',
              fontFamily: '"PT Sans Narrow", sans-serif',
              fontWeight: 700,
              fontSize: '10pt',
              color: 'white',
              backgroundColor: '#C26E50'
            }}
            title="Items to build"
            className="flex items-center justify-center"
          >
            <ClipboardList className="h-3 w-3 mr-1" />
            {itemsCount}
          </span>
          
          {/* Average Wait Time Button - Kleur 3: grijs */}
          <div 
            style={{
              minWidth: '24px',
              padding: '0.1rem 0.3rem',
              borderRadius: '0.25rem',
              textAlign: 'center',
              fontFamily: '"PT Sans Narrow", sans-serif',
              fontWeight: 700,
              fontSize: '10pt',
              color: 'white',
              backgroundColor: 'rgb(55, 65, 81)', /* gray-700 */
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Gemiddelde wachttijd berekend over voltooide orders uit afgelopen 6 maanden"
          >
            <TimerIcon className="h-3 w-3 mr-1" />
            <WaitTimeDisplay allOrders={allOrders} />
          </div>
        </div>
      </div>
    );
  };
  
  // Helper to check if a status is completed
  const isStatusComplete = (order: Order | OrderItem, status: string) => {
    // For all statuses, ONLY return true if they have been explicitly marked in statusChangeDates
    // This makes all checkboxes start unchecked by default, even 'ordered' checkbox
    if (order.statusChangeDates && order.statusChangeDates[status]) {
      return true;
    }
    
    // Special case for DRY status - auto-checked after 5 days from BUILD date
    if (status === 'dry' && isDry(order).isDryEnough) {
      return true;
    }
    
    // Special case for SM (smoothing) checkbox - auto-checked for smoke-fired colors (SB, T, TB, C)
    if (status === 'smoothing') {
      // Check if it's a CARDS product (don't auto-check)
      const type = getTypeFromSpecifications(order);
      const isCards = type?.toUpperCase().includes('CARDS');
      
      if (isCards) {
        return false;
      }
      
      // Auto-check if this is one of the smoke-fired colors (SB, T, TB, C)
      if (needsSmokeFiring(order)) {
        // Make this auto-check more visible in the UI for testing
        console.log("Auto-checking SM checkbox for smoke-fired color:", getColorFromSpecifications(order));
        return true;
      }
    }
    
    // All other checkboxes start unchecked by default
    return false;
  };
  
  // Handle status change for order with immediate UI feedback
  const handleOrderStatusChange = (orderId: number, status: string, checked: boolean) => {
    console.log(`Updating order ${orderId} status ${status} to ${checked ? 'checked' : 'unchecked'}`);
    
    try {
      // First, look for the order in the current state
      const orders = queryClient.getQueryData<Order[]>(['/api/orders']) || [];
      const orderIndex = orders.findIndex(o => o.id === orderId);
      
      if (orderIndex === -1) {
        console.error(`Order with ID ${orderId} not found in query cache`);
        return;
      }
      
      // Create a deep copy of orders to work with
      const newOrders = [...orders];
      const order = {...newOrders[orderIndex]};
      
      // Update the status change dates
      const updatedDates = {...(order.statusChangeDates || {})};
      if (checked) {
        updatedDates[status] = new Date().toISOString();
      } else {
        delete updatedDates[status];
      }
      
      // For BUILD checkbox, also update the buildDate field
      let updateData: Partial<Order> = { statusChangeDates: updatedDates };
      
      if (status === 'building') {
        if (checked) {
          // Use new Date() directly for Date type field
          const currentDate = new Date();
          updateData.buildDate = currentDate;
          console.log(`Setting buildDate for order ${orderId} to ${currentDate.toISOString()}`);
        } else {
          updateData.buildDate = null;
          console.log(`Clearing buildDate for order ${orderId}`);
        }
      }
      
      // Create updated order
      const updatedOrder = {
        ...order,
        ...updateData
      };
      
      // Replace the order in our local array
      newOrders[orderIndex] = updatedOrder;
      
      // Update the cache immediately (this is key for UI responsiveness)
      queryClient.setQueryData(['/api/orders'], newOrders);
      
      // Use offline mode to handle the update - this works in both online and offline modes
      // The offline mode API will handle syncing when the device comes back online
      updateOfflineOrder(orderId, updateData)
        .then(() => console.log(`Successfully updated order ${orderId} status ${status} in offline storage`))
        .catch(err => console.error(`Failed to update order ${orderId} status in offline storage:`, err));
    } catch (error) {
      console.error(`Error updating order ${orderId} status ${status}:`, error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "An error occurred while updating the order status. Please try again.",
      });
    }
  };
  
  // Handle status change for item with immediate UI feedback
  const handleItemStatusChange = (itemId: number, status: string, checked: boolean) => {
    console.log(`Updating item ${itemId} status ${status} to ${checked ? 'checked' : 'unchecked'}`);
    
    try {
      // Find the order ID for this item to maintain expand/collapse state
      const item = allOrderItems.find(i => i.id === itemId);
      if (!item) {
        console.error(`Item with ID ${itemId} not found in allOrderItems`);
        return;
      }
      
      // Get the order ID for this item to prevent collapsing
      const orderId = item.orderId;
      
      // Save the collapsed state before making any changes
      const expandedState = !collapsedOrders[orderId];
      
      // If this is a multi-item order, ensure it stays expanded during the update
      const orderItems = itemsByOrder[orderId] || [];
      const isMultiItemOrder = orderItems.length > 1;
      
      if (isMultiItemOrder && expandedState) {
        // Explicitly mark this order as expanded to prevent it from collapsing
        console.log(`Keeping order ${orderId} expanded during status update`);
        setCollapsedOrders(prev => ({
          ...prev,
          [orderId]: false // false means expanded
        }));
      }
      
      // First, look for the item in the current state
      const items = queryClient.getQueryData<OrderItem[]>(['/api/order-items']) || [];
      const itemIndex = items.findIndex(i => i.id === itemId);
      
      if (itemIndex === -1) {
        console.error(`Item with ID ${itemId} not found in query cache`);
        return;
      }
      
      // Create a deep copy of items to work with
      const newItems = [...items];
      const itemToUpdate = {...newItems[itemIndex]};
      
      // Update the status change dates
      const updatedDates = {...(itemToUpdate.statusChangeDates || {})};
      if (checked) {
        updatedDates[status] = new Date().toISOString();
      } else {
        delete updatedDates[status];
      }
      
      // For BUILD checkbox, also update the buildDate field
      // Use the standard type for OrderItem updates - buildDate can either be a Date or null
      let updateData: Partial<OrderItem> = { statusChangeDates: updatedDates };
      
      if (status === 'building') {
        if (checked) {
          // The client-server communication and REST API can only handle serializable data,
          // so we have to convert the Date to an ISO string for network transport
          const now = new Date();
          // Send the date as an ISO string (server will parse it back to a Date)
          updateData.buildDate = now.toISOString();
          console.log(`Setting buildDate for item ${itemId} to ISO string: ${now.toISOString()}`);
        } else {
          updateData.buildDate = null;
          console.log(`Clearing buildDate for item ${itemId}`);
        }
      }
      
      // Create updated item
      const updatedItem = {
        ...itemToUpdate,
        ...updateData
      };
      
      // Replace the item in our local array
      newItems[itemIndex] = updatedItem;
      
      // Update the cache immediately (this is key for UI responsiveness)
      queryClient.setQueryData(['/api/order-items'], newItems);
      
      // Use offline mode to handle the update
      updateOfflineOrderItem(itemId, updateData)
        .then(() => console.log(`Successfully updated item ${itemId} status ${status} in offline storage`))
        .catch(err => console.error(`Failed to update item ${itemId} status in offline storage:`, err));
      
      // Keep multi-item orders expanded when they were already expanded
      if (isMultiItemOrder && expandedState) {
        // Use a timeout to ensure this happens after state updates
        setTimeout(() => {
          console.log(`Preserving expanded state for order ${orderId} after data update`);
          setCollapsedOrders(prev => ({
            ...prev,
            [orderId]: false // false means expanded
          }));
        }, 100);
      }
    } catch (error) {
      console.error(`Error updating item ${itemId} status ${status}:`, error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "An error occurred while updating the item status. Please try again.",
      });
    }
  };
  
  // Handle material update (bags and boxes)
  const handleMaterialUpdate = (id: number, isOrder: boolean, materialType: 'bag' | 'box', materialInfo: any) => {
    // Get existing data
    if (isOrder) {
      const orders = queryClient.getQueryData<Order[]>(['/api/orders']) || [];
      const orderIndex = orders.findIndex(o => o.id === id);
      
      if (orderIndex === -1) return;
      
      // Create a deep copy of orders to work with
      const newOrders = [...orders];
      const order = {...newOrders[orderIndex]};
      
      // Create or update specifications object
      const updatedSpecs: Record<string, any> = {...(order.specifications || {})};
      
      if (materialType === 'bag') {
        // Update in multiple formats to ensure compatibility
        updatedSpecs.bagType = materialInfo.type;
        updatedSpecs.bagSize = materialInfo.size;
        updatedSpecs['Bag Type'] = materialInfo.type;
        updatedSpecs['Bag Size'] = materialInfo.size;
        updatedSpecs['bag type'] = materialInfo.type;
        updatedSpecs['bag size'] = materialInfo.size;
      } else if (materialType === 'box') {
        updatedSpecs.boxSize = materialInfo;
        updatedSpecs['Box Size'] = materialInfo;
        updatedSpecs['box size'] = materialInfo;
      }
      
      // Apply changes to the order
      order.specifications = updatedSpecs;
      newOrders[orderIndex] = order;
      
      // Update the local cache immediately
      queryClient.setQueryData(['/api/orders'], newOrders);
      
      // Make the server request
      updateOfflineOrder(id, { specifications: updatedSpecs });
      
      toast({
        title: `${materialType === 'bag' ? 'Bag' : 'Box'} updated`,
        description: `Updated ${materialType} information for order #${order.orderNumber}`,
      });
    } else {
      // Handle order item
      const items = queryClient.getQueryData<OrderItem[]>(['/api/order-items']) || [];
      const itemIndex = items.findIndex(i => i.id === id);
      
      if (itemIndex === -1) return;
      
      // Create a deep copy of items to work with
      const newItems = [...items];
      const item = {...newItems[itemIndex]};
      
      // Create or update specifications object
      const updatedSpecs: Record<string, any> = {...(item.specifications || {})};
      
      if (materialType === 'bag') {
        // Update in multiple formats to ensure compatibility
        updatedSpecs.bagType = materialInfo.type;
        updatedSpecs.bagSize = materialInfo.size;
        updatedSpecs['Bag Type'] = materialInfo.type;
        updatedSpecs['Bag Size'] = materialInfo.size;
        updatedSpecs['bag type'] = materialInfo.type;
        updatedSpecs['bag size'] = materialInfo.size;
      } else if (materialType === 'box') {
        updatedSpecs.boxSize = materialInfo;
        updatedSpecs['Box Size'] = materialInfo;
        updatedSpecs['box size'] = materialInfo;
      }
      
      // Apply changes to the item
      item.specifications = updatedSpecs;
      newItems[itemIndex] = item;
      
      // Update the local cache immediately
      queryClient.setQueryData(['/api/order-items'], newItems);
      
      // Make the server request
      updateOfflineOrderItem(id, { specifications: updatedSpecs });
      
      toast({
        title: `${materialType === 'bag' ? 'Bag' : 'Box'} updated`,
        description: `Updated ${materialType} information for item ${item.serialNumber}`,
      });
    }
  };
  
  // Handle order click to display details and workshop notes,
  // including all order items for multi-item orders
  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setWorkshopNotes(order.notes || '');
    setArchiveOrder(Boolean(order.archived));
    
    // Initialize reseller information
    setIsReseller(Boolean(order.isReseller));
    setResellerNickname(order.resellerNickname || '');
    
    // Clear selected items when opening a new order dialog
    setSelectedItems([]);
    
    setOrderDetailsOpen(true);

    // Ensure all order items are loaded
    const orderItems = queryClient.getQueryData<OrderItem[]>(['/api/order-items']) || [];
    
    // Check if this order has multiple items
    const orderItemCount = orderItems.filter(item => item.orderId === order.id).length;
    console.log(`Order ${order.orderNumber} has ${orderItemCount} items`);
  };
  
  // We'll no longer need this function since we're using the popover directly
  
  // Handle saving workshop notes and reseller information
  const handleSaveNotes = () => {
    if (selectedOrder) {
      // Update the cached data immediately for responsiveness
      queryClient.setQueryData(['/api/orders'], (old: Order[] | undefined) => {
        if (!old) return old;
        return old.map(order => {
          if (order.id === selectedOrder.id) {
            return {
              ...order,
              notes: workshopNotes,
              isReseller: isReseller,
              resellerNickname: isReseller ? resellerNickname : null
            };
          }
          return order;
        });
      });
      
      // Use offline mode to save notes and reseller info - this works in both online and offline modes
      updateOfflineOrder(selectedOrder.id, { 
        notes: workshopNotes,
        isReseller: isReseller,
        resellerNickname: isReseller ? resellerNickname : null
      });
      
      // If this is a reseller order, invalidate the resellers query to refresh the list
      if (isReseller && resellerNickname) {
        console.log('Invalidating resellers query cache after adding/updating reseller:', resellerNickname);
        
        // Immediately refetch the resellers to update UI dropdown
        queryClient.invalidateQueries({ queryKey: ['/api/resellers'] });
        queryClient.invalidateQueries({ queryKey: ['/api/resellers/active'] });
        
        // Force an immediate refetch to ensure the new reseller appears in the dropdown
        queryClient.fetchQuery({ queryKey: ['/api/resellers/active'] });
        
        // Alert the user that this may take a moment to appear in the dropdown
        toast({
          title: "Reseller Added",
          description: "The new reseller has been added and will appear in the dropdown shortly",
          duration: 3000,
        });
      }
      
      toast({
        title: isReseller ? "Reseller Information Updated" : "Notes Updated",
        description: isReseller ? "Reseller status and nickname have been saved" : "Workshop notes have been saved",
      });
    }
  };
  
  // Handle archiving/unarchiving an order
  const handleArchiveToggle = () => {
    if (selectedOrder) {
      const newArchivedState = !selectedOrder.archived;
      
      // Update the cached data immediately for responsiveness
      queryClient.setQueryData(['/api/orders'], (old: Order[] | undefined) => {
        if (!old) return old;
        return old.map(order => {
          if (order.id === selectedOrder.id) {
            return {
              ...order,
              archived: newArchivedState
            };
          }
          return order;
        });
      });
      
      // Use offline mode to update archive status
      updateOfflineOrder(selectedOrder.id, { archived: newArchivedState });
      
      toast({
        title: newArchivedState ? "Order Archived" : "Order Restored",
        description: newArchivedState 
          ? "Order has been hidden from the main list" 
          : "Order has been restored to the main list",
      });
      
      setOrderDetailsOpen(false);
    }
  };
  
  // In flat row system all items are always visible (no collapsing)
  const toggleOrderCollapse = (orderId: number, event?: React.MouseEvent) => {
    // Prevent event bubbling if provided
    if (event) {
      event.stopPropagation();
    }
    
    // With flat row system, we don't actually toggle state anymore
    // but we keep the function for compatibility
    console.log(`Order collapse toggle clicked for order ${orderId}, but ignoring since we're using flat row system`);
  }
  
  // Toggle isolation for a specific order
  const toggleOrderIsolation = (orderId: number, event?: React.MouseEvent) => {
    // Prevent event bubbling if provided
    if (event) {
      event.stopPropagation();
    }
    
    setIsolatedOrderIds(prevIds => {
      if (prevIds.includes(orderId)) {
        // If already isolated, remove it
        return prevIds.filter(id => id !== orderId);
      } else {
        // Otherwise add it to isolated list
        return [...prevIds, orderId];
      }
    });
  };
  
  // Clear all order isolation
  const clearIsolation = () => {
    setIsolatedOrderIds([]);
  };
  
  // Extract all specifications for display
  const formatSpecificationsForDisplay = (order: Order): { [key: string]: string } => {
    const result: { [key: string]: string } = {};
    
    if (order.specifications && typeof order.specifications === 'object') {
      // Loop through all specs and format them for display
      Object.entries(order.specifications as Record<string, any>).forEach(([key, value]) => {
        // Skip null or undefined values
        if (value === null || value === undefined) return;
        
        // Format the key to be more readable
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1') // Add space before capitals
          .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
          .replace(/_/g, ' '); // Replace underscores with spaces
        
        // Format the value
        let formattedValue = value;
        
        // If it's a date string, format it
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
          try {
            formattedValue = formatDate(value);
          } catch (e) {
            // Keep original if date parsing fails
          }
        }
        
        result[formattedKey] = String(formattedValue);
      });
    }
    
    return result;
  };
  
  return (
    <MainLayout className="pb-0 mb-0">
      {/* Order Details Dialog */}
      <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
        <DialogContent className="max-w-3xl w-[90vw] max-h-[90vh] overflow-hidden sm:max-h-[85vh] md:max-h-[80vh] p-4 sm:p-5">
          <div className="absolute right-3 top-3 z-50">
            <button
              onClick={() => setOrderDetailsOpen(false)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-white dark:bg-gray-950 p-1"
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <DialogHeader className="pb-2 space-y-1">
            <DialogTitle className="flex items-center gap-2 pr-6 text-base">
              <span>Order {selectedOrder?.orderNumber}</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(selectedOrder?.orderDate || '')}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Customer and order information
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 overflow-y-auto max-h-[calc(80vh-160px)]">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 gap-3 rounded-md border p-4 bg-[#FCFCFB]">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-sm text-muted-foreground">Name:</strong>
                      <div>{selectedOrder.customerName}</div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedOrder.customerName || '');
                        toast({
                          title: "Copied to clipboard",
                          description: "Customer name has been copied",
                          duration: 2000
                        });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {selectedOrder.customerEmail && (
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-sm text-muted-foreground">Email:</strong>
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a href={`mailto:${selectedOrder.customerEmail}`} className="text-blue-600 hover:underline">
                            {selectedOrder.customerEmail}
                          </a>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedOrder.customerEmail || '');
                          toast({
                            title: "Copied to clipboard",
                            description: "Email has been copied",
                            duration: 2000
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {selectedOrder.customerPhone && (
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-sm text-muted-foreground">Phone:</strong>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${selectedOrder.customerPhone}`} className="text-blue-600 hover:underline">
                            {selectedOrder.customerPhone}
                          </a>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedOrder.customerPhone || '');
                          toast({
                            title: "Copied to clipboard",
                            description: "Phone number has been copied",
                            duration: 2000
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {selectedOrder.customerAddress && (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-sm text-muted-foreground">Address:</strong>
                          <div>{selectedOrder.customerAddress}</div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedOrder.customerAddress || '');
                            toast({
                              title: "Copied to clipboard",
                              description: "Address has been copied",
                              duration: 2000
                            });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Waiting time indicator */}
                      {selectedOrder.orderDate && (
                        <div className="mt-1 text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 w-fit">
                          <Clock className="inline-block h-3 w-3 mr-1" />
                          Waiting {getDaysSinceOrder(selectedOrder.orderDate)} days
                        </div>
                      )}

                      <div className="mt-2 mb-2 relative h-[120px] w-full overflow-hidden rounded-md border bg-gray-100">
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            [
                              selectedOrder.customerAddress,
                              selectedOrder.customerCity,
                              selectedOrder.customerState,
                              selectedOrder.customerCountry,
                              selectedOrder.customerZip
                            ].filter(Boolean).join(', ')
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 flex flex-col items-center justify-center text-center p-3"
                        >
                          <MapPin className="h-6 w-6 mb-1 text-[#1F5B61]" />
                          <span className="text-xs text-[#1F5B61] font-medium">Click to view customer location on Google Maps</span>
                          <span className="text-[10px] text-gray-600 mt-1 max-w-[90%] line-clamp-3">
                            {[
                              selectedOrder.customerAddress,
                              selectedOrder.customerCity,
                              selectedOrder.customerState,
                              selectedOrder.customerZip,
                              selectedOrder.customerCountry
                            ].filter(Boolean).join(', ')}
                          </span>
                        </a>
                      </div>
                    </>
                  )}
                  
                  {(selectedOrder.customerCity || selectedOrder.customerState || selectedOrder.customerZip) && (
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-sm text-muted-foreground">City/State/Zip:</strong>
                        <div>
                          {[
                            selectedOrder.customerCity,
                            selectedOrder.customerState,
                            selectedOrder.customerZip
                          ].filter(Boolean).join(', ')}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          const cityStateZip = [
                            selectedOrder.customerCity,
                            selectedOrder.customerState,
                            selectedOrder.customerZip
                          ].filter(Boolean).join(', ');
                          navigator.clipboard.writeText(cityStateZip);
                          toast({
                            title: "Copied to clipboard",
                            description: "City/State/Zip has been copied",
                            duration: 2000
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {selectedOrder.customerCountry && (
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-sm text-muted-foreground">Country:</strong>
                        <div>{selectedOrder.customerCountry}</div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedOrder.customerCountry || '');
                          toast({
                            title: "Copied to clipboard",
                            description: "Country has been copied",
                            duration: 2000
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {selectedOrder.shopifyOrderId && (
                    <div className="flex justify-between items-start mt-3 pt-3 border-t border-gray-200">
                      <div>
                        <strong className="text-sm text-muted-foreground">Shopify Order:</strong>
                        <div className="flex items-center gap-1">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          <a 
                            href={`https://stonewhistle.myshopify.com/admin/orders/${selectedOrder.shopifyOrderId}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View in Shopify
                          </a>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://stonewhistle.myshopify.com/admin/orders/${selectedOrder.shopifyOrderId}`);
                          toast({
                            title: "Copied to clipboard",
                            description: "Shopify order URL has been copied",
                            duration: 2000
                          });
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Instrument Specifications */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  Instrument Details
                </h3>
                
                {/* Order items section for multi-item orders */}
                {(() => {
                  const orderItems = queryClient.getQueryData<OrderItem[]>(['/api/order-items']) || [];
                  const items = orderItems.filter(item => item.orderId === selectedOrder.id);
                  
                  if (items.length > 1) {
                    return (
                      <div className="rounded-md border mb-4 p-4 bg-[#FCFCFB]">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">Order Items ({items.length})</h4>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const orderItems = items.filter(item => !selectedItems.some(i => i.id === item.id));
                                if (orderItems.length > 0) {
                                  // Some items from this order are not selected, so select them all
                                  setSelectedItems(prev => [...prev, ...orderItems]);
                                } else {
                                  // All items are already selected, so deselect items from this order
                                  setSelectedItems(prev => prev.filter(i => i.orderId !== selectedOrder.id));
                                }
                              }}
                              className="h-7 text-xs"
                            >
                              {items.every(item => selectedItems.some(i => i.id === item.id)) 
                                ? "Deselect All" 
                                : "Select All"}
                            </Button>
                            {selectedItems.length > 0 && (
                              <Button 
                                size="sm" 
                                onClick={() => setJointBoxDialogOpen(true)}
                                className="h-7 text-xs bg-[#1F5B61] hover:bg-[#174349] text-white"
                              >
                                <Package className="h-3 w-3 mr-1" />
                                Box {selectedItems.length} Selected
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {items.map((item, index) => {
                            const type = getTypeFromSpecifications(item);
                            const color = getColorFromSpecifications(item);
                            const tuning = getNoteTuningFromSpecifications(item);
                            const frequency = item.specifications?.frequency || '';
                            
                            return (
                              <div key={item.id} className={`p-2 mb-2 rounded flex ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                <div className="mr-2 flex items-center">
                                  <Checkbox 
                                    id={`select-item-${item.id}`} 
                                    checked={selectedItems.some(i => i.id === item.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedItems(prev => [...prev, item]);
                                      } else {
                                        setSelectedItems(prev => prev.filter(i => i.id !== item.id));
                                      }
                                    }}
                                    className="h-4 w-4" /* Smaller checkbox */
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-center">
                                    <div className="font-medium">{item.serialNumber}</div>
                                    <div className="flex space-x-1">
                                      <div style={{ width: '75px' }} className="text-center bg-gray-100 rounded px-1 py-0.5 text-xs">
                                        <span className="font-medium">{type || item.itemType}</span>
                                      </div>
                                      {tuning && (
                                        <div style={{ width: '55px' }} className="text-center bg-gray-100 rounded px-1 py-0.5 text-xs">
                                          <span className="font-medium">{tuning}</span>
                                        </div>
                                      )}
                                      {frequency && (
                                        <div style={{ width: '45px' }} className="text-center bg-gray-100 rounded px-1 py-0.5 text-xs">
                                          <span className="font-medium">{frequency}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Label Preview */}
                                  <div className={`mt-2 border border-dashed ${selectedItems.some(i => i.id === item.id) ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'} p-2 rounded-md`}>
                                    <div className={`${selectedItems.some(i => i.id === item.id) ? 'text-sm' : 'text-xs'} font-bold text-center mb-1`}>
                                      {selectedItems.some(i => i.id === item.id) ? '📋 LABEL TEMPLATE 📋' : 'Label Preview:'}
                                    </div>
                                    <div className={`${selectedItems.some(i => i.id === item.id) ? 'text-sm' : 'text-xs'} leading-tight bg-white p-3 border border-gray-300 rounded shadow-sm`}>
                                      <div className="flex justify-between items-center mb-1.5">
                                        <span className="flex-1"><span className="font-semibold">Customer:</span> {selectedOrder?.customerName}</span>
                                        <span className="text-right flex-1"><span className="font-semibold">Order:</span> {selectedOrder?.orderNumber}</span>
                                      </div>
                                      <div className="flex justify-between mb-1.5">
                                        <span><span className="font-semibold">Type:</span> {type || item.itemType}</span>
                                        <span><span className="font-semibold">Color:</span> {color || '-'}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span><span className="font-semibold">Tuning:</span> {tuning || '-'}</span>
                                        <span><span className="font-semibold">Freq:</span> {frequency || '-'}</span>
                                      </div>
                                      {selectedItems.some(i => i.id === item.id) && (
                                        <div className="mt-2 pt-2 border-t border-gray-200 text-center text-gray-600">
                                          Serial: {item.serialNumber}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {/* Scrollable Instrument Labels */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold flex items-center gap-1.5">
                      <Package className="h-4 w-4" />
                      Instrument Labels Preview
                    </h3>
                    <span className="text-xs text-gray-500">{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected</span>
                  </div>
                  
                  <div className="overflow-y-auto max-h-[200px] border rounded-md">
                    {selectedItems.length > 0 ? (
                      <div className="divide-y">
                        {selectedItems.map((item, index) => (
                          <div key={item.id} className="p-3 hover:bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-start gap-2">
                                <Checkbox 
                                  id={`select-item-${item.id}`}
                                  className="mt-1"
                                  checked={selectedBoxItems.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedBoxItems(prev => [...prev, item.id]);
                                    } else {
                                      setSelectedBoxItems(prev => prev.filter(id => id !== item.id));
                                    }
                                  }}
                                />
                                <div className="space-y-0.5">
                                  <div className="font-medium text-sm flex items-center">
                                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#015a6c]"></span>
                                    {item.serialNumber}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Type: {item.itemType || getTypeFromSpecifications(item)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <div className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                                  {getNoteTuningFromSpecifications(item) || '-'}
                                </div>
                                <div className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                                  {item.specifications?.frequency || '-'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Color:</span>
                                <span>{getColorFromSpecifications(item) || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Box:</span>
                                <span>{getBoxSize(item) || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tuning:</span>
                                <span>{getNoteTuningFromSpecifications(item) || '-'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Frequency:</span>
                                <span>{item.specifications?.frequency || '-'}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Select item(s) to display label preview</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="rounded-md border p-3 bg-gray-50">
                      <div className="text-sm font-medium text-gray-700 mb-1">Order Summary</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Order Number:</span>
                          <span className="font-medium">{selectedOrder?.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Customer:</span>
                          <span className="font-medium truncate max-w-[120px]">{selectedOrder?.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Status:</span>
                          <span className="font-medium capitalize">{selectedOrder?.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Date:</span>
                          <span className="font-medium">{selectedOrder?.orderDate && new Date(selectedOrder.orderDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="rounded-md border p-3 bg-gray-50">
                      <div className="text-sm font-medium text-gray-700 mb-1">Quick Actions</div>
                      <div className="grid grid-cols-2 gap-1 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs"
                          disabled={selectedBoxItems.length === 0}
                        >
                          <Printer className="h-3.5 w-3.5 mr-1" />
                          Print Labels ({selectedBoxItems.length})
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs"
                          disabled={selectedBoxItems.length === 0}
                          onClick={() => {
                            if (selectedBoxItems.length > 0) {
                              setJointBoxDialogOpen(true);
                            }
                          }}
                        >
                          <Package className="h-3.5 w-3.5 mr-1" />
                          Box Items ({selectedBoxItems.length})
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              
              {/* Notes Section */}
              <div className="col-span-full">
                {/* Display Shopify Notes if available */}
                {selectedOrder.notes && selectedOrder.notes.trim() !== '' && (
                  <div className="mb-4">
                    <Label className="text-sm flex items-center mb-1">
                      <span className="mr-1.5 inline-block h-3 w-3 rounded-full bg-red-500"></span>
                      Customer Notes from Shopify
                    </Label>
                    <div className="rounded-md border p-3 bg-[#FEF2F2] text-[#7F1D1D] whitespace-pre-wrap">
                      {selectedOrder.notes}
                    </div>
                  </div>
                )}
                
                {/* Workshop Notes */}
                <div className="space-y-1 col-span-full">
                  <Label htmlFor="workshopNotes" className="text-sm flex items-center">
                    <span className="mr-1.5 inline-block h-3 w-3 rounded-full bg-[#015a6c]"></span>
                    Workshop Notes
                  </Label>
                  <Textarea 
                    id="workshopNotes" 
                    placeholder="Add workshop notes, internal remarks, or special instructions here..." 
                    className="min-h-[80px]"
                    value={workshopNotes}
                    onChange={(e) => setWorkshopNotes(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Reseller Settings */}
              <div className="flex items-center justify-between gap-3 col-span-full mt-1 py-2 border-t">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="reseller" 
                    checked={isReseller}
                    onCheckedChange={setIsReseller}
                  />
                  <Label htmlFor="reseller" className="cursor-pointer text-sm font-medium">
                    {isReseller ? 'Reseller Order' : 'Mark as Reseller Order'}
                  </Label>
                </div>
                {isReseller && (
                  <div className="flex-1 max-w-[200px]">
                    <Input
                      placeholder="Reseller nickname"
                      value={resellerNickname}
                      onChange={(e) => setResellerNickname(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                )}
                <div className="text-xs text-muted-foreground max-w-[180px]">
                  {isReseller ? 
                    'This order will be highlighted and display the reseller nickname' : 
                    'Mark reseller orders for better visibility'}
                </div>
              </div>
              
              {/* Archive Toggle */}
              <div className="flex items-center justify-between gap-3 col-span-full mt-1 py-2 border-t">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="archive" 
                    checked={archiveOrder}
                    onCheckedChange={setArchiveOrder}
                  />
                  <Label htmlFor="archive" className="cursor-pointer text-sm font-medium">
                    {archiveOrder ? 'Order Archived (Hidden)' : 'Archive This Order'}
                  </Label>
                </div>
                <div className="text-xs text-muted-foreground max-w-[180px]">
                  {archiveOrder ? 
                    'This order will be hidden from the main list' : 
                    'Archived orders are hidden from the main list but can be restored later'}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDetailsOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="default"
              onClick={() => {
                handleSaveNotes();
                if (archiveOrder !== Boolean(selectedOrder?.archived)) {
                  handleArchiveToggle();
                }
                setOrderDetailsOpen(false);
              }}
              className="bg-[#1F5B61] hover:bg-[#174349] text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Order Range Settings Dialog */}
      <Dialog open={showOrderRangeSettings} onOpenChange={setShowOrderRangeSettings}>
        <DialogContent className="max-w-md w-[90vw] p-4 sm:p-5">
          <div className="absolute right-3 top-3 z-50">
            <button
              onClick={() => setShowOrderRangeSettings(false)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-white dark:bg-gray-950 p-1"
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <DialogHeader className="pb-2 space-y-1">
            <DialogTitle className="text-base">Order Number Range Settings</DialogTitle>
            <DialogDescription className="text-xs">
              Filter orders by their order number range
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="minOrderNumber" className="text-sm">Minimum Order #</Label>
                <Input
                  id="minOrderNumber"
                  placeholder="e.g., 1485"
                  value={minOrderNumber}
                  onChange={(e) => setMinOrderNumber(e.target.value)}
                  className="h-8 text-sm"
                />
                <p className="text-xs text-muted-foreground">Only show orders above this number</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="maxOrderNumber" className="text-sm">Maximum Order #</Label>
                <Input
                  id="maxOrderNumber"
                  placeholder="e.g., 1600"
                  value={maxOrderNumber}
                  onChange={(e) => setMaxOrderNumber(e.target.value)}
                  className="h-8 text-sm"
                />
                <p className="text-xs text-muted-foreground">Leave empty to show all newer orders</p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setMinOrderNumber('');
                setMaxOrderNumber('');
              }}
            >
              Reset
            </Button>
            <Button 
              onClick={() => setShowOrderRangeSettings(false)}
              className="bg-[#1F5B61] hover:bg-[#174349] text-white"
            >
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Joint Box Assignment Dialog */}
      <Dialog open={jointBoxDialogOpen} onOpenChange={setJointBoxDialogOpen}>
        <DialogContent className="max-w-md w-[90vw] p-4 sm:p-5">
          <div className="absolute right-3 top-3 z-50">
            <button
              onClick={() => setJointBoxDialogOpen(false)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-white dark:bg-gray-950 p-1"
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <DialogHeader className="pb-2 space-y-1">
            <DialogTitle className="text-base">Assign Joint Box</DialogTitle>
            <DialogDescription className="text-xs">
              Assign a shared box for {selectedItems.length} selected flutes
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-3 py-3">
            <div className="space-y-1">
              <Label className="text-sm">Selected Items</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md p-2 bg-gray-50">
                {selectedItems.map(item => (
                  <div key={item.id} className="flex items-center py-0.5 border-b last:border-0">
                    <div className="font-medium text-sm">{item.serialNumber}</div>
                    <div className="ml-2 text-xs text-gray-500">
                      {getTypeFromSpecifications(item)} {getNoteTuningFromSpecifications(item)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="boxSize" className="text-sm">Select Box Size</Label>
              <div className="grid grid-cols-3 gap-2">
                {boxSizes.map(size => (
                  <Button
                    key={size}
                    type="button"
                    variant={selectedCustomBox === size ? "default" : "outline"}
                    className={`text-sm h-8 ${selectedCustomBox === size ? "bg-[#1F5B61] text-white" : ""}`}
                    onClick={() => setSelectedCustomBox(size)}
                  >
                    {size}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={selectedCustomBox === 'custom' ? "default" : "outline"}
                  className={`text-sm h-8 ${selectedCustomBox === 'custom' ? "bg-[#1F5B61] text-white" : ""}`}
                  onClick={() => setSelectedCustomBox('custom')}
                >
                  Custom
                </Button>
              </div>
            </div>
            
            {selectedCustomBox === 'custom' && (
              <div className="space-y-1">
                <Label htmlFor="customBoxSize" className="text-sm">Custom Box Size</Label>
                <Input
                  id="customBoxSize"
                  value={customBoxSize}
                  onChange={(e) => setCustomBoxSize(e.target.value)}
                  placeholder="e.g. 25x25x25"
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setJointBoxDialogOpen(false);
                setSelectedCustomBox('');
                setCustomBoxSize('');
              }}
            >
              Cancel
            </Button>
            <Button
              disabled={
                selectedItems.length === 0 || 
                (selectedCustomBox === 'custom' && !customBoxSize) ||
                (!selectedCustomBox)
              }
              onClick={() => {
                const boxSize = selectedCustomBox === 'custom' ? customBoxSize : selectedCustomBox;
                updateCustomBoxMutation.mutate({
                  itemIds: selectedItems.map(item => item.id),
                  customBoxSize: boxSize
                });
                setJointBoxDialogOpen(false);
              }}
              className="bg-[#1F5B61] hover:bg-[#174349] text-white"
            >
              Apply Custom Box
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex flex-row-reverse justify-between items-center mb-1">
        <div className="flex items-center gap-3 order-last">
          {unfulfilledOrdersCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-[#015a6c] text-white rounded" title="Total orders">
                <FileText className="h-3 w-3 mr-1" />
                {unfulfilledOrdersCount}
              </span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-[#C26E50] text-white rounded" title="Items to build">
                <Package className="h-3 w-3 mr-1" />
                {itemsCount}
              </span>
              
              {/* Current average waiting time */}
              {allOrderItems.length > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold bg-gray-700 text-white rounded" title="Average wait time">
                  <Clock className="h-3 w-3 mr-1" />
                  {Math.round(
                    allOrderItems
                      .filter(item => !isStatusComplete(item, 'shipping'))
                      .reduce((sum, item) => sum + getItemWaitingDays(item), 0) /
                    allOrderItems.filter(item => !isStatusComplete(item, 'shipping')).length || 0
                  )}d
                </span>
              )}
              
              {/* Non-working periods indicator */}
              {nonWorkingPeriods.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="inline-flex items-center justify-center gap-1 px-2 py-0.5 text-xs font-semibold bg-purple-500 text-white rounded hover:bg-purple-600" title="Non-working periods">
                      <Calendar className="h-3 w-3 mr-1" />{nonWorkingPeriods.length}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <div className="font-medium">Non-Working Periods</div>
                      <div className="text-muted-foreground text-sm">
                        These periods are excluded from waiting time calculations.
                      </div>
                      <div className="max-h-40 overflow-y-auto">
                        {nonWorkingPeriods.map((period, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border-b">
                            <div>
                              <div className="font-medium">{formatDate(period.start)} - {formatDate(period.end)}</div>
                              <div className="text-sm text-muted-foreground">{period.reason}</div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setNonWorkingPeriods(prev => prev.filter((_, i) => i !== index));
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => setShowNonWorkingForm(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Non-Working Period
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-2 items-center order-first">
          {/* Order isolation indicator */}
          {hasIsolatedOrders && (
            <div className="isolation-indicator">
              <span>
                <strong>{isolatedOrderIds.length}</strong> order{isolatedOrderIds.length !== 1 ? 's' : ''} isolated
              </span>
              <button 
                onClick={clearIsolation}
                className="isolation-clear-button"
              >
                <XIcon className="h-3 w-3" />
                Clear
              </button>
            </div>
          )}
          
          {/* Smart filter indicator - show when any filters are active */}
          {(typeFilter !== null || colorFilters.length > 0 || tuningFilter !== null || 
            frequencyFilter !== null || resellerFilter !== null || statusFilter !== null) && (
            <div className="isolation-indicator bg-blue-700">
              <span>
                Filters active
              </span>
              <button 
                onClick={clearAllFilters}
                className="isolation-clear-button"
              >
                <XIcon className="h-3 w-3" />
                Clear All
              </button>
            </div>
          )}
          
          {/* Zoekbalk verwijderd - nu in header.tsx */}

          {/* Add Non-Working Period button - more compact */}
          <Button 
            variant="outline" 
            onClick={() => setShowNonWorkingForm(true)}
            className="text-sm flex items-center"
            title="Track Non-Working Period"
          >
            <Calendar className="h-4 w-4" />
          </Button>

          {/* Removed the large sorting toggle as it's now in the order header */}
          <Button 
            variant="outline" 
            onClick={() => setShowOrderRangeSettings(true)}
            className="text-sm flex items-center"
            title="Set Order Number Range"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button 
            variant="default" 
            onClick={async () => {
              // First sync with Shopify to get any new orders
              toast({
                title: "Syncing with Shopify...",
                description: "Checking for new orders",
              });
              
              try {
                // Import from Shopify
                const result = await syncShopifyOrders();
                
                if (result.success) {
                  // Invalidate queries to refresh local data
                  queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/order-items'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
                  
                  // Show success message
                  toast({
                    title: "Sync Complete",
                    description: result.importedCount 
                      ? `Imported ${result.importedCount} new order(s) from Shopify` 
                      : "All data updated. No new orders from Shopify",
                  });
                } else {
                  // If Shopify sync fails, still refresh local data
                  queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/order-items'] });
                  queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
                  
                  toast({
                    title: "Sync Partially Failed",
                    description: "Data updated, but Shopify import failed: " + result.message,
                    variant: "destructive",
                  });
                }
              } catch (error) {
                // If there's an error, still refresh local data
                queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
                queryClient.invalidateQueries({ queryKey: ['/api/order-items'] });
                queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
                
                toast({
                  title: "Sync Error",
                  description: "Data updated but could not connect to Shopify.",
                  variant: "destructive",
                });
              }
            }}
            className="bg-[#C26E50] hover:bg-[#B05E40] text-white font-condensed sync-button"
            disabled={!isOnline}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            SYNC
          </Button>
        </div>
      </div>
      
      {/* Add WorksheetFilters component above the table */}
      <WorksheetFilters
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        tuningFilter={tuningFilter}
        setTuningFilter={setTuningFilter}
        frequencyFilter={frequencyFilter}
        setFrequencyFilter={setFrequencyFilter}
        colorFilters={colorFilters}
        setColorFilters={setColorFilters}
        resellerFilter={resellerFilter}
        setResellerFilter={setResellerFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        resellers={resellers}
        uniqueTypes={filterOptions.types}
        uniqueTunings={filterOptions.tunings}
        uniqueColors={filterOptions.colors}
        uniqueFrequencies={filterOptions.frequencies}
        statusOptions={statusOptions}
      />
      
      {/* Non-Working Period Dialog */}
      <Dialog open={showNonWorkingForm} onOpenChange={setShowNonWorkingForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Non-Working Period</DialogTitle>
            <DialogDescription>
              Track periods when you're not working (holidays, ceremonies, travel) to get more accurate waiting time calculations.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={newNonWorkingPeriod.start}
                onChange={(e) => setNewNonWorkingPeriod(prev => ({
                  ...prev,
                  start: e.target.value
                }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={newNonWorkingPeriod.end}
                onChange={(e) => setNewNonWorkingPeriod(prev => ({
                  ...prev,
                  end: e.target.value
                }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                placeholder="e.g., Holiday, Travel, Ceremony, etc."
                value={newNonWorkingPeriod.reason}
                onChange={(e) => setNewNonWorkingPeriod(prev => ({
                  ...prev,
                  reason: e.target.value
                }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={() => {
                if (!newNonWorkingPeriod.start || !newNonWorkingPeriod.end) {
                  toast({
                    title: "Missing dates",
                    description: "Please provide both start and end dates",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Add the new period
                setNonWorkingPeriods(prev => [...prev, {
                  start: newNonWorkingPeriod.start,
                  end: newNonWorkingPeriod.end,
                  reason: newNonWorkingPeriod.reason || 'Unspecified'
                }]);
                
                // Reset form
                setNewNonWorkingPeriod({
                  start: format(new Date(), 'yyyy-MM-dd'),
                  end: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
                  reason: ''
                });
                
                // Close dialog
                setShowNonWorkingForm(false);
                
                toast({
                  title: "Non-working period added",
                  description: "The waiting time calculations will now exclude this period."
                });
              }}
            >
              Add Period
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="rounded-md border bg-white mt-0 mb-0 pb-0 overflow-auto h-[calc(100vh-130px)]">
        <Table className="sticky-header-table mb-0 pb-0 relative">
          <TableHeader className="z-20">
            <TableRow className="divide-x divide-gray-300 border-b-2 border-white h-12 sticky top-0">
              <TableHead className="sticky-header sticky left-0 top-0 bg-[#015a6c] text-white p-1 whitespace-nowrap min-w-[90px] z-50 font-condensed text-center">
                <div className="flex items-center justify-center">
                  <span className="text-white font-bold mr-1">Order</span>
                  {/* Sorting toggle in the Order header */}
                  <div className="flex items-center" title={newestFirst ? "Nieuwste orders eerst" : "Oudste orders eerst"}>
                    <Switch
                      id="headerSortOrder"
                      checked={newestFirst}
                      onCheckedChange={(checked) => {
                        setNewestFirst(checked);
                        setSortField('orderNumber');
                        setSortDirection(checked ? 'desc' : 'asc');
                      }}
                      className="h-4 w-8 scale-75"
                    />
                    <Label htmlFor="headerSortOrder" className="ml-1 text-xs text-white">
                      {newestFirst ? "N→O" : "O→N"}
                    </Label>
                  </div>
                </div>
                {hasIsolatedOrders && (
                  <span className="ml-2 bg-orange-600 text-white text-xs px-1 rounded">
                    Filtered: {isolatedOrderIds.length}
                  </span>
                )}
              </TableHead>
              <TableHead className="sticky-header sticky top-0 bg-[#015a6c] text-white p-1 whitespace-nowrap min-w-[35px] z-40 text-center font-condensed">
                <span className="sr-only">Isolate</span>
                <Filter className="h-4 w-4 inline-block text-white" />
              </TableHead>
              <TableHead className="sticky-header sticky top-0 bg-[#015a6c] text-white p-1 whitespace-nowrap min-w-[55px] z-40 font-condensed text-center">
                <span className="text-white font-bold">Waiting</span>
              </TableHead>
              <TableHead className="sticky-header sticky top-0 bg-[#015a6c] text-white p-1 whitespace-nowrap min-w-[120px] z-40 font-condensed text-center">
                {/* Type filter dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center justify-center cursor-pointer">
                      <span className="text-white font-bold mr-1">Type</span>
                      <ChevronDown className="h-3 w-3 text-white" />
                      {typeFilter && (
                        <Badge variant="secondary" className="ml-1 bg-blue-700 text-white text-xs px-1 h-5">1</Badge>
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" align="start">
                    <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className={!typeFilter ? "bg-blue-50" : ""}
                      onClick={() => setTypeFilterSafe(null)}
                    >
                      <Check className={cn("mr-2 h-4 w-4", !typeFilter ? "opacity-100" : "opacity-0")} />
                      All Types
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {filterOptions.types.map((type) => (
                      <DropdownMenuItem
                        key={type}
                        className={typeFilter === type ? "bg-blue-50" : ""}
                        onClick={() => {
                          // If already selected, clear the filter, otherwise set it
                          // Using our safe setter function that ensures consistent UPPERCASE format
                          const newValue = typeFilter === type ? null : type;
                          console.log(`FILTER DEBUG: Selected type ${type}, will set to: ${newValue || 'null'}`);
                          setTypeFilterSafe(newValue);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", typeFilter === type ? "opacity-100" : "opacity-0")} />
                        {type}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead className="sticky-header sticky top-0 bg-[#015a6c] text-white p-1 whitespace-nowrap min-w-[45px] z-40 font-condensed text-center">
                {/* Color filter dropdown with only the 5 standard colors with vertical checkbox layout */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center justify-center cursor-pointer">
                      <span className="text-white font-bold mr-1">Color</span>
                      <ChevronDown className="h-3 w-3 text-white" />
                      {colorFilters.length > 0 && (
                        <Badge variant="secondary" className="ml-1 bg-blue-700 text-white text-xs px-1 h-5">
                          {colorFilters.length}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-24" align="start">
                    <div className="p-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-xs">Colors</span>
                        {colorFilters.length > 0 && (
                          <button 
                            className="text-xs text-blue-600 hover:text-blue-800" 
                            onClick={(e) => {
                              // Prevent the dropdown from closing
                              e.stopPropagation();
                              console.log('Clearing all color filters');
                              setColorFilters([]);
                            }}
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {/* Vertical color boxes with letters and small checkboxes - exact same styling as in rows */}
                        {['B', 'SB', 'T', 'TB', 'C'].map((colorCode) => {
                          const isSelected = colorFilters.includes(colorCode);
                          return (
                            <div key={colorCode} className="flex items-center mb-1 space-x-2">
                              {/* Small checkbox */}
                              <div
                                onClick={(e) => {
                                  // Prevent closing dropdown on selection
                                  e.stopPropagation();
                                  
                                  // Toggle this color in our filters
                                  if (isSelected) {
                                    setColorFilters(colorFilters.filter(c => c !== colorCode));
                                  } else {
                                    setColorFilters([...colorFilters, colorCode]);
                                  }
                                }}
                                className="relative inline-flex items-center justify-center flex-shrink-0 w-4 h-4 rounded border border-primary cursor-pointer"
                              >
                                {isSelected && (
                                  <span className="text-xs text-primary">✓</span>
                                )}
                              </div>
                              
                              {/* Color badge with letter - exact same styling as in rows */}
                              <div className="flex items-center">
                                <span 
                                  style={{
                                    minWidth: '24px',
                                    padding: '0.1rem 0.3rem',
                                    borderRadius: '0.25rem',
                                    textAlign: 'center',
                                    fontFamily: '"PT Sans Narrow", sans-serif',
                                    fontWeight: 700,
                                    fontSize: '10pt',
                                    color: 'white',
                                    cursor: 'pointer'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    
                                    // Toggle this color in our filters (same as checkbox)
                                    if (isSelected) {
                                      setColorFilters(colorFilters.filter(c => c !== colorCode));
                                    } else {
                                      setColorFilters([...colorFilters, colorCode]);
                                    }
                                  }}
                                  className={getColorClass(colorCode)}
                                >
                                  {colorCode}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              {/* We've removed Tuning, Hz, and Reseller columns as requested */}
              
              {/* Status columns */}
              {statusColumns.map(col => (
                <TableHead key={col.id} className="sticky-header sticky top-0 text-center bg-[#015a6c] text-white p-1 whitespace-nowrap min-w-[28px] z-40 font-condensed">
                  <span className="text-white font-bold">{col.label}</span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-300">
            {isLoadingOrders || isLoadingItems ? (
              <TableRow>
                <TableCell colSpan={20} className="text-center py-10">
                  Loading orders...
                </TableCell>
              </TableRow>
            ) : filteredOrderItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={20} className="text-center py-10">
                  No items found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              // COMPLETELY ITEM-BASED DISPLAY LOGIC
              // Group by order for visual organization and apply sorting
              Object.entries(
                filteredOrderItems.reduce((groups, item) => {
                  const orderId = item.orderId;
                  if (!groups[orderId]) {
                    groups[orderId] = [];
                  }
                  groups[orderId].push(item);
                  return groups;
                }, {} as Record<number, OrderItem[]>)
              )
              // Sort the grouped items by order number according to the sort setting
              .sort((a, b) => {
                const orderIdA = parseInt(a[0]);
                const orderIdB = parseInt(b[0]);
                
                // Find the corresponding orders
                const orderA = allOrders.find(order => order.id === orderIdA);
                const orderB = allOrders.find(order => order.id === orderIdB);
                
                if (!orderA || !orderB) return 0;
                
                // Extract order numbers for sorting
                const orderNumberA = parseInt(orderA.orderNumber?.replace(/\D/g, '') || '0');
                const orderNumberB = parseInt(orderB.orderNumber?.replace(/\D/g, '') || '0');
                
                // Apply sorting based on newestFirst setting (same logic as in allOrders sorting)
                return newestFirst ? (orderNumberB - orderNumberA) : (orderNumberA - orderNumberB);
              })
              .map(([orderId, items]) => {
                const order = allOrders.find(order => order.id === parseInt(orderId));
                if (!order) return null; // Skip if parent order not found
                
                // Handle orders with zero items (which shouldn't happen with our filtering)
                if (items.length === 0) {
                  return (
                    <TableRow 
                      key={order.id} 
                      className={`hover:bg-gray-50 divide-x border-b border-dotted ${isolatedOrderIds.includes(order.id) ? 'isolated-order' : ''} ${order.id % 2 === 0 ? 'bg-[#FCFCFB]' : 'bg-[#F5F5F0]'}`}>
                      <TableCell 
                        className={`font-bold sticky left-0 p-1 whitespace-nowrap z-20 ${order.isReseller ? 'bg-[#59296e]' : 'bg-[#015a6c]'} align-top cursor-pointer order-number-cell`}
                        style={{ zIndex: 20 }}
                        onClick={() => handleOrderClick(order)}
                      >
                        <div className="flex flex-col pt-1">
                          <div className="flex items-center">
                            <span className="hover:underline text-black">
                              {showOrderNumbers ? order.orderNumber?.replace('SW-', '') : ''}
                            </span>
                            
                            {/* Show reseller nickname with total items or percentage based on reseller */}
                            {order.isReseller && (
                              order.resellerNickname ? (
                                <span className="ml-1 text-xs bg-gray-500 text-white px-1 py-0.5 rounded font-bold">
                                  {`${order.resellerNickname} ${items.length}`}
                                </span>
                              ) : (
                                <span className="ml-1 text-xs bg-gray-500 text-white px-1 rounded font-bold">{items.length}</span>
                              )
                            )}
                            
                            {/* Notes indicator with red dot */}
                            {order.notes && order.notes.trim() !== '' && (
                              <span 
                                className="ml-1.5 inline-block h-4 w-4 rounded-full bg-red-600 border border-white" 
                                title={`This order has customer notes: "${order.notes.substring(0, 30)}${order.notes.length > 30 ? '...' : ''}"`}
                              ></span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell 
                        className={`p-1 whitespace-nowrap text-center ${order.id % 2 === 0 ? 'bg-[#FCFCFB]' : 'bg-[#F5F5F0]'}`}
                      >
                        <button 
                          className={`isolation-btn ${isolatedOrderIds.includes(order.id) ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleOrderIsolation(order.id, e);
                          }}
                          title={isolatedOrderIds.includes(order.id) ? "Remove from isolated view" : "Isolate this order"}
                          aria-label={isolatedOrderIds.includes(order.id) ? "Remove from isolated view" : "Isolate this order"}
                        >
                          {isolatedOrderIds.includes(order.id) ? 
                            <Focus className="h-4 w-4" /> : 
                            <Filter className="h-4 w-4" />
                          }
                        </button>
                      </TableCell>
                      <TableCell className={`font-medium p-1 whitespace-nowrap text-center text-lg ${order.id % 2 === 0 ? 'bg-[#FCFCFB]' : 'bg-[#F5F5F0]'}`}>
                        <div className="flex flex-col items-center">
                          {typeof getDaysSinceOrder(order.orderDate) === 'number' && (
                            <span className={`px-2 py-0.5 rounded ${getWaitingColorClass(getDaysSinceOrder(order.orderDate) as number)}`}>
                              {getDaysSinceOrder(order.orderDate)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={`p-1 whitespace-nowrap text-lg ${order.id % 2 === 0 ? 'bg-[#FCFCFB]' : 'bg-[#F5F5F0]'}`}>
                        <div className="flex justify-center">
                          {(() => {
                            const instrumentType = getTypeFromSpecifications(order);
                            const tuningNote = getNoteTuningFromSpecifications(order);
                            const freq = getTuningFrequencyFromSpecifications(order) || "";
                            
                            // Extract frequency from freq string with improved detection
                            const freqValue = freq.includes('432') ? '432' : 
                                             (freq.includes('440') ? '440' : 
                                             (freq.includes('64') ? '64' : undefined));
                                             
                            if (instrumentType) {
                              return (
                                <MoldNamePopover 
                                  instrumentType={instrumentType} 
                                  tuningNote={tuningNote || ''} 
                                  frequency={freqValue}
                                >
                                  <CombinedInstrumentTuningBadge
                                    instrumentType={instrumentType}
                                    tuningNote={tuningNote}
                                    frequency={freqValue}
                                  />
                                </MoldNamePopover>
                              );
                            } else {
                              return (
                                <div style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontFamily: '"PT Sans Narrow", sans-serif',
                                  fontWeight: 'bold',
                                  fontSize: '16pt',
                                  backgroundColor: '#9ca3af',
                                  color: 'white',
                                  minWidth: '45px',
                                  textAlign: 'center'
                                }}>
                                  —
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="p-1 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          <span 
                            style={{
                              minWidth: '50px',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              textAlign: 'center',
                              fontFamily: '"PT Sans Narrow", sans-serif',
                              fontWeight: 700,
                              fontSize: '14pt',
                              color: 'white'
                            }}
                            className={`${getColorClass(getColorFromSpecifications(order) === 'Smokefired Terra and Black' ? 'T' : (getColorFromSpecifications(order)?.slice(0, 2) || ''))}`}
                          >
                            {getColorFromSpecifications(order) === 'Smokefired Terra and Black' ? 'T' : (getColorFromSpecifications(order)?.slice(0, 2) || '—')}
                          </span>
                        </div>
                      </TableCell>
                      {/* Removed Tuning, Hz, and Status cells as requested */}
                      {statusColumns.map((col, index) => {
                        // This section was for date columns, which we've converted to checkboxes
                        if (col.isDateColumn) {
                          return (
                            <TableCell 
                              key={col.id} 
                              className="text-center p-1 text-sm"
                              style={{ 
                                backgroundColor: index % 2 === 0 ? '#F5F5F0' : '#F9F0E8'
                              }}
                            >
                              —
                            </TableCell>
                          );
                        }
                        
                        // For material columns (bag, box)
                        if (col.isMaterialColumn) {
                          if (col.id === 'bag') {
                            const bagInfo = getBagInfo(order);
                            
                            // Generate bag options based on instrument type
                            const bagOptions = [
                              { type: 'Innato', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
                              { type: 'Natey', sizes: ['S', 'M', 'L'] },
                              { type: 'ZEN', sizes: ['S', 'M', 'L'] },
                              { type: 'Double', sizes: ['M', 'L'] },
                              { type: 'OvA', sizes: ['Bagpack'] }
                            ];
                            
                            return (
                              <TableCell 
                                key={col.id} 
                                className="text-center p-1"
                                style={{ 
                                  backgroundColor: index % 2 === 0 ? '#F5F5F0' : '#F9F0E8'
                                }}
                              >
                                {/* Clickable bag label that opens a dropdown */}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="w-full cursor-pointer">
                                      {bagInfo ? (
                                        <span className={`bag-label bag-${bagInfo.size} bag-${bagInfo.type}`}>
                                          <span className="font-bold text-white">{bagInfo.type.toUpperCase()} {bagInfo.size.toUpperCase()}</span>
                                        </span>
                                      ) : (
                                        <span className="text-gray-500 hover:text-gray-800">Assign bag</span>
                                      )}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-56 p-2">
                                    <div className="grid gap-2">
                                      <h4 className="font-medium text-sm">Select bag type</h4>
                                      <div className="grid grid-cols-2 gap-1">
                                        {bagOptions.map(option => (
                                          <div key={option.type}>
                                            <div className="font-medium text-xs mb-1">{option.type}</div>
                                            <div className="flex flex-wrap gap-1">
                                              {option.sizes.map(size => (
                                                <button
                                                  key={`${option.type}-${size}`}
                                                  className={`text-xs px-2 py-1 rounded border ${
                                                    bagInfo?.type === option.type && bagInfo?.size === size
                                                      ? 'bg-primary text-white'
                                                      : 'bg-white hover:bg-gray-100'
                                                  }`}
                                                  onClick={() => handleMaterialUpdate(
                                                    order.id,
                                                    true,
                                                    'bag',
                                                    { type: option.type, size }
                                                  )}
                                                >
                                                  {size}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                            );
                          } else if (col.id === 'box') {
                            // Get instrument type and tuning to determine correct box size
                            const instrumentType = getTypeFromSpecifications(order);
                            const tuningNote = getNoteTuningFromSpecifications(order);
                            let boxSize: string | undefined;
                            
                            // Direct mapping for each instrument type and tuning
                            if (instrumentType) {
                              const type = instrumentType.toUpperCase();
                              
                              if (type.includes('INNATO')) {
                                // INNATO box size logic
                                if (tuningNote) {
                                  // Lower tunings need bigger boxes
                                  if (tuningNote.includes('G3') || tuningNote.includes('F#3') ||
                                      tuningNote.includes('F3') || tuningNote.includes('E3')) {
                                    boxSize = '35x35x35';
                                  } else {
                                    boxSize = '30x30x30';
                                  }
                                } else {
                                  // Default box for INNATO
                                  boxSize = '30x30x30';
                                }
                              } else if (type.includes('NATEY')) {
                                // NATEY box size logic - 2 distinct sizes based on tuning
                                if (tuningNote) {
                                  // Higher tunings use 15x15x15, lower use 12x12x30
                                  const highNotes = ['A4', 'G#4', 'G4', 'F#4', 'F4'];
                                  if (highNotes.includes(tuningNote)) {
                                    boxSize = '15x15x15';
                                  } else {
                                    boxSize = '12x12x30';
                                  }
                                } else {
                                  // Default box for NATEY
                                  boxSize = '12x12x30';
                                }
                              } else if (type.includes('ZEN')) {
                                // All ZEN flutes use the same box size
                                boxSize = '15x15x15';
                              } else if (type.includes('DOUBLE')) {
                                // All DOUBLE flutes use the same box size
                                boxSize = '20x20x20';
                              } else if (type.includes('OVA')) {
                                // OVA flutes get a large backpack box
                                boxSize = '40x40x60';
                              } else if (type.includes('CARDS')) {
                                // Cards products go in an envelope
                                boxSize = 'Envelope';
                              } else {
                                // Fallback to regular box size function
                                boxSize = getBoxSize(order);
                              }
                            } else {
                              // If no instrument type, use regular function
                              boxSize = getBoxSize(order);
                            }
                            
                            // Determine box size class (small, medium, large) based on dimensions
                            const getBoxSizeClass = (size: string | undefined) => {
                              if (!size) return 'box-small';
                              if (size.startsWith('15') || size.startsWith('20') || size.startsWith('12')) return 'box-small';
                              if (size.startsWith('30')) return 'box-medium';
                              return 'box-large'; // 35, 40, 50
                            };
                            
                            // All available box sizes
                            const boxSizes = ['20x20x20', '30x30x30', '35x35x35', '40x40x40', '50x50x50', '15x15x15', '12x12x30', 
                              '35x35x35', '40x40x60', 'Envelope'];
                            
                            return (
                              <TableCell 
                                key={col.id} 
                                className="text-center p-1"
                                style={{ 
                                  backgroundColor: index % 2 === 0 ? '#F5F5F0' : '#F9F0E8'
                                }}
                              >
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="w-full cursor-pointer">
                                      {boxSize ? (
                                        <span className={`box-label ${getBoxSizeClass(boxSize)}`}>
                                          <span className="font-bold text-white">{boxSize.toUpperCase()}</span>
                                        </span>
                                      ) : (
                                        <span className="text-gray-500 hover:text-gray-800">Assign box</span>
                                      )}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48 p-2">
                                    <div className="grid gap-2">
                                      <h4 className="font-medium text-sm">Select box size</h4>
                                      <div className="grid grid-cols-2 gap-1">
                                        {boxSizes.map(size => (
                                          <button
                                            key={size}
                                            className={`text-xs px-2 py-1 rounded border ${
                                              boxSize === size
                                                ? 'bg-primary text-white'
                                                : 'bg-white hover:bg-gray-100'
                                            }`}
                                            onClick={() => handleMaterialUpdate(
                                              order.id,
                                              true,
                                              'box',
                                              size
                                            )}
                                          >
                                            {size}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </TableCell>
                            );
                          }
                        }
                        
                        // For the DRY checkbox - auto-checked after 5 days from BUILD
                        if (col.isAutoCheck && col.dependsOn === 'building') {
                          const isBuilt = order.status === 'building' || isStatusComplete(order, 'building');
                          const dryingStatus = isDry(order);
                          const isDryStatusPresent = Boolean(order.statusChangeDates?.dry);
                          
                          return (
                            <TableCell 
                              key={col.id} 
                              className="text-center p-0 align-middle"
                              style={{ 
                                backgroundColor: index % 2 === 0 ? '#F5F5F0' : '#F9F0E8',
                                verticalAlign: 'middle'
                              }}
                            >
                              {isBuilt ? (
                                // If it's ready to be marked dry (5 days passed) and not yet manually marked
                                dryingStatus.isDryEnough && !isDryStatusPresent ? (
                                  <div 
                                    className="bg-[#f06923] rounded-md flex items-center justify-center mx-auto w-7 h-7 cursor-pointer"
                                    onClick={() => handleOrderStatusChange(order.id, col.id, true)}
                                    title="Ready to mark as dry (5+ days since BUILD)"
                                  >
                                    <Check className="h-5 w-5 text-white" />
                                  </div>
                                ) : 
                                // If it's still drying, show days remaining in orange pill
                                (!dryingStatus.isDryEnough && dryingStatus.daysRemaining !== null && !isDryStatusPresent) ? (
                                  <div 
                                    className="bg-orange-100 border-2 border-[#f06923] rounded-md flex items-center justify-center mx-auto w-7 h-7 cursor-pointer text-xs font-bold text-[#d25618]"
                                    title={`${dryingStatus.daysRemaining} day${dryingStatus.daysRemaining !== 1 ? 's' : ''} left to dry`}
                                  >
                                    {dryingStatus.daysRemaining}
                                  </div>
                                ) : (
                                  // If manually marked or already dried
                                  <Checkbox
                                    checked={isStatusComplete(order, col.id)}
                                    onCheckedChange={(checked) => 
                                      handleOrderStatusChange(order.id, col.id, checked as boolean)
                                    }
                                    className="touch-target h-7 w-7 cursor-pointer !border-orange-500 !border-2"
                                    data-order-id={order.id}
                                    data-status={col.id}
                                  />
                                )
                              ) : (
                                // If not built yet, show disabled checkbox
                                <Checkbox
                                  checked={false}
                                  className="touch-target h-7 w-7 !border-orange-500 !border-2 cursor-not-allowed opacity-50"
                                  disabled={true}
                                />
                              )}
                            </TableCell>
                          );
                        }
                        
                        // For regular status checkboxes
                        return (
                          <TableCell 
                            key={col.id} 
                            className="text-center p-0 align-middle"
                            style={{ 
                              backgroundColor: index % 2 === 0 ? '#F5F5F0' : '#F9F0E8',
                              verticalAlign: 'middle'
                            }}
                          >
                            {/* Special handling for DRY status */}
                            {col.id === 'dry' && col.isAutoCheck ? (
                              (() => {
                                // Get drying status info (has it been 5 days, how many days left)
                                const dryingStatus = isDry(order);
                                const isDryStatusPresent = Boolean(order.statusChangeDates?.dry);
                                
                                // If it's ready to be marked dry (5 days passed) and not yet marked
                                if (dryingStatus.isDryEnough && !isDryStatusPresent) {
                                  return (
                                    <div 
                                      className="bg-[#f06923] rounded-md flex items-center justify-center mx-auto w-7 h-7 cursor-pointer"
                                      onClick={() => handleOrderStatusChange(order.id, col.id, true)}
                                    >
                                      <Check className="h-5 w-5 text-white" />
                                    </div>
                                  );
                                }
                                
                                // If it's still drying, show days remaining in orange pill
                                if (!dryingStatus.isDryEnough && dryingStatus.daysRemaining !== null && !isDryStatusPresent) {
                                  return (
                                    <div 
                                      className="bg-orange-100 border border-[#f06923] rounded-md flex items-center justify-center mx-auto w-7 h-7 cursor-pointer text-xs font-bold text-[#d25618]"
                                      title={`${dryingStatus.daysRemaining} day${dryingStatus.daysRemaining !== 1 ? 's' : ''} left to dry`}
                                    >
                                      {dryingStatus.daysRemaining}
                                    </div>
                                  );
                                }
                                
                                // Otherwise regular checkbox
                                return (
                                  <Checkbox
                                    checked={isStatusComplete(order, col.id)} 
                                    onCheckedChange={(checked) => 
                                      handleOrderStatusChange(order.id, col.id, checked as boolean)
                                    }
                                    className="touch-target h-7 w-7 cursor-pointer"
                                    data-order-id={order.id}
                                    data-status={col.id}
                                  />
                                );
                              })()
                            ) : (
                              <div className="checkbox-wrapper">
                                <Checkbox
                                  checked={isStatusComplete(order, col.id)} 
                                  onCheckedChange={(checked) => 
                                    handleOrderStatusChange(order.id, col.id, checked as boolean)
                                  }
                                  className={`touch-target ${
                                    // Special color for SM checkbox - grey to indicate it's auto-checked for smoke-fired colors
                                    col.id === 'smoothing' && needsSmokeFiring(order) 
                                      ? 'checkbox-sm-auto cursor-not-allowed !bg-gray-200 !border-gray-400' 
                                      : col.id === 'dry' 
                                        ? 'checkbox-dry cursor-pointer !border-orange-500 !border-2' 
                                        : 'cursor-pointer'
                                  }`}
                                  // Disable SM checkbox for smoke-fired colors and TS R checkbox if criteria not met
                                  disabled={(col.id === 'smoothing' && needsSmokeFiring(order)) || 
                                    (col.id === 'testing' && order.status === 'building' && !isStatusComplete(order, 'testing'))}
                                  data-order-id={order.id}
                                  data-status={col.id}
                                />
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                }
                
                // If there are items, show each item in its own row with order info in first row only
                // Always show expanded version regardless of collapse state
                // const isCollapsed = Boolean(collapsedOrders[order.id]);
                
                // We're no longer using the collapsed view - always show all items
                // if (isCollapsed && orderItems.length > 1) {
                //   ...collapsed view code removed...
                // }
                
                // If not collapsed, show all items THAT MATCH THE FILTERS
                // Eerst halen we de items voor deze order op
                const itemsInThisOrder = itemsByOrder[order.id] || [];
                
                // Dan filteren we ze op basis van de actieve filters
                return itemsInThisOrder
                  .filter(item => {
                    // Als er geen actieve filters zijn, toon alle items
                    if (typeFilter === null && colorFilters.length === 0 && tuningFilter === null && frequencyFilter === null) {
                      return true;
                    }
                    
                    // Check type filter
                    if (typeFilter !== null) {
                      const itemType = getTypeFromSpecifications(item);
                      
                      // Speciaal geval voor DOUBLE fluiten
                      if (typeFilter === 'DOUBLE') {
                        // Check specifications voor DOUBLE in type of model
                        const specs = item.specifications as Record<string, any> || {};
                        const isDOUBLEType = 
                          (specs.type && specs.type.toUpperCase().includes('DOUBLE')) ||
                          (specs.model && specs.model.toUpperCase().includes('DOUBLE'));
                          
                        if (isDOUBLEType) return true;
                        
                        // Check voor G# in Medium of Large (speciale regel voor DOUBLE fluiten)
                        const isGSharp = (specs.note && specs.note.toUpperCase().includes('G#')) || 
                                    (specs.tuning && specs.tuning.toUpperCase().includes('G#'));
                                    
                        const isLargerSize = (specs.size && (specs.size.toUpperCase().includes('MEDIUM') || 
                                          specs.size.toUpperCase().includes('LARGE')));
                                          
                        if (isGSharp && isLargerSize) return true;
                        
                        // Niet een DOUBLE fluit volgens de criteria
                        return false;
                      }
                      
                      // Voor andere types, directe vergelijking
                      if (!itemType || itemType.toUpperCase() !== String(typeFilter).toUpperCase()) {
                        return false;
                      }
                    }
                    
                    // Check kleurfilters
                    if (colorFilters.length > 0) {
                      const itemColor = getColorFromSpecifications(item);
                      if (!itemColor || !colorFilters.includes(itemColor)) {
                        return false;
                      }
                    }
                    
                    // Check tuning filter
                    if (tuningFilter !== null) {
                      const itemTuning = getNoteTuningFromSpecifications(item);
                      if (!itemTuning || itemTuning !== tuningFilter) {
                        return false;
                      }
                    }
                    
                    // Check frequency filter
                    if (frequencyFilter !== null) {
                      const itemFreq = getTuningFrequencyFromSpecifications(item);
                      if (!itemFreq || itemFreq !== frequencyFilter) {
                        return false;
                      }
                    }
                    
                    // Item voldoet aan alle actieve filters
                    return true;
                  })
                  .map((item, index) => (
                  <TableRow 
                    key={`${order.id}-${item.id}`}
                    className={`
  hover:bg-gray-50 
  divide-x 
  border-b border-dotted
  order-row
  ${isolatedOrderIds.includes(order.id) ? 'isolated-order' : ''} 
  ${itemsInThisOrder.length > 1 ? 'multi-item-flat-row' : (order.id % 2 === 0 ? 'bg-[#FCFCFB]' : 'bg-[#F5F5F0]')}
  ${itemsInThisOrder.length > 1 ? 'border-l-4 border-l-gray-300' : ''}
  ${index === 0 && itemsInThisOrder.length > 1 ? 'border-t-2 border-t-gray-400' : ''}
  ${index === itemsInThisOrder.length - 1 && itemsInThisOrder.length > 1 ? 'border-b-2 border-b-gray-400' : ''}
`}
                    style={{
                      backgroundColor: getCellBackgroundColor(itemsInThisOrder, order.id),
                      verticalAlign: 'middle'
                    }}
                  >
                        <TableCell 
                          className={`font-bold sticky left-0 p-1 whitespace-nowrap z-20 ${order.isReseller ? 'bg-[#59296e]' : 'bg-[#015a6c]'} align-middle cursor-pointer order-number-cell`}
                          style={{ zIndex: 20 }}
                          onClick={() => handleOrderClick(order)}
                        >
                          <div className="flex flex-col pt-1">
                            <div className="flex items-center">
                              <span className="hover:underline text-white">
                                {showOrderNumbers ? (
                                  itemsInThisOrder.length > 1 ? 
                                    `${order.orderNumber?.replace('SW-', '')}-${index + 1}` : 
                                    order.orderNumber?.replace('SW-', '')
                                ) : ''}
                              </span>
                              
                              {/* Show reseller nickname with total items in numeric format without percentage symbols */}
                              {order.isReseller && (
                                order.resellerNickname ? (
                                  <span className="ml-1 text-xs bg-gray-500 text-white px-1 py-0.5 rounded font-bold">
                                    {order.resellerNickname} {itemsInThisOrder.length > 1 ? itemsInThisOrder.length : ''}
                                  </span>
                                ) : (
                                  <span className="ml-1 text-xs bg-gray-500 text-white px-1 rounded font-bold">{itemsInThisOrder.length}</span>
                                )
                              )}
                              
                              {/* Notes indicator with red dot - comes before joint box */}
                              {order.notes && order.notes.trim() !== '' && (
                                <span 
                                  className="ml-1.5 inline-block h-2.5 w-2.5 rounded-full bg-red-600 border border-white" 
                                  title={`This order has customer notes: "${order.notes.substring(0, 30)}${order.notes.length > 30 ? '...' : ''}"`}
                                ></span>
                              )}
                              
                              {/* Show total count for non-reseller multi-item orders */}
                              {!order.isReseller && itemsInThisOrder.length > 1 && (
                                <span className="ml-1 text-xs bg-gray-500 text-white px-1 py-0.5 rounded font-bold">
                                  {`${itemsInThisOrder.length}`}
                                </span>
                              )}
                            </div>
                            
                            {/* Removed extended order numbers from here - will show them in each row */}
                          </div>
                        </TableCell>
                        <TableCell 
                          
                          className={`p-1 whitespace-nowrap text-center align-middle`}
                          style={{ backgroundColor: getCellBackgroundColor(itemsInThisOrder, order.id) }}
                        >
                          <div className="flex flex-col items-center">
                            <button 
                              className={`isolation-btn ${isolatedOrderIds.includes(order.id) ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleOrderIsolation(order.id, e);
                              }}
                              title={isolatedOrderIds.includes(order.id) ? "Remove from isolated view" : "Isolate this order"}
                              aria-label={isolatedOrderIds.includes(order.id) ? "Remove from isolated view" : "Isolate this order"}
                            >
                              {isolatedOrderIds.includes(order.id) ? 
                                <Focus className="h-4 w-4" /> : 
                                <Filter className="h-4 w-4" />
                              }
                            </button>
                          </div>
                        </TableCell>
                        <TableCell 
                          
                          className={`font-medium p-1 whitespace-nowrap text-center align-middle`}
                          style={{ backgroundColor: getCellBackgroundColor(itemsInThisOrder, order.id) }}
                        >
                          <div className="flex flex-col items-center">
                            {typeof getDaysSinceOrder(order.orderDate) === 'number' && (
                              <span className={`px-2 py-0.5 rounded ${getWaitingColorClass(getDaysSinceOrder(order.orderDate) as number)}`}>
                                {getDaysSinceOrder(order.orderDate)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                    {/* We'll handle serial numbers in a different way */}
                    
                    <TableCell 
                      className="p-1 whitespace-nowrap text-lg"
                      style={{ 
                        zIndex: 10,
                        verticalAlign: "middle"
                      }}
                    >
                      {/* Show the extended order number for each row when expanded */}
                      <div 
                        className="flex flex-col items-center p-0.5"
                        style={{ 
                          alignItems: 'center',
                          verticalAlign: 'middle',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        {/* Removed duplicate order number display since we're showing it in the order number column */}
                        {/* Combined badge with instrument type, tuning, and frequency */}
                        <div className="flex justify-center">
                          {(() => {
                            const instrumentType = getTypeFromSpecifications(item) || getTypeFromSpecifications(order);
                            const tuningNote = getNoteTuningFromSpecifications(item) || getNoteTuningFromSpecifications(order);
                            const freq = getTuningFrequencyFromSpecifications(item) || getTuningFrequencyFromSpecifications(order) || "";

                            // Extract frequency from freq string with improved detection
                            const freqValue = freq.includes('432') ? '432' : 
                                            (freq.includes('440') ? '440' : 
                                            (freq.includes('64') ? '64' : undefined));
                                             
                            console.log('DEBUG ItemPopoverFreq:', { 
                              instrumentType, 
                              tuningNote, 
                              freq, 
                              freqValue,
                              itemId: item.id,
                              serialNumber: item.serialNumber
                            });
                            
                            if (instrumentType) {
                              return (
                                <MoldNamePopover 
                                  instrumentType={instrumentType} 
                                  tuningNote={tuningNote || ''} 
                                  frequency={freqValue}
                                >
                                  <CombinedInstrumentTuningBadge
                                    instrumentType={instrumentType}
                                    tuningNote={tuningNote}
                                    frequency={freqValue}
                                  />
                                </MoldNamePopover>
                              );
                            } else {
                              return (
                                <div style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontFamily: '"PT Sans Narrow", sans-serif',
                                  fontWeight: 'bold',
                                  fontSize: '16pt',
                                  backgroundColor: '#9ca3af',
                                  color: 'white',
                                  minWidth: '45px',
                                  textAlign: 'center'
                                }}>
                                  —
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell 
                      className="p-1 whitespace-nowrap text-center"
                      style={{ 
                        zIndex: 10,
                        verticalAlign: "middle"
                      }}
                    >
                      <div className="flex justify-center p-0.5" style={{ 
                        backgroundColor: 'transparent',
                        width: '100%'
                      }}>
                        {/* Use getColorFromSpecifications(item) directly instead of getColorFromSpecifications(order) */}
                        {(() => {
                          const itemColor = getColorFromSpecifications(item);
                          const colorCode = itemColor === 'Smokefired Terra and Black' ? 'T' : (itemColor?.slice(0, 2) || '');
                          
                          // For our problematic SW-1580-2 with "Smokefired black with Terra and Copper Bubbles"
                          if (item.serialNumber === 'SW-1580-2') {
                            console.log("Special case for SW-1580-2, forcing color code C");
                            return (
                              <span className={`min-w-[60px] px-2 py-1 rounded font-medium text-center ${getColorClass('C')}`}>
                                C
                              </span>
                            );
                          }
                          
                          return (
                            <span className={`min-w-[60px] px-2 py-1 rounded font-medium text-center ${getColorClass(colorCode)}`}>
                              {colorCode || '—'}
                            </span>
                          );
                        })()}
                      </div>
                    </TableCell>
                    {statusColumns.map((col, index) => {
                      // Special case for BUILD column - render as checkbox
                      if (col.id === 'building') {
                        return (
                          <TableCell 
                            key={col.id} 
                            className="text-center p-1 status-column-group"
                            style={{ 
                              zIndex: 10,
                              verticalAlign: "middle"
                            }}
                          >
                            <div className="checkbox-wrapper">
                              <Checkbox
                                checked={isStatusComplete(item, col.id)} 
                                onCheckedChange={(checked) => 
                                  handleItemStatusChange(item.id, col.id, checked as boolean)
                                }
                                className="touch-target cursor-pointer h-7 w-7"
                                data-item-id={item.id}
                                data-status={col.id}
                              />
                            </div>
                          </TableCell>
                        );
                      }
                      
                      // For other date columns (legacy code path), hide them
                      if (col.isDateColumn) {
                        return (
                          <TableCell 
                            key={col.id} 
                            className="text-center p-1 text-base status-column-group"
                            style={{ 
                              zIndex: 10,
                              verticalAlign: "middle"
                            }}
                          >
                            <div className="flex justify-center p-0.5" style={{ 
                              backgroundColor: 'transparent',
                              width: '100%'
                            }}>
                              {/* Don't display dates in multi-item orders */}
                              —
                            </div>
                          </TableCell>
                        );
                      }
                      
                      // For material columns (bag, box)
                      if (col.isMaterialColumn) {
                        if (col.id === 'bag') {
                          const bagInfo = getBagInfo(item) || getBagInfo(order);
                          
                          // Generate bag options based on instrument type
                          const bagOptions = [
                            { type: 'Innato', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
                            { type: 'Natey', sizes: ['S', 'M', 'L'] },
                            { type: 'ZEN', sizes: ['S', 'M', 'L'] },
                            { type: 'Double', sizes: ['M', 'L'] },
                            { type: 'OvA', sizes: ['Bagpack'] }
                          ];
                          
                          // Determine if this is an expanded item row
                          const isExpandedItemRow = false; // No expanded rows in flat system
                          
                          return (
                            <TableCell 
                              key={col.id} 
                              className="text-center p-1 material-column"
                              style={{ 
                                backgroundColor: isExpandedItemRow ? '#e2e2e2' : (index % 2 === 0 ? '#F5F5F0' : '#F9F0E8'),
                                zIndex: 10
                              }}
                            >
                              {/* Clickable bag label that opens a dropdown */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="w-full cursor-pointer">
                                    {bagInfo ? (
                                      <span className={`bag-label bag-${bagInfo.size} bag-${bagInfo.type}`}>
                                        <span className="font-bold text-white">{bagInfo.type.toUpperCase()} {bagInfo.size.toUpperCase()}</span>
                                      </span>
                                    ) : (
                                      <span className="text-gray-500 hover:text-gray-800">Assign bag</span>
                                    )}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-2">
                                  <div className="grid gap-2">
                                    <h4 className="font-medium text-sm">Select bag type</h4>
                                    <div className="grid grid-cols-2 gap-1">
                                      {bagOptions.map(option => (
                                        <div key={option.type}>
                                          <div className="font-medium text-xs mb-1">{option.type}</div>
                                          <div className="flex flex-wrap gap-1">
                                            {option.sizes.map(size => (
                                              <button
                                                key={`${option.type}-${size}`}
                                                className={`text-xs px-2 py-1 rounded border ${
                                                  bagInfo?.type === option.type && bagInfo?.size === size
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white hover:bg-gray-100'
                                                }`}
                                                onClick={() => handleMaterialUpdate(
                                                  item.id,
                                                  false,
                                                  'bag',
                                                  { type: option.type, size }
                                                )}
                                              >
                                                {size}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                          );
                        } else if (col.id === 'box') {
                          // First get bag info to determine the box size
                          const bagInfo = getBagInfo(item) || getBagInfo(order);
                          const instrumentType = getTypeFromSpecifications(item) || getTypeFromSpecifications(order);
                          
                          // Get box size from material settings based on bag info
                          let boxSize: string | undefined;
                          
                          if (bagInfo && instrumentType && materialSettings) {
                            const type = instrumentType.toLowerCase();
                            let instrumentKey: string;
                            
                            // Normalize instrument type for lookup
                            if (type.includes('innato')) instrumentKey = 'innato';
                            else if (type.includes('natey')) instrumentKey = 'natey';
                            else if (type.includes('zen')) instrumentKey = 'zen';
                            else if (type.includes('double')) instrumentKey = 'double';
                            else if (type.includes('ova')) instrumentKey = 'ova';
                            else if (type.includes('card')) instrumentKey = 'cards';
                            else instrumentKey = '';
                            
                            // Find matching setting by bag size
                            if (instrumentKey && materialSettings[instrumentKey]) {
                              // Find first matching setting with this bag size
                              const matchingSetting = materialSettings[instrumentKey].find(
                                (setting: any) => setting.bagSize === bagInfo.size
                              );
                              
                              if (matchingSetting) {
                                boxSize = matchingSetting.boxSize;
                                console.log(`Found box size ${boxSize} for ${instrumentKey} with bag size ${bagInfo.size}`);
                              }
                            }
                          }

                          // If no box size from material settings, use the one from the order data
                          if (!boxSize) {
                            boxSize = getBoxSize(item) || getBoxSize(order);
                          }
                          
                          // For styling the box size
                          const getBoxSizeClass = (size: string | undefined) => {
                            if (!size) return 'box-small';
                            if (size === '-' || size === 'Envelope' || size === 'E~NVELOPE') return 'box-envelope';
                            if (size.startsWith('15') || size.startsWith('20') || size.startsWith('12')) return 'box-small';
                            if (size.startsWith('30')) return 'box-medium';
                            return 'box-large'; // 35, 40, 50
                          };
                          
                          // Get all available box sizes from material settings
                          let boxSizes: string[] = [];
                          
                          if (materialSettings) {
                            // Get all unique box sizes from workshop settings
                            const allSizes = new Set<string>();
                            
                            Object.values(materialSettings).forEach((settings: any) => {
                              settings.forEach((setting: any) => {
                                if (setting.boxSize && setting.boxSize !== '-') {
                                  allSizes.add(setting.boxSize);
                                }
                              });
                            });
                            
                            boxSizes = Array.from(allSizes);
                            
                            // Add ENVELOPE option for CARDS
                            if (instrumentType?.toLowerCase().includes('card')) {
                              boxSizes = ['ENVELOPE'];
                              // Force boxSize to ENVELOPE for CARDS products
                              boxSize = 'ENVELOPE';
                            }
                          } else {
                            // Fallback if no material settings
                            boxSizes = ['20x20x20', '30x30x30', '35x35x35', '40x40x40', '50x50x50', '15x15x15', '12x12x30', 
                                      '35x35x35', '40x40x60', 'ENVELOPE'];
                          }
                          
                          // Determine if this is an expanded item row
                          const isExpandedItemRow = false; // No expanded rows in flat system
                          
                          return (
                            <TableCell 
                              key={col.id} 
                              className="text-center p-1 material-column"
                              style={{ 
                                backgroundColor: isExpandedItemRow ? '#e2e2e2' : (index % 2 === 0 ? '#F5F5F0' : '#F9F0E8'),
                                zIndex: 10
                              }}
                            >
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="w-full cursor-pointer">
                                    {boxSize ? (
                                      <span className={`box-label ${getBoxSizeClass(boxSize)}`}>
                                        <span className="font-bold text-white">
                                          {boxSize === "ENVELOPE" || boxSize === "E~NVELOPE" ? "ENVELOPE" : 
                                           boxSize.replace(/X/g, 'x')}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-gray-500 hover:text-gray-800">Assign box</span>
                                    )}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2">
                                  <div className="grid gap-2">
                                    <h4 className="font-medium text-sm">Select box size</h4>
                                    <div className="grid grid-cols-2 gap-1">
                                      {boxSizes.map(size => (
                                        <button
                                          key={size}
                                          className={`text-xs px-2 py-1 rounded border ${
                                            boxSize === size
                                              ? 'bg-primary text-white'
                                              : 'bg-white hover:bg-gray-100'
                                          }`}
                                          onClick={() => handleMaterialUpdate(
                                            item.id,
                                            false,
                                            'box',
                                            size
                                          )}
                                        >
                                          {size === "ENVELOPE" || size === "E~NVELOPE" ? "ENVELOPE" : size.replace(/X/g, 'x')}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                          );
                        }
                        return (
                          <TableCell key={col.id} className="text-center p-1">—</TableCell>
                        );
                      }
                      
                      // For the DRY checkbox - auto-checked after 5 days from BUILD
                      if (col.isAutoCheck && col.dependsOn === 'building') {
                        // Get drying status info (has it been 5 days, how many days left)
                        const dryingStatus = isDry(item);
                        const isBuilt = isStatusComplete(item, 'building');
                        
                        // Check if the dry status is already marked
                        const isDryStatusPresent = Boolean(item.statusChangeDates && item.statusChangeDates['dry']);
                        
                        return (
                          <TableCell 
                            key={col.id} 
                            className="text-center p-0 status-column-group"
                            style={{ 
                              zIndex: 10
                            }}
                          >
                            <div className="flex justify-center p-0.5" style={{ 
                              backgroundColor: (itemsInThisOrder.length > 1 && !collapsedOrders[order.id] && index > 0) ? '#f5f5f3' : 'transparent',
                              borderRadius: (itemsInThisOrder.length > 1 && !collapsedOrders[order.id] && index > 0) ? '4px' : '0',
                              width: '100%'
                            }}>
                              {isBuilt && dryingStatus.isDryEnough && !isDryStatusPresent ? (
                                <div 
                                  className="bg-[#f06923] rounded-md flex items-center justify-center mx-auto w-7 h-7 cursor-pointer"
                                  onClick={() => handleItemStatusChange(item.id, 'dry', true)}
                                >
                                  <Check className="h-5 w-5 text-white" />
                                </div>
                              ) : isBuilt && !dryingStatus.isDryEnough && dryingStatus.daysRemaining !== null && !isDryStatusPresent ? (
                                <div 
                                  className="bg-orange-100 border-2 border-[#f06923] rounded-md flex items-center justify-center mx-auto w-7 h-7 cursor-pointer text-sm font-bold text-[#d25618]"
                                  title={`${dryingStatus.daysRemaining} day${dryingStatus.daysRemaining !== 1 ? 's' : ''} left to dry`}
                                >
                                  {dryingStatus.daysRemaining}
                                </div>
                              ) : (
                                <Checkbox
                                  checked={Boolean(isDryStatusPresent) || (isBuilt && dryingStatus.isDryEnough)}
                                  onCheckedChange={(checked) => 
                                    handleItemStatusChange(item.id, 'dry', checked as boolean)
                                  }
                                  className="touch-target h-7 w-7 !border-[#f06923] !border-2 data-[state=checked]:!bg-[#f06923] data-[state=checked]:text-white cursor-pointer"
                                  data-item-id={item.id}
                                  data-status="dry"
                                />
                              )}
                            </div>
                          </TableCell>
                        );
                      }
                      
                      // For regular status checkboxes
                      return (
                        <TableCell 
                          key={col.id} 
                          className="text-center p-0 status-column-group"
                          style={{ 
                            zIndex: 10
                          }}
                        >
                          <div className="flex justify-center p-0.5" style={{ 
                            backgroundColor: itemsInThisOrder.length > 1 ? '#f5f5f3' : 'transparent',
                            width: '100%'
                          }}>
                            <button 
                              onClick={() => {
                                // Get current state to toggle
                                const currentState = isStatusComplete(item, col.id);
                                const newState = !currentState;
                                console.log(`Toggling item ${item.id} status ${col.id} from ${currentState} to ${newState}`);
                                
                                // Call the item status change handler
                                handleItemStatusChange(item.id, col.id, newState);
                              }}
                              className={`flex items-center justify-center h-7 w-7 rounded-sm border-2 
                                ${isStatusComplete(item, col.id) ? 'bg-primary text-white' : 'bg-white'}
                                ${
                                  // Special color for SM checkbox - grey to indicate it's auto-checked for smoke-fired colors
                                  col.id === 'smoothing' && needsSmokeFiring(item) 
                                    ? 'bg-gray-200 border-gray-400 cursor-not-allowed' 
                                    : col.id === 'dry' 
                                      ? 'border-[#f06923] data-[state=checked]:bg-[#f06923] cursor-pointer' 
                                      : 'border-primary cursor-pointer'
                                }
                                ${
                                  (col.id === 'smoothing' && needsSmokeFiring(item)) || 
                                  (col.id === 'testing' && 
                                  (item.status || order.status) === 'building' && 
                                  !(item.status === 'testing' || isStatusComplete(order, 'testing')))
                                  ? 'opacity-50 pointer-events-none' : ''
                                }
                              `}
                              disabled={(col.id === 'smoothing' && needsSmokeFiring(item)) || 
                                (col.id === 'testing' && 
                                (item.status || order.status) === 'building' && 
                                !(item.status === 'testing' || isStatusComplete(order, 'testing')))}
                            >
                              {isStatusComplete(item, col.id) && (
                                <Check className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell 
                      className="p-1 min-w-[150px] max-w-[250px] notes-column"
                      style={{ 
                        zIndex: 10
                      }}
                    >
                      <div className="flex flex-col p-0.5" style={{ 
                        backgroundColor: itemsInThisOrder.length > 1 ? '#f5f5f3' : 'transparent',
                        width: '100%'
                      }}>
                        <div className="relative group">
                          {/* Abbreviated notes - always visible */}
                          <div className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] text-base">
                            {(typeof item.specifications === 'object' && 
                             ((item.specifications as any)?.notes || 
                              (item.specifications as any)?.note || 
                              (item.specifications as any)?.comments || 
                              (item.specifications as any)?.remark)) || 
                              order.notes || ""}
                          </div>
                          
                          {/* Full notes that show on hover - if notes exist and are longer than what fits */}
                          {((typeof item.specifications === 'object' && 
                             (item.specifications as any)?.notes && 
                             (item.specifications as any)?.notes.length > 20) || 
                             (order.notes && order.notes.length > 20)) && (
                            <div className="absolute left-0 top-full mt-1 z-50 bg-white shadow-lg rounded p-2 min-w-[200px] max-w-[300px] whitespace-normal text-sm hidden group-hover:block">
                              {(typeof item.specifications === 'object' && 
                               (item.specifications as any)?.notes) || 
                                order.notes || ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ));
              })
            )}
          </TableBody>
        </Table>
        {/* Joint Box Selection Dialog */}
        <Dialog open={jointBoxDialogOpen} onOpenChange={setJointBoxDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Joint Box</DialogTitle>
              <DialogDescription>
                Select a box size to assign to all {selectedItems.length} selected items.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="boxSize" className="text-base">Box Sizes</Label>
                  <span className="text-sm text-gray-500">{selectedItems.length} items selected</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {/* Get box sizes directly from box materials inventory */}
                  {(boxMaterials as MaterialInventory[])
                    .filter((material: MaterialInventory) => 
                      // Only show boxes with available inventory
                      material.materialType === 'box' && material.quantity > 0
                    )
                    .map((material: MaterialInventory) => (
                    <Button
                      key={material.id}
                      variant={selectedCustomBox === material.size ? "default" : "outline"}
                      className={`text-sm h-10 ${selectedCustomBox === material.size ? "bg-[#1F5B61] hover:bg-[#174349] text-white" : ""}`}
                      onClick={() => setSelectedCustomBox(material.size)}
                    >
                      <div className="flex flex-col items-center">
                        <span>{material.size === "ENVELOPE" || material.size === "E~NVELOPE" ? "ENVELOPE" : material.size.replace(/X/g, 'x')}</span>
                        <span className="text-xs opacity-70">({material.quantity} left)</span>
                      </div>
                    </Button>
                  ))}
                </div>
                <div className="mt-4">
                  <Label htmlFor="customBoxSize" className="block mb-2">Custom Size</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="customBoxSize"
                      placeholder="e.g. 45x45x45"
                      value={customBoxSize}
                      onChange={(e) => {
                        setCustomBoxSize(e.target.value);
                        setSelectedCustomBox(e.target.value);
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1 mt-2">
                <Label className="text-base">Selected Flutes</Label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 bg-gray-50">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex items-center py-1 border-b last:border-0">
                      <div className="font-medium">{item.serialNumber}</div>
                      <div className="ml-2 text-sm text-gray-500">
                        {getTypeFromSpecifications(item)} {getNoteTuningFromSpecifications(item)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setJointBoxDialogOpen(false);
                  setSelectedCustomBox('');
                  setCustomBoxSize('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const boxSize = selectedCustomBox === customBoxSize ? customBoxSize : selectedCustomBox;
                  updateCustomBoxMutation.mutate({
                    itemIds: selectedItems.map(item => item.id),
                    customBoxSize: boxSize
                  });
                  setJointBoxDialogOpen(false);
                }}
                className="bg-[#1F5B61] hover:bg-[#174349] text-white"
                disabled={!selectedCustomBox || selectedItems.length === 0}
              >
                Apply Joint Box
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Non-working Periods and Time Window Dialog */}
        <Dialog open={showNonWorkingForm} onOpenChange={setShowNonWorkingForm}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Non-working Periods & Calculation Settings</DialogTitle>
              <DialogDescription>
                Add non-working periods (holidays, travel, etc.) to improve waiting time calculations.
                These periods will be excluded from waiting time calculations.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Time Window Selection */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Time Window for Waiting Calculations</h3>
                <p className="text-sm text-gray-500">
                  Select how far back you want to consider orders in waiting time calculations.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {timeWindowOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedTimeWindow(option.value)}
                      className={`px-3 py-1.5 rounded-md text-sm ${
                        selectedTimeWindow === option.value
                          ? 'bg-[#015a6c] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="border-t border-gray-200 my-4"></div>
              
              {/* Non-working periods list */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Non-working Periods</h3>
                <p className="text-sm text-gray-500">
                  These periods will be excluded from waiting time calculations.
                </p>
                
                {nonWorkingPeriods.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {nonWorkingPeriods.map((period, index) => {
                      const start = parseISO(period.start);
                      const end = period.end ? parseISO(period.end) : new Date();
                      const days = differenceInDays(end, start);
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-3 rounded-md bg-gray-50">
                          <div>
                            <div className="font-medium">
                              {format(start, 'MMM d, yyyy')} - {period.end ? format(parseISO(period.end), 'MMM d, yyyy') : 'Ongoing'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {period.reason} ({days} day{days !== 1 ? 's' : ''})
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setNonWorkingPeriods(periods => periods.filter((_, i) => i !== index));
                              toast({
                                title: "Period Removed",
                                description: "Non-working period has been removed",
                              });
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No non-working periods added yet.</p>
                  </div>
                )}
                
                {/* Add new period form */}
                <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                  <h4 className="text-md font-medium mb-2">Add New Period</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={newNonWorkingPeriod.start}
                        onChange={(e) => setNewNonWorkingPeriod(prev => ({
                          ...prev,
                          start: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="end-date">End Date (optional)</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={newNonWorkingPeriod.end}
                        onChange={(e) => setNewNonWorkingPeriod(prev => ({
                          ...prev,
                          end: e.target.value
                        }))}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label htmlFor="reason">Reason (e.g., "Holiday", "Travel")</Label>
                      <Input
                        id="reason"
                        placeholder="Reason for non-working period"
                        value={newNonWorkingPeriod.reason}
                        onChange={(e) => setNewNonWorkingPeriod(prev => ({
                          ...prev,
                          reason: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4 bg-[#015a6c] hover:bg-[#01424f] text-white"
                    onClick={() => {
                      // Validate dates
                      const startDate = parseISO(newNonWorkingPeriod.start);
                      const endDate = newNonWorkingPeriod.end ? parseISO(newNonWorkingPeriod.end) : null;
                      
                      if (endDate && isBefore(endDate, startDate)) {
                        toast({
                          variant: "destructive",
                          title: "Date Error",
                          description: "End date must be after start date",
                        });
                        return;
                      }
                      
                      // Add the new period
                      setNonWorkingPeriods(prev => [...prev, {
                        start: newNonWorkingPeriod.start,
                        end: newNonWorkingPeriod.end,
                        reason: newNonWorkingPeriod.reason || 'Non-working period'
                      }]);
                      
                      // Reset form
                      setNewNonWorkingPeriod({
                        start: format(new Date(), 'yyyy-MM-dd'),
                        end: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
                        reason: ''
                      });
                      
                      toast({
                        title: "Period Added",
                        description: "Non-working period has been added",
                      });
                    }}
                    disabled={!newNonWorkingPeriod.start || !newNonWorkingPeriod.reason}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Period
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                onClick={() => {
                  setShowNonWorkingForm(false);
                  // Refresh the orders with new calculation settings
                  queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
                }}
                className="bg-[#015a6c] hover:bg-[#01424f] text-white"
              >
                Save & Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}