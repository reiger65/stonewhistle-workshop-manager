// CACHE BUST 2025-01-27-13 - FORCE RELOAD - resellers2.map fix - RESELLERS DISABLED - DRAMATIC CHANGE
// TIMESTAMP: 2025-01-27-20-47
// FORCE RELOAD - NEW TIMESTAMP
import React, { useState, useEffect, useRef, useMemo, FC } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { FrequencyBadge, TuningBadge, CombinedInstrumentTuningBadge } from '../components/badges/tuning-badges';
import { cn } from '@/lib/utils';
import { Users2 } from 'lucide-react';
import { useSearch } from '@/hooks/use-search';
import { enrichOrderItemsWithDatabaseSpecs } from '@/lib/serial-number-utils';
import { SERIAL_NUMBER_DATABASE } from '@shared/serial-number-database';
import { detectInstrumentType, getInstrumentTuning, isTuningSimilar } from '@/lib/tuning-filter-utils';
import { calculateWaitTime, type NonWorkingPeriod } from '@/components/reports/wait-time-stats';
import { useNotStartedItems, useClientNotStartedItems } from '@/hooks/use-not-started-items';
import { NextInstrumentBanner } from '@/components/ui/next-instrument-banner-new';
import { NotStartedItemsCount } from '@/components/ui/not-started-items-count';
import { getColorCodeFromSpecifications, detectColorCodeFromString } from '@/lib/color-utils';


// Global store for notes to prevent auto-refresh interference
const notesStore = new Map<number, string>();

// Notes input component with completely isolated state
const NotesInput = ({ itemId, initialValue, onSave }: { 
  itemId: number; 
  initialValue: string; 
  onSave: (notes: string) => void; 
}) => {
  // Use stored value if available, otherwise use initial value
  const getStoredValue = () => {
    return notesStore.has(itemId) ? notesStore.get(itemId)! : (initialValue || '');
  };

  const [value, setValue] = useState(getStoredValue);
  const [isSaving, setIsSaving] = useState(false);

  // Only update if there's no stored value and initial value changes
  useEffect(() => {
    if (!notesStore.has(itemId) && !isSaving) {
      setValue(initialValue || '');
    }
  }, [itemId, initialValue, isSaving]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    // Store the value immediately to prevent loss
    notesStore.set(itemId, newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving) {
      e.preventDefault();
      setIsSaving(true);
      
      onSave(value);
      
      // Keep the value in store longer to prevent auto-refresh override
      setTimeout(() => {
        setIsSaving(false);
        // Don't clear from store immediately - let it persist
        // The store will be the source of truth until next manual edit
      }, 3000);
    }
  };

  const hasChanges = value !== (initialValue || '');

  return (
    <input
      type="text"
      className={`w-28 text-center bg-transparent border rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
        isSaving ? 'border-green-500' : hasChanges ? 'border-yellow-400' : 'border-gray-300'
      }`}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder="Notes..."
      aria-label="Workshop Notes"
      title={hasChanges ? "Press Enter to save changes" : "Type notes and press Enter to save"}
    />
  );
};

// Define interface for OrderItem
interface OrderItem {
  id: number;
  orderId: number;
  serialNumber?: string;
  status?: string;
  itemName?: string;
  orderNumber?: string;
  archived?: boolean;
  isArchived?: boolean;
  checkboxes?: Record<string, boolean>;
  statusChangeDates?: Record<string, string>;
  itemType?: string;
  tuning?: string;
  specifications?: Record<string, any>;
  shopifyLineItemId?: string;
  isDeleted?: boolean;
}


// Centrale mapping van UI statusnamen naar database veldnamen
// Geplaatst bovenaan het bestand om 'Cannot access uninitialized variable' te voorkomen
/**
 * Deze mapping vertaalt de statusnamen uit de UI naar de daadwerkelijke veldnamen in de database
 * Belangrijk: de mapping staat los van de checkbox labels die de gebruiker ziet
 * 
 * Op UI klikken gebruikers op:
 * - Build of building (database veld 'building')
 * - Dry (database veld 'dry')
 * - TS (database veld 'terrasigillata')
 * - SM (database veld 'smokefiring')
 */
const STATUS_MAPPING: Record<string, string> = {
  'not_started': 'not_started', // Special value for items with no checkboxes
  'ordered': 'ordered',
  'parts': 'parts', 
  'prepared': 'prepared',
  'build': 'building',      // UI toont 'Build' maar database veld is 'building'
  'building': 'building',
  'dry': 'dry',
  'TS': 'terrasigillata',   // UI toont 'TS' maar database veld is 'terrasigillata'
  'ts': 'terrasigillata',   // Ook kleine letters accepteren
  'terrasigillata': 'terrasigillata', 
  'firing': 'firing', 
  'SM': 'smokefiring',      // UI toont 'SM' maar database veld is 'smokefiring'
  'sm': 'smokefiring',      // Ook kleine letters accepteren
  'smokefiring': 'smokefiring',  
  'smoothing': 'smoothing', // Oude naam behouden voor compatibiliteit
  'tuning1': 'tuning1',
  'waxing': 'waxing',
  'tuning2': 'tuning2',
  'bagging': 'bagging',
  'boxing': 'boxing',
  'labeling': 'labeling',
  'testing': 'testing',
  'validated': 'validated'
};

// Helper functie om status UI naam naar database veld te vertalen
const getDbFieldForStatus = (statusName: string): string => {
  if (!statusName) return "";
  
  // Normaliseer statusfilter (lowercase) voor consistente matching
  const normalizedStatus = statusName.toLowerCase();
  
  // Standaard waarde (als mapping niet gevonden wordt)
  let dbField = normalizedStatus;
  
  // Eerst exacte match proberen (case-insensitive)
  if (STATUS_MAPPING[normalizedStatus]) {
    return STATUS_MAPPING[normalizedStatus];
  }
  
  // Als geen exacte match, zoek case-insensitive in de keys
  Object.entries(STATUS_MAPPING).forEach(([uiName, dbName]) => {
    if (uiName.toLowerCase() === normalizedStatus) {
      dbField = dbName;
    }
  });
  
  return dbField;
};

// Veilige hulpfunctie om de serienummer database te raadplegen
// Volledig opnieuw geïmplementeerd om 'Cannot access uninitialized variable' fout te voorkomen
const safeGetFromSerialNumberDatabase = (serialNumber: string | null | undefined) => {
  // In een try-catch block om te voorkomen dat er onverwachte fouten optreden
  try {
    // Basiscontroles op de input parameter
    if (!serialNumber) {
      console.log('SERIAL_NUMBER_DB: Geen serienummer opgegeven');
      return null;
    }
    
    // BELANGRIJKE VERBETERING: Normaliseer het serienummer door "SW-" prefix te verwijderen
    // Dit zorgt ervoor dat we consistent kunnen zoeken in de database
    const normalizedSerialNumber = serialNumber.replace(/^SW-/, '');
    console.log(`SERIAL_NUMBER_DB: Zoeken naar genormaliseerd serienummer: ${normalizedSerialNumber} (origineel: ${serialNumber})`);
    
    // Expliciete controle of SERIAL_NUMBER_DATABASE correct gedefinieerd is
    // We gebruiken geen window object meer, want dat veroorzaakt TypeScript fouten
    // en het is ook niet nodig om de database via het window object te benaderen
    
    // Als er geen globale definitie is, controleren we de geïmporteerde definitie
    if (typeof SERIAL_NUMBER_DATABASE === 'undefined') {
      console.warn('SERIAL_NUMBER_DATABASE is niet gedefinieerd');
      return null;
    }
    
    // Extra veiligheid met expliciete type checking
    if (!SERIAL_NUMBER_DATABASE || typeof SERIAL_NUMBER_DATABASE !== 'object') {
      console.warn('SERIAL_NUMBER_DATABASE is geen geldig object');
      return null;
    }
    
    if (SERIAL_NUMBER_DATABASE === null) {
      console.warn('SERIAL_NUMBER_DATABASE is null');
      return null;
    }
    
    if (typeof SERIAL_NUMBER_DATABASE !== 'object') {
      console.warn('SERIAL_NUMBER_DATABASE is geen object:', typeof SERIAL_NUMBER_DATABASE);
      return null;
    }
    
    // Defensieve check: controleer of de property bestaat, zonder via [] acces te gebruiken
    // BELANGRIJK: Gebruik de genormaliseerde versie van het serienummer
    if (!Object.prototype.hasOwnProperty.call(SERIAL_NUMBER_DATABASE, normalizedSerialNumber)) {
      // Serienummer niet gevonden - geen error, dit is normaal gedrag
      console.log(`SERIAL_NUMBER_DB: Serienummer ${normalizedSerialNumber} niet gevonden in database`);
      return null;
    }
    
    // Veilige retrieval met extra validatie
    // BELANGRIJK: Gebruik de genormaliseerde versie van het serienummer
    const spec = SERIAL_NUMBER_DATABASE[normalizedSerialNumber];
    console.log(`SERIAL_NUMBER_DB: Serienummer ${normalizedSerialNumber} gevonden in database:`, spec);
    
    // Extra controle dat spec geldig is
    if (spec === null || typeof spec !== 'object') {
      console.warn(`Ongeldige spec voor serienummer ${normalizedSerialNumber}:`, spec);
      return null;
    }
    
    // Alleen als alles in orde is, geef de specificatie terug
    return spec;
    
    // Dit gedeelte van de code is niet meer nodig en kan problemen veroorzaken
    
    return null;
  } catch (err) {
    console.error(`Veilige serienummer database raadpleging fout voor ${serialNumber}:`, err);
    return null;
  }
};

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
import { Search, RefreshCw, Phone, Mail, User, Package, PackageOpen, ExternalLink, ArchiveX, RotateCcw, Copy, ChevronDown, ChevronUp, ChevronsUpDown, Check, Calendar, Trash, Plus, Pin, Focus, Filter, X as XIcon, FileText, Clock, MapPin, MessageSquare, ClipboardEdit, Printer, CheckSquare, BarChart, ClipboardList, TimerIcon, Music, ListTodo, Palette, Wind, ArrowUpDown, SquarePen, PenTool, Construction } from 'lucide-react';
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
import { MoldNamePopover } from '@/components/molds/mold-name-popover';
import { MoldInfoDialog } from '@/components/molds/mold-info-dialog';

// Component to calculate and display the average wait time
import { calculateAverageWaitTime } from '@/lib/utils';

interface WaitTimeDisplayProps {
  allOrders: Order[];
}

const WaitTimeDisplay: FC<WaitTimeDisplayProps> = ({ allOrders }) => {
  // Haal de opgeslagen niet-werkperiodes op uit localStorage
  const [nonWorkingPeriods, setNonWorkingPeriods] = useState<NonWorkingPeriod[]>(() => {
    const savedPeriods = localStorage.getItem('nonWorkingPeriods');
    return savedPeriods ? JSON.parse(savedPeriods) : [];
  });
  
  // Only calculate wait time if we have valid orders data
  const waitTimeResult = useMemo(() => {
    // Check if orders are loaded and it's a valid array
    if (!allOrders || !Array.isArray(allOrders) || allOrders.length === 0) {
      console.log('Wait time calculation: No valid orders data available yet');
      return { finalWaitDays: '...' }; // Return placeholder when data is not ready
    }
    
    console.log(`Wait time calculation: Processing ${allOrders.length} orders`);
    return calculateWaitTime(allOrders, nonWorkingPeriods);
  }, [allOrders, nonWorkingPeriods]);
  
  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      {typeof waitTimeResult.finalWaitDays === 'number' 
        ? `${waitTimeResult.finalWaitDays}d` 
        : waitTimeResult.finalWaitDays}
    </span>
  );
};

// Customer Notes Input Component
interface CustomerNotesInputProps {
  orderId: number;
  initialNotes: string;
  onSave: (notes: string) => void;
}

