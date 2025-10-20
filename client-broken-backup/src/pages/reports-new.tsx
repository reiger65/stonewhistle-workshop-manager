import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart, Area, Scatter } from 'recharts';
import { PieChart, Pie, Cell, Sector } from 'recharts';
import { DownloadIcon, PieChart as PieChartIcon, BarChart as BarChartIcon, LineChart as LineChartIcon, ClockIcon, Map, Music, PaintBucket, Radio, Globe2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Order, OrderItem } from '@shared/schema';
import { formatDate } from '@/lib/utils';
import {
  generateInstrumentTypeData,
  generateColorData,
  generateTuningData,
  generateLocationData,
  generateMonthlyTrendData
} from '@/lib/report-utils';

export default function Reports() {
  const [timeframe, setTimeframe] = useState('all');
  const [chartType, setChartType] = useState('waitingTime');
  
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
  const typeData = useMemo(() => 
    generateInstrumentTypeData(filteredOrders, filteredOrderItems),
    [filteredOrders, filteredOrderItems]
  );
  
  const colorData = useMemo(() => 
    generateColorData(filteredOrders, filteredOrderItems),
    [filteredOrders, filteredOrderItems]
  );
  
  const tuningData = useMemo(() => 
    generateTuningData(filteredOrders, filteredOrderItems),
    [filteredOrders, filteredOrderItems]
  );
  
  const locationData = useMemo(() => 
    generateLocationData(filteredOrders),
    [filteredOrders]
  );
  
  const monthlyData = useMemo(() => 
    generateMonthlyTrendData(filteredOrders),
    [filteredOrders]
  );
  
  const waitingTimeData = generateWaitingTimeData();
  
  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(order => 
    order.status === 'completed' || order.status === 'shipping'
  ).length;
  const completionRate = totalOrders ? Math.round((completedOrders / totalOrders) * 100) : 0;
  
  // Calculate waiting time data - from when orders were placed to when they were completed
  function generateWaitingTimeData() {
    // Start specifically from July 23, 2023 as requested
    // We'll organize by months to show trend over time
    
    // Set specific start date (July 23, 2023)
    const earliestDate = new Date("2023-07-23");
    
    // Round down to the first day of the month
    const startMonth = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
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
      (order.status === 'shipping' || order.status === 'delivered') && 
      order.orderDate && 
      (order.shippedDate || order.updatedAt)
    ).length}`);
    
    // Calculate wait time for each completed order by month of order placement
    (allOrders as Order[]).forEach(order => {
      // Skip orders that aren't completed yet or don't have both dates
      if ((order.status !== 'shipping' && order.status !== 'delivered') || 
          !order.orderDate || 
          (!order.shippedDate && !order.updatedAt)) {
        return;
      }
      
      // Only consider orders placed since July 23, 2023
      const orderDate = new Date(order.orderDate);
      if (orderDate < new Date("2023-07-23")) {
        return;
      }
      
      const completionDate = order.shippedDate ? new Date(order.shippedDate) : 
                            order.deliveredDate ? new Date(order.deliveredDate) : 
                            new Date(order.updatedAt);
      
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
    
    // Apply moving average to smooth the data
    const smoothedData = [...monthsData];
    for (let i = 1; i < monthsData.length - 1; i++) {
      const prev = monthsData[i-1].averageWaitTime || 0;
      const curr = monthsData[i].averageWaitTime || 0;
      const next = monthsData[i+1].averageWaitTime || 0;
      
      // If we have valid data points, calculate the average
      if (prev > 0 && curr > 0 && next > 0) {
        smoothedData[i].movingAvgWaitTime = Math.round((prev + curr + next) / 3);
      } else {
        smoothedData[i].movingAvgWaitTime = curr;
      }
    }
    
    // Handle edge cases (first and last month)
    if (smoothedData.length > 0) {
      smoothedData[0].movingAvgWaitTime = smoothedData[0].averageWaitTime;
      smoothedData[smoothedData.length - 1].movingAvgWaitTime = 
        smoothedData[smoothedData.length - 1].averageWaitTime;
    }
    
    // Start from the first month with actual data
    return smoothedData.filter(m => m.orderCount > 0);
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
        startDate = new Date(0); // Beginning of time
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Production Reports</h1>
        
        <div className="flex items-center space-x-3">
          <Select 
            value={timeframe} 
            onValueChange={setTimeframe}
          >
            <SelectTrigger className="w-[180px]">
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
        <TabsList className="grid grid-cols-6 w-full md:w-auto">
          <TabsTrigger value="waitingTime" className="flex items-center">
            <ClockIcon className="mr-2 h-4 w-4" />
            Waiting Time
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
            {chartType === 'instrumentTypes' && 'Instrument Type Distribution'}
            {chartType === 'colors' && 'Color Distribution'}
            {chartType === 'tunings' && 'Tuning Distribution'}
            {chartType === 'locations' && 'Customer Locations'}
            {chartType === 'monthly' && 'Monthly Production Trends'}
          </CardTitle>
          <CardDescription>
            {chartType === 'waitingTime' && 'Shows waiting time trends with outliers removed (caps at 5 months max and removes longest/shortest wait times per month)'}
            {chartType === 'instrumentTypes' && 'Breakdown of orders by instrument type'}
            {chartType === 'colors' && 'Popularity of different flute colors'}
            {chartType === 'tunings' && 'Most requested tuning notes'}
            {chartType === 'locations' && 'Geographic distribution of customers'}
            {chartType === 'monthly' && 'Trends of orders by instrument type over time'}
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
                  .filter((order: Order) => order.status === 'shipping')
                  .sort((a: Order, b: Order) => {
                    const dateA = a.shippedDate ? new Date(a.shippedDate) : new Date(0);
                    const dateB = b.shippedDate ? new Date(b.shippedDate) : new Date(0);
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