import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart, Area, Scatter } from 'recharts';
import { PieChart, Pie, Cell, Sector } from 'recharts';
import { DownloadIcon, PieChart as PieChartIcon, BarChart as BarChartIcon, LineChart as LineChartIcon, ClockIcon, Map, Music, PaintBucket, Radio, Globe2, ToggleLeft, Timer } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { Order, OrderItem } from '@shared/schema';
import { formatDate } from '@/lib/utils';
import {
  generateInstrumentTypeData,
  generateColorData,
  generateTuningData,
  generateLocationData,
  generateMonthlyTrendData,
  instrumentColors
} from '@/lib/report-utils';
import WaitTimeStats from '@/components/reports/wait-time-stats';

// Gebruik april 2024 als startdatum voor historische data zoals door gebruiker gevraagd
// Deze datum wordt overal in de analysis gebruikt voor consistentie
const DATA_START_DATE = new Date("2024-04-01");

export default function Reports() {
  const [timeframe, setTimeframe] = useState('all');
  const [chartType, setChartType] = useState('waitingTime');
  const [analysisMode, setAnalysisMode] = useState<'orders' | 'items'>('orders');
  const [showInstrumentSpecificData, setShowInstrumentSpecificData] = useState(false);
  const [showNonWorkingPeriods, setShowNonWorkingPeriods] = useState(true);
  
  // Fetch all orders
  const { data: allOrders = [] } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });
  
  // Fetch all order items
  const { data: allOrderItems = [] } = useQuery<OrderItem[]>({
    queryKey: ['/api/items'],
  });
  
  // Filter orders by timeframe
  const filteredOrders = useMemo(() => 
    filterOrdersByTimeframe(allOrders),
    [allOrders, timeframe]
  );
  
  // Filter order items by the selected timeframe
  const filteredOrderItems = useMemo(() => {
    const orderIds = new Set(filteredOrders.map(order => order.id));
    return allOrderItems.filter(item => orderIds.has(item.orderId));
  }, [allOrderItems, filteredOrders]);
  
  // Generate data for charts
  const typeData = useMemo(() => {
    // If in items mode, pass filtered items and empty orders array
    // If in orders mode, pass filtered orders and empty items array
    return analysisMode === 'items'
      ? generateInstrumentTypeData([], filteredOrderItems)
      : generateInstrumentTypeData(filteredOrders, []);
  }, [filteredOrders, filteredOrderItems, analysisMode]);
  
  const colorData = useMemo(() => {
    // If in items mode, pass filtered items and empty orders array
    // If in orders mode, pass filtered orders and empty items array
    return analysisMode === 'items'
      ? generateColorData([], filteredOrderItems)
      : generateColorData(filteredOrders, []);
  }, [filteredOrders, filteredOrderItems, analysisMode]);
  
  const tuningData = useMemo(() => {
    // If in items mode, pass filtered items and empty orders array
    // If in orders mode, pass filtered orders and empty items array
    return analysisMode === 'items'
      ? generateTuningData([], filteredOrderItems)
      : generateTuningData(filteredOrders, []);
  }, [filteredOrders, filteredOrderItems, analysisMode]);
  
  const locationData = useMemo(() => 
    generateLocationData(filteredOrders),
    [filteredOrders]
  );
  
  const monthlyData = useMemo(() => 
    generateMonthlyTrendData(filteredOrders),
    [filteredOrders]
  );
  
  // Generate waiting time data based on orders or items depending on the toggle
  const waitingTimeData = useMemo(() => 
    generateWaitingTimeData(analysisMode === 'items', filteredOrders, filteredOrderItems), 
    [analysisMode, filteredOrders, filteredOrderItems, timeframe] // Dependency op gefilterde items en orders
  );
  
  // Generate instrument-specific waiting time data
  const instrumentWaitingTimeData = useMemo(() => {
    // Gebruik de werkelijke data voor de grafiek zonder vulling met fictieve gegevens
    const data = generateInstrumentWaitingTimeData(analysisMode === 'items', filteredOrders, filteredOrderItems);
    console.log("Wait by Type data:", data);
    
    // Alleen de echte data tonen, geen geforceerde instrumenttypen zonder echte data
    return data;
  }, [filteredOrders, filteredOrderItems, analysisMode, timeframe]); // Dependency op gefilterde items en orders
  
  const totalOrders = filteredOrders.length;
  // Improved completed orders logic based on database analysis
  // SQL query showed orders have status = 'archived' and various delivery_status values
  const completedOrders = filteredOrders.filter(order => {
    // Orders with archived status are completed
    if (order.status === 'archived') return true;
    
    // Orders explicitly marked as delivered
    if (order.status === 'delivered') return true;
    
    // Orders with status 'shipping' and delivered delivery_status
    if (order.status === 'shipping' && order.deliveryStatus === 'delivered') return true;
    
    // Legacy 'completed' status (if any exists)
    if (order.status === 'completed') return true;
    
    // Check delivery_status separately as well
    if (order.deliveryStatus === 'delivered') return true;
    
    return false;
  }).length;
  console.log(`Aantal voltooide orders (gebaseerd op status & deliveryStatus): ${completedOrders}`);
  const completionRate = totalOrders ? Math.round((completedOrders / totalOrders) * 100) : 0;
  
  // Calculate waiting time data - from when orders were placed to when they were completed
  // Generate data about average waiting time per instrument type
  function generateInstrumentWaitingTimeData(useItems = false, filteredOrders: Order[] = [], filteredItems: OrderItem[] = []) {
    // We gebruiken nu de reeds gefilterde orders die al zijn gefilterd op basis van timeframe en DATA_START_DATE
    const ordersToAnalyze = filteredOrders;
    
    console.log(`Instrument analyse: ${ordersToAnalyze.length} orders (gefilterd vanaf ${DATA_START_DATE.toLocaleDateString()})`);
    
    // Create a structure to hold waiting times by instrument type
    const waitingTimesByType: Record<string, { 
      totalDays: number, 
      count: number, 
      averageWaitTime: number,
      waitTimes: number[] 
    }> = {
      'INNATO': { totalDays: 0, count: 0, averageWaitTime: 0, waitTimes: [] },
      'NATEY': { totalDays: 0, count: 0, averageWaitTime: 0, waitTimes: [] },
      'DOUBLE': { totalDays: 0, count: 0, averageWaitTime: 0, waitTimes: [] },
      'ZEN': { totalDays: 0, count: 0, averageWaitTime: 0, waitTimes: [] },
      'OVA': { totalDays: 0, count: 0, averageWaitTime: 0, waitTimes: [] },
      'CARDS': { totalDays: 0, count: 0, averageWaitTime: 0, waitTimes: [] },
      'OTHER': { totalDays: 0, count: 0, averageWaitTime: 0, waitTimes: [] }
    };
    
    if (useItems) {
      console.log('Using item-based instrument waiting time analysis');
      
      // Gebruik de items parameter in plaats van een nieuwe filtering
      const itemsToUse = filteredItems;
      
      console.log(`Items gefilterd van ${allOrderItems.length} naar ${filteredItems.length} items (zelfde tijdvenster als orders)`);
      
      // Gebruik de gefilterde items voor analyse
      for (const item of itemsToUse) {
        // Find parent order to get dates
        const parentOrder = allOrders.find(order => order.id === item.orderId);
        if (!parentOrder) continue;
        
        // Skip orders that aren't completed yet or don't have both dates
        if ((parentOrder.status !== 'shipping' && parentOrder.status !== 'delivered') || 
            !parentOrder.orderDate || 
            (!parentOrder.shippedDate && !parentOrder.updatedAt)) {
          continue;
        }
        
        // Get order and completion dates
        const orderDate = new Date(parentOrder.orderDate);
        const completionDate = parentOrder.shippedDate ? new Date(parentOrder.shippedDate) : 
                             parentOrder.deliveredDate ? new Date(parentOrder.deliveredDate) : 
                             new Date(parentOrder.updatedAt);
        
        // Calculate wait time in days
        const waitTimeDays = Math.round((completionDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Skip negative wait times or those with too long wait (anomalies)
        if (waitTimeDays < 0 || waitTimeDays > 400) continue;
        
        // Cap extremely long wait times at 150 days to prevent outliers
        const cappedWaitTimeDays = Math.min(waitTimeDays, 150);
        
        // Determine instrument type
        let type = 'OTHER';
        let itemSpecType: string | undefined;
        
        // Safely extract type from specifications
        if (item.specifications && typeof item.specifications === 'object') {
          const specs = item.specifications as Record<string, unknown>;
          if ('type' in specs && typeof specs.type === 'string') {
            itemSpecType = specs.type;
          }
        }
        
        if (itemSpecType) {
          type = getInstrumentType(itemSpecType);
        } else if (item.itemType) {
          type = getInstrumentType(item.itemType);
        }
        
        // Add to waiting times for this type
        waitingTimesByType[type].totalDays += cappedWaitTimeDays;
        waitingTimesByType[type].count += 1;
        waitingTimesByType[type].waitTimes.push(cappedWaitTimeDays);
      }
    } else {
      console.log('Using order-based instrument waiting time analysis');
      
      // Gebruik de gefilterde orders in plaats van allOrders
      for (const order of filteredOrders) {
        // Skip orders that aren't completed yet or don't have both dates
        if ((order.status !== 'shipping' && order.status !== 'delivered') || 
            !order.orderDate || 
            (!order.shippedDate && !order.updatedAt)) {
          continue;
        }
        
        // Get order and completion dates
        const orderDate = new Date(order.orderDate);
        const completionDate = order.shippedDate ? new Date(order.shippedDate) : 
                             order.deliveredDate ? new Date(order.deliveredDate) : 
                             new Date(order.updatedAt);
        
        // Calculate wait time in days
        const waitTimeDays = Math.round((completionDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Skip negative wait times (indicates data issue)
        if (waitTimeDays < 0 || waitTimeDays > 400) continue;
        
        // Cap extremely long wait times at 150 days (5 months)
        const cappedWaitTimeDays = Math.min(waitTimeDays, 150);
        
        // Determine instrument type from order specifications
        let type = 'OTHER';
        const specs = order.specifications as Record<string, unknown> || {};
        if (specs && typeof specs === 'object' && 'type' in specs && typeof specs.type === 'string') {
          type = getInstrumentType(specs.type);
        } else if (order.title) {
          type = getInstrumentType(order.title);
        }
        
        // Add to waiting times for this type
        waitingTimesByType[type].totalDays += cappedWaitTimeDays;
        waitingTimesByType[type].count += 1;
        waitingTimesByType[type].waitTimes.push(cappedWaitTimeDays);
      }
    }
    
    // Calculate averages for each type with trimmed outliers
    Object.keys(waitingTimesByType).forEach(type => {
      const data = waitingTimesByType[type];
      if (data.count > 0) {
        // If we have enough data points, trim outliers
        if (data.waitTimes.length > 2) {
          const sortedTimes = [...data.waitTimes].sort((a, b) => a - b);
          const trimmedTimes = sortedTimes.slice(1, sortedTimes.length - 1);
          const sum = trimmedTimes.reduce((sum, val) => sum + val, 0);
          data.averageWaitTime = Math.round(sum / trimmedTimes.length);
        } else {
          // Otherwise use simple average
          data.averageWaitTime = Math.round(data.totalDays / data.count);
        }
      }
    });
    
    // Convert to chart-friendly format
    return Object.entries(waitingTimesByType)
      .filter(([_, data]) => data.count > 0)
      .map(([type, data]) => ({
        name: type,
        averageWaitTime: data.averageWaitTime,
        count: data.count,
        fill: instrumentColors[type as keyof typeof instrumentColors] || '#94a3b8'
      }))
      .sort((a, b) => b.count - a.count); // Sort by number of items
  }
  
  // Helper function to extract instrument type from an item/order type string
  function getInstrumentType(typeString: string): string {
    const upperType = String(typeString).toUpperCase();
    
    if (upperType.includes('INNATO')) return 'INNATO';
    if (upperType.includes('NATEY')) return 'NATEY';
    if (upperType.includes('DOUBLE')) return 'DOUBLE';
    if (upperType.includes('ZEN')) return 'ZEN';
    if (upperType.includes('OVA')) return 'OVA';
    
    // Special case for CARDS vs INNATO
    if ((upperType.includes('CARDS') || upperType.includes('KAART')) &&
        !upperType.includes('INNATO')) {
      return 'CARDS';
    }
    
    // If type has INNATO but also includes card, it's an INNATO
    if (upperType.includes('INNATO')) {
      return 'INNATO';
    }
    
    return 'OTHER';
  }
  
  function generateWaitingTimeData(useItems = false, filteredOrders: Order[] = [], filteredItems: OrderItem[] = []) {
    // We'll organize by months to show trend over time
    
    // Gebruik globale startdatum variabele (April 2024) voor alle analyses
    console.log(`Wachttijd grafiek startdatum ingesteld op: ${DATA_START_DATE.toLocaleDateString('nl-NL')}`);
    
    // Round down to the first day of the month
    const startMonth = new Date(DATA_START_DATE.getFullYear(), DATA_START_DATE.getMonth(), 1);
    const currentMonth = new Date();
    const endMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    // Create an array of all months between start and end
    interface WaitTimeDataPoint {
      month: string;
      name: string;
      displayName: string;
      averageWaitTime: number;
      orderCount: number;
      totalDays: number;
      year: number;
      movingAvgWaitTime?: number;
    }
    
    const monthsData: WaitTimeDataPoint[] = [];
    let currentDate = new Date(startMonth);
    
    while (currentDate <= endMonth) {
      const yearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const monthName = currentDate.toLocaleString('default', { month: 'short' });
      const year = currentDate.getFullYear();
      const monthLabel = `${monthName} ${year}`;
      
      monthsData.push({
        month: yearMonth,
        name: monthLabel,
        displayName: monthName,
        averageWaitTime: 0,
        orderCount: 0,
        totalDays: 0,
        year: year
      });
      
      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    
    // First collect all wait times per month to calculate trimmed averages
    // This will let us remove outliers (shortest and longest wait times)
    const waitTimesByMonth: Record<string, number[]> = {};
    
    // Debug: Check how many completed orders we're looking at
    console.log(`Total completed orders for analysis: ${allOrders.filter(order => 
      (order.status === 'shipping' || order.status === 'delivered' || order.status === 'completed') && 
      order.orderDate && 
      (order.shippedDate || order.updatedAt || order.deliveredDate)
    ).length}`);
    
    // Calculate wait time for each completed order by month of order placement
    if (useItems) {
      // Item-based analysis
      console.log('Using item-based waiting time analysis');
      
      // Gebruik de reeds gefilterde items in plaats van ze opnieuw te filteren
      const itemsToAnalyze = filteredItems;
      
      console.log(`Items voor waiting time analyse: ${itemsToAnalyze.length} van ${allOrderItems.length} (gefilterd op zelfde tijdvenster als orders, vanaf ${DATA_START_DATE.toLocaleDateString()})`);
      
      // Get all completed order items
      (itemsToAnalyze as OrderItem[]).forEach(item => {
        // Find parent order to get dates
        const parentOrder = allOrders.find(order => order.id === item.orderId);
        if (!parentOrder) return;
        
        // Versoepel de voltooiingscriteria om meer data te tonen
        // We tellen alle orders met een orderdatum mee, ook als ze geen verzend- of leverdatum hebben
        if (!parentOrder.orderDate) {
          return; // Alleen orders zonder datum overslaan
        }
        
        // Debug: log alle orders voor analyse
        console.log(`Analysing order ${parentOrder.orderNumber} (${parentOrder.status}): orderDate=${parentOrder.orderDate}`);
        
        // Alle datums accepteren voor complete historie
        const orderDate = new Date(parentOrder.orderDate);
        // Filter weggehaald om alle orders te tonen, ongeacht datum
        
        // Bereken completion date - als er geen is, gebruik een schatting
        let completionDate;
        
        if (parentOrder.shippedDate) {
          completionDate = new Date(parentOrder.shippedDate);
        } else if (parentOrder.deliveredDate) {
          completionDate = new Date(parentOrder.deliveredDate);
        } else if (parentOrder.updatedAt) {
          completionDate = new Date(parentOrder.updatedAt);
        } else {
          // Geen completion datum beschikbaar, gebruik een schatting gebaseerd op gemiddelde productietijd
          // Alle orders worden gemaakt, behalve als ze geannuleerd (canceled) of teruggestuurd (refunded) zijn
          
          // Controleer op geannuleerde orders of refunds - deze tellen we niet mee
          if (parentOrder.status === 'canceled' || parentOrder.deliveryStatus === 'refunded') {
            // Skip geannuleerde of terugbetaalde orders
            console.log(`Order ${parentOrder.orderNumber} overgeslagen: ${parentOrder.deliveryStatus || parentOrder.status}`);
            return null; // Signaleer dat deze order moet worden overgeslagen
          }
          
          // Voor alle andere orders schatten we een redelijke completionDate
          if (parentOrder.status === 'archived' || parentOrder.status === 'completed' || parentOrder.status === 'shipped') {
            // Voor voltooide orders: gemiddeld 60 dagen productietijd
            const estimatedDays = 60; // Gemiddelde schatting voor voltooide orders  
            completionDate = new Date(new Date(parentOrder.orderDate).getTime() + (estimatedDays * 24 * 60 * 60 * 1000));
            console.log(`Order ${parentOrder.orderNumber}: Geschatte completionDate voor voltooide order (${estimatedDays} dagen)`);
          } else if (parentOrder.status === 'building' || parentOrder.status === 'testing' || parentOrder.status === 'tuning') {
            // Voor orders in productie: huidige productieduur + kleine buffer
            completionDate = new Date();
            const orderDateObj = new Date(parentOrder.orderDate);
            const daysSoFar = Math.round((completionDate.getTime() - orderDateObj.getTime()) / (1000 * 60 * 60 * 24));
            
            // Voeg buffer toe aan lopende orders
            const bufferDays = Math.max(10, Math.min(30, daysSoFar * 0.2)); // 20% buffer, min 10 dagen, max 30
            completionDate = new Date(completionDate.getTime() + (bufferDays * 24 * 60 * 60 * 1000));
            
            console.log(`Order ${parentOrder.orderNumber}: Lopende order, dagen in productie tot nu toe: ${daysSoFar}, geschatte voltooiing: +${bufferDays} dagen`);
          } else {
            // Voor nieuwe orders: gemiddeld 90 dagen productietijd vanaf besteldatum
            const estimatedDays = 90; // Langere schatting voor nieuwe orders
            completionDate = new Date(new Date(parentOrder.orderDate).getTime() + (estimatedDays * 24 * 60 * 60 * 1000));
            console.log(`Order ${parentOrder.orderNumber}: Geschatte completionDate voor nieuwe order (${estimatedDays} dagen)`);
          }
        }
        
        // Calculate wait time in days
        const waitTimeDays = Math.round((completionDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Skip negative wait times (indicates data issue)
        if (waitTimeDays < 0) return;
        
        // Debug log for items
        console.log(`Item ${item.serialNumber} (order ${parentOrder.orderNumber}): ${waitTimeDays} days wait time`);
        
        // Cap extremely long wait times at 150 days (5 months) to prevent outliers from skewing the data
        const cappedWaitTimeDays = Math.min(waitTimeDays, 150);
        
        // Use order month instead of completion month to predict future waiting times
        const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Store all wait times for this month to filter outliers later
        if (!waitTimesByMonth[orderMonth]) {
          waitTimesByMonth[orderMonth] = [];
        }
        
        // Add the wait time for each individual item
        waitTimesByMonth[orderMonth].push(cappedWaitTimeDays);
        
        // Also track in our month data
        const monthData = monthsData.find(m => m.month === orderMonth);
        if (monthData) {
          monthData.orderCount++;
        }
      });
    } else {
      // Order-based analysis (original implementation)
      console.log('Using order-based waiting time analysis');
      
      // Gebruik de reeds gefilterde orders
      const ordersToAnalyze = filteredOrders;
      
      console.log(`Orders voor waiting time analyse: ${ordersToAnalyze.length} van ${allOrders.length} (gefilterd vanaf ${DATA_START_DATE.toLocaleDateString()})`);
      
      (ordersToAnalyze as Order[]).forEach(order => {
        // Versoepel de voltooiingscriteria om meer data te tonen
        // We tellen alle orders met een orderdatum mee, ook als ze geen verzend- of leverdatum hebben
        if (!order.orderDate) {
          return; // Alleen orders zonder datum overslaan
        }
        
        // Debug: log alle orders voor analyse
        console.log(`Analysing order ${order.orderNumber} (${order.status}): orderDate=${order.orderDate}`);
        
        // Alle datums accepteren voor complete historie
        const orderDate = new Date(order.orderDate);
        
        // Bereken completion date - als er geen is, gebruik een schatting
        let completionDate;
        
        if (order.shippedDate) {
          completionDate = new Date(order.shippedDate);
        } else if (order.deliveredDate) {
          completionDate = new Date(order.deliveredDate);
        } else if (order.updatedAt) {
          completionDate = new Date(order.updatedAt);
        } else {
          // Geen completion datum beschikbaar, gebruik een schatting gebaseerd op gemiddelde productietijd
          // Alle orders worden gemaakt, behalve als ze geannuleerd (canceled) of teruggestuurd (refunded) zijn
          
          // Controleer op geannuleerde orders of refunds - deze tellen we niet mee
          if (order.status === 'canceled' || order.deliveryStatus === 'refunded') {
            // Skip geannuleerde of terugbetaalde orders
            console.log(`Order ${order.orderNumber} overgeslagen: ${order.deliveryStatus || order.status}`);
            return null; // Signaleer dat deze order moet worden overgeslagen
          }
          
          // Voor alle andere orders schatten we een redelijke completionDate
          if (order.status === 'archived' || order.status === 'completed' || order.status === 'shipped') {
            // Voor voltooide orders: gemiddeld 60 dagen productietijd
            const estimatedDays = 60; // Gemiddelde schatting voor voltooide orders  
            completionDate = new Date(new Date(order.orderDate).getTime() + (estimatedDays * 24 * 60 * 60 * 1000));
            console.log(`Order ${order.orderNumber}: Geschatte completionDate voor voltooide order (${estimatedDays} dagen)`);
          } else if (order.status === 'building' || order.status === 'testing' || order.status === 'tuning') {
            // Voor orders in productie: huidige productieduur + kleine buffer
            completionDate = new Date();
            const orderDateObj = new Date(order.orderDate);
            const daysSoFar = Math.round((completionDate.getTime() - orderDateObj.getTime()) / (1000 * 60 * 60 * 24));
            
            // Voeg buffer toe aan lopende orders
            const bufferDays = Math.max(10, Math.min(30, daysSoFar * 0.2)); // 20% buffer, min 10 dagen, max 30
            completionDate = new Date(completionDate.getTime() + (bufferDays * 24 * 60 * 60 * 1000));
            
            console.log(`Order ${order.orderNumber}: Lopende order, dagen in productie tot nu toe: ${daysSoFar}, geschatte voltooiing: +${bufferDays} dagen`);
          } else {
            // Voor nieuwe orders: gemiddeld 90 dagen productietijd vanaf besteldatum
            const estimatedDays = 90; // Langere schatting voor nieuwe orders
            completionDate = new Date(new Date(order.orderDate).getTime() + (estimatedDays * 24 * 60 * 60 * 1000));
            console.log(`Order ${order.orderNumber}: Geschatte completionDate voor nieuwe order (${estimatedDays} dagen)`);
          }
        }
        
        // Calculate wait time in days
        const waitTimeDays = Math.round((completionDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Skip negative wait times (indicates data issue)
        if (waitTimeDays < 0) return;
        
        // Debug log to see actual wait time values
        console.log(`Order ${order.orderNumber}: ${waitTimeDays} days wait time`);
        
        // Cap extremely long wait times at 150 days (5 months) to prevent outliers from skewing the data
        // This matches the real maximum waiting time in your workshop
        const cappedWaitTimeDays = Math.min(waitTimeDays, 150);
        
        // Use order month instead of completion month to predict future waiting times
        // This shows how long customers who ordered in a specific month had to wait
        const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Store all wait times for this month to filter outliers later
        if (!waitTimesByMonth[orderMonth]) {
          waitTimesByMonth[orderMonth] = [];
        }
        // Use the capped wait time to prevent extreme outliers like 342 days
        waitTimesByMonth[orderMonth].push(cappedWaitTimeDays);
        
        // Also track in our month data
        const monthData = monthsData.find(m => m.month === orderMonth);
        if (monthData) {
          monthData.orderCount++;
        }
      });
    }
    
    // Now calculate trimmed averages for each month (remove longest and shortest waiting times)
    monthsData.forEach(month => {
      const waitTimes = waitTimesByMonth[month.month] || [];
      
      if (waitTimes.length <= 2) {
        // If we have 2 or fewer data points, use regular average (can't trim)
        month.averageWaitTime = waitTimes.length > 0 
          ? Math.round(waitTimes.reduce((sum: number, val: number) => sum + val, 0) / waitTimes.length) 
          : 0;
      } else {
        // Sort wait times and remove the shortest and longest values
        const sortedWaitTimes = [...waitTimes].sort((a, b) => a - b);
        const trimmedWaitTimes = sortedWaitTimes.slice(1, sortedWaitTimes.length - 1);
        
        // Calculate average of remaining values
        const sum = trimmedWaitTimes.reduce((sum, val) => sum + val, 0);
        month.averageWaitTime = Math.round(sum / trimmedWaitTimes.length);
      }
    });
    
    // Debug: Log raw month data before processing
    console.log("Maandgegevens voor filtering:", monthsData.map(m => `${m.month}: ${m.orderCount} orders, avg=${m.averageWaitTime}`));
    
    // Calculate moving average to smooth the data
    const smoothedData = [...monthsData];
    for (let i = 1; i < monthsData.length - 1; i++) {
      const prev = monthsData[i-1].averageWaitTime || 0;
      const curr = monthsData[i].averageWaitTime || 0;
      const next = monthsData[i+1].averageWaitTime || 0;
      
      // Calculate moving average only when we have at least 3 consecutive months with data
      if (prev > 0 && curr > 0 && next > 0) {
        smoothedData[i].movingAvgWaitTime = Math.round((prev + curr + next) / 3);
      } else if (curr > 0) {
        // If current month has data but not enough for moving average, use the current value
        smoothedData[i].movingAvgWaitTime = curr;
      } else {
        // Otherwise set to 0
        smoothedData[i].movingAvgWaitTime = 0;
      }
    }
    
    // Handle edge cases (first and last month)
    if (smoothedData.length > 0) {
      // First month - if it has data, keep its value, otherwise set to 0
      smoothedData[0].movingAvgWaitTime = smoothedData[0].averageWaitTime || 0;
      
      // Last month - if it has data, keep its value, otherwise set to 0
      const lastIndex = smoothedData.length - 1;
      smoothedData[lastIndex].movingAvgWaitTime = smoothedData[lastIndex].averageWaitTime || 0;
    }
    
    // Toon alle beschikbare maanden (of een maximum van 24) om meer historie te laten zien
    // Dit zorgt ervoor dat we een compleet beeld krijgen van alle orders
    const relevantMonths = smoothedData.length > 24 ? smoothedData.slice(-24) : smoothedData;
    
    // Debug: Log the final filtered months data
    console.log(`Gefilterde en verwerkte maanden data (${relevantMonths.length} maanden):`, 
                relevantMonths.map(m => `${m.month}: ${m.orderCount} orders, avg=${m.averageWaitTime}`));
    
    // Log de meest recente maand apart voor analyse
    if (relevantMonths.length > 0) {
      const latestMonth = relevantMonths[relevantMonths.length - 1];
      console.log(`LAATSTE MAAND WACHTTIJD: ${latestMonth.month} = ${latestMonth.averageWaitTime} dagen (${latestMonth.orderCount} orders)`);
      
      // Berekenen wat de wachttijd is voor alleen de afgeronde orders in de laatste maand
      const latestMonthRawData = waitTimesByMonth[latestMonth.month] || [];
      console.log(`Ruwe wachttijden laatste maand: ${latestMonthRawData.join(', ')} dagen`);
    }
    
    return relevantMonths;
  };
  
  function filterOrdersByTimeframe(orders: Order[]) {
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(DATA_START_DATE); // Gebruik globale startdatum (april 2024)
    }
    
    return orders.filter((order: Order) => {
      if (!order.orderDate) return false;
      const orderDate = new Date(order.orderDate);
      return orderDate >= startDate && orderDate <= now;
    });
  };
  
  const handleExportPDF = () => {
    // In a production app, this would generate a PDF report
    console.log('Exporting PDF report...');
  };

  return (
    <MainLayout>
      {/* Wait time analysis component */}
      <div className="mb-6">
        <WaitTimeStats />
      </div>
    
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Production Reports</h1>
        
        <div className="flex items-center space-x-3">
          <Select 
            value={timeframe} 
            onValueChange={setTimeframe}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2 border rounded-md p-2">
            <Label htmlFor="analysis-mode" className="text-sm whitespace-nowrap">
              Analysis mode:
            </Label>
            <div className="flex items-center space-x-1">
              <Label htmlFor="orders-mode" className={`text-sm ${analysisMode === 'orders' ? 'font-semibold' : ''}`}>Orders</Label>
              <Switch
                id="analysis-mode"
                checked={analysisMode === 'items'}
                onCheckedChange={(checked) => setAnalysisMode(checked ? 'items' : 'orders')}
              />
              <Label htmlFor="items-mode" className={`text-sm ${analysisMode === 'items' ? 'font-semibold' : ''}`}>Items</Label>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={handleExportPDF}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
              <h3 className="text-3xl font-bold text-primary mt-1">{totalOrders}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Orders</p>
              <h3 className="text-3xl font-bold text-primary mt-1">{completedOrders}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</p>
              <h3 className="text-3xl font-bold text-primary mt-1">{completionRate}%</h3>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="waitingTime" onValueChange={setChartType} className="mb-6">
        <TabsList className="grid grid-cols-7 w-full md:w-auto">
          <TabsTrigger value="waitingTime" className="flex items-center">
            <ClockIcon className="mr-2 h-4 w-4" />
            Waiting Time
          </TabsTrigger>
          <TabsTrigger value="instrumentWaitTime" className="flex items-center">
            <Timer className="mr-2 h-4 w-4" />
            Wait by Type
          </TabsTrigger>
          <TabsTrigger value="instrumentTypes" className="flex items-center">
            <Music className="mr-2 h-4 w-4" />
            Instruments
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center">
            <PaintBucket className="mr-2 h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="tunings" className="flex items-center">
            <Radio className="mr-2 h-4 w-4" />
            Tunings
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center">
            <Globe2 className="mr-2 h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center">
            <BarChartIcon className="mr-2 h-4 w-4" />
            Monthly
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {chartType === 'waitingTime' && 'Average Waiting Time Trend by Order Month'}
            {chartType === 'instrumentWaitTime' && 'Average Waiting Time by Instrument Type'}
            {chartType === 'instrumentTypes' && 'Instrument Type Distribution'}
            {chartType === 'colors' && 'Color Distribution'}
            {chartType === 'tunings' && 'Tuning Distribution'}
            {chartType === 'locations' && 'Customer Locations'}
            {chartType === 'monthly' && 'Monthly Production Trends'}
          </CardTitle>
          <CardDescription>
            {chartType === 'waitingTime' && 'Toont alle historische wachttijden vanaf begin 2023 tot heden. Uitschieters verwijderd (maximaal 5 maanden en langste/kortste tijd per maand gefilterd)'}
            {chartType === 'instrumentWaitTime' && 'Vergelijk gemiddelde wachttijden per instrumenttype'}
            {chartType === 'instrumentTypes' && 'Verdeling van orders per instrumenttype'}
            {chartType === 'colors' && 'Populariteit van verschillende fluitkleuren'}
            {chartType === 'tunings' && 'Meest gevraagde stemmingen'}
            {chartType === 'locations' && 'Geografische verdeling van klanten'}
            {chartType === 'monthly' && 'Trends van orders per instrumenttype over tijd'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full">
            {/* Waiting Time Chart */}
            {chartType === 'waitingTime' && waitingTimeData.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={waitingTimeData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 70,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    interval={0} 
                  />
                  <YAxis 
                    yAxisId="left"
                    label={{ value: 'Average Days', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    label={{ value: 'Number of Orders', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Waiting Time') return [`${value} days`, name];
                      if (name === 'Smoothed Average') return [`${value} days`, name];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="right"
                    dataKey="orderCount" 
                    name="Orders Completed" 
                    fill="#8884d8" 
                    barSize={20} 
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="averageWaitTime" 
                    name="Waiting Time" 
                    stroke="#ff7300" 
                    strokeWidth={2} 
                    dot={{ r: 4 }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="movingAvgWaitTime" 
                    name="Smoothed Average" 
                    stroke="#4CAF50" 
                    strokeWidth={3} 
                    dot={{ r: 1 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
            
            {/* Instrument-specific Waiting Time Chart */}
            {chartType === 'instrumentWaitTime' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={instrumentWaitingTimeData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 40,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    interval={0}
                  />
                  <YAxis
                    yAxisId="left"
                    label={{ value: 'Average Wait Time (Days)', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'Number of Orders', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Average Wait Time') return [`${value} days`, name];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="averageWaitTime" 
                    name="Average Wait Time"
                    barSize={40}
                  >
                    {instrumentWaitingTimeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    name="Number of Orders"
                    stroke="#8884d8"
                    strokeWidth={2}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
            
            {/* Instrument Types Chart */}
            {chartType === 'instrumentTypes' && (
              <div className="flex justify-center items-center h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Orders']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {/* Colors Chart */}
            {chartType === 'colors' && (
              <div className="flex justify-center items-center h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={colorData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ code, percent }) => `${code}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {colorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [value, props.payload.name]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {/* Tunings Chart */}
            {chartType === 'tunings' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tuningData}
                  layout="vertical"
                  margin={{
                    top: 20,
                    right: 30,
                    left: 60,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={60}
                  />
                  <Tooltip formatter={(value) => [value, 'Orders']} />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="Orders" 
                    barSize={20}
                  >
                    {tuningData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            
            {/* Locations Chart */}
            {chartType === 'locations' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={locationData}
                  layout="vertical"
                  margin={{
                    top: 20,
                    right: 30,
                    left: 80,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="country" 
                    type="category" 
                    width={80}
                  />
                  <Tooltip formatter={(value) => [value, 'Orders']} />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="Orders" 
                    barSize={20}
                  >
                    {locationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            
            {/* Monthly Chart */}
            {chartType === 'monthly' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 70,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                    interval={0} 
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="INNATO" name="INNATO" stackId="a" fill="#818cf8" />
                  <Bar dataKey="NATEY" name="NATEY" stackId="a" fill="#fbbf24" />
                  <Bar dataKey="DOUBLE" name="DOUBLE" stackId="a" fill="#a855f7" />
                  <Bar dataKey="ZEN" name="ZEN" stackId="a" fill="#2dd4bf" />
                  <Bar dataKey="OVA" name="OVA" stackId="a" fill="#ec4899" />
                  <Bar dataKey="CARDS" name="CARDS" stackId="a" fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Completed Orders</CardTitle>
          <CardDescription>The most recently completed orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4">Order #</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Items</th>
                  <th className="text-left py-3 px-4">Wait Time</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {allOrders
                  .filter((order: Order) => order.status === 'shipping' || order.status === 'delivered' || order.status === 'completed')
                  .sort((a: Order, b: Order) => {
                    const dateA = a.shippedDate ? new Date(a.shippedDate) : a.deliveredDate ? new Date(a.deliveredDate) : new Date(a.updatedAt || 0);
                    const dateB = b.shippedDate ? new Date(b.shippedDate) : b.deliveredDate ? new Date(b.deliveredDate) : new Date(b.updatedAt || 0);
                    return dateB.getTime() - dateA.getTime();
                  })
                  .slice(0, 5)
                  .map((order: Order) => {
                    const orderDate = order.orderDate ? new Date(order.orderDate) : null;
                    const shippedDate = order.shippedDate ? new Date(order.shippedDate) : null;
                    const waitTime = orderDate && shippedDate
                      ? Math.round((shippedDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
                      : null;
                    
                    return (
                      <tr key={order.id} className="border-b dark:border-gray-700">
                        <td className="py-3 px-4">{order.orderNumber}</td>
                        <td className="py-3 px-4">{orderDate ? formatDate(orderDate) : "—"}</td>
                        <td className="py-3 px-4">{order.items?.length || "—"}</td>
                        <td className="py-3 px-4">{waitTime !== null ? `${waitTime} days` : "—"}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}