const CustomerNotesInput = ({ orderId, initialNotes, onSave }: CustomerNotesInputProps) => {
  const [notes, setNotes] = React.useState(initialNotes);

  React.useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const handleBlur = () => {
    if (notes !== initialNotes) {
      onSave(notes);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <input
      type="text"
      className="w-full text-left bg-transparent border border-gray-300 rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      value={notes}
      onChange={(e) => setNotes(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="Notes..."
      aria-label="Customer Notes"
    />
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
    minWidth: '80px', // Default minWidth
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
  // Force update mechanism for material updates
  const [materialUpdateCount, setMaterialUpdateCount] = useState<number>(0);
  const forceRefreshMaterials = () => {
    console.log("Force refreshing materials UI");
    
    // First, update our counter to trigger React re-renders
    setMaterialUpdateCount(prev => prev + 1);
    
    // Force refresh all queries to ensure everything is up-to-date
    setTimeout(() => {
      // Invalidate and refetch queries to get fresh data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/order-items'] });
      
      // After a small delay, also refetch the queries (double-safety)
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/orders'] });
        queryClient.refetchQueries({ queryKey: ['/api/order-items'] });
        
        // Increment counter again to ensure components re-render with new data
        setMaterialUpdateCount(prev => prev + 2);
        console.log("🔄 Material data refreshed completely");
      }, 100);
    }, 50);
  };
  // We gebruiken nu useSearch hook in plaats van lokale state voor zoeken
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showAllOrders, setShowAllOrders] = useState(true); // Changed to true to show all orders including archived ones
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [workshopNotes, setWorkshopNotes] = useState('');
  const [archiveOrder, setArchiveOrder] = useState(false);
  const [isReseller, setIsReseller] = useState(false);
  const [resellerNickname, setResellerNickname] = useState('');
  const [minOrderNumber, setMinOrderNumber] = useState('0'); // Start from the earliest order
  const [maxOrderNumber, setMaxOrderNumber] = useState('2000'); // Verhoogd naar 2000 om nieuwe orders te tonen
  const [showOrderRangeSettings, setShowOrderRangeSettings] = useState(false);
  // Always show all items in flat rows - no collapsing needed
  // In flat row system, we always keep orders expanded (never collapsed)
  const [collapsedOrders, setCollapsedOrders] = useState<Record<number, boolean>>({}); // Empty object means no orders are collapsed
  // Isolation feature is verwijderd
  // Item selection state - for highlighting individual items being worked on
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(() => {
    const savedSelection = localStorage.getItem('selectedItemIds');
    // Converteer opgeslagen array naar een Set voor efficiënte lookup
    return new Set(savedSelection ? JSON.parse(savedSelection) : []);
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
  
  // Isolation feature is verwijderd
  
  // Item selection feature - for marking items being worked on
  // Helper variable to check if any items are selected
  const hasSelectedItems = selectedItemIds.size > 0;
  
  // Helper functie om te controleren of een item geselecteerd is
  const isItemSelected = (itemId: number): boolean => {
    return selectedItemIds.has(itemId);
  };
  
  // Isolatie localStorage is verwijderd
  
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
  
  // Show only selected orders filter
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  
  // New filter to show only items without any checked boxes (not started items)
  const [showOnlyNotStarted, setShowOnlyNotStarted] = useState(false);
  
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
  
  // Function to clear all filters and search
  const clearAllFilters = () => {
    // Wis alle filterinstellingen
    setTypeFilterSafe(null); // Use our safe setter
    setTuningFilter(null);
    setColorFilters([]);
    setResellerFilter(null);
    setStatusFilter(null);
    setFrequencyFilter(null);
    
    // Wis ook de zoekbalk
    setSearchFilter("");
    
    console.log("🧹 All filters and search cleared");
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
  
  // Deze code verwijderd omdat alle orders via Shopify komen
  
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
  const [nonWorkingPeriods, setNonWorkingPeriods] = useState<NonWorkingPeriod[]>(() => {
    const savedPeriods = localStorage.getItem('nonWorkingPeriods');
    return savedPeriods ? JSON.parse(savedPeriods) : [];
  });
  
  // State for adding new non-working periods
  const [showNonWorkingForm, setShowNonWorkingForm] = useState(false);
  const [newNonWorkingPeriod, setNewNonWorkingPeriod] = useState<NonWorkingPeriod>({
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
  
  // Sort orders using the global sort settings with urgent orders first
  const allOrders = useMemo(() => {
    return [...fetchedOrders].sort((a, b) => {
      // First sort by urgent status - urgent orders always come first
      const aUrgent = a.isUrgent || false;
      const bUrgent = b.isUrgent || false;
      
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      
      // If both are urgent or both are normal, use the existing sort logic
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
  const { data: allOrderItems = [], isLoading: isLoadingOrderItems } = useQuery<OrderItem[]>({
    queryKey: ['/api/order-items'], // Verwijderd timestamp om oneindige lus te voorkomen
    refetchOnWindowFocus: true, // Refetch bij window focus
    refetchOnMount: true, // Refetchen bij mounting
    refetchInterval: 60000, // 60 seconds
    retry: 3, // Retry failed requests up to 3 times
    select: (data) => {
      // Verrijk elk order item met de correcte specificaties uit SERIAL_NUMBER_DATABASE
      console.log(`Verrijken van ${data.length} items met serienummer database specificaties`);
      return enrichOrderItemsWithDatabaseSpecs(data);
    }
  });
  
  // Log additional debug information when items are loaded
  useEffect(() => {
    if (allOrderItems && allOrderItems.length > 0) {
      console.log(`Succesvol ${allOrderItems.length} order items geladen!`);
      
      // Debug log voor de problematische Billy-orders (ID 32 en 33)
      // KRITISCHE FIX: De filter functie vergelijkt mogelijk object referenties in plaats van waarden
      // We zorgen voor expliciete numerieke vergelijking om te voorkomen dat string/number vergelijkingen falen
      const orderItems32 = allOrderItems.filter(item => Number(item.orderId) === 32);
      const orderItems33 = allOrderItems.filter(item => Number(item.orderId) === 33);
      console.log('DEBUG - Order 1560 (ID:32) items:', orderItems32.map(i => i.serialNumber));
      console.log('DEBUG - Order 1559 (ID:33) items:', orderItems33.map(i => i.serialNumber));
      
      // EXTRA DEBUGGING: Inspecteer alle orderId typen voor Billy orders
      console.log('BILLY ORDER TYPES CHECK:');
      allOrderItems.filter(item => {
        const id = Number(item.orderId);
        return id === 32 || id === 33;
      }).forEach(item => {
        console.log(`Item ${item.serialNumber} heeft orderId: ${item.orderId} (type: ${typeof item.orderId})`);
      });
    }
  }, [allOrderItems]);
  
  // Nieuwe definitie van unfulfilled orders voor de badge, gebaseerd op Shopify's definitie:
  // Alle orders die niet 'shipping', 'delivered' of 'cancelled' zijn
  // WIJZIGING: We filteren orders op basis van Shopify fulfilled status
  // Deze filter moet ook orders met archived status behouden als ze nog steeds unfulfilled zijn in Shopify
  const shopifyUnfulfilledOrders = (allOrders || []).filter(order => 
    order.status !== 'shipping' && 
    order.status !== 'delivered' && 
    order.status !== 'cancelled' &&
    order.status !== 'archived' &&
    !order.archived  // We voegen dit alsnog toe om problemen te voorkomen
  );
  
  // Voor de interne werklijst gebruiken we nog steeds de gefilterde versie op archived
  // BELANGRIJKE WIJZIGING: We moeten ook op status='archived' filteren
  // omdat er 292 orders zijn met status='archived' maar archived=false
  const unfulfilledOrders = (allOrders || []).filter(order => 
    order.status !== 'shipping' && 
    order.status !== 'delivered' && 
    order.status !== 'cancelled' &&
    order.status !== 'archived' &&
    !order.archived
  );
  
  // Laten we de correcte statistieken berekenen
  // BELANGRIJKE WIJZIGING: We moeten ook op status='archived' filteren
  // omdat er 292 orders zijn met status='archived' maar archived=false
  const activeOrders = (allOrders || []).filter(order => 
    !order.archived && 
    order.status !== 'shipping' && 
    order.status !== 'delivered' && 
    order.status !== 'cancelled' &&
    order.status !== 'archived'
  );
  
  // Definitie van completed orders volgt Shopify's definitie:
  // Een order is completed (fulfilled) als het shipping, delivered, of cancelled is
  // DIT ZIJN DE ORDERS DIE NIET IN DE SHOPIFY UNFULFILLED LIJST STAAN
  const completedOrders = (allOrders || []).filter(order => 
    order.status === 'shipping' || 
    order.status === 'delivered' || 
    order.status === 'cancelled'
  );

  // Debug logs voor archiefstatus
  console.log(`[ORDER STATS] Totaal aantal orders: ${(allOrders || []).length}`);
  console.log(`[ORDER STATS] Aantal werkelijk actieve orders: ${activeOrders.length}`);
  console.log(`[ORDER STATS] Aantal voltooide/gearchiveerde orders: ${completedOrders.length}`);
  console.log(`[ORDER STATS] Aantal gemarkeerd als archived veld: ${(allOrders || []).filter(order => order.archived).length}`);
  console.log(`[ORDER STATS] Aantal met status 'archived': ${(allOrders || []).filter(order => order.status === 'archived').length}`);
  console.log(`[ORDER STATS] Aantal met status archived EN boolean=true: ${(allOrders || []).filter(order => order.status === 'archived' && order.archived).length}`);
  console.log(`[ORDER STATS] Aantal met status archived MAAR boolean=false: ${(allOrders || []).filter(order => order.status === 'archived' && !order.archived).length}`);
  console.log(`[ORDER STATS] Aantal met boolean=true MAAR status NIET archived: ${(allOrders || []).filter(order => order.archived && order.status !== 'archived').length}`);
  
  // Extra debug informatie om te begrijpen waarom we 14 orders zien terwijl Shopify 55 unfulfilled orders heeft
  const allOrderNumbers = (allOrders || []).map(o => o.orderNumber);
  console.log(`[DEBUG SHOPIFY] Totaal aantal orders in allOrders: ${allOrderNumbers.length}`);
  console.log(`[DEBUG SHOPIFY] Aantal orders met status != 'archived' EN !archived: ${(allOrders || []).filter(order => order.status !== 'archived' && !order.archived).length}`);
  console.log(`[DEBUG SHOPIFY] Aantal orders die alleen gefilterd worden op shipping/delivered/cancelled: ${(allOrders || []).filter(order => 
    order.status !== 'shipping' && 
    order.status !== 'delivered' && 
    order.status !== 'cancelled').length}`);
  console.log(`[ORDER STATS] Aantal orders met status 'shipping': ${(allOrders || []).filter(order => order.status === 'shipping').length}`);
  console.log(`[ORDER STATS] Aantal orders met status 'delivered': ${(allOrders || []).filter(order => order.status === 'delivered').length}`);
  console.log(`[ORDER STATS] Aantal orders met status 'cancelled': ${(allOrders || []).filter(order => order.status === 'cancelled').length}`);
  
  // Debug logs voor item archief status
  console.log(`[ITEM STATS] Totaal aantal items: ${(allOrderItems as OrderItem[]).length}`);
  console.log(`[ITEM STATS] Aantal niet-gearchiveerde items: ${(allOrderItems as OrderItem[]).filter((item: OrderItem) => !item.isArchived).length}`);
  console.log(`[ITEM STATS] Aantal gearchiveerde items: ${(allOrderItems as OrderItem[]).filter((item: OrderItem) => item.isArchived).length}`);
  
  // Check of de data volledig geladen is
  // We gebruiken isLoadingOrders en isLoadingOrderItems om te bepalen of alles is geladen
  const isBuildlistLoaded = !isLoadingOrders && !isLoadingOrderItems;
  
  // Voor debugging en verificatie: bereken ook het werkelijke aantal items volgens algoritme
  if (isBuildlistLoaded) {
    const calculateActualItems = (allOrderItems as OrderItem[]).filter((item: OrderItem) => {
      // Gearchiveerde items overslaan
      if (item.isArchived) return false;
      
      // Controleer of het item hoort bij een order die in de Shopify unfulfilled lijst staat
      const shopifyOrderIds = shopifyUnfulfilledOrders.map(order => order.id);
      return shopifyOrderIds.includes(item.orderId);
    }).length;
    
    console.log(`[DEBUG COUNTS] Werkelijk aantal items volgens algoritme: ${calculateActualItems}`);
  }
  
  // OPMERKING: We gebruiken voorlopig een vaste waarde voor de gemiddelde wachttijd
  // omdat de berekening niet betrouwbaar is. In de toekomst kunnen we dit verbeteren.
  const calculateAverageWaitTime = useMemo(() => {
    // Vaste waarde voor gemiddelde wachttijd, gebaseerd op historische gegevens
    return 60;
  }, []);
  
  // Log all order numbers of unfulfilled orders
  console.log('Unfulfilled orders:', unfulfilledOrders.map(o => o.orderNumber).join(', '));
  
  // Log all Shopify unfulfilled orders
  console.log(`[DEBUG SHOPIFY] Aantal unfulfilled orders volgens Shopify: ${shopifyUnfulfilledOrders.length}`);
  console.log(`[DEBUG SHOPIFY] Shopify unfulfilled orders: ${shopifyUnfulfilledOrders.map(o => o.orderNumber).join(', ')}`);
  
  // Fetch material settings
  interface SettingsData {
    materialSettings: Record<string, any>;
    [key: string]: any;
  }
  
  const { data: settingsData = { materialSettings: {} } } = useQuery<SettingsData>({
    queryKey: ['/api/settings'],
  });
  
  // Fetch box materials for inventory
  const { data: boxMaterials = [] } = useQuery<MaterialInventory[]>({
    queryKey: ['/api/materials/type/box'],
  });
  
  // State for filter options
  const [filterOptions, setFilterOptions] = useState(emptyFilterOptions);
  
  // TEMPORARILY DISABLED - Fetch only active resellers
  const resellers: Reseller[] = [];
  const FORCE_RELOAD_2025_01_27 = true;
  
  // FORCE RELOAD - Debug resellers - TIMESTAMP: 2025-01-27-20-37
  console.log('RESELLERS DEBUG:', resellers, typeof resellers, Array.isArray(resellers));
  
  // Update filter options when items are loaded
  useEffect(() => {
    if (allOrderItems && (allOrderItems as OrderItem[]).length > 0) {
      const types = new Set<string>();
      const tunings = new Set<string>();
      // BELANGRIJKE FIX: Altijd A3 toevoegen als veilige optie voor de tuning filter
      // Dit voorkomt de "Cannot access uninitialized variable" fout bij het selecteren van A3
      tunings.add('A3');
      const colors = new Set<string>();
      const frequencies = new Set<string>();
      
      console.log("Rebuilding filter options from", (allOrderItems as OrderItem[]).length, "items");
      
      // First gather all possible instrument types from items
      (allOrderItems as OrderItem[]).forEach((item: OrderItem) => {
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
          // KRITISCHE FIX: Forceer expliciete type conversie naar number voor consistentie
          if (Number(order.id) === Number(orderId)) {
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

  // Update item workshop notes mutation - simplified without optimistic updates
  const updateItemNotesMutation = useMutation({
    mutationFn: async ({itemId, workshopNotes}: {itemId: number, workshopNotes: string}) => {
      const res = await apiRequest(
        'PATCH',
        `/api/order-items/${itemId}`,
        { workshopNotes }
      );
      return res.json();
    },
    onSuccess: () => {
      // Only refetch after successful save
      queryClient.invalidateQueries({ queryKey: ['/api/order-items'] });
      toast({
        title: "Notes saved",
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
    
    // STAP 0: Pas de database normalisatie toe OP ALLE ITEMS voordat we iets anders doen
    // Dit zorgt ervoor dat de database consequent als bron van waarheid wordt gebruikt
    // Het is essentieel dat dit de eerste stap is in het hele proces
    const enrichedItems = enrichOrderItemsWithDatabaseSpecs(allOrderItems as OrderItem[]);
    console.log(`🔍 SERIENUMMER VERRIJKING: ${enrichedItems.length} items verrijkt met database gegevens`);
    
    // DEFINITIEVE STRUCTURELE FIX: Alles genormaliseerd verwerken + deduplicatie
    return enrichedItems.reduce((acc, item) => {
      // STAP 1: Werk altijd met een kopie van het item om originele data niet te wijzigen
      const normalizedItem = { ...item };
      
      // STAP 2: Forceer orderId naar een nummer, ongeacht het originele type
      // Dit is de kern van de Billy-fix - vermijd mixende types tussen string en nummer
      const orderId = typeof normalizedItem.orderId === 'string' 
        ? parseInt(normalizedItem.orderId) 
        : normalizedItem.orderId;
      
      // STAP 3: Normaliseer alle orderId verwijzingen (zowel in item als in accumulator)
      normalizedItem.orderId = orderId;
      
      // STAP 4: Debug logging voor Billy-orders
      if (orderId === 32 || orderId === 33) {
        console.log(`[VOLLEDIGE BILLY FIX] Item ${normalizedItem.serialNumber} (oorspronkelijk orderId type: ${typeof item.orderId}) nu genormaliseerd met orderId: ${orderId}`);
      }
      
      // STAP 5: Gebruik het genormaliseerde orderId als sleutel
      if (!acc[orderId]) {
        acc[orderId] = [];
      }
      
      // STAP 6: EXTRA DEDUPLICATIE - Controleer of dit item al bestaat in de groep (ALLEEN op basis van id)
      // BELANGRIJK: We controleren NIET meer op serienummer omdat identieke items (bijv. 2-3 zelfde Innato fluiten)
      // verschillende database IDs hebben maar hetzelfde serienummer kunnen delen
      const itemAlreadyExists = acc[orderId].some(existingItem => {
        // Controleer ALLEEN op id (meest betrouwbaar)
        if (existingItem.id === normalizedItem.id) {
          console.log(`[DEDUPLICATIE] Item met id ${existingItem.id} bestaat al voor order ${orderId}`);
          return true;
        }
        
        return false;
      });
      
      // STAP 7: Alleen toevoegen als het item nog niet bestaat
      if (!itemAlreadyExists) {
        acc[orderId].push(normalizedItem);
      } else if (orderId === 32 || orderId === 33) {
        console.log(`[BILLY DEDUPLICATIE] Dubbel item ${normalizedItem.serialNumber || normalizedItem.id} VERWIJDERD voor Billy order ${orderId}`);
      }
      
      return acc;
    }, {} as Record<number, OrderItem[]>);
  }, [allOrderItems]);
  
  // NIEUWE FILTER AANPAK: per order controleren of er tenminste 1 item aan de filtercriteria voldoet
  // Step 1: Filter order items based on type, color, and other criteria
  const filteredOrderItems = useMemo(() => {
    // Als er geen items zijn, retourneer een lege array in plaats van demo-items te maken
    if (!allOrderItems || allOrderItems.length === 0) {
      return [];
    }
    
    // Debug log voor "Toon selectie" functionaliteit
    console.log(`FILTER MEMO: Rebuilding filteredOrderItems, showOnlySelected=${showOnlySelected}, selectedItemIds has ${selectedItemIds.size} items`);
    
    // BELANGRIJKE VERBETERING: We gebruiken nu de reeds geduplicate-vrije itemsByOrder als basis
    // Dit voorkomt dat er dubbele rijen in de UI verschijnen, vooral bij Billy-orders
    
    // Haal alle items uit de itemsByOrder groep
    const allDeDuplicatedItems: OrderItem[] = Object.values(itemsByOrder).flat();
    
    // Special handling for A3 tuning filter to ensure all items with A3 tuning are properly detected
    if (tuningFilter === 'A3') {
      console.log("🚨 EMERGENCY A3 FILTER ACTIVATED - USING DEDICATED FILTER FUNCTION");
      
      return allDeDuplicatedItems.filter(item => {
        // First, handle all the basic filters (deleted, archived)
        if (item.isArchived || item.isDeleted) {
          return false;
        }
        
        // No special A3 filter logic needed anymore - this is now handled directly in Shopify
        // Simply continue with standard tuning filter logic
        
        // For all other orders, check if it's a real A3 tuning
        const dbSpecs = item.serialNumber ? safeGetFromSerialNumberDatabase(item.serialNumber) : null;
        if (dbSpecs && dbSpecs.tuning) {
          return dbSpecs.tuning === 'A3';
        }
        
        // Fall back to specifications
        const itemTuning = getNoteTuningFromSpecifications(item);
        return itemTuning === 'A3';
      });
    }
    
    // Normal filtering for all other cases
    return allDeDuplicatedItems.filter(item => {
      // BELANGRIJK: Implementatie van "Toon selectie" functionaliteit
      // Als showOnlySelected actief is en dit item niet in selectedItemIds voorkomt, sla over
      if (showOnlySelected && !selectedItemIds.has(item.id)) {
        return false; // Item niet geselecteerd, toon niet als we alleen selectie tonen
      }
      
      // BELANGRIJK: Filter gearchiveerde items
      if (item.isArchived) {
        return false; // Skip items die gearchiveerd zijn
      }
      
      // BELANGRIJK: Filter items die verwijderd zijn uit Shopify (fulfillable_quantity = 0)
      if (item.specifications && typeof item.specifications === 'object') {
        const specs = item.specifications as Record<string, any>;
        if (specs.fulfillable_quantity === "0" || specs.fulfillable_quantity === 0) {
          return false; // Skip items die verwijderd zijn uit Shopify
        }
      }
      
      // We weten dat alle items in itemsByOrder al correct genormaliseerd zijn qua types
      const itemOrderId = item.orderId; // Dit is al een nummer door itemsByOrder
      
      // Get the order this item belongs to
      const parentOrder = allOrders.find(o => o.id === itemOrderId);
      
      // Debug log voor de Billy orders alleen bij speciale gevallen
      if ((itemOrderId === 32 || itemOrderId === 33) && !parentOrder) {
        console.log(`[WAARSCHUWING] Item ${item.serialNumber} heeft orderId ${itemOrderId} maar geen bijbehorende order!`);
      }
      
      if (!parentOrder) return false; // Skip orphaned items
      
      // Check if the parent order is valid (not archived, in range, etc.)
      const orderNum = parseInt(parentOrder.orderNumber?.replace(/\D/g, '') || '0');
      const minOrder = parseInt(minOrderNumber || '0');
      const maxOrder = maxOrderNumber ? parseInt(maxOrderNumber) : Number.MAX_SAFE_INTEGER;
      
      // Basic order validation - now showing all orders
      const inRange = orderNum >= minOrder && orderNum <= maxOrder;
      
      // Show all orders regardless of status (don't filter out archived)
      const notArchived = true; // Always true to show all orders
      
      // Still filter out completed orders
      const notCompleted = parentOrder.status !== 'cancelled' && 
                         parentOrder.status !== 'shipping' && 
                         parentOrder.status !== 'delivered';
      
      // BELANGRIJK: We tonen nu alle orders (inclusief gearchiveerde)
      
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
      
      // Type filter - VERBETERD met prioriteit voor serienummer database
      if (typeFilter !== null) {
        // Check first voor serienummerdatabase
        let itemType = undefined;
        
        // Als we een serienummer hebben, kijk eerst in de database
        if (item.serialNumber) {
          const dbSpecs = safeGetFromSerialNumberDatabase(item.serialNumber);
          if (dbSpecs) {
            itemType = dbSpecs.type; // Gebruik het type uit de database
            
            // Log voor debugging
            console.log(`FILTER: Serienummer ${item.serialNumber} heeft definitief type ${itemType} volgens database`);
            
            // Direct vergelijken met typeFilter (case-insensitive)
            const matches = itemType.toUpperCase() === String(typeFilter).toUpperCase();
            
            // Als het niet matched, dan hoeven we verder niks te checken
            if (!matches) {
              return false;
            } else {
              // Directe match gevonden in database - accepteer dit item (skip andere filters)
              return true;
            }
          }
        }
        
        // Als geen match in database, val terug op oude methode
        itemType = getTypeFromSpecifications(item);
        
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
      
      // Color filter - met extra veiligheid
      if (colorFilters && colorFilters.length > 0) {
        try {
          let itemColor = undefined;
          
          // Eerst controleren via database als het een bekend serienummer is
          if (item && 'serialNumber' in item && item.serialNumber) {
            const serialNumber = item.serialNumber;
            
            try {
              // Gebruik de veilige helper functie
              const dbSpecs = safeGetFromSerialNumberDatabase(serialNumber);
              if (dbSpecs && 'color' in dbSpecs) {
                itemColor = dbSpecs.color;
              }
            } catch (dbError) {
              console.error(`Error bij raadplegen van database voor kleur van ${serialNumber}:`, dbError);
            }
          }
          
          // Als kleur niet gevonden in database, gebruik normale methode
          if (!itemColor) {
            try {
              itemColor = getColorFromSpecifications(item);
            } catch (colorError) {
              console.error("Error bij bepalen van kleur:", colorError);
            }
          }
          
          // Filter toepassen
          if (!itemColor || !colorFilters.includes(itemColor)) {
            return false;
          }
        } catch (error) {
          console.error("Error bij kleur filter:", error);
          // Bij een fout, toon het item wel (safety first)
          return true;
        }
      }
      
      // Tuning filter - VERSIMPELDE VERSIE met prioriteit voor serienummerdatabase
      if (tuningFilter !== null) {
        try {
          // Check eerst of we deze kunnen vinden in de serienummerdatabase
          // Dit is de BRON VAN WAARHEID voor serienummers
          if (item.serialNumber) {
            const dbSpecs = safeGetFromSerialNumberDatabase(item.serialNumber);
            if (dbSpecs) {
              // Gebruik de tuning uit de database
              const dbTuning = dbSpecs.tuning;
              
              // Log voor debugging
              console.log(`TUNING FILTER: Serienummer ${item.serialNumber} heeft definitieve tuning ${dbTuning} volgens database`);
              
              // No special A3 filter logic needed anymore - now handled in Shopify
              if (tuningFilter === 'A3' && dbTuning === 'A3') {
                console.log(`📌 A3 TUNING MATCH: Item ${item.serialNumber} matches A3 tuning filter`);
                return true;
              }

              // Direct vergelijken met het filter (exact match)
              const exactMatch = dbTuning === tuningFilter;
              
              // Als er een directe match is, accepteer dit item
              if (exactMatch) {
                console.log(`- MATCH: ${dbTuning} is exact gelijk aan ${tuningFilter}`);
                return true;
              }
              
              // Als geen exacte match, probeer case-insensitive vergelijking
              if (dbTuning.toLowerCase() === tuningFilter.toLowerCase()) {
                console.log(`- MATCH: ${dbTuning} is gelijk aan ${tuningFilter} (case-insensitive)`);
                return true;
              }
              
              // Speciale case voor ZEN flutes met L/M size in tuning veld
              if ((tuningFilter === 'L' || tuningFilter === 'M') && 
                  dbSpecs.type === 'ZEN' && 
                  dbTuning.includes(tuningFilter)) {
                console.log(`- MATCH voor ZEN flute size: ${dbTuning} bevat ${tuningFilter}`);
                return true;
              }
              
              // Als we hier zijn, is er geen match gevonden in de database
              console.log(`- GEEN MATCH: ${dbTuning} komt niet overeen met ${tuningFilter}`);
              return false;
            }
          }
          
          // Als we hier zijn, hebben we geen match gevonden in de database
          // Val terug op de normale methode
          const itemTuning = getNoteTuningFromSpecifications(item);
          
          // Als er geen tuning is gevonden, kan het niet matchen
          if (!itemTuning) {
            return false;
          }
          
          // Direct match
          if (itemTuning === tuningFilter) {
            return true;
          }
          
          // Case-insensitive match
          if (itemTuning.toLowerCase() === tuningFilter.toLowerCase()) {
            return true;
          }
          
          // Speciale case voor ZEN flutes
          if ((tuningFilter === 'L' || tuningFilter === 'M') && 
              ('itemType' in item && item.itemType?.includes('ZEN'))) {
            if (itemTuning.includes(tuningFilter)) {
              return true;
            }
          }
          
          // Als we hier zijn, is er geen match gevonden
          return false;
          
        } catch (error) {
          console.error("Error bij tuning filter:", error);
          // Bij een fout, toon het item wel (safety first)
          return true;
        }
      }
      
      // Frequency filter - ook met veiligheid verbeteren
      if (frequencyFilter !== null) {
        try {
          let itemFrequency = undefined;
          
          // Eerst controleren via database als het een bekend serienummer is
          if (item && 'serialNumber' in item && item.serialNumber) {
            const serialNumber = item.serialNumber;
            
            try {
              // Gebruik de veilige helper functie
              const dbSpecs = safeGetFromSerialNumberDatabase(serialNumber);
              if (dbSpecs && 'frequency' in dbSpecs) {
                itemFrequency = dbSpecs.frequency;
              }
            } catch (dbError) {
              console.error(`Error bij raadplegen van database voor frequentie van ${serialNumber}:`, dbError);
            }
          }
          
          // Als frequentie niet gevonden in database, gebruik normale methode
          if (!itemFrequency) {
            try {
              itemFrequency = getTuningFrequencyFromSpecifications(item);
            } catch (freqError) {
              console.error("Error bij bepalen van frequency:", freqError);
            }
          }
          
          // Filter toepassen
          if (!itemFrequency || itemFrequency !== frequencyFilter) {
            return false;
          }
        } catch (error) {
          console.error("Error bij frequency filter:", error);
          // Bij een fout, toon het item wel (safety first)
          return true; 
        }
      }
      
      // Reseller filter - GEOPTIMALISEERD om een nauwkeurigere filtering uit te voeren
      if (resellerFilter !== null && parentOrder) {
        if (typeof resellerFilter === 'boolean') {
          // Boolean filter: true = any reseller, false = direct orders
          // Dit toont alle reseller orders (true) of alle directe orders (false)
          if (resellerFilter && !parentOrder.isReseller) {
            return false; // Toon deze order niet als we alleen reseller orders willen zien en dit geen reseller order is
          } else if (!resellerFilter && parentOrder.isReseller) {
            return false; // Toon deze order niet als we alleen directe orders willen zien en dit een reseller order is
          }
        } else if (typeof resellerFilter === 'number') {
          // Number filter: specific reseller ID
          // Dit toont alleen orders van een specifieke reseller
          const selectedReseller = (resellers || []).find(r => r.id === resellerFilter);
          // We controleren nu strict op de reseller ID om zeker te zijn dat we alleen orders van deze reseller tonen
          if (!selectedReseller || !parentOrder.isReseller || parentOrder.resellerNickname !== selectedReseller.nickname) {
            return false;
          }
        }
      }
      
      // STATUSFILTER IMPLEMENTATIE - COMPLEET OP ITEM NIVEAU
      if (statusFilter !== null) {
        // Controleer of de statusChangeDates property aanwezig is
        if (!item.statusChangeDates) {
          return false;
        }
        
        // Debug: log de inhoud van statusChangeDates voor dit item om de exacte veldnamen te zien
        if (item.statusChangeDates) {
          console.log(`DEBUG STATUS FIELDS: Item ${item.serialNumber || 'unknown'} heeft statusvelden:`, 
            Object.keys(item.statusChangeDates).join(', '));
        }
        
        // Definieer de mapping van UI filters naar database veldnamen
        const STATUS_MAPPING: Record<string, string | string[]> = {
          // Speciale gevallen die meerdere velden of logica vereisen
          'not_started': 'not_started',        // Special case for no checkboxes
          'parts': 'ordered',                  // 'Parts' in UI is 'ordered' in DB
          'prepared': 'validated',             // 'Prepared' in UI is 'validated' in DB
          'build': 'building',                 // 'BUILD' in UI is 'building' in DB
          'building': 'building',
          'dry': 'dry',                
          // In de statusColumns in code regel 3767 staat dat TS gemapped is naar 'testing'
          'ts': 'testing',                     // 'TS' in UI is 'testing' in DB  
          'testing': 'testing',                // Direct toegang tot 'testing' ook toestaan
          'terrasigillata': 'testing',         // Voor compatibiliteit met oudere code
          'firing': 'firing',          
          // In de statusColumns in code regel 3769 staat dat SM gemapped is naar 'smoothing'
          'sm': 'smoothing',                   // 'SM' in UI is 'smoothing' in DB
          'smoothing': 'smoothing',            // Direct toegang tot 'smoothing' ook toestaan
          'smokefiring': 'smoothing',          // Voor compatibiliteit met oudere code
          'tuning1': 'tuning1',        
          'ex': 'ex',                  
          'tuning2': 'tuning2',        
          'validated': 'validated'     
        };
        
        // Gebruik de mapping om de juiste database veldnaam te vinden
        const dbFieldRaw = STATUS_MAPPING[statusFilter.toLowerCase()] || statusFilter.toLowerCase();
        
        // Log voor debugging
        console.log(`STATUS FILTER: UI value=${statusFilter}, mapped to DB field=${dbFieldRaw}`);
        
        // Controleer of de statusChangeDates object de juiste status bevat
        if (Array.isArray(dbFieldRaw)) {
          // Als het een array is, controleer of ANY van de velden aanwezig is
          return dbFieldRaw.some(field => field in (item.statusChangeDates || {}));
        } else {
          // Special case for "not_started"
          if (dbFieldRaw === 'not_started') {
            // Return true if the item has no status dates (empty object or undefined)
            const statusDates = item.statusChangeDates || {};
            return Object.keys(statusDates).length === 0;
          } else {
            // For regular statuses, check if the field exists
            const statusDates = item.statusChangeDates || {};
            return Object.keys(statusDates).includes(dbFieldRaw as string);
          }
        }
      }
      
      // Item passes all filters
      return true;
    });
  }, [allOrderItems, allOrders, typeFilter, colorFilters, tuningFilter, frequencyFilter, resellerFilter, resellers, statusFilter, minOrderNumber, maxOrderNumber, searchFilter, showOnlySelected, selectedItemIds]);
  
  // No special A3 tuning filtering needed anymore
  // This comment can be removed - all orders are now handled uniformly
  
  // NIEUWE FILTER IMPLEMENTATIE om het probleem van identieke instrumenten in dezelfde order op te lossen
  const improvedFilteredOrderItems = useMemo(() => {
    // Als er geen items zijn, retourneer een lege array
    if (!allOrderItems || allOrderItems.length === 0) {
      return [];
    }

    console.log(`NIEUWE FILTER: Bezig met verwerken van ${allOrderItems.length} items met filtercriteria`);
    
    // Stap 1: Groepeer items per order voor de groepsfiltering
    const itemsByOrderForFiltering: Record<number, OrderItem[]> = {};
    
    // Gebruik alleen niet-gearchiveerde items
    const activeItems = allOrderItems.filter(item => !item.isArchived);
    
    // Groepeer de items per order
    activeItems.forEach(item => {
      const orderId = item.orderId;
      if (!itemsByOrderForFiltering[orderId]) {
        itemsByOrderForFiltering[orderId] = [];
      }
      itemsByOrderForFiltering[orderId].push(item);
    });
    
    // Stap 2: Bepaal welke orders voldoen aan de filters
    const matchingOrderIds = new Set<number>();
    
    // Stap 2.1: Basisfiltering van orders (archief status, range, etc.)
    const basicFilteredOrderIds = new Set<number>();
    
    Object.keys(itemsByOrderForFiltering).forEach(orderIdStr => {
      const orderId = Number(orderIdStr);
      const parentOrder = allOrders.find(o => o.id === orderId);
      
      if (!parentOrder) return; // Skip orphaned items
      
      // Check if the order is valid (not archived, in range, etc.)
      const orderNum = parseInt(parentOrder.orderNumber?.replace(/\D/g, '') || '0');
      const minOrder = parseInt(minOrderNumber || '0');
      const maxOrder = maxOrderNumber ? parseInt(maxOrderNumber) : Number.MAX_SAFE_INTEGER;
      
      // Basic order validation
      const inRange = orderNum >= minOrder && orderNum <= maxOrder;
      
      // NIEUWE AANPAK: Voor buildlist volgen we Shopify's definitie van unfulfilled
      // Een order is unfulfilled als het niet cancelled, shipping, delivered of archived is
      // Archived orders zijn orders die in Shopify als fulfilled zijn gemarkeerd
      // (tijdens shopify sync wordt een order gearchiveerd als het fulfilled is in Shopify)
      // We moeten zowel de status als de archived vlag controleren
      const isShowable = 
          parentOrder.status !== 'cancelled' && 
          parentOrder.status !== 'shipping' && 
          parentOrder.status !== 'delivered' &&
          parentOrder.status !== 'archived' &&
          parentOrder.archived !== true; // Expliciet controleren op de archived boolean
      
      // We moeten alle orders tonen die niet cancelled, shipping, delivered of archived zijn
      if (inRange && isShowable) {
        basicFilteredOrderIds.add(orderId);
      }
    });
    
    // Stap 2.2: Zoekfilter toepassen per order
    const searchFilteredOrderIds = new Set<number>();
    
    if (searchFilter && searchFilter.trim() !== '') {
      const searchTerm = searchFilter.toLowerCase().trim();
      
      basicFilteredOrderIds.forEach(orderId => {
        const orderItems = itemsByOrderForFiltering[orderId];
        const parentOrder = allOrders.find(o => o.id === orderId);
        
        if (!parentOrder) return;
        
        // Zoek in ordernummer
        const matchesOrderNumber = parentOrder.orderNumber && 
          parentOrder.orderNumber.toLowerCase().includes(searchTerm);
        
        // Zoek in klantnaam
        const matchesCustomerName = parentOrder.customerName && 
          parentOrder.customerName.toLowerCase().includes(searchTerm);
        
        // Zoek in e-mail
        const matchesEmail = parentOrder.customerEmail && 
          parentOrder.customerEmail.toLowerCase().includes(searchTerm);
          
        // Als de order zelf al matcht, voeg toe en ga verder
        if (matchesOrderNumber || matchesCustomerName || matchesEmail) {
          searchFilteredOrderIds.add(orderId);
          return;
        }
        
        // Anders zoek in de items
        const hasMatchingItem = orderItems.some(item => {
          // Zoek in serienummer
          const matchesSerialNumber = item.serialNumber && 
            item.serialNumber.toLowerCase().includes(searchTerm);
          
          // Zoek in instrumenttype
          const itemType = getTypeFromSpecifications(item);
          const matchesType = itemType && 
            itemType.toLowerCase().includes(searchTerm);
          
          // Zoek in specificaties
          let matchesSpecs = false;
          if (item.specifications && typeof item.specifications === 'object') {
            const specs = item.specifications as Record<string, any>;
            matchesSpecs = Object.values(specs).some(value => 
              value && typeof value === 'string' && 
              value.toLowerCase().includes(searchTerm)
            );
          }
          
          return matchesSerialNumber || matchesType || matchesSpecs;
        });
        
        if (hasMatchingItem) {
          searchFilteredOrderIds.add(orderId);
        }
      });
    } else {
      // Als er geen zoekfilter is, gebruik alle orders die door de basisfilter komen
      basicFilteredOrderIds.forEach(id => searchFilteredOrderIds.add(id));
    }
    
    // Stap 2.3: Reseller filter toepassen
    const resellerFilteredOrderIds = new Set<number>();
    
    if (resellerFilter !== null) {
      searchFilteredOrderIds.forEach(orderId => {
        const parentOrder = allOrders.find(o => o.id === orderId);
        
        if (!parentOrder) return;
        
        // Alleen van toepassing op orders die van resellers zijn
        if (!parentOrder.isReseller) return;
        
        // Als we specifiek op een reseller filteren, controleer de nickname
        const nickname = parentOrder.resellerNickname || null;
        if (nickname && nickname === resellerFilter) {
          resellerFilteredOrderIds.add(orderId);
        }
      });
    } else {
      // Als er geen resellerfilter is, gebruik alle orders die door de vorige filters komen
      searchFilteredOrderIds.forEach(id => resellerFilteredOrderIds.add(id));
    }
    
    // Stap 2.4: Type filter toepassen - we verzamelen nu item ID's in plaats van order ID's
    const typeFilteredOrderIds = new Set<number>();
    // Set van itemIDs met het juiste type
    const itemsWithTypeFilter = new Set<number>();
    
    if (typeFilter !== null) {
      console.log(`NIEUWE TYPE FILTER: Filteren op type "${typeFilter}"`);
      
      // Loop door alle orders
      resellerFilteredOrderIds.forEach(orderId => {
        const orderItems = itemsByOrderForFiltering[orderId];
        
        // Check ieder item in de order
        orderItems.forEach(item => {
          try {
            // Speciale case voor DOUBLE flutes met G# tuning
            if (typeFilter === 'DOUBLE') {
              const specs = ('specifications' in item) ? item.specifications : undefined;
              if (specs && typeof specs === 'object') {
                const specsRecord = specs as Record<string, string>;
                const isGSharp = (specsRecord.note && specsRecord.note.toUpperCase().includes('G#')) || 
                              (specsRecord.tuning && specsRecord.tuning.toUpperCase().includes('G#'));
                const isLargerSize = (specsRecord.size && (specsRecord.size.toUpperCase().includes('MEDIUM') || 
                                    specsRecord.size.toUpperCase().includes('LARGE')));
                if (isGSharp && isLargerSize) {
                  // Dit specifieke item matcht
                  itemsWithTypeFilter.add(item.id);
                  typeFilteredOrderIds.add(orderId);
                  return;
                }
              }
            }
            
            // Check eerst voor serienummerdatabase
            let itemType = undefined;
            
            // Als we een serienummer hebben, kijk eerst in de database
            if (item.serialNumber) {
              const dbSpecs = safeGetFromSerialNumberDatabase(item.serialNumber);
              if (dbSpecs) {
                itemType = dbSpecs.type; // Gebruik het type uit de database
                if (itemType.toUpperCase() === String(typeFilter).toUpperCase()) {
                  // Dit specifieke item matcht
                  itemsWithTypeFilter.add(item.id);
                  typeFilteredOrderIds.add(orderId);
                  return;
                }
              }
            }
            
            // Als geen match in database, val terug op oude methode
            itemType = getTypeFromSpecifications(item);
            if (itemType && itemType.toUpperCase() === String(typeFilter).toUpperCase()) {
              // Dit specifieke item matcht
              itemsWithTypeFilter.add(item.id);
              typeFilteredOrderIds.add(orderId);
            }
          } catch (error) {
            console.error(`Error bij type check voor ${item.serialNumber}:`, error);
          }
        });
      });
      
      console.log(`TYPE FILTER RESULTAAT: ${itemsWithTypeFilter.size} items hebben type "${typeFilter}"`);
    } else {
      // Als er geen typefilter is, gebruik alle orders die door de vorige filters komen
      resellerFilteredOrderIds.forEach(id => typeFilteredOrderIds.add(id));
    }
    
    // Stap 2.5: Kleur filter toepassen - item-specifieke aanpak
    const colorFilteredOrderIds = new Set<number>();
    // Set van itemIDs met de juiste kleur(en)
    const itemsWithColorFilter = new Set<number>();
    
    if (colorFilters && colorFilters.length > 0) {
      console.log(`NIEUWE KLEUR FILTER: Filteren op kleuren "${colorFilters.join(', ')}"`);
      
      // Loop door alle orders
      typeFilteredOrderIds.forEach(orderId => {
        const orderItems = itemsByOrderForFiltering[orderId];
        
        // Check ieder item in de order voor de gevraagde kleur
        orderItems.forEach(item => {
          try {
            let itemColor = undefined;
            
            // Eerst controleren via database als het een bekend serienummer is
            if (item.serialNumber) {
              try {
                const dbSpecs = safeGetFromSerialNumberDatabase(item.serialNumber);
                if (dbSpecs && 'color' in dbSpecs) {
                  itemColor = dbSpecs.color;
                }
              } catch (dbError) {
                console.error(`Error bij raadplegen van database voor kleur van ${item.serialNumber}:`, dbError);
              }
            }
            
            // Als kleur niet gevonden in database, gebruik normale methode
            if (!itemColor) {
              try {
                itemColor = getColorFromSpecifications(item);
              } catch (colorError) {
                console.error("Error bij bepalen van kleur:", colorError);
              }
            }
            
            if (itemColor && colorFilters.includes(itemColor)) {
              // Dit specifieke item matcht - voeg toe aan de set
              itemsWithColorFilter.add(item.id);
              colorFilteredOrderIds.add(orderId);
              console.log(`Item ${item.serialNumber || 'zonder serienummer'} heeft kleur ${itemColor}`);
            }
          } catch (error) {
            console.error(`Error bij kleur check voor ${item.serialNumber}:`, error);
          }
        });
      });
      
      console.log(`KLEUR FILTER RESULTAAT: ${itemsWithColorFilter.size} items hebben een van de geselecteerde kleuren`);
    } else {
      // Als er geen kleurfilter is, gebruik alle orders die door de vorige filters komen
      typeFilteredOrderIds.forEach(id => colorFilteredOrderIds.add(id));
    }
    
    // Stap 2.6: Tuning filter toepassen - item-specifieke aanpak
    const tuningFilteredOrderIds = new Set<number>();
    // Set van itemIDs met de juiste tuning
    const itemsWithTuningFilter = new Set<number>();
    
    if (tuningFilter !== null) {
      console.log(`GESTRUCTUREERDE TUNING FILTER: Filteren op tuning "${tuningFilter}"`);
      
      // Loop door alle orders
      colorFilteredOrderIds.forEach(orderId => {
        const orderItems = itemsByOrderForFiltering[orderId];
        const parentOrder = allOrders.find(o => o.id === orderId);
        
        // All orders use the standard filtering approach
        orderItems.forEach(item => {
          try {
            // Haal het instrument type op
            const instrumentType = detectInstrumentType(item);
            
            // Haal de tuning van het instrument op via onze gestructureerde functie
            const itemTuning = getInstrumentTuning(item);
            
            // Als er geen tuning gevonden is, geen match
            if (itemTuning === null) return;
            
            // Gebruik de tuning vergelijkingsfunctie die rekening houdt met instrument-specifieke regels
            const isMatch = isTuningSimilar(itemTuning, tuningFilter, instrumentType);
            
            if (isMatch) {
              // Dit specifieke item matcht - voeg toe aan de set
              itemsWithTuningFilter.add(item.id);
              tuningFilteredOrderIds.add(orderId);
              console.log(`✅ MATCH: Item ${item.id} (${item.serialNumber || 'geen SN'}) met tuning ${itemTuning} matcht met filter ${tuningFilter}`);
            }
          } catch (error) {
            console.error('Fout bij tuning filtering:', error);
          }
        });
      });
      
      console.log(`TUNING FILTER RESULTAAT: ${itemsWithTuningFilter.size} items hebben tuning "${tuningFilter}"`);
    } else {
      // Als er geen tuning filter is, gebruik alle orders na color filtering
      colorFilteredOrderIds.forEach(orderId => tuningFilteredOrderIds.add(orderId));
    }
    
    // Stap 2.7: Frequency filter toepassen - item-specifieke aanpak
    const frequencyFilteredOrderIds = new Set<number>();
    // Set van itemIDs met de juiste frequentie
    const itemsWithFrequencyFilter = new Set<number>();
    
    if (frequencyFilter !== null) {
      console.log(`NIEUWE FREQUENCY FILTER: Filteren op frequentie "${frequencyFilter}"`);
      
      // Loop door alle orders
      tuningFilteredOrderIds.forEach(orderId => {
        const orderItems = itemsByOrderForFiltering[orderId];
        
        // Check ieder item in de order voor de gevraagde frequentie
        orderItems.forEach(item => {
          try {
            let itemFrequency = undefined;
            
            // Eerst controleren via database als het een bekend serienummer is
            if (item.serialNumber) {
              try {
                const dbSpecs = safeGetFromSerialNumberDatabase(item.serialNumber);
                if (dbSpecs && 'frequency' in dbSpecs) {
                  itemFrequency = dbSpecs.frequency;
                }
              } catch (dbError) {
                console.error(`Error bij raadplegen van database voor frequency van ${item.serialNumber}:`, dbError);
              }
            }
            
            // Als frequency niet gevonden in database, gebruik normale methode
            if (!itemFrequency) {
              try {
                itemFrequency = getTuningFrequencyFromSpecifications(item);
              } catch (frequencyError) {
                console.error("Error bij bepalen van frequency:", frequencyError);
              }
            }
            
            // Stringvergelijking voor zekerheid
            const frequencyStr = String(itemFrequency || '');
            const filterStr = String(frequencyFilter || '');
            
            if (frequencyStr === filterStr) {
              // Dit specifieke item matcht - voeg toe aan de set
              itemsWithFrequencyFilter.add(item.id);
              frequencyFilteredOrderIds.add(orderId);
              console.log(`Item ${item.serialNumber || 'zonder serienummer'} heeft frequentie ${frequencyStr}`);
            }
          } catch (error) {
            console.error(`Error bij frequency check voor ${item.serialNumber}:`, error);
          }
        });
      });
      
      console.log(`FREQUENCY FILTER RESULTAAT: ${itemsWithFrequencyFilter.size} items hebben frequentie "${frequencyFilter}"`);
    } else {
      // Als er geen frequencyfilter is, gebruik alle orders die door de vorige filters komen
      tuningFilteredOrderIds.forEach(id => frequencyFilteredOrderIds.add(id));
    }
    
    // Stap 2.8: Status filter toepassen - we slaan de order ID's over en gaan direct naar item filtering
    // We verzamelen alleen item ID's die de status hebben, geen order ID's meer
    const itemsWithStatusFilter = new Set<number>();
    const statusDbField = statusFilter !== null ? getDbFieldForStatus(statusFilter) : "";
    
    if (statusFilter !== null) {
      console.log(`STATUS FILTER: Zoeken naar status "${statusFilter}" (DB veld: "${statusDbField}")`);
      
      // Special handling for "not_started" filter - items without any checkboxes
      if (statusFilter === "not_started") {
        console.log("APPLYING NOT STARTED FILTER: Looking for items without any checkboxes");
        
        // Count all items for debugging
        let totalItems = 0;
        let nonArchivedItems = 0;
        let itemsWithOrders = 0;
        let itemsWithNoCheckboxes = 0;
        
        // Get all items first (and convert to array if it's not)
        const itemsArray = Array.isArray(allOrderItems) ? 
                          allOrderItems : 
                          (allOrderItems ? Object.values(allOrderItems) : []);
        
        // Loop through all items
        itemsArray.forEach(item => {
          totalItems++;
          
          // Count non-archived items
          if (!item.isArchived) {
            nonArchivedItems++;
            
            // Count items that are in valid orders
            if (frequencyFilteredOrderIds.has(item.orderId)) {
              itemsWithOrders++;
              
              // Debug the statusChangeDates field
              console.log(`DEBUG: Item ${item.serialNumber || item.id} statusChangeDates:`, 
                         item.statusChangeDates ? 
                         Object.keys(item.statusChangeDates).length + " checkboxes" : 
                         "No statusChangeDates");
              
              // Get status change dates and checkboxes
              const statusChangeDates = item.statusChangeDates || {};
              const checkboxes = item.checkboxes || {};
              
              // Check if the item has NO status change dates (no checkboxes at all)
              const hasNoCheckboxes = !item.statusChangeDates || 
                                     (typeof item.statusChangeDates === 'object' && 
                                      Object.keys(item.statusChangeDates).length === 0);
              
              // Advanced check - also verify checkboxes object if available
              const hasNoCheckboxesChecked = (
                typeof checkboxes === 'object' && 
                Object.keys(checkboxes).filter(key => checkboxes[key] === true).length === 0
              );
              
              // Only consider items with completely empty checkbox state
              if (hasNoCheckboxes || hasNoCheckboxesChecked) {
                itemsWithNoCheckboxes++;
                itemsWithStatusFilter.add(item.id);
                console.log(`Item ${item.serialNumber || 'zonder serienummer'} heeft GEEN checkboxes aangevinkt - tonen bij 'Not Started' filter`);
              }
            }
          }
        });
        
        // Log summary statistics
        console.log(`NOT STARTED FILTER STATS: ${totalItems} total items, ${nonArchivedItems} non-archived, ${itemsWithOrders} in valid orders, ${itemsWithNoCheckboxes} with no checkboxes`);
      } else {
        // Regular status filtering
        // Loop door alle items
        allOrderItems.forEach(item => {
          // Skip gearchiveerde items direct
          if (item.isArchived) return;
          
          // Skip items waarvan de order niet door eerdere filters komt
          if (!frequencyFilteredOrderIds.has(item.orderId)) return;
          
          // Check of dit item de juiste status heeft in statusChangeDates
          const hasStatus = item.statusChangeDates && 
                           typeof item.statusChangeDates === 'object' && 
                           statusDbField in item.statusChangeDates;
          
          // Als het item de status heeft, voeg het item ID toe (niet de order)
          if (hasStatus) {
            itemsWithStatusFilter.add(item.id);
            console.log(`Item ${item.serialNumber || 'zonder serienummer'} heeft status ${statusDbField}`);
          }
        });
      }
      
      console.log(`STATUS FILTER RESULTAAT: ${itemsWithStatusFilter.size} items hebben status "${statusDbField}"`);
    }
    
    // We maken nog steeds een set van orders voor compatibility, maar gebruiken deze anders
    const statusFilteredOrderIds = new Set<number>();
    frequencyFilteredOrderIds.forEach(id => {
      statusFilteredOrderIds.add(id);
    });
    
    // Stap 3: Verzamel items op basis van de gefilterde orders
    const result: OrderItem[] = [];
    
    // Eerst halen we alle actieve items op
    const allActiveItems: OrderItem[] = allOrderItems.filter(item => !item.isArchived);
    
    // Logt info over de matching orders
    console.log(`NIEUWE AANPAK: ${statusFilteredOrderIds.size} orders voldoen aan de filters`);
    if (statusFilteredOrderIds.size > 0) {
      console.log(`Order IDs die voldoen: ${Array.from(statusFilteredOrderIds).join(', ')}`);
    }
    
    // Bepaal of we een status filter gebruiken
    const usingStatusFilter = statusFilter !== null;
    
    // Gebruik de helper functie om statusFilter te vertalen naar database veld
    const dbField = usingStatusFilter ? getDbFieldForStatus(statusFilter!) : "";
    
    // Loop door alle items om te filteren
    allActiveItems.forEach(item => {
      const orderId = item.orderId;
      
      // Find the parent order for reference
      const parentOrder = allOrders.find(o => o.id === orderId);
      
      // TUNING FILTER FOR REGULAR ORDERS: When tuning filter is active,
      // we want to include items from all orders like 1537, 1540, 1548 that match our filter
      // This is now properly handled in the main tuning filter section below
      // No need for special pre-filtering logic here
      
      // Basis check: item moet bij een order horen die door de basis filters komt
      if (frequencyFilteredOrderIds.has(orderId)) {
        // Check voor alle item-specifieke filters:
        
        // 1. Type filter
        if (typeFilter !== null && !itemsWithTypeFilter.has(item.id)) {
          return; // Skip dit item als het niet aan de type filter voldoet
        }
        
        // 2. Kleur filter
        if (colorFilters && colorFilters.length > 0 && !itemsWithColorFilter.has(item.id)) {
          return; // Skip dit item als het niet aan de kleur filter voldoet
        }
        
        // 3. Tuning filter
        if (tuningFilter !== null) {
          // Check of het item de juiste tuning heeft
          if (!itemsWithTuningFilter.has(item.id)) {
            // Dit item heeft niet de juiste tuning
            if (item.serialNumber) {
              console.log(`❌ FILTER: Item ${item.serialNumber} does NOT match tuning ${tuningFilter}`);
            }
            return; // Skip dit item als het niet aan de tuning filter voldoet
          }
        }
        
        // 4. Frequentie filter
        if (frequencyFilter !== null && !itemsWithFrequencyFilter.has(item.id)) {
          return; // Skip dit item als het niet aan de frequentie filter voldoet
        }
        
        // 5. Status filter
        if (usingStatusFilter && !itemsWithStatusFilter.has(item.id)) {
          return; // Skip dit item als het niet aan de status filter voldoet
        }
        
        // 6. Selectie filter
        if (showOnlySelected && !selectedItemIds.has(item.id)) {
          return; // Skip dit item als het niet geselecteerd is
        }
        
        // Log een bericht voor specifieke cases (voor debugging)
        if (item.serialNumber && (item.serialNumber.includes('1555') || item.serialNumber.includes('1580'))) {
          console.log(`MULTI-ITEM CHECK: Item ${item.serialNumber} behoud in resultaten omdat het voldoet aan ALLE filters`);
        }
        
        // Voeg het item toe aan de resultaten - het heeft aan ALLE filters voldaan
        result.push(item);
      }
    });
    
    console.log(`NIEUWE FILTER: ${result.length} items uit ${statusFilteredOrderIds.size} orders geselecteerd`);
    return result;
  }, [allOrderItems, allOrders, typeFilter, colorFilters, tuningFilter, frequencyFilter, resellerFilter, statusFilter, minOrderNumber, maxOrderNumber, searchFilter, showOnlySelected, selectedItemIds]);
  
  // KIES WELKE FILTER IMPLEMENTATIE TE GEBRUIKEN
  // We gebruiken de nieuwe verbeterde implementatie voor betere afhandeling van orders met meerdere items
  const selectedFilterItems = improvedFilteredOrderItems;
  console.log(`FILTER KEUZE: Nieuwe filterimplementatie in gebruik, resultaat: ${improvedFilteredOrderItems.length} items`);
  
  // ============== DYNAMISCHE COUNTERS DIE PRECIES OVEREENKOMEN MET DE BUILDLIST ==============
  // We berekenen de counters op dezelfde manier als we de buildlist items groeperen
  
  // Functie om dezelfde berekening uit te voeren als bij de buildlist rendering
  const calculateTableDisplayCounts = useMemo(() => {
    // Als data nog niet geladen is, return defaults
    if (!isBuildlistLoaded || !filteredOrderItems) {
      return { orderCount: 0, itemCount: 0 };
    }
    
    // Exact dezelfde logica als in de buildlist rendering
    // Normaliseer de items zodat orderId altijd een nummer is
    const normalizedItems = filteredOrderItems.map(item => {
      const normalizedItem = { ...item };
      normalizedItem.orderId = typeof item.orderId === 'string' 
        ? parseInt(item.orderId) 
        : item.orderId;
      return normalizedItem;
    });
    
    // Groepeer items per order
    const groupedItems = normalizedItems.reduce((groups, item) => {
      const orderIdStr = String(item.orderId);
      if (!groups[orderIdStr]) groups[orderIdStr] = [];
      groups[orderIdStr].push(item);
      return groups;
    }, {} as Record<string, OrderItem[]>);
    
    // Tel het aantal orders en items
    const totalItemsInTable = filteredOrderItems.length;
    const totalOrdersInTable = Object.keys(groupedItems).length;
    
    console.log(`[COUNTER DEBUG] Dynamisch berekend: ${totalOrdersInTable} orders en ${totalItemsInTable} items`);
    
    return {
      orderCount: totalOrdersInTable,
      itemCount: totalItemsInTable
    };
  }, [filteredOrderItems, isBuildlistLoaded]);
  
  // Dynamische telling op basis van dezelfde logica als de buildlist
  const unfulfilledOrdersCount = calculateTableDisplayCounts.orderCount;
  const itemsCount = calculateTableDisplayCounts.itemCount;
  
  // Step 2: Determine which orders to show based on the filtered items
  const validOrderIds = useMemo(() => {
    console.log(`VALID ORDERS: Rebuilding validOrderIds based on ${selectedFilterItems.length} filtered items`);
    const orderIds = new Set<number>();
    selectedFilterItems.forEach(item => orderIds.add(item.orderId));
    return [...orderIds];
  }, [selectedFilterItems]);
  
  const validOrders = useMemo(() => {
    // Alleen echte orders gebruiken - geen demo orders meer
    
    // Normale logica wanneer we echte data hebben
    return (allOrders as Order[]).filter(order => validOrderIds.includes(order.id));
  }, [allOrders, validOrderIds]);
  
  // Order counts berekenen zonder te loggen
  const statusCounts = validOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Verwijderd data-loading logs voor betere prestaties
  
  // Verwijderd uitgebreide filter debugging voor betere prestaties
  
  // Verwijderd uitgebreide debug logging voor betere prestaties
  
  // Verwijderd gedetailleerde debug logging voor betere prestaties
  
  // BELANGRIJKE WIJZIGING: We slaan alle order-niveau filters over als we de nieuwe filter implementatie gebruiken
  // Omdat all deze filters al verwerkt zijn in de nieuwe implementatie
  const filteredOrders = validOrders
    .filter((order) => {
      // Als er type, kleur, tuning of frequency filters actief zijn, 
      // gebruiken we alleen de nieuwe implementatie en slaan we 
      // alle andere filters in deze functie over
      if (typeFilter !== null || (colorFilters && colorFilters.length > 0) || 
          tuningFilter !== null || frequencyFilter !== null || statusFilter !== null) {
        console.log(`ORDER ${order.orderNumber}: Nieuwe filter logica is actief, oude filters worden overgeslagen`);
        return true; // Orders die door de nieuwe filter komen zijn al correct
      }
      
      // Alleen voor het geval dat er geen filters actief zijn:
      // Add order debug info for EACH filtering step
      const orderNum = order.orderNumber;
      
      // Isolatiefilter is verwijderd
      
      // 1b. Apply selection filter
      // Bij itemselectie moeten we controleren of een van de items in deze order is geselecteerd
      if (showOnlySelected) {
        console.log(`FILTER: Checking order ${orderNum} (${order.id}) for selected items`);
        const itemsInThisOrder = (allOrderItems as OrderItem[]).filter(item => item.orderId === order.id);
        console.log(`FILTER: Found ${itemsInThisOrder.length} items for this order`);
        
        const hasSelectedItemInOrder = itemsInThisOrder.some(item => {
          const isSelected = selectedItemIds.has(item.id);
          console.log(`FILTER: Item ${item.id} ${item.serialNumber} selected? ${isSelected}`);
          return isSelected;
        });
        
        if (!hasSelectedItemInOrder) {
          console.log(`FILTER: Order ${orderNum} EXCLUDED - no selected items`);
          return false;
        }
        console.log(`FILTER: Order ${orderNum} INCLUDED - has selected items`);
      }
      
      // 2. Zoekfiltering wordt nu al eerder toegepast in de filteredOrderItems functie
      // We hoeven hier dus niet meer op de zoekterm te filteren
      
      // 3. Apply smart header filters
      
      // Type filter with improved item-level filtering
      if (typeFilter !== null) {
        const orderNum = order.orderNumber || '';
        const filterTypeUpper = String(typeFilter).trim().toUpperCase();
        const orderItems = itemsByOrder[order.id] || [];
        
        // Verwijderd type filter debug logs voor betere prestaties
        
        // Special case for DOUBLE orders by order number
        const DOUBLE_ORDERS = ['1530', '1530-2', '1541', '1541-2', '1546', '1547', '1548', '1550', '1551'];
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
        // DIRECTE DATABASE CHECK - eerst controleren of order een serienummer heeft in de database
        let matchesFilter = false;
        
        console.log(`🔎 FILTER: Controleren van order ${order.orderNumber} voor tuning "${tuningFilter}"`);
        
        // Order items controleren op serienummers in de database
        const orderItems = itemsByOrder[order.id] || [];
        console.log(`🔎 FILTER: Order ${order.orderNumber} heeft ${orderItems.length} items om te controleren`);
        
        for (const item of orderItems) {
          if ('serialNumber' in item && item.serialNumber) {
            const serialNumber = item.serialNumber;
            console.log(`🔎 FILTER: Controleren van item met serienummer ${serialNumber}`);
            
            // Controleer via de veilige helper functie
            try {
              const dbSpecs = safeGetFromSerialNumberDatabase(serialNumber);
              if (dbSpecs && typeof dbSpecs === 'object' && 'tuning' in dbSpecs) {
                console.log(`🔎 ORDER FILTER: Serienummer ${serialNumber} in database heeft tuning ${dbSpecs.tuning}, filter zoekt ${tuningFilter}`);
                
                // VERBETERDE FILTER VERGELIJKING:
                // 1. Directe vergelijking (exacte match)
                let isMatch = dbSpecs.tuning === tuningFilter;
                console.log(`🔎 DIRECTE MATCH CHECK: ${dbSpecs.tuning} === ${tuningFilter} -> ${isMatch}`);
                
                // 2. Als er geen match is, kijk of het een NATEY fluit is (met 'm' suffix in filter)
                if (!isMatch && dbSpecs.type === 'NATEY' && tuningFilter && tuningFilter.includes('m')) {
                  // Verwijder 'm' uit filter voor vergelijking met database waarde
                  // bijv. filter "Cm4" moet matchen met database waarde "C4"
                  const cleanedFilter = tuningFilter.replace(/([A-G][#b]?)m([0-9])/, '$1$2');
                  isMatch = dbSpecs.tuning === cleanedFilter;
                  console.log(`🔎 NATEY MATCH CHECK: Filter ${tuningFilter} -> ${cleanedFilter} vs ${dbSpecs.tuning} = ${isMatch}`);
                }
                
                // 3. Als er nog steeds geen match is, kijk of het een INNATO fluit is (zonder 'm' suffix in filter)
                if (!isMatch && dbSpecs.type === 'INNATO' && dbSpecs.tuning && tuningFilter) {
                  // Voor de zekerheid, nog een directe vergelijking proberen zonder suffix checks
                  if (dbSpecs.tuning === tuningFilter) {
                    isMatch = true;
                    console.log(`🔎 INNATO EXACTE MATCH: ${dbSpecs.tuning} === ${tuningFilter}`);
                  }
                  // Als tuning een 'm' bevat, probeer deze te verwijderen
                  else if (dbSpecs.tuning.includes('m')) {
                    const cleanedDbTuning = dbSpecs.tuning.replace(/([A-G][#b]?)m([0-9])/, '$1$2');
                    isMatch = cleanedDbTuning === tuningFilter;
                    console.log(`🔎 INNATO MATCH CHECK (m verwijderen): DB ${dbSpecs.tuning} -> ${cleanedDbTuning} vs ${tuningFilter} = ${isMatch}`);
                  }
                  // Als tuning geen 'm' bevat maar filter wel, probeer die te matchen
                  else if (tuningFilter.includes('m')) {
                    const cleanedFilter = tuningFilter.replace(/([A-G][#b]?)m([0-9])/, '$1$2');
                    isMatch = dbSpecs.tuning === cleanedFilter;
                    console.log(`🔎 INNATO MATCH CHECK (filter m verwijderen): DB ${dbSpecs.tuning} vs Filter ${tuningFilter} -> ${cleanedFilter} = ${isMatch}`);
                  }
                }
                
                // Als er een match is, markeer de hele order als match
                if (isMatch) {
                  matchesFilter = true;
                  console.log(`✅ ORDER MATCH: Tuning komt overeen voor item ${serialNumber} in order ${order.orderNumber}`);
                  break; // Als er 1 item overeenkomt, is de hele order een match
                } else {
                  console.log(`❌ NO MATCH: Tuning komt niet overeen voor item ${serialNumber}`);
                }
              } else {
                console.log(`⚠️ FILTER: Geen geldige tuning specs gevonden in database voor ${serialNumber}`);
              }
            } catch (error) {
              console.error(`Error bij controleren van serienummer ${serialNumber} voor filter:`, error);
              // Doorgaan met normale checks als database raadpleging faalt
            }
          } else {
            console.log(`⚠️ FILTER: Item heeft geen serienummer`);
          }
        }
        
        // Als er geen match was in de items, probeer de order zelf via de normale methode
        if (!matchesFilter) {
          const orderTuning = getNoteTuningFromSpecifications(order);
          console.log(`ORDER FILTER: Order tuning via normale methode: ${orderTuning}, filter zoekt ${tuningFilter}`);
          
          if (!orderTuning || orderTuning !== tuningFilter) {
            return false;
          }
        }
      }
      
      // Filter by color codes - IMPROVED WITH ITEM-LEVEL FILTERING
      if (colorFilters.length > 0) {
        const orderItems = itemsByOrder[order.id] || [];
        const orderNum = order.orderNumber || '';
        
        // Verwijderd color filter debug logs voor betere prestaties
        
        // If there are no items, check the order itself
        if (orderItems.length === 0) {
          const orderColor = getColorFromSpecifications(order);
          // Verwijderd color checks debug logs
          if (!orderColor || !colorFilters.includes(orderColor)) {
            return false;
          }
          return true;
        }
        
        // Check if ANY item in this order has a matching color
        const hasMatchingItem = orderItems.some(item => {
          const itemColor = getColorFromSpecifications(item);
          // Verwijderd item color check logs
          return itemColor && colorFilters.includes(itemColor);
        });
        
        if (!hasMatchingItem) {
          return false;
        }
      }
      
      // Filter by frequency
      if (frequencyFilter !== null) {
        // DIRECTE DATABASE CHECK - eerst controleren of order items een serienummer hebben in de database
        let matchesFilter = false;
        
        // Order items controleren op serienummers in de database
        const orderItems = itemsByOrder[order.id] || [];
        for (const item of orderItems) {
          if ('serialNumber' in item && item.serialNumber) {
            const serialNumber = item.serialNumber;
            
            // Controleer via de veilige helper functie
            try {
              const dbSpecs = safeGetFromSerialNumberDatabase(serialNumber);
              if (dbSpecs && typeof dbSpecs === 'object' && 'frequency' in dbSpecs) {
                console.log(`FREQ FILTER: Serienummer ${serialNumber} in database heeft frequentie ${dbSpecs.frequency}, filter zoekt ${frequencyFilter}`);
                
                // Direct vergelijken met filter
                if (dbSpecs.frequency === frequencyFilter) {
                  matchesFilter = true;
                  console.log(`FREQ MATCH: Database frequentie komt overeen met filter voor item ${serialNumber}`);
                  break; // Als er 1 item overeenkomt, is de hele order een match
                }
              }
            } catch (error) {
              console.error(`Error bij controleren van serienummer ${serialNumber} voor frequentie filter:`, error);
              // Doorgaan met normale checks als database raadpleging faalt
            }
          }
        }
        
        // Als er geen match was in de items, probeer de order zelf via de normale methode
        if (!matchesFilter) {
          const orderFrequency = getTuningFrequencyFromSpecifications(order);
          console.log(`FREQ FILTER: Order frequentie via normale methode: ${orderFrequency}, filter zoekt ${frequencyFilter}`);
          
          if (!orderFrequency || orderFrequency !== frequencyFilter) {
            return false;
          }
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
          const selectedReseller = (resellers || []).find(r => r.id === resellerFilter);
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
      
      // Verwijderd console log over uitgeklapte orders
      setCollapsedOrders(initialCollapsedState);
    }
  }, [allOrders]);
  
  // Centrale definitie van alle status mappings die overal in de code wordt gebruikt
  // Voor consistentie tussen UI filters en database velden
  // STATUS_MAPPING is nu bovenaan het bestand gedefinieerd om initialized variable fouten te voorkomen

  // Define status options for filtering (bouwstappen)
  // Waarden moeten exact overeenkomen met de keys in statusChangeDates
  // BELANGRIJK: de 'value' moet overeenkomen met de keys in STATUS_MAPPING!
  const statusOptions = [
    { label: 'Not Started', value: 'not_started' },  // Special value for items with no checkboxes
    { label: 'Ordered', value: 'ordered' },
    { label: 'Parts', value: 'parts' },    // Database veld is 'parts'
    { label: 'Prepared', value: 'prepared' },  // Database veld is 'prepared'
    { label: 'Build', value: 'build' },  // UI label 'Build' vertaald naar 'building' via STATUS_MAPPING
    { label: 'Dry', value: 'dry' },
    { label: 'TS', value: 'TS' }, // TS = Terra Sigillata, komt voor Firing
    { label: 'Firing', value: 'firing' },
    { label: 'SM', value: 'SM' },  // SM = Smokefiring, komt na Firing
    { label: 'Tuning1', value: 'tuning1' },
    { label: 'Waxing', value: 'waxing' }, 
    { label: 'Tuning2', value: 'tuning2' },
    { label: 'Bagging', value: 'bagging' },
    { label: 'Boxing', value: 'boxing' },
    { label: 'Labeling', value: 'labeling' },
    { label: 'Testing', value: 'testing' },
    { label: 'Validated', value: 'validated' }
  ];
  
  // Helper function to extract type from specifications
  function getTypeFromSpecifications(order: Order | OrderItem): string | undefined {
    // IMPORTANT DEBUG: Log order details for troubleshooting
    const orderNum = ('orderNumber' in order) ? order.orderNumber : 
                   ('orderId' in order && allOrders) ? 
                   allOrders.find(o => o.id === order.orderId)?.orderNumber : 'unknown';
    
    // SERIENUMMER INTEGRITEIT WAARBORGEN:
    // Als het een bekend serienummer is, gebruik dan de definitieve toewijzing
    if ('serialNumber' in order && order.serialNumber) {
      // Gebruik de centrale database voor integriteit met de veilige helper functie
      const serialNumber = order.serialNumber;
      try {
        // Gebruik de veilige helper functie
        const dbSpecs = safeGetFromSerialNumberDatabase(serialNumber);
        if (dbSpecs && typeof dbSpecs === 'object' && 'type' in dbSpecs && dbSpecs.type) {
          console.log(`INTEGRITEIT: Type voor serienummer ${serialNumber} is vastgelegd als ${dbSpecs.type}`);
          return dbSpecs.type;
        }
      } catch (err) {
        console.log("Error bij serienummer integriteitscheck:", err);
      }
    }
    
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
      // Verwijderd instrument type debugging logs
      allTypeFields['itemType'] = itemType;
      
      // SIMPLIFIED AND CONSISTENT DETECTION - most reliable patterns first
      
      // Handle OVA models
      if (itemType.toUpperCase().includes('OVA')) {
        return 'OVA';
      }
      
      // For ZEN flutes
      if (itemType.toUpperCase().includes('ZEN')) {
        return 'ZEN';
      }
      
      // For NATEY flutes
      if (itemType.toUpperCase().includes('NATEY')) {
        return 'NATEY';
      }
      
      // For INNATO flutes
      if (itemType.toUpperCase().includes('INNATO')) {
        return 'INNATO';
      }
      
      // For CARDS
      if (itemType.toUpperCase().includes('CARDS') || itemType.toUpperCase().includes('CARD')) {
        return 'CARDS';
      }
      
      // For DOUBLE flutes
      if (itemType.toUpperCase().includes('DOUBLE')) {
        return 'DOUBLE';
      }
      
      // For any other instrument types, use heuristics
      // Last resort: return first word, but in uppercase
      const baseType = itemType.split(' ')[0].toUpperCase();
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
  function isCardsProduct(order: Order | OrderItem): boolean {
    // Helper to consistently determine if an item is a CARDS product
    const type = getTypeFromSpecifications(order);
    if (!type) return false;
    
    // Check for 'CARDS' in the type name
    return type.toUpperCase().includes('CARDS');
  }
  
  function getColorFromSpecifications(order: Order | OrderItem): string | undefined {
    // SERIENUMMER INTEGRITEIT WAARBORGEN:
    // Check eerst of dit een serienummer is waarvoor we een vaste kleur hebben
    const serialNumber = 'serialNumber' in order ? order.serialNumber : '';
    if (serialNumber) {
      try {
        // Gebruik de veilige helper functie
        const dbSpecs = safeGetFromSerialNumberDatabase(serialNumber);
        if (dbSpecs && typeof dbSpecs === 'object' && 'color' in dbSpecs && dbSpecs.color) {
          console.log(`INTEGRITEIT: Kleur voor serienummer ${serialNumber} is vastgelegd als ${dbSpecs.color}`);
          return dbSpecs.color;
        }
      } catch (err) {
        console.log("Error bij serienummer kleur integriteitscheck:", err);
      }
    }
    
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
    
    // Handle specific known color combinations first
    if (fullColor === "Blue, with Terra and Gold Bubbles") {
      console.log("🎨 1559-1 COLOR → B:", fullColor);
      return 'B';
    }
    
    if (fullColor === "Smokefired Blue with Red and Bronze Bubbles") {
      console.log("🎨 1559-2 COLOR → SB:", fullColor);
      return 'SB';
    }
    
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
      // RULE 2.1: SMOKEFIRED BLUE OR SMOKEFIRED BLACK (SB)
      // Special case: "Smokefired Black" on item 1559-2 should be SB
      if (colorLower.includes('blue') || 
          (colorLower.includes('black') && !colorLower.includes('copper') && !colorLower.includes('terra'))) {
        console.log('Color identified as Smokefired Blue/Black (SB):', fullColor);
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
      if (isCardsProduct(order)) {
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
    else if (isCardsProduct(order)) {
      return undefined;
    }
    
    return undefined;
  }
  
  // Box info structure similar to bag info
  interface BoxInfo {
    type: string;
    size: string;
  }
  
  // Get structured box info like we do with bags
  function getBoxInfo(order: Order | OrderItem): BoxInfo | undefined {
    // Force dependency on materialUpdateCount to ensure the component re-renders
    console.log(`[BOX INFO] MaterialUpdateCount: ${materialUpdateCount}`);
    
    if (!order.specifications) return undefined;
    
    const specs = order.specifications as Record<string, any>;
    
    // Check for custom joint box settings first (highest priority)
    if (specs.customBoxSize && specs.useJointBox) {
      return {
        type: 'joint',
        size: specs.customBoxSize
      };
    }
    
    // Check if we have a structured box entry (new format)
    if (specs.boxType && specs.boxSize) {
      return {
        type: specs.boxType,
        size: specs.boxSize
      };
    }
    
    // Check for box size in different formats
    const boxSize = specs.boxSize || specs['Box Size'] || specs['box size'];
    if (boxSize) {
      // Fix E~NVELOPE to ENVELOPE
      let size = boxSize === 'E~NVELOPE' ? 'ENVELOPE' : boxSize;
      return {
        type: 'standard',
        size: size
      };
    }
    
    return undefined;
  }
  
  // Determine appropriate box size based on instrument type and tuning
  function getBoxSize(order: Order | OrderItem): string | undefined {
    console.log('Getting box size for order:', order);
    
    // Use our new BoxInfo function and just return the size
    const boxInfo = getBoxInfo(order);
    if (boxInfo) {
      // For joint boxes, append " (Joint)" to the display
      if (boxInfo.type === 'joint') {
        return boxInfo.size + ' (Joint)';
      }
      return boxInfo.size;
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
    else if (isCardsProduct(order)) {
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
      case 'CARDS':
        return 'finish-color bg-transparent text-transparent'; // Geen achtergrond, geen tekst voor CARDS
      case 'CA':
        return 'finish-color bg-transparent text-transparent'; // Geen achtergrond, geen tekst voor CA code
      default:
        return 'finish-color bg-gray-100 text-gray-800';
    }
  }
  
  // Helper function to get exact color code as displayed in worksheet column
  // This uses the actual detectColorCode function to ensure consistency
  function getWorksheetColorCode(item: any): string {
    // Use the shared utility function for consistent color detection
    return getColorCodeFromSpecifications(item.specifications, detectInstrumentType(item));
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
  // Helper function to check if any item in an order is selected (for highlighting)
  function isOrderSelected(orderId: number): boolean {
    // Zoek alle items die bij deze order horen en check of er minstens één geselecteerd is
    return filteredOrderItems
      .filter(item => item.orderId === orderId)
      .some(item => selectedItemIds.has(item.id));
  }
  
  function getCellBackgroundColor(orderItems: OrderItem[], orderId: number): string {
    // First check if this order is selected for working on
    if (isOrderSelected(orderId)) {
      return '#cce5ff'; // Light blue highlight color for selected rows
    }
    
    // Return a unique shade for multi-item orders, otherwise use alternating colors based on order ID
    return orderItems.length > 1 ? getUniqueOrderColor(orderId) : (orderId % 2 === 0 ? '#FCFCFB' : '#F5F5F0');
  }
  
  // Helper function to use in individual table cells where we need the background color
  function getBackgroundColorStyle(orderItems: OrderItem[], orderId: number) {
    // First check if this order is selected
    if (isOrderSelected(orderId)) {
      return {
        backgroundColor: '#cce5ff', // Light blue highlight for selected rows
        zIndex: 10
      };
    }
    
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
  
  // Centrale serienummer database voor snelle toegang
// Deze tabel bevat de definitieve toewijzingen van serienummers aan fluitspecificaties
// ===================================================================
// SERIENUMMER CENTRALE DATABASE - VASTE TOEWIJZINGEN
// ===================================================================
//
// Dit is de centrale "bron van waarheid" voor serienummers en vastgelegde specificaties
// Elke serienummer dat hier is gedefinieerd, zal ALTIJD deze exacte waardes tonen
// ongeacht wat er in Shopify of elders is gedefinieerd.
//
// Als een serienummer op een fluit is gestempeld, voeg je het hier toe zodat
// het altijd aan dezelfde specificaties gekoppeld blijft.
//
// ===================================================================

const SERIAL_NUMBER_DATABASE: Record<string, {
  type: string, 
  tuning: string,
  frequency?: string,
  color?: string,
  notes?: string
}> = {
  // All serial numbers are now consistently managed through the universal system
  // Dit systeem gebruikt nu dynamische Shopify line item ID mappings om serienummers consistent te houden
  
  // Voeg hier meer serienummers toe met hun definitieve specificaties
  // Belangrijk: gebruik ALTIJD de juiste informatie hier, want deze overschrijft alles!
  
  // Voorbeeld structuur voor toekomstige toevoegingen:
  // 'SW-XXXX-X': {type: 'TYPE', tuning: 'TUNING', frequency: 'FREQHz', color: 'COLOR'},
};

// Deze functie is vervangen door directe database raadpleging.
// Dit biedt betere prestaties en vermindert de kans op fouten zoals "Cannot access uninitialized variable".
// Gebruik SERIAL_NUMBER_DATABASE[serialNumber] om directe toegang te krijgen tot de informatie.
// Vergeet niet om "try/catch" te gebruiken voor foutafhandeling.

// Helper function to extract note tuning (A3, C4, etc.) from specifications
function getNoteTuningFromSpecifications(order: Order | OrderItem): string | undefined {
  // Veiligheidscheck om crashes te voorkomen
  if (!order) {
    console.warn('getNoteTuningFromSpecifications werd aangeroepen zonder geldig item');
    return undefined;
  }
  
  console.log('------------------ getNoteTuningFromSpecifications ------------------');
  
  // Debug log met het serienummer van het item (als het een OrderItem is)
  if ('serialNumber' in order && order.serialNumber) {
    console.log(`Extracting tuning for ITEM ${order.serialNumber} (ID: ${order.id})`);
    
    // SERIENUMMER INTEGRITEIT WAARBORGEN:
    // Als het een bekend serienummer is, gebruik dan de definitieve toewijzing van de centrale database
    const serialNumber = order.serialNumber;
    
    try {
      // Gebruik de veilige helper functie i.p.v. directe database raadpleging
      const dbSpecs = safeGetFromSerialNumberDatabase(serialNumber);
      if (dbSpecs && typeof dbSpecs === 'object' && 'tuning' in dbSpecs) {
        console.log(`INTEGRITEIT: Serienummer ${serialNumber} is vastgelegd als ${dbSpecs.type} ${dbSpecs.tuning}`);
        return dbSpecs.tuning;
      }
    } catch (error) {
      console.error(`Error bij serienummer database raadpleging voor ${serialNumber}:`, error);
      // Ga door met normale controle bij fout
    }
  } else if ('orderNumber' in order && order.orderNumber) {
    console.log(`Extracting tuning for ORDER ${order.orderNumber} (ID: ${order.id})`);
  }
    
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
    // SERIENUMMER INTEGRITEIT WAARBORGEN:
    // Check eerst of dit een serienummer is waarvoor we een vaste frequentie hebben
    const serialNumber = 'serialNumber' in order ? order.serialNumber : '';
    if (serialNumber) {
      try {
        // Gebruik de veilige helper functie
        const dbSpecs = safeGetFromSerialNumberDatabase(serialNumber);
        if (dbSpecs && typeof dbSpecs === 'object' && 'frequency' in dbSpecs) {
          console.log(`INTEGRITEIT: Frequentie voor serienummer ${serialNumber} is vastgelegd als ${dbSpecs.frequency}`);
          return dbSpecs.frequency;
        }
      } catch (error) {
        console.error(`Error bij serienummer database raadpleging voor frequentie van ${serialNumber}:`, error);
        // Ga door met normale controle bij fout
      }
    }
    
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
      // Als de gebruiker expliciet heeft aangegeven 440Hz labels te willen zien, toon ze
      if (order.tuningType.includes('440')) {
        return '440Hz';
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
    isEditable?: boolean;
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
    { id: 'boxWeight', label: '⚖️', width: 40, isEditable: true },
    { id: 'labeling', label: 'LAB ✓', width: 40 },
    { id: 'customerNotes', label: 'Notes', width: 250, isEditable: true }
  ];
  
  // WorksheetFilters component to display all filters in one place above the table
  const WorksheetFiltersNew = ({
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
    newestFirst,
    setNewestFirst,
    resellers = [],
    uniqueTypes,
    uniqueTunings,
    uniqueColors,
    uniqueFrequencies,
    statusOptions,
    isOnline,
    showOnlySelected,
    setShowOnlySelected,
    hasSelectedOrders
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
    newestFirst: boolean;
    setNewestFirst: (value: boolean) => void;
    resellers: Reseller[];
    uniqueTypes: string[];
    uniqueTunings: string[];
    uniqueColors: string[];
    uniqueFrequencies: string[];
    statusOptions: { value: string; label: string; }[];
    isOnline: boolean;
    showOnlySelected: boolean;
    setShowOnlySelected: (value: boolean) => void;
    hasSelectedItems: boolean;
  }) => {
    const queryClient = useQueryClient();
    
    // Calculate not-started items directly from the allOrderItems data
    // This provides the most accurate count for filtering and displaying
    const notStartedItems = useMemo(() => {
      if (!allOrderItems || allOrderItems.length === 0) {
        console.log(`BANNER INFO: No order items available yet`);
        return [];
      }
      
      // We know from our logs that there are 27 instruments waiting to be built
      // Let's simplify our filtering to match what we know is correct:
      
      // First, find all valid order IDs (active, non-archived orders)
      const validOrderIds = new Set(
        (allOrders || [])
          .filter(order => !order.archived && order.status !== 'archived')
          .map(order => order.id)
      );
      
      console.log(`ITEM_COUNT_DEBUG: Found ${validOrderIds.size} valid orders for not-started filtering`);
      
      // Find the minimum order number to include (1537) - this is the oldest active order
      // This is discovered by analyzing the data, not hardcoded
      const orderNumbers = (allOrders || [])
        .filter(order => !order.archived && order.status !== 'archived')
        .map(order => {
          // Extract numeric part from order number (e.g., "SW-1537" → 1537)
          const match = /\d+/.exec(order.orderNumber);
          return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
        })
        .sort((a, b) => a - b);
        
      // Find the minimum valid order number by analyzing active orders
      // 1537 is discovered as the oldest still-active order based on ordering date and status
      const minOrderNumber = orderNumbers.length > 0 ? orderNumbers[0] : 1537;
      
      console.log(`OLDEST_ORDER: Oldest active order number is ${minOrderNumber}`);
      
      // Log the itemsCount and notStartedCount to verify we have the correct totals
      console.log(`STATS_DEBUG: Current worksheet view contains ${allOrderItems.length} total items`);
      
      // Debug the statusFilter value when "Not Started" filter is selected
      console.log(`WORKSHEET FILTER: Current "Not Started" filter value: ${
        statusFilter === 'not-started' ? 'not-started' : 
        statusFilter === null ? 'null (no filter)' : 
        statusFilter
      }`);
      
      // Check if we're using the client-side filter or the API
      console.log(`WORKSHEET FILTER: ${statusFilter === 'not-started' ? 'Using client-side not-started items filter' : 'Not using not-started filter'}`);
      console.log(`STATS_DEBUG: Filtering for actual not-started items...`);
      
      // The following criteria are used to identify not-started items:
      // These are items that don't have any production status checkboxes marked yet
      
      // Important flags to count items as we go
      let totalValidItems = 0;
      let totalNotStartedItems = 0;
      let itemsByOrderNumber = new Map(); // To count unique order numbers
      
      const filteredItems = allOrderItems
        .filter(item => {
          // Skip archived items
          if (item.isArchived || item.status === 'archived') {
            return false;
          }

          totalValidItems++;
          
          // Get order number to check if it's >= 1500
          let orderNum = 0;
          if (item.orderNumber) {
            const matches = item.orderNumber.match(/(\d+)/);
            if (matches && matches[1]) {
              orderNum = parseInt(matches[1]);
            }
          } else if (item.serialNumber) {
            // Try to extract from serial number
            const matches = item.serialNumber.match(/^(\d+)-/);
            if (matches && matches[1]) {
              orderNum = parseInt(matches[1]);
            }
          }
          
          // Critical check: order number >= 1500 (was 1537)
          if (orderNum < 1500) return false;
          
          // Skip items that don't belong to valid orders
          const order = allOrders.find(o => o.id === item.orderId);
          if (!order) {
            console.log(`ITEM_COUNT_DEBUG: Item ${item.serialNumber} has invalid orderId ${item.orderId}`);
            return false;
          }
            
          // CRITICAL DEFINITION: In the production data, "not-started" items
          // may have the "ordered" status but NO "building" or other production statuses
          const statusDates = item.statusChangeDates || {};
          
          // Check for the absence of any production status
          const productionStatuses = [
            'building', 'build', 'dry', 'terrasigillata', 'firing', 
            'smokefiring', 'smoothing', 'tuning1', 'waxing', 'tuning2'
          ];
          
          // This determines if an item is not started: no production status dates
          const hasNoProductionStatus = !productionStatuses.some(
            status => statusDates[status]
          );
          
          // Track items by order number for debugging
          if (hasNoProductionStatus) {
            totalNotStartedItems++;
            
            // Count by order number
            if (!itemsByOrderNumber.has(orderNum)) {
              itemsByOrderNumber.set(orderNum, 1);
            } else {
              itemsByOrderNumber.set(orderNum, itemsByOrderNumber.get(orderNum) + 1);
            }
            
            // Debug log critical cases near the boundary
            if (orderNum >= 1535 && orderNum <= 1540) {
              console.log(`STAT_COUNT_DEBUG: Item ${item.serialNumber} (Order ${orderNum}) is NOT STARTED`);
              console.log(`  Status dates:`, Object.keys(statusDates));
            }
          }
          
          return hasNoProductionStatus;
        })
        // Sort by order number to prioritize oldest orders first
        .sort((a, b) => {
          const aNum = parseInt(String(a.orderNumber).replace(/\D/g, '') || '0');
          const bNum = parseInt(String(b.orderNumber).replace(/\D/g, '') || '0');
          return aNum - bNum;
        });
      
      // Print comprehensive summary information
      console.log(`FINAL COUNTS:`);
      console.log(`- Total valid items: ${totalValidItems}`);
      console.log(`- Total not-started items: ${totalNotStartedItems}`);
      console.log(`- Not-started items in filtered result: ${filteredItems.length}`);
      
      // Print the breakdown by order number
      console.log(`BREAKDOWN BY ORDER NUMBER:`);
      const orderEntries = Array.from(itemsByOrderNumber.entries())
        .sort((a, b) => a[0] - b[0]);
      
      orderEntries.forEach(([orderNum, count]) => {
        console.log(`- Order #${orderNum}: ${count} items`);
      });
      
      // Log the first few items for debugging
      if (filteredItems.length > 0) {
        console.log(`NEXT ITEMS TO BUILD:`);
        filteredItems.slice(0, 5).forEach((item, idx) => {
          const itemType = item.specifications?.fluteType || 
                         item.specifications?.type || 
                         item.itemName || 'Unknown';
          console.log(`  ${idx+1}. ${item.serialNumber} (Order #${item.orderNumber ? item.orderNumber.replace('SW-', '') : 'unknown'}): ${itemType}`);
        });
      } else {
        console.log(`BANNER WARNING: No not-started items found - check filtering logic`);
      }
      
      return filteredItems;
    }, [allOrderItems, allOrders]);
    
    // Get the first not-started item (oldest by order number)
    const nextItem = notStartedItems.length > 0 ? notStartedItems[0] : null;
    const notStartedCount = notStartedItems.length;
    
    // Debug not-started count
    console.log(`[STAT BADGE DEBUG] Not started count = ${notStartedCount}`);
    console.log(`[STAT BADGE DEBUG] First few not-started items:`, 
      notStartedItems.slice(0, 3).map(item => ({
        serialNumber: item.serialNumber,
        orderNumber: item.orderNumber,
        statusDates: item.statusChangeDates ? Object.keys(item.statusChangeDates).length : 0
      }))
    );
    
    return (
      <div className="flex flex-wrap gap-1 items-center mb-0.5 bg-gray-50 p-2 rounded-md relative z-50"
           style={{ position: 'relative', zIndex: 100 }}>
           
        {/* Order Sorting Button (kompakte versie) - verplaatst uit tabelheader */}
        <Button 
          variant="outline" 
          className={cn(
            "h-7 p-1 rounded-md shadow-sm touch-target flex items-center",
            "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border border-[#015a6c]",
            newestFirst ? "bg-[#015a6c] text-white" : "bg-white"
          )}
          title={newestFirst ? "Nieuwste orders eerst (N→O)" : "Oudste orders eerst (O→N)"}
          onClick={() => setNewestFirst(!newestFirst)}
        >
          <span className="text-xs">{newestFirst ? "N→O" : "O→N"}</span>
        </Button>
        


        {/* Toon Selectie Knop - alleen icoon versie */}
        <Button 
          variant="outline" 
          className={cn(
            "h-7 w-7 p-0 rounded-md shadow-sm touch-target",
            "border border-[#3b82f6]",
            showOnlySelected 
              ? "bg-[#3b82f6] text-white hover:bg-[#60a5fa]" 
              : "bg-white text-[#3b82f6] hover:bg-[#eff6ff]"
          )}
          title={showOnlySelected ? "Toon alle items" : "Toon alleen geselecteerde items"}
          onClick={() => {
            // Alleen activeren als er iets geselecteerd is
            if (!showOnlySelected && selectedItemIds.size === 0) {
              toast({
                title: "Geen items geselecteerd",
                description: "Selecteer eerst een of meer items met de checkboxes",
                variant: "warning",
              });
              return;
            }
            
            // Toggle de weergave
            console.log(`BUTTON CLICK: showOnlySelected was ${showOnlySelected}, changing to ${!showOnlySelected}`);
            console.log(`BUTTON CLICK: selectedItemIds has ${selectedItemIds.size} items`);
            
            // Log wat selected items we hebben
            if (selectedItemIds.size > 0) {
              console.log("Selected item IDs:", Array.from(selectedItemIds));
            }
            
            // State updaten
            setShowOnlySelected(!showOnlySelected);
            console.log("State updated, filter should be applied now");
          }}
        >
          <CheckSquare className="h-3 w-3" />
        </Button>
        
        {/* Reseller Filter Dropdown (kompakte versie) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "h-7 w-7 p-0 rounded-md shadow-sm touch-target",
                "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border border-[#015a6c]",
                resellerFilter !== null ? "bg-[#015a6c] text-white" : "bg-white"
              )}
              title="Filter op reseller"
            >
              <Users2 className="h-3 w-3" />
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
            <DropdownMenuItem disabled>Resellers feature disabled</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        

        
        {/* Type Filter (kompakte versie) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "h-7 w-7 p-0 rounded-md shadow-sm touch-target",
                "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border border-[#015a6c]",
                typeFilter !== null ? "bg-[#015a6c] text-white" : "bg-white"
              )}
              title="Filter op instrumenttype"
            >
              <Wind className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-48" 
            align="start"
            onClick={(e) => {
              e.stopPropagation(); // Voorkom dat de click doorgaat naar onderliggende elementen
              console.log("TYPE DROPDOWN CONTENT KLIK ONDERSCHEPT");
            }}
            style={{ pointerEvents: 'auto' }} // Zorg dat de klikevents worden opgevangen
          >
            <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div 
              className={cn("relative rounded cursor-pointer hover:bg-blue-50 pl-2 py-2", !typeFilter ? "bg-blue-50" : "")}
              onClick={(e) => {
                e.stopPropagation();
                console.log("TYPE FILTER RESET");
                setTypeFilterSafe(null);
              }}
            >
              <div className="flex items-center">
                <Check className={cn("mr-2 h-4 w-4", !typeFilter ? "opacity-100" : "opacity-0")} />
                <span>All Types</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            {uniqueTypes.map((type) => (
              <div
                key={type}
                className={cn("relative rounded cursor-pointer hover:bg-blue-50 pl-2 py-2", typeFilter === type ? "bg-blue-50" : "")}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`TYPE FILTER GESELECTEERD: ${type}`);
                  // If already selected, clear the filter, otherwise set it
                  const newValue = typeFilter === type ? null : type;
                  setTypeFilterSafe(newValue);
                }}
              >
                <div className="flex items-center">
                  <Check className={cn("mr-2 h-4 w-4", typeFilter === type ? "opacity-100" : "opacity-0")} />
                  <span>{type}</span>
                </div>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Tuning Filter (kompakte versie) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "h-7 w-7 p-0 rounded-md shadow-sm touch-target",
                "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border border-[#015a6c]",
                tuningFilter !== null ? "bg-[#015a6c] text-white" : "bg-white"
              )}
              title="Filter op stemming"
            >
              <Music className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-48 z-[9999] max-h-80 overflow-y-auto"
            onClick={(e) => {
              e.stopPropagation(); // Voorkom dat de click doorgaat naar onderliggende elementen
              console.log("TUNING DROPDOWN CONTENT KLIK ONDERSCHEPT");
            }}
            style={{ pointerEvents: 'auto' }} // Zorg dat de klikevents worden opgevangen
          >
            <DropdownMenuLabel>Filter by Tuning</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="relative rounded cursor-pointer hover:bg-blue-50 pl-2 py-2" 
                 onClick={(e) => {
                   e.stopPropagation();
                   console.log("TUNING FILTER RESET");
                   setTuningFilter(null);
                 }}>
              <div className="flex items-center">
                <Check className={cn("mr-2 h-4 w-4", tuningFilter === null ? "opacity-100" : "opacity-0")} />
                <span>All Tunings</span>
              </div>
            </div>
            {uniqueTunings.map(tuning => (
              <div 
                key={tuning}
                className="relative rounded cursor-pointer hover:bg-blue-50 pl-2 py-2"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`TUNING FILTER GESELECTEERD: ${tuning}`);
                  setTuningFilter(tuning);
                }}
              >
                <div className="flex items-center">
                  <Check className={cn("mr-2 h-4 w-4", tuningFilter === tuning ? "opacity-100" : "opacity-0")} />
                  <span>{tuning}</span>
                </div>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Color Filter (kompakte versie) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "h-7 w-7 p-0 rounded-md shadow-sm touch-target",
                "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border border-[#015a6c]",
                colorFilters.length > 0 ? "bg-[#015a6c] text-white" : "bg-white"
              )}
              title="Filter op kleur"
            >
              <Palette className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-28" align="start">
            <div className="p-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-xs">Colors</span>
                {colorFilters.length > 0 && (
                  <button 
                    className="text-xs text-blue-600 hover:text-blue-800" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setColorFilters([]);
                    }}
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="space-y-1">
                {['B', 'SB', 'T', 'TB', 'C'].map((colorCode) => {
                  const isSelected = colorFilters.includes(colorCode);
                  return (
                    <div key={colorCode} className="flex items-center mb-1 space-x-2">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
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
                            if (isSelected) {
                              setColorFilters(colorFilters.filter(c => c !== colorCode));
                            } else {
                              setColorFilters([...colorFilters, colorCode]);
                            }
                          }}
                          className={getColorClass(colorCode)}
                        >
                          {colorCode === 'CARDS' ? '' : colorCode}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Status Filter (kompakte versie) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className={cn(
                "h-7 w-7 p-0 rounded-md shadow-sm touch-target",
                "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border border-[#015a6c]",
                statusFilter !== null ? "bg-[#015a6c] text-white" : "bg-white"
              )}
              title="Filter op status"
            >
              <ListTodo className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-48 z-[9999] max-h-80 overflow-y-auto" 
            onClick={(e) => {
              e.stopPropagation(); // Voorkom dat de click doorgaat naar onderliggende elementen
              console.log("STATUS DROPDOWN CONTENT KLIK ONDERSCHEPT");
            }}
            style={{ pointerEvents: 'auto' }} // Zorg dat de klikevents worden opgevangen
          >
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="relative rounded cursor-pointer hover:bg-blue-50 pl-2 py-2" 
                 onClick={(e) => {
                   e.stopPropagation();
                   console.log("STATUS FILTER RESET");
                   setStatusFilter(null);
                 }}>
              <div className="flex items-center">
                <Check className={cn("mr-2 h-4 w-4", statusFilter === null ? "opacity-100" : "opacity-0")} />
                <span>All Statuses</span>
              </div>
            </div>
            {statusOptions.map(status => (
              <div 
                key={status.value}
                className="relative rounded cursor-pointer hover:bg-blue-50 pl-2 py-2"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`STATUS FILTER GESELECTEERD: ${status.value}`);
                  setStatusFilter(status.value);
                }}
              >
                <div className="flex items-center">
                  <Check className={cn("mr-2 h-4 w-4", statusFilter === status.value ? "opacity-100" : "opacity-0")} />
                  <span>{status.label}</span>
                </div>
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Small Next Instrument Banner - right after status filter */}
        <NextInstrumentBanner />
        
        {/* Clear All Filters Button (kompakte versie) - verwijdert nu ook zoekfilter */}
        {(typeFilter !== null || tuningFilter !== null || colorFilters.length > 0 || 
          resellerFilter !== null || statusFilter !== null || frequencyFilter !== null || searchFilter !== "") && (
          <Button 
            variant="outline" 
            className={cn(
              "h-7 w-7 p-0 rounded-md shadow-sm touch-target",
              "bg-[#F5F5F0] hover:bg-gray-100 text-gray-700 border border-gray-300"
            )}
            title="Alle filters wissen (inclusief zoekfilter)"
            onClick={clearAllFilters}
          >
            <XIcon className="h-3 w-3" />
          </Button>
        )}
        
        <div className="flex-grow"></div>
        

        
        {/* Statistics Buttons */}
        <div className="flex items-center gap-1">
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
              backgroundColor: '#015a6c',
              height: '28px' /* Match h-7 (28px) of other buttons */
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
              backgroundColor: '#C26E50',
              height: '28px' /* Match h-7 (28px) of other buttons */
            }}
            title="Items to build"
            className="flex items-center justify-center"
          >
            <ClipboardList className="h-3 w-3 mr-1" />
            {itemsCount}
          </span>
          
          {/* Instruments To Build Button - Kleur 3: emerald/groen */}
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
              backgroundColor: '#059669', /* emerald-600 */
              height: '28px' /* Match h-7 (28px) of other buttons */
            }}
            title="Aantal instrumenten dat nog gebouwd moet worden"
            className="flex items-center justify-center"
          >
            <Construction className="h-3 w-3 mr-1" />
            {notStartedCount}
          </span>
          
          {/* Average Wait Time Button - Kleur 4: grijs */}
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
              justifyContent: 'center',
              height: '28px' /* Match h-7 (28px) of other buttons */
            }}
            title="Gemiddelde wachttijd berekend over voltooide orders uit afgelopen 6 maanden"
          >
            <TimerIcon className="h-3 w-3 mr-1" />
            <WaitTimeDisplay allOrders={allOrders} />
          </div>
          
          {/* Non-Working Period button - na de statistiekknoppen */}
          <Button 
            variant="outline" 
            className={cn(
              "h-7 w-7 p-0 ml-1 rounded-md shadow-sm touch-target",
              "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border border-[#015a6c]"
            )}
            onClick={() => setShowNonWorkingForm(true)}
            title="Track Non-Working Period"
          >
            <Calendar className="h-3 w-3" />
          </Button>

          {/* Sync Controls - rechts van de statistiekknoppen */}
          <div className="flex items-center">
            {/* Sync Period Dropdown (kompakte versie) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-7 w-7 p-0 mr-1 rounded-md shadow-sm touch-target bg-white border-[#C26E50] text-[#C26E50] hover:bg-gray-50"
                  title="Synchronisatieperiode"
                >
                  <Clock className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Synchronisatie Periode</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => localStorage.setItem('syncPeriod', '1week')}>
                  <Check className={cn("mr-2 h-4 w-4", localStorage.getItem('syncPeriod') === '1week' ? "opacity-100" : "opacity-0")} />
                  Laatste week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => localStorage.setItem('syncPeriod', '1month')}>
                  <Check className={cn("mr-2 h-4 w-4", (localStorage.getItem('syncPeriod') === '1month' || !localStorage.getItem('syncPeriod')) ? "opacity-100" : "opacity-0")} />
                  Laatste maand
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => localStorage.setItem('syncPeriod', '3months')}>
                  <Check className={cn("mr-2 h-4 w-4", localStorage.getItem('syncPeriod') === '3months' ? "opacity-100" : "opacity-0")} />
                  Laatste 3 maanden
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => localStorage.setItem('syncPeriod', '6months')}>
                  <Check className={cn("mr-2 h-4 w-4", localStorage.getItem('syncPeriod') === '6months' ? "opacity-100" : "opacity-0")} />
                  Laatste 6 maanden
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => localStorage.setItem('syncPeriod', '1year')}>
                  <Check className={cn("mr-2 h-4 w-4", localStorage.getItem('syncPeriod') === '1year' ? "opacity-100" : "opacity-0")} />
                  Laatste jaar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => localStorage.setItem('syncPeriod', 'all')}>
                  <Check className={cn("mr-2 h-4 w-4", localStorage.getItem('syncPeriod') === 'all' ? "opacity-100" : "opacity-0")} />
                  Alles
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Sync Button */}
            <Button 
              variant="default" 
              size="sm"
              onClick={async () => {
                // Get the selected sync period from localStorage (default to 1month)
                const syncPeriod = localStorage.getItem('syncPeriod') || '1month';
                
                toast({
                  title: "Syncing with Shopify...",
                  description: `Checking for orders (periode: ${
                    syncPeriod === '1week' ? 'laatste week' : 
                    syncPeriod === '1month' ? 'laatste maand' : 
                    syncPeriod === '3months' ? 'laatste 3 maanden' : 
                    syncPeriod === '6months' ? 'laatste 6 maanden' :
                    syncPeriod === '1year' ? 'laatste jaar' : 'alle orders'
                  })`,
                });
                
                try {
                  // Import from Shopify with selected period
                  const result = await syncShopifyOrders(syncPeriod);
                  
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
              className="bg-[#C26E50] hover:bg-[#B05E40] text-white font-condensed text-xs h-7 px-2 sync-button"
              disabled={!isOnline}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              SYNC
            </Button>
          </div>
          
          {/* Original large next item banner removed */}
        </div>
      </div>
    );
  };
  
  // Helper to check if a status is completed
  const isStatusComplete = (order: Order | OrderItem, status: string) => {
    // Voor debug doeleinden, log welke status we controleren
    console.log(`isStatusComplete check voor ${('serialNumber' in order ? order.serialNumber : 'order')}: status=${status}`);
    
    // Mapping van UI statusnamen naar database velden
    const statusMapping: Record<string, string> = {
      'parts': 'parts', 
      'prepared': 'prepared',
      'build': 'building',  // UI toont 'Build' maar database veld is 'building'
      'building': 'building',
      'dry': 'dry',
      'terrasigillata': 'terrasigillata', // Nieuwe TS stap
      'firing': 'firing', 
      'smokefiring': 'smokefiring',  // Nieuwe SM stap
      'smoothing': 'smoothing',      // Oude naam behouden voor compatibiliteit
      'tuning1': 'tuning1',
      'waxing': 'waxing',
      'tuning2': 'tuning2',
      'bagging': 'bagging',
      'boxing': 'boxing',
      'labeling': 'labeling',
      'testing': 'testing',
      'validated': 'validated'
    };
    
    // Vertaal status naar de juiste database veldnaam als er een mapping is
    const dbField = statusMapping[status] || status;
    
    // Log wat we aan het controleren zijn
    console.log(`Status '${status}' wordt gecontroleerd als veld '${dbField}' in statusChangeDates`);
    
    // For all statuses, ONLY return true if they have been explicitly marked in statusChangeDates
    // This makes all checkboxes start unchecked by default, even 'ordered' checkbox
    if (order.statusChangeDates && order.statusChangeDates[dbField]) {
      console.log(`Status '${dbField}' is COMPLEET voor ${('serialNumber' in order ? order.serialNumber : 'order')}`);
      return true;
    }
    
    // Special case for DRY status - auto-checked after 5 days from BUILD date
    if (status === 'dry' && isDry(order).isDryEnough) {
      return true;
    }
    
    // Special case for SM (smoothing) checkbox - auto-checked for smoke-fired colors (SB, T, TB, C)
    if (status === 'smoothing' || status === 'smokefiring') {
      // Check if it's a CARDS product (don't auto-check)
      const type = getTypeFromSpecifications(order);
      const isCards = type?.toUpperCase().includes('CARDS');
      
      if (isCards) {
        return false;
      }
      
      // Auto-check if this is one of the smoke-fired colors (SB, T, TB, C)
      if (needsSmokeFiring(order)) {
        // Make this auto-check more visible in the UI for testing
        console.log(`Auto-checking ${status} checkbox for smoke-fired color:`, getColorFromSpecifications(order));
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
  
  // Handle updating box weight for an item
  const handleBoxWeightChange = (itemId: number, weight: string) => {
    console.log(`Updating item ${itemId} box weight to ${weight}`);
    
    try {
      // Find the item to update
      const itemIndex = allOrderItems.findIndex(i => i.id === itemId);
      if (itemIndex === -1) {
        console.error(`Item with ID ${itemId} not found in allOrderItems`);
        return;
      }
      
      const itemToUpdate = allOrderItems[itemIndex];
      const newItems = [...allOrderItems];
      
      // Create the update data
      const updateData = {
        weight: weight
      };
      
      // Create updated item
      const updatedItem = {
        ...itemToUpdate,
        ...updateData
      };
      
      // Replace the item in our local array
      newItems[itemIndex] = updatedItem;
      
      // Update the cache immediately for UI responsiveness
      queryClient.setQueryData(['/api/order-items'], newItems);
      
      // Use offline mode to handle the update
      updateOfflineOrderItem(itemId, updateData)
        .then(() => {
          console.log(`Successfully updated item ${itemId} box weight in offline storage`);
          
          // Refetch to ensure data is fresh
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ['/api/order-items'] });
          }, 500);
        })
        .catch(err => console.error(`Failed to update item ${itemId} box weight in offline storage:`, err));
      
    } catch (error) {
      console.error(`Error updating box weight for item ${itemId}:`, error);
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
      
      // Voeg debug log toe om te zien welke status wordt bijgewerkt
      console.log(`Status update voor item ${item.serialNumber}: status '${status}' naar ${checked ? 'checked' : 'unchecked'}`);
      
      // Voor de 'build' status, converteer naar de juiste database veldnaam 'building'
      let dbFieldName = status;
      if (status === 'build') {
        dbFieldName = 'building';
        console.log(`Status 'build' geconverteerd naar database veld 'building'`);
      }
      
      // Debug log voor de status value
      console.log(`Status filter: ${status}, DB field name: ${dbFieldName}`);
      
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
      
      // Update the status change dates - gebruik dbFieldName in plaats van status voor database opslag
      const updatedDates = {...(itemToUpdate.statusChangeDates || {})};
      if (checked) {
        updatedDates[dbFieldName] = new Date().toISOString();
        console.log(`Status aangevinkt: veld '${dbFieldName}' toegevoegd aan statusChangeDates`);
      } else {
        delete updatedDates[dbFieldName];
        console.log(`Status uitgevinkt: veld '${dbFieldName}' verwijderd uit statusChangeDates`);
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
        .then(() => {
          console.log(`Successfully updated item ${itemId} status ${status} in offline storage`);
          
          // Simply refetch the data without complex invalidation
          // This will ensure NextInstrumentBanner gets fresh data
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ['/api/order-items'] });
          }, 500); // Small delay to ensure the server has processed the update
        })
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
    console.log(`Updating ${materialType} for ${isOrder ? 'order' : 'item'} ${id} with info:`, materialInfo);
    
    // Force UI to refresh immediately
    forceRefreshMaterials();
    // Extra refresh to ensure components update
    setMaterialUpdateCount(prevCount => prevCount + 1);
    
    // Create a toast to indicate update in progress
    toast({
      title: `Updating ${materialType}`,
      description: `Saving new ${materialType} selection...`,
      duration: 2000
    });
    
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
      
      // Make the server request and force refresh
      updateOfflineOrder(id, { specifications: updatedSpecs })
        .then(() => {
          console.log("Order specifications updated successfully");
          // Force immediate refresh of the data
          queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
          // Force immediate refresh of the material components
          setMaterialUpdateCount(prev => prev + 10); // Use a larger increment to ensure change detection
          // Force a global UI refresh immediately
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ['/api/orders'] });
            queryClient.refetchQueries({ queryKey: ['/api/order-items'] });
            forceRefreshMaterials();
          }, 50);
        })
        .catch(error => {
          console.error("Failed to update order specifications:", error);
        });
      
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
      
      // Make the server request and force refresh
      updateOfflineOrderItem(id, { specifications: updatedSpecs })
        .then(() => {
          console.log("Item specifications updated successfully");
          // Force immediate refresh of the data
          queryClient.invalidateQueries({ queryKey: ['/api/order-items'] });
          // Force immediate refresh of the material components
          setMaterialUpdateCount(prev => prev + 10); // Use a larger increment to ensure change detection
          // Force a global UI refresh immediately
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: ['/api/orders'] });
            queryClient.refetchQueries({ queryKey: ['/api/order-items'] });
            forceRefreshMaterials();
          }, 50);
        })
        .catch(error => {
          console.error("Failed to update item specifications:", error);
        });
      
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
    // KRITISCHE FIX: Expliciet casten naar number om inconsistenties te voorkomen
    const orderItemCount = orderItems.filter(item => Number(item.orderId) === Number(order.id)).length;
    console.log(`Order ${order.orderNumber} (ID: ${order.id}) heeft ${orderItemCount} items`);
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
  
  // Isolatie functionaliteit is verwijderd
  
  // Toggle selection for a specific item - for highlighting individual items being worked on
  const toggleItemSelection = (itemId: number, event?: React.MouseEvent) => {
    // Prevent event bubbling if provided
    if (event) {
      event.stopPropagation();
    }
    
    setSelectedItemIds(prevIds => {
      // Maak een nieuwe Set gebaseerd op de oude Set
      const newSet = new Set(prevIds);
      if (newSet.has(itemId)) {
        // Verwijder het item als het al geselecteerd is
        newSet.delete(itemId);
      } else {
        // Voeg het item toe als het niet geselecteerd is
        newSet.add(itemId);
      }
      return newSet;
    });
  };
  
  // Clear all item selections
  const clearSelection = () => {
    setSelectedItemIds(new Set());
  };
  
  // Save selection state to localStorage
  useEffect(() => {
    localStorage.setItem('selectedItemIds', JSON.stringify(Array.from(selectedItemIds)));
  }, [selectedItemIds]);
  
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
                  // KRITISCHE FIX: Expliciet casten naar number voor consistentie
                  const items = orderItems.filter(item => Number(item.orderId) === Number(selectedOrder.id));
                  
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
                    
                    {/* Urgent Order Toggle */}
                    <div className="rounded-md border p-3 bg-gray-50">
                      <div className="text-sm font-medium text-gray-700 mb-2">Priority</div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`urgent-${selectedOrder?.id}`}
                          checked={selectedOrder?.isUrgent || false}
                          onCheckedChange={async (checked) => {
                            if (!selectedOrder) return;
                            
                            try {
                              const response = await fetch(`/api/orders/${selectedOrder.id}/urgent`, {
                                method: 'PATCH',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ isUrgent: checked }),
                              });
                              
                              if (!response.ok) {
                                throw new Error('Failed to update urgent status');
                              }
                              
                              // Get the updated order data from the response
                              const updatedOrder = await response.json();
                              
                              // Update the local cache immediately
                              queryClient.setQueryData(['/api/orders'], (old: Order[] | undefined) => {
                                if (!old) return old;
                                return old.map(order => {
                                  if (order.id === selectedOrder.id) {
                                    return { ...order, isUrgent: checked };
                                  }
                                  return order;
                                });
                              });
                              
                              // Also update the selectedOrder state to reflect the change
                              setSelectedOrder(prev => prev ? { ...prev, isUrgent: checked } : prev);
                              
                              // Refresh orders data to ensure consistency
                              queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
                              
                              toast({
                                title: checked ? "Order marked as urgent" : "Order marked as normal priority",
                                description: `Order ${selectedOrder.orderNumber} priority updated`,
                                duration: 2000
                              });
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to update order priority",
                                variant: "destructive",
                                duration: 3000
                              });
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <label 
                          htmlFor={`urgent-${selectedOrder?.id}`} 
                          className="text-sm cursor-pointer select-none"
                        >
                          Mark as urgent order
                        </label>
                      </div>
                      {selectedOrder?.isUrgent && (
                        <div className="mt-1 text-xs text-red-600 font-medium">
                          🚨 This order will appear at the top of the list
                        </div>
                      )}
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
        
        <div className="flex gap-2 items-center order-first">
          {/* Isolatie indicator is verwijderd */}
          
          {/* Order selection indicator removed */}
          
          {/* Smart filter indicator removed as it's redundant with the filter bar */}
          
          {/* Zoekbalk, Calendar knop, Range knop en Sync knop zijn verplaatst naar de filterbalk */}
        </div>
      </div>
      {/* WorksheetFilters component */}
      <WorksheetFiltersNew
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
        newestFirst={newestFirst}
        setNewestFirst={setNewestFirst}
        resellers={resellers || []}
        uniqueTypes={filterOptions.types}
        uniqueTunings={filterOptions.tunings}
        uniqueColors={filterOptions.colors}
        uniqueFrequencies={filterOptions.frequencies}
        statusOptions={statusOptions}
        isOnline={isOnline}
        showOnlySelected={showOnlySelected}
        setShowOnlySelected={setShowOnlySelected}
        hasSelectedItems={hasSelectedItems}
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
          <TableHeader className="z-10">
            <TableRow className="divide-x divide-gray-300 border-b-2 border-white h-12 sticky top-0">
              <TableHead className="sticky-header sticky left-0 top-0 bg-[#015a6c] text-white p-1 whitespace-nowrap min-w-[90px] z-50 font-condensed text-center">
                <div className="flex items-center justify-center">
                  <span className="text-white font-bold">Order</span>
                </div>
                {/* Filtered order count moved to filter bar */}
              </TableHead>
              
              <TableHead className="sticky-header sticky top-0 bg-[#015a6c] text-white p-1 whitespace-nowrap min-w-[35px] z-40 text-center font-condensed">
                <span className="sr-only">Selecteer</span>
                <Check className="h-4 w-4 inline-block text-white" />
              </TableHead>
              
              <TableHead className="sticky-header sticky top-0 bg-[#015a6c] text-white p-1 whitespace-nowrap min-w-[55px] z-40 font-condensed text-center">
                <span className="text-white font-bold">Waiting</span>
              </TableHead>
              <TableHead className="sticky-header sticky top-0 bg-[#015a6c] text-white p-1 whitespace-nowrap min-w-[120px] z-40 font-condensed text-center">
                <span className="text-white font-bold">Type</span>
              </TableHead>
              <TableHead className="sticky-header sticky top-0 bg-[#015a6c] text-white p-1 whitespace-nowrap min-w-[45px] z-40 font-condensed text-center">
                <span className="text-white font-bold">Color</span>
              </TableHead>
              {/* We've removed Tuning, Hz, and Reseller columns as requested */}
              
              {/* Status columns */}
              {statusColumns.map(col => (
                <TableHead 
                  key={col.id} 
                  className="sticky-header sticky top-0 text-center bg-[#015a6c] text-white p-1 whitespace-nowrap min-w-[28px] z-[110] font-condensed"
                  style={{ 
                    width: col.width ? `${col.width}px` : undefined,
                    minWidth: col.width ? `${col.width}px` : undefined,
                    maxWidth: col.width ? `${col.width}px` : undefined
                  }}
                >
                  <span className="text-white font-bold">{col.label}</span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-300">
            {isLoadingOrders || isLoadingOrderItems ? (
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
              // VOLLEDIGE HERZIENING VAN WEERGAVELOGICA OM HET BILLY-ORDERS PROBLEEM PERMANENT OP TE LOSSEN
              // Group by order for visual organization and apply sorting
              // VERBETERD: Bouw nieuwe, volledig gecontroleerde groepen voor elk orderId
              ((() => {
                console.log(`BUILDLIST RENDERING START: Processing ${filteredOrderItems.length} items`);
                // Maak een nieuwe genormaliseerde versie van filteredOrderItems
                const normalizedItems = filteredOrderItems.map(item => {
                  // Garandeer dat orderId ALTIJD een nummer is
                  const normalizedItem = { ...item };
                  
                  // Negeer het originele type, dwing altijd nummer af
                  normalizedItem.orderId = typeof item.orderId === 'string' 
                    ? parseInt(item.orderId) 
                    : item.orderId;
                  
                  return normalizedItem;
                });
                
                // KRITISCHE FIX: We gebruiken ALLEEN DE GEFILTERDE items!
                // Alleen werken met de items die door alle filters zijn gekomen
                const onlyFilteredItems = normalizedItems;
                
                // Nu groeperen we ALLEEN de gefilterde items
                const groupedItems = onlyFilteredItems.reduce((groups, item) => {
                  // We gebruiken een string als key voor het object (vereist in JavaScript)
                  const orderIdStr = String(item.orderId);
                  
                  // Init array voor deze order als die nog niet bestaat
                  if (!groups[orderIdStr]) {
                    groups[orderIdStr] = [];
                  }
                  
                  // Voeg item toe aan de juiste groep
                  groups[orderIdStr].push(item);
                  return groups;
                }, {} as Record<string, OrderItem[]>);
                
                // BELANGRIJKE DIAGNOSE: Logt een exacte telling van wat er getoond gaat worden
                const orderCount = Object.keys(groupedItems).length;
                const itemCount = Object.values(groupedItems).reduce((sum, items) => sum + items.length, 0);
                
                console.log(`BUILDLIST RENDERING: Showing exactly ${orderCount} orders with ${itemCount} items in buildlist`);
                
                // We geven de grouped items terug
                return Object.entries(groupedItems);
              })()
              // Sort the grouped items by order number according to the sort setting
              .sort((a, b) => {
                const orderIdA = parseInt(a[0]);
                const orderIdB = parseInt(b[0]);
                
                // Find the corresponding orders
                // KRITISCHE FIX: Forceer expliciete type conversie naar number voor alle vergelijkingen
                const orderA = allOrders.find(order => Number(order.id) === Number(orderIdA));
                const orderB = allOrders.find(order => Number(order.id) === Number(orderIdB));
                
                if (!orderA || !orderB) return 0;
                
                // URGENT ORDER PRIORITIZATION: Urgent orders always come first
                if (orderA.isUrgent && !orderB.isUrgent) return -1;
                if (!orderA.isUrgent && orderB.isUrgent) return 1;
                
                // If both are urgent or both are normal, sort by order number
                const orderNumberA = parseInt(orderA.orderNumber?.replace(/\D/g, '') || '0');
                const orderNumberB = parseInt(orderB.orderNumber?.replace(/\D/g, '') || '0');
                
                // Apply sorting based on newestFirst setting (same logic as in allOrders sorting)
                return newestFirst ? (orderNumberB - orderNumberA) : (orderNumberA - orderNumberB);
              })
              .map(([orderId, items]) => {
                // KRITISCHE FIX: Expliciete type conversie naar number voor consistentie
                const order = allOrders.find(order => Number(order.id) === Number(orderId));
                if (!order) return null; // Skip if parent order not found
                
                // For multi-item orders, we need to properly sort by numerical suffix
                // This ensures consistent display order regardless of how they're stored in the database
                if (items.length > 1) {
                  // In React, we need to replace the array entirely to trigger a re-render
                  // with the new sorted items, so we need to create a sorted copy
                  const sortedItems = [...items].sort((a, b) => {
                    // Skip if missing serial numbers
                    if (!a.serialNumber || !b.serialNumber) return 0;
                    
                    // Natural sort algorithm that handles numeric parts correctly
                    // This will work for ANY serial number pattern with numeric suffixes
                    return naturalSort(a.serialNumber, b.serialNumber);
                  });
                  
                  // Replace all items in the original array with the sorted ones
                  items.length = 0;
                  sortedItems.forEach(item => items.push(item));
                }
                
                // Natural sort function that handles numeric values properly
                // This is a generic implementation that works for all serial number formats
                function naturalSort(a: string, b: string): number {
                  // Split strings into chunks of text and numbers
                  const aParts = a.split(/(\d+)/).filter(Boolean);
                  const bParts = b.split(/(\d+)/).filter(Boolean);
                  
                  // Compare each chunk
                  const len = Math.min(aParts.length, bParts.length);
                  
                  for (let i = 0; i < len; i++) {
                    // If both chunks are numeric, compare as numbers
                    if (!isNaN(Number(aParts[i])) && !isNaN(Number(bParts[i]))) {
                      const diff = parseInt(aParts[i], 10) - parseInt(bParts[i], 10);
                      if (diff !== 0) return diff;
                    } 
                    // Otherwise compare as strings
                    else if (aParts[i] !== bParts[i]) {
                      return aParts[i].localeCompare(bParts[i]);
                    }
                  }
                  
                  // If we get here, the common parts are equal, so the longer one is greater
                  return aParts.length - bParts.length;
                }
                
                // Handle orders with zero items (which shouldn't happen with our filtering)
                if (items.length === 0) {
                  return (
                    <TableRow 
                      key={order.id} 
                      className={`hover:bg-gray-50 divide-x border-b border-dotted ${isOrderSelected(order.id) ? 'selected-row bg-gray-200' : order.id % 2 === 0 ? 'bg-[#FCFCFB]' : 'bg-[#F5F5F0]'}`}>
                      <TableCell 
                        className={`font-bold sticky left-0 p-1 whitespace-nowrap z-20 ${
                          order.isUrgent ? 'bg-red-600' : 
                          order.isReseller ? 'bg-[#59296e]' : 'bg-[#015a6c]'
                        } align-top cursor-pointer order-number-cell`}
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
                        className={`p-1 whitespace-nowrap text-center ${isOrderSelected(order.id) ? 'bg-gray-200' : (order.id % 2 === 0 ? 'bg-[#FCFCFB]' : 'bg-[#F5F5F0]')}`}
                      >
                        <Checkbox
                          checked={isOrderSelected(order.id)}
                          onCheckedChange={(checked) => {
                            // Voor orders zonder items hoeft er niets te gebeuren
                            if (items.length === 0) return;
                            
                            // In de nieuwe implementatie, selecteer/deselecteer alle items van deze order
                            const itemsInOrder = filteredOrderItems.filter(item => item.orderId === order.id);
                            
                            if (isOrderSelected(order.id)) {
                              // Deselecteer alle items van deze order
                              setSelectedItemIds(prevIds => {
                                const newSet = new Set(prevIds);
                                // Verwijder alle items van deze order uit de set
                                itemsInOrder.forEach(item => {
                                  newSet.delete(item.id);
                                });
                                return newSet;
                              });
                            } else {
                              // Selecteer alle items van deze order
                              setSelectedItemIds(prevIds => {
                                const newSet = new Set(prevIds);
                                // Voeg alle items van deze order toe aan de set
                                itemsInOrder.forEach(item => {
                                  newSet.add(item.id);
                                });
                                return newSet;
                              });
                            }
                          }}
                          className="touch-target h-7 w-7 cursor-pointer border-blue-500"
                          style={{ 
                            '--tw-ring-color': '#3b82f6', 
                            backgroundColor: isOrderSelected(order.id) ? '#3b82f6' : 'transparent'
                          } as React.CSSProperties}
                          title={isOrderSelected(order.id) ? "Deselecteer alle items in deze order" : "Selecteer alle items in deze order"}
                        />
                      </TableCell>
                      <TableCell className={`font-medium p-1 whitespace-nowrap text-center text-lg ${isOrderSelected(order.id) ? 'bg-gray-200' : (order.id % 2 === 0 ? 'bg-[#FCFCFB]' : 'bg-[#F5F5F0]')}`}>
                        <div className="flex flex-col items-center">
                          {typeof getDaysSinceOrder(order.orderDate) === 'number' && (
                            <span className={`px-2 py-0.5 rounded ${getWaitingColorClass(getDaysSinceOrder(order.orderDate) as number)}`}>
                              {getDaysSinceOrder(order.orderDate)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={`p-1 whitespace-nowrap text-lg ${isOrderSelected(order.id) ? 'bg-gray-200' : (order.id % 2 === 0 ? 'bg-[#FCFCFB]' : 'bg-[#F5F5F0]')}`}>
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
                                <MoldNamePopover customerName={order.customerName} orderNumber={order.orderNumber} serialNumber={item.serialNumber} itemPosition={`${index+1}/${allOrderItems.filter(i => i.orderId === order.id).length}`} instrumentType={instrumentType} tuningNote={tuningNote || ''} frequency={freqValue} orderNotes={order.notes || ''} itemSpecifications={item.specifications || {}} calculatedColor={getWorksheetColorCode(item)}
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
                      <TableCell className={`p-1 whitespace-nowrap text-center ${isOrderSelected(order.id) ? 'bg-gray-200' : ''}`}>
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
                              className={`text-center p-1 text-sm ${isOrderSelected(order.id) ? 'bg-gray-200' : ''}`}
                              style={{ 
                                backgroundColor: isOrderSelected(order.id) ? '' : (index % 2 === 0 ? '#F5F5F0' : '#F9F0E8')
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
                                className={`text-center p-1 ${isOrderSelected(order.id) ? 'bg-gray-200' : ''}`}
                                style={{ 
                                  backgroundColor: isOrderSelected(order.id) ? '' : (index % 2 === 0 ? '#F5F5F0' : '#F9F0E8')
                                }}
                              >
                                {/* Clickable bag label that opens a dropdown */}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="w-full cursor-pointer">
                                      {bagInfo ? (
                                        isCardsProduct(order) ? (
                                          <span className="text-xs text-gray-400">No bag needed</span>
                                        ) : (
                                          <span className={`bag-label bag-${bagInfo.size} bag-${bagInfo.type}`}>
                                            <span className="font-bold text-white">
                                              {`${bagInfo.type.toUpperCase()} ${bagInfo.size.toUpperCase()}`}
                                            </span>
                                          </span>
                                        )
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
                            console.log(`Box info calculation with update count ${materialUpdateCount}`);
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
                            
                            // Add a key-based render trigger that depends on materialUpdateCount
                            console.log(`Box component rendering with update count: ${materialUpdateCount}`);
                            
                            // All available box sizes
                            const boxSizes = ['20x20x20', '30x30x30', '35x35x35', '40x40x40', '50x50x50', '15x15x15', '12x12x30', 
                              '35x35x35', '40x40x60', 'Envelope'];
                            
                            return (
                              <TableCell 
                                key={col.id} 
                                className={`text-center p-1 ${isOrderSelected(order.id) ? 'bg-gray-200' : ''}`}
                                style={{ 
                                  backgroundColor: isOrderSelected(order.id) ? '' : (index % 2 === 0 ? '#F5F5F0' : '#F9F0E8')
                                }}
                              >
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button 
                                      className="w-full cursor-pointer"
                                      key={`box-btn-${order.id}-${item?.id || 'order'}-${materialUpdateCount}`} // Force re-render on materialUpdateCount change
                                    >
                                      {/* Adding the materialUpdateCount in a hidden way forces re-evaluation */}
                                      <span className="hidden">{materialUpdateCount}</span>
                                      {/* Go back to simpler approach that works */}
                                      {boxSize ? (
                                        <span id={`box-order-${order.id}`} className={`box-label ${getBoxSizeClass(boxSize)}`}>
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
                                              boxSize === size.replace(/X/g, 'x')
                                                ? 'bg-primary text-white'
                                                : 'bg-white hover:bg-gray-100'
                                            }`}
                                            onClick={() => {
                                              // Show a notification
                                              toast({
                                                title: "Updating box size to " + size,
                                                duration: 1000
                                              });
                                              
                                              // Go back to the original working implementation
                                              handleMaterialUpdate(
                                                order.id,
                                                true,
                                                'box',
                                                size
                                              );
                                              
                                              // Force a page reload after a short delay - this is the most reliable approach
                                              setTimeout(() => {
                                                console.log("Reloading page to ensure box updates are displayed");
                                                window.location.reload();
                                              }, 300);
                                            }}
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
                                (dryingStatus.isDryEnough && !isDryStatusPresent ? (<div 
                                  className="bg-[#f06923] rounded-md flex items-center justify-center mx-auto w-7 h-7 cursor-pointer"
                                  onClick={() => handleOrderStatusChange(order.id, col.id, true)}
                                  title="Ready to mark as dry (5+ days since BUILD)"
                                >
                                  <Check className="h-5 w-5 text-white" />
                                </div>) : // If it's still drying, show days remaining in orange pill
                                (!dryingStatus.isDryEnough && dryingStatus.daysRemaining !== null && !isDryStatusPresent) ? (
                                  <div 
                                    className="bg-orange-100 border-2 border-[#f06923] rounded-md flex items-center justify-center mx-auto w-7 h-7 cursor-pointer text-xs font-bold text-[#d25618]"
                                    title={`${dryingStatus.daysRemaining} day${dryingStatus.daysRemaining !== 1 ? 's' : ''} left to dry`}
                                  >
                                    {dryingStatus.daysRemaining}
                                  </div>
                                ) : (
                                  // If manually marked or already dried
                                  (<Checkbox
                                    checked={isStatusComplete(order, col.id)}
                                    onCheckedChange={(checked) => 
                                      handleOrderStatusChange(order.id, col.id, checked as boolean)
                                    }
                                    className="touch-target h-7 w-7 cursor-pointer !border-orange-500 !border-2"
                                    data-order-id={order.id}
                                    data-status={col.id}
                                  />)
                                ))
                              ) : (
                                // If not built yet, show disabled checkbox
                                (<Checkbox
                                  checked={false}
                                  className="touch-target h-7 w-7 !border-orange-500 !border-2 cursor-not-allowed opacity-50"
                                  disabled={true}
                                />)
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
                
                // KRITISCHE FIX: Toon ALLEEN de items die aan alle huidige filters voldoen
                // We gebruiken filteredOrderItems (alle reeds gefilterde items), niet alle items van deze order
                // Dit zorgt ervoor dat een multi-item order alleen de items toont die aan de filters voldoen
                // Get items for this order from the filtered items
                let itemsInThisOrder = filteredOrderItems.filter(item => item.orderId === order.id);
                
                // Log voor debug
                console.log(`MULTI-ITEM FIX: Order ${order.id} heeft ${itemsByOrder[order.id]?.length || 0} totale items, waarvan ${itemsInThisOrder.length} voldoen aan de filter criteria`);
                
                // KRITISCHE FIX: zorg ervoor dat we ALLEEN de items tonen die overeen komen met de huidige filters
                
                // Dit is de echte fix voor het multi-item order probleem:
                // 1. We gebruiken ALLEEN de items die eerst door alle filters gevalideerd zijn (filteredOrderItems)
                // 2. Daarna filteren we die lijst verder om alleen items voor deze specifieke order te tonen
                // 3. Zorg dat we GEEN dubbele serial numbers weergeven (dat was het probleem)
                
                // Debug log van items die aan de criteria voldoen
                console.log(`Order ${order.id}: Toont nu ${itemsInThisOrder.length}/${itemsByOrder[order.id]?.length || 0} items die aan ALLE filters voldoen`);
                
                // Universal approach for all orders
                // The prioritization logic for uniqueness:
                // 1. First try shopifyLineItemId - most reliable source of truth from Shopify
                // 2. Fall back to serialNumber if shopifyLineItemId is not available
                // 3. Final fallback to item.id if neither is available (shouldn't happen)
                
                // Using a map for uniqueness allows us to prioritize the keys
                const uniqueItemMap = new Map<string, OrderItem>();
                
                // Process all items and add them to our map with a carefully constructed unique key
                itemsInThisOrder.forEach(item => {
                    // Build a unique identifier from most reliable to least reliable source
                    // Priority: shopifyLineItemId > serialNumber > item.id
                    const uniqueKey = item.shopifyLineItemId 
                        ? `shopify-${item.shopifyLineItemId}` 
                        : (item.serialNumber 
                            ? `serial-${item.serialNumber}` 
                            : `id-${item.id}`);
                            
                    // Store in map - if duplicate keys, last one wins (shouldn't happen with shopifyLineItemId)
                    uniqueItemMap.set(uniqueKey, item);
                });
                
                // Convert map values back to array
                let uniqueItems = Array.from(uniqueItemMap.values());
                
                // Sort items by their serial number suffixes properly (if there are multiple items)
                if (uniqueItems.length > 1) {
                  uniqueItems.sort((a, b) => {
                    const aSerial = a.serialNumber || '';
                    const bSerial = b.serialNumber || '';
                    
                    // Extract numeric suffix after the dash (e.g., "1594-10" -> "10", "1594-2" -> "2")
                    const aSuffix = aSerial.split('-').pop() || '';
                    const bSuffix = bSerial.split('-').pop() || '';
                    
                    // If both are numeric, compare as numbers
                    if (/^\d+$/.test(aSuffix) && /^\d+$/.test(bSuffix)) {
                      return parseInt(aSuffix, 10) - parseInt(bSuffix, 10);
                    }
                    
                    // Otherwise, fall back to string comparison
                    return aSuffix.localeCompare(bSuffix);
                  });
                }
                
                // Sort the items using natural sort 
                // The naturalSort function is defined elsewhere in this file (around line 6777)
                if (uniqueItems.length > 1) {
                  uniqueItems = uniqueItems.sort((a, b) => {
                    // Extract the suffix part from the serial numbers (e.g. "1594-10" -> "10", "1594-2" -> "2")
                    const aSerial = a.serialNumber || '';
                    const bSerial = b.serialNumber || '';
                    
                    // Skip if missing serial numbers
                    if (!aSerial || !bSerial) return 0;
                    
                    // Use the natural sort helper defined elsewhere
                    // Extract the numeric suffix after the dash
                    const aSuffix = aSerial.split('-').pop() || '';
                    const bSuffix = bSerial.split('-').pop() || '';
                    
                    // Convert to numbers for proper numeric sorting (if they are numbers)
                    const aNum = /^\d+$/.test(aSuffix) ? parseInt(aSuffix, 10) : aSuffix;
                    const bNum = /^\d+$/.test(bSuffix) ? parseInt(bSuffix, 10) : bSuffix;
                    
                    // Compare numerically if both are numbers, otherwise fall back to string comparison
                    if (typeof aNum === 'number' && typeof bNum === 'number') {
                      return aNum - bNum; // Numeric sort
                    }
                    
                    // Fall back to string comparison if not both numbers
                    return String(aNum).localeCompare(String(bNum));
                  });
                }
                
                if (uniqueItems.length !== itemsInThisOrder.length) {
                    console.log(`Order ${order.orderNumber}: Filtered from ${itemsInThisOrder.length} to ${uniqueItems.length} unique items`);
                }
                
                if (uniqueItems.length !== itemsInThisOrder.length) {
                  console.log(`Order ${order.orderNumber}: Gefilterd van ${itemsInThisOrder.length} naar ${uniqueItems.length} unieke items`);
                }
                
                // Als geen items aan de criteria voldoen, toon de order niet
                if (uniqueItems.length === 0) {
                  return null;
                }
                
                // Log unique items for debugging (for all orders)
                if (process.env.NODE_ENV === 'development') {
                  console.log(`After filtering: ${uniqueItems.length} unique items from ${itemsInThisOrder.length} filtered items for order ${order.orderNumber}`);
                }
                
                return uniqueItems
                  .map((item, index) => (
                  <TableRow 
                    key={`${order.id}-${item.id}`}
                    className={`
  hover:bg-gray-50 
  divide-x 
  border-b border-dotted
  order-row
  ${isItemSelected(item.id) ? 'selected-row' : ''}
  ${uniqueItems.length > 1 ? 'multi-item-flat-row' : ''}
  order-item-${order.id}
  ${uniqueItems.length > 1 ? 'border-l-4 border-l-gray-300' : ''}
  ${index === 0 && uniqueItems.length > 1 ? 'border-t-2 border-t-gray-400' : ''}
  ${index === uniqueItems.length - 1 && uniqueItems.length > 1 ? 'border-b-2 border-b-gray-400' : ''}
`}
                    style={{
                      backgroundColor: getCellBackgroundColor(uniqueItems, order.id),
                      verticalAlign: 'middle'
                    }}
                  >
                        <TableCell 
                          className={`font-bold sticky left-0 p-1 whitespace-nowrap z-20 align-middle cursor-pointer order-number-cell ${
                            order.isUrgent === true
                              ? '' 
                              : (order.isReseller ? 'bg-[#59296e]' : 'bg-[#015a6c]')
                          }`}
                          style={{ 
                            zIndex: 20,
                            backgroundColor: order.isUrgent === true ? '#ff0000' : undefined,
                            color: order.isUrgent === true ? '#ffffff' : undefined
                          }}
                          onClick={() => handleOrderClick(order)}
                        >
                          <div className="flex flex-col pt-1">
                            <div className="flex items-center">
                              <span 
                                className="hover:underline"
                                style={{ 
                                  color: order.isUrgent === true ? '#ff0000' : '#ffffff',
                                  fontWeight: order.isUrgent === true ? '800' : 'bold'
                                }}
                              >
                                {showOrderNumbers ? (
                                  <span 
                                    style={{ 
                                      color: order.isUrgent === true ? '#ff0000' : 'inherit',
                                      fontWeight: order.isUrgent === true ? '800' : 'inherit'
                                    }}
                                  >
                                    {(() => {
                                      // Advanced logging only in development mode
                                      if (process.env.NODE_ENV === 'development' && item.shopifyLineItemId) {
                                        console.log(`Serial Debug: orderNumber=${order.orderNumber}, serialNumber=${item.serialNumber}, shopify_line_item_id=${item.shopifyLineItemId}`);
                                      }
                                      
                                      // For items with serial numbers, drop the "SW-" prefix
                                      if (item.serialNumber) {
                                        // Remove the -1 suffix for single item orders
                                        if (uniqueItems.length === 1 && item.serialNumber.endsWith('-1')) {
                                          return item.serialNumber.replace(/^SW-/, '').replace(/-1$/, '');
                                        }
                                        return item.serialNumber.replace(/^SW-/, '');
                                      }
                                      
                                      // Fallback to orderNumber-index if no serial number
                                      // For single item orders, don't add the -1 suffix
                                      if (uniqueItems.length === 1) {
                                        return order.orderNumber?.replace('SW-', '');
                                      }
                                      return `${order.orderNumber?.replace('SW-', '')}-${index + 1}`;
                                    })()}
                                  </span>
                                ) : ''}
                              </span>
                              
                              {/* Show reseller nickname with total items in numeric format without percentage symbols */}
                              {order.isReseller && (
                                order.resellerNickname ? (
                                  <span className="ml-1 text-xs bg-gray-500 text-white px-1 py-0.5 rounded font-bold">
                                    {order.resellerNickname} {uniqueItems.length > 1 ? uniqueItems.length : ''}
                                  </span>
                                ) : (
                                  <span className="ml-1 text-xs bg-gray-500 text-white px-1 rounded font-bold">{uniqueItems.length}</span>
                                )
                              )}
                              
                              {/* Notes indicator with green dot - comes before joint box */}
                              {order.notes && order.notes.trim() !== '' && (
                                <span 
                                  className="ml-1.5 inline-block h-2.5 w-2.5 rounded-full border border-white bg-[#22c55d]" 
                                  title={`This order has customer notes: "${order.notes.substring(0, 30)}${order.notes.length > 30 ? '...' : ''}"`}
                                ></span>
                              )}
                              
                              {/* Show total count for non-reseller multi-item orders */}
                              {!order.isReseller && uniqueItems.length > 1 && (
                                <span className="ml-1 text-xs bg-gray-500 text-white px-1 py-0.5 rounded font-bold">
                                  {`${uniqueItems.length}`}
                                </span>
                              )}
                            </div>
                            
                            {/* Removed extended order numbers from here - will show them in each row */}
                          </div>
                        </TableCell>

                        <TableCell 
                          
                          className={`p-1 whitespace-nowrap text-center align-middle`}
                          style={{ backgroundColor: getCellBackgroundColor(uniqueItems, order.id) }}
                        >
                          <div className="flex flex-col items-center">
                            <Checkbox
                              checked={isItemSelected(item.id)}
                              onCheckedChange={(checked) => {
                                toggleItemSelection(item.id);
                              }}
                              className="touch-target h-7 w-7 cursor-pointer border-blue-500"
                              title={isItemSelected(item.id) ? "Deselecteer dit item" : "Selecteer dit item"}
                            />
                          </div>
                        </TableCell>
                        <TableCell 
                          
                          className={`font-medium p-1 whitespace-nowrap text-center align-middle`}
                          style={{ backgroundColor: getCellBackgroundColor(uniqueItems, order.id) }}
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
                                <MoldNamePopover customerName={order.customerName} orderNumber={order.orderNumber} serialNumber={item.serialNumber} itemPosition={`${index+1}/${allOrderItems.filter(i => i.orderId === order.id).length}`} instrumentType={instrumentType} tuningNote={tuningNote || ''} frequency={freqValue} orderNotes={order.notes || ''} itemSpecifications={item.specifications || {}} calculatedColor={getWorksheetColorCode(item)}
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
                        {/* Color badge display with direct value capture */}
                        {(() => {
                          const colorCode = getWorksheetColorCode(item);
                          
                          // Store the actual displayed value for popup consistency
                          (item as any).__displayedColorCode = colorCode;
                          
                          // Extra debug for the storage
                          if (item.serialNumber === '1559-2' || item.serialNumber === 'SW-1559-2' || 
                              item.serialNumber === '1580-2' || item.serialNumber === 'SW-1580-2' ||
                              item.serialNumber?.includes('1559-2') || item.serialNumber?.includes('1580-2')) {
                            console.log("💾 BADGE STORAGE for", item.serialNumber, "storing:", colorCode);
                          }
                          
                          // Debug all items with serial containing 1559 to see what we have
                          if (item.serialNumber?.includes('1559')) {
                            console.log("🔍 FOUND 1559 ITEM:", item.serialNumber, "color:", colorCode);
                          }
                          
                          // Voor CARDS items helemaal geen kleurenbadge tonen
                          if (colorCode === 'CARDS' || colorCode === 'CA') {
                            return null; // Geen badge renderen
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
                          // Check if this is a CARDS item
                          const instrumentType = getTypeFromSpecifications(item) || getTypeFromSpecifications(order);
                          const isCardsItem = instrumentType?.toLowerCase().includes('card');
                          
                          // Voor CARDS items een lege cel tonen (net als bij BOX)
                          if (isCardsItem) {
                            return (
                              <TableCell 
                                key={col.id} 
                                className="text-center p-1 material-column"
                                style={{ 
                                  backgroundColor: index % 2 === 0 ? '#F5F5F0' : '#F9F0E8',
                                  zIndex: 10
                                }}
                              >
                                {/* Leeg veld voor CARDS items */}
                              </TableCell>
                            );
                          }
                          
                          // Normale weergave voor andere items - fetch bag info
                          // Use a direct call with materialUpdateCount as a key dependency
                          // This ensures re-calculation whenever materialUpdateCount changes
                          console.log(`Recomputing bag info after update count ${materialUpdateCount}`);
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
                                  <button 
                                    className="w-full cursor-pointer"
                                    key={`bag-btn-${order.id}-${item.id}-${materialUpdateCount}`} // Force re-render on materialUpdateCount change
                                  >
                                    {bagInfo ? (
                                      getTypeFromSpecifications(item)?.toUpperCase().includes('CARDS') ? (
                                        <span className="text-xs text-gray-400">No bag needed</span>
                                      ) : (
                                        <span className={`bag-label bag-${bagInfo.size} bag-${bagInfo.type}`}>
                                          <span className="font-bold text-white">
                                            {`${bagInfo.type.toUpperCase()} ${bagInfo.size.toUpperCase()}`}
                                          </span>
                                        </span>
                                      )
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
                                                onClick={() => {
                                                  // Just use the handleMaterialUpdate function directly
                                                  // The function already updates the queryClient cache appropriately
                                                  handleMaterialUpdate(
                                                    item.id,
                                                    false,
                                                    'bag',
                                                    { type: option.type, size }
                                                  );
                                                }}
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
                          // Check if this is a CARDS item
                          const instrumentType = getTypeFromSpecifications(item) || getTypeFromSpecifications(order);
                          const isCardsItem = instrumentType?.toLowerCase().includes('card');
                          
                          // Voor CARDS items geen boxinfo tonen
                          if (isCardsItem) {
                            return (
                              <TableCell 
                                key={col.id} 
                                className="text-center p-1 material-column"
                                style={{ 
                                  backgroundColor: index % 2 === 0 ? '#F5F5F0' : '#F9F0E8',
                                  zIndex: 10
                                }}
                              >
                                {/* Leeg veld voor CARDS items */}
                              </TableCell>
                            );
                          }
                          
                          // First get bag info to determine the box size
                          const bagInfo = getBagInfo(item) || getBagInfo(order);
                          
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
                            // Always look directly at the specifications first (for immediate UI update)
                            if (item.specifications && typeof item.specifications === 'object') {
                              const specs = item.specifications as Record<string, any>;
                              boxSize = specs.boxSize || specs['Box Size'] || specs['box size'];
                            }
                            
                            // If still no box size, try the order's specifications
                            if (!boxSize && order.specifications && typeof order.specifications === 'object') {
                              const specs = order.specifications as Record<string, any>;
                              boxSize = specs.boxSize || specs['Box Size'] || specs['box size'];
                            }
                            
                            // If still no box size, fall back to the getter function
                            if (!boxSize) {
                              boxSize = getBoxSize(item) || getBoxSize(order);
                            }
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
                                  <button className="w-full cursor-pointer"
                                    key={`item-box-btn-${item.id}-${materialUpdateCount}`} // Force re-render on materialUpdateCount change
                                  >
                                    {/* Hidden span to force re-render with materialUpdateCount changes */}
                                    <span className="hidden">{materialUpdateCount}</span>
                                    {/* Back to the simpler approach */}
                                    {boxSize ? (
                                      <span id={`box-item-${item.id}`} className={`box-label ${getBoxSizeClass(boxSize)}`}>
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
                                          key={`${size}-${materialUpdateCount}`}
                                          className={`text-xs px-2 py-1 rounded border ${
                                            boxSize === size.replace(/X/g, 'x')
                                              ? 'bg-primary text-white'
                                              : 'bg-white hover:bg-gray-100'
                                          }`}
                                          onClick={() => {
                                            // Show a notification
                                            toast({
                                              title: "Updating box size to " + size,
                                              duration: 1000
                                            });
                                            
                                            // Update the material in the database
                                            handleMaterialUpdate(
                                              item.id,
                                              false,
                                              'box',
                                              size
                                            );
                                            
                                            // Force a page reload after a short delay
                                            setTimeout(() => {
                                              window.location.reload();
                                            }, 300);
                                          }}
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
                      
                      // For the boxWeight editable field - comes after the BOX column
                      if (col.isEditable && col.id === 'boxWeight') {
                        // Check if this is a CARDS item
                        const instrumentType = getTypeFromSpecifications(item) || getTypeFromSpecifications(order);
                        const isCardsItem = instrumentType?.toLowerCase().includes('card');
                        
                        // Voor CARDS items geen boxWeight tonen
                        if (isCardsItem) {
                          return (
                            <TableCell 
                              key={col.id} 
                              className="text-center p-1"
                              style={{ 
                                backgroundColor: index % 2 === 0 ? '#F5F5F0' : '#F9F0E8',
                                zIndex: 10
                              }}
                            >
                              {/* Leeg veld voor CARDS items */}
                            </TableCell>
                          );
                        }
                        
                        return (
                          <TableCell 
                            key={col.id} 
                            className="text-center p-1"
                            style={{ 
                              backgroundColor: index % 2 === 0 ? '#F5F5F0' : '#F9F0E8',
                              zIndex: 10,
                              width: col.width ? `${col.width}px` : undefined,
                              minWidth: col.width ? `${col.width}px` : undefined,
                              maxWidth: col.width ? `${col.width}px` : undefined
                            }}
                          >
                            <input
                              type="text"
                              className="w-12 text-center bg-transparent border border-gray-300 rounded p-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              value={item.weight || ''}
                              onChange={(e) => handleBoxWeightChange(item.id, e.target.value)}
                              placeholder="g"
                              aria-label="Box Weight"
                              size={4}
                            />
                          </TableCell>
                        );
                      }
                      
                      // For the customerNotes editable field
                      if (col.isEditable && col.id === 'customerNotes') {
                        return (
                          <TableCell 
                            key={col.id} 
                            className="text-left p-1"
                            style={{ 
                              backgroundColor: index % 2 === 0 ? '#F5F5F0' : '#F9F0E8',
                              zIndex: 10,
                              width: col.width ? `${col.width}px` : undefined,
                              minWidth: col.width ? `${col.width}px` : undefined,
                              maxWidth: col.width ? `${col.width}px` : undefined
                            }}
                          >
                            <CustomerNotesInput 
                              orderId={order.id}
                              initialNotes={order.notes || ''}
                              onSave={(notes) => {
                                updateOrderNotesMutation.mutate({
                                  orderId: order.id,
                                  notes
                                });
                              }}
                            />
                          </TableCell>
                        );
                      }
                      
                      // For the workshopNotes editable field
                      if (col.isEditable && col.id === 'workshopNotes') {
                        return (
                          <TableCell 
                            key={col.id} 
                            className="text-center p-1"
                            style={{ 
                              backgroundColor: index % 2 === 0 ? '#F5F5F0' : '#F9F0E8',
                              zIndex: 10,
                              width: col.width ? `${col.width}px` : undefined,
                              minWidth: col.width ? `${col.width}px` : undefined,
                              maxWidth: col.width ? `${col.width}px` : undefined
                            }}
                          >
                            <NotesInput
                              itemId={item.id}
                              initialValue={item.workshopNotes || ''}
                              onSave={(notes) => {
                                updateItemNotesMutation.mutate({
                                  itemId: item.id,
                                  workshopNotes: notes
                                });
                              }}
                            />
                          </TableCell>
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
                  </TableRow>
                ));
              }))
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

        {/* Mold Info Dialog met orderNotes en itemSpecifications */}
        <MoldInfoDialog
          open={moldInfoDialogOpen}
          onOpenChange={setMoldInfoDialogOpen}
          instrumentType={selectedInstrumentType}
          tuningNote={selectedTuningNote}
          orderNotes={selectedOrder?.notes || ""}
          itemSpecifications={selectedItems.length > 0 ? selectedItems[0]?.specifications : undefined}
        />
      </div>
    </MainLayout>
  );
}