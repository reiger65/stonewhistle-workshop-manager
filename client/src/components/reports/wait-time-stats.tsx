import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Order } from '@shared/schema';
import { calculateAverageWaitTime } from '@/lib/utils';

// Interface voor niet-werkperiodes
interface NonWorkingPeriod {
  start: string;
  end: string;
  reason: string;
}

const WaitTimeStats = () => {
  // Load non-working periods from localStorage
  const [nonWorkingPeriods, setNonWorkingPeriods] = useState<NonWorkingPeriod[]>([]);
  
  // Fetch all orders
  const { data: allOrders = [] } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  // Haal niet-werkperiodes op uit localStorage
  useEffect(() => {
    const savedPeriods = localStorage.getItem('nonWorkingPeriods');
    if (savedPeriods) {
      try {
        setNonWorkingPeriods(JSON.parse(savedPeriods));
      } catch (e) {
        console.error('Error parsing non-working periods from localStorage:', e);
        setNonWorkingPeriods([]);
      }
    }
  }, []);

  // Bereken de wachttijd
  const waitTimeData = calculateWaitTime(allOrders, nonWorkingPeriods);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600" /> 
          Productiewachttijd
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 h-8 flex flex-col justify-center">
            <p className="text-gray-600 text-xs">Ruwe wachttijd</p>
            <p className="text-base font-bold text-blue-700">{waitTimeData.baseWaitDays} dagen</p>
          </div>

          <div className="bg-gray-50 p-2 rounded-lg border h-8 flex flex-col justify-center">
            <p className="text-gray-600 text-xs">Inclusief vakantiedagen</p>
            <p className="text-base font-bold text-blue-600">{waitTimeData.finalWaitDays} dagen</p>
          </div>
          
          {waitTimeData.totalNonWorkingDays > 0 && (
            <div className="col-span-2 bg-amber-50 p-2 rounded-lg border border-amber-100 mt-1 h-8 flex items-center">
              <p className="text-amber-800 text-xs flex justify-between w-full">
                <span>Niet-werkdagen:</span>
                <span className="font-medium">{waitTimeData.totalNonWorkingDays} dagen</span>
              </p>
            </div>
          )}
          {waitTimeData.recentCompletedOrders > 0 && (
            <div className="col-span-2 bg-green-50 p-2 rounded-lg border border-green-100 mt-1 h-8 flex items-center">
              <p className="text-green-800 text-xs flex justify-between w-full">
                <span>Gebaseerd op voltooide orders:</span>
                <span className="font-medium">{waitTimeData.recentCompletedOrders} orders</span>
              </p>
            </div>
          )}
          
          {waitTimeData.pendingItemCount > 0 && (
            <div className="col-span-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100 mt-1 h-8 flex items-center">
              <p className="text-indigo-800 text-xs flex justify-between w-full">
                <span>Aantal wachtende instrumenten:</span>
                <span className="font-medium">{waitTimeData.pendingItemCount} instrumenten</span>
              </p>
            </div>
          )}
          
          {waitTimeData.wachtrijFactor > 0 && (
            <div className="col-span-2 bg-purple-50 p-2 rounded-lg border border-purple-100 mt-1 h-8 flex items-center">
              <p className="text-purple-800 text-xs flex justify-between w-full">
                <span>Extra tijd door wachtrij:</span>
                <span className="font-medium">{waitTimeData.wachtrijFactor} dagen</span>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Functie om wachttijd te berekenen, dynamisch op basis van orderdata
interface WaitTimeResult {
  baseWaitDays: number;
  workdaysCorrectionFactor: number;
  fourDayWeekAdjustment: number;
  totalNonWorkingDays: number;
  totalWaitDays: number;
  finalWaitDays: number | string;  // Added string type for loading state
  
  // Nieuwe velden voor instrumentmix
  pendingItemCount: number;
  wachtrijFactor: number;
  
  // Batch process wachttijden
  ovenWachttijd: number;
  verzendWachttijd: number;
  
  // Brondata
  recentCompletedOrders: number;
  buildingOrders: number;
  avgCompletionTime: number;
  avgProductionTime: number;
  bufferDays: number;
}

function calculateWaitTime(allOrders: Order[], nonWorkingPeriods: NonWorkingPeriod[]): WaitTimeResult {
  console.log("===== DYNAMISCHE WACHTTIJD BEREKENING =====");
  
  try {
    // Stap 1: Bereken het totaal aantal niet-werkdagen
    let totalNonWorkingDays = 0;
    nonWorkingPeriods.forEach(period => {
      const startDate = new Date(period.start);
      const endDate = new Date(period.end);
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (daysDiff > 0) {
          totalNonWorkingDays += daysDiff;
          console.log(`Niet-werkperiode van ${period.start} tot ${period.end} (${daysDiff} dagen): ${period.reason}`);
        }
      }
    });
    console.log(`Totaal aantal niet-werkdagen uit ingestelde periodes: ${totalNonWorkingDays}`);
    
    // Stap 2: Filter voltooide orders van de afgelopen 3 maanden
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    const recentCompletedOrders = allOrders.filter(order => 
      ['shipping', 'delivered', 'completed'].includes(order.status) &&
      order.orderDate && 
      new Date(order.orderDate) >= threeMonthsAgo &&
      order.orderNumber !== "1587" // Exclude special order
    );
    
    console.log(`Aantal voltooide orders in de afgelopen 3 maanden: ${recentCompletedOrders.length}`);
    
    // Stap 3: Filter actieve orders in productie (met BUILD checkbox aangevinkt)
    const buildingOrders = allOrders.filter(order => 
      order.status !== "cancelled" && 
      order.status !== "delivered" && 
      order.status !== "shipping" &&
      order.status !== "completed" &&
      order.orderNumber !== "1587" && // Exclude special order
      (order.statusChangeDates?.building || order.buildDate)
    );
    
    console.log(`Aantal actieve orders in productie: ${buildingOrders.length}`);
    
    // Stap 4: Bereken basis wachttijd op basis van voltooide orders
    let baseWaitDays = 0;
    let avgCompletionTime = 0;
    let avgProductionTime = 0;
    
    // 4a. Als er recent voltooide orders zijn, gebruik hun gemiddelde doorlooptijd
    if (recentCompletedOrders.length > 0) {
      const completionTimes = recentCompletedOrders.map(order => {
        const orderDate = new Date(order.orderDate);
        const completionDate = order.shippedDate ? new Date(order.shippedDate) : 
                             order.deliveredDate ? new Date(order.deliveredDate) : 
                             new Date(order.updatedAt);
        
        const days = Math.round((completionDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
        return days;
      });
      
      // Als er genoeg data is, trim outliers
      if (completionTimes.length > 3) {
        const sortedTimes = [...completionTimes].sort((a, b) => a - b);
        const trimmedTimes = sortedTimes.slice(1, sortedTimes.length - 1);
        avgCompletionTime = Math.round(trimmedTimes.reduce((sum, time) => sum + time, 0) / trimmedTimes.length);
      } else {
        avgCompletionTime = Math.round(completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length);
      }
      
      console.log(`Gemiddelde doorlooptijd van voltooide orders: ${avgCompletionTime} dagen`);
    } else {
      // Fallback als er geen data is
      avgCompletionTime = calculateAverageWaitTime(allOrders, {
        trimOutliers: true,
        maxWaitDays: 150,
        includeStatuses: ['shipping', 'delivered', 'completed']
      });
      console.log(`Geen recente voltooide orders gevonden, fallback: ${avgCompletionTime} dagen`);
    }
    
    // 4b. Bereken productietijd van actieve orders (tijd sinds BUILD aanvinken)
    if (buildingOrders.length > 0) {
      const productionTimes = buildingOrders.map(order => {
        const buildDate = order.statusChangeDates?.building ? 
          new Date(order.statusChangeDates.building) : 
          order.buildDate ? new Date(order.buildDate) : null;
          
        if (!buildDate) return 0;
        
        const days = Math.round((now.getTime() - buildDate.getTime()) / (1000 * 60 * 60 * 24));
        return days;
      }).filter(days => days > 0);
      
      if (productionTimes.length > 0) {
        avgProductionTime = Math.round(productionTimes.reduce((sum, time) => sum + time, 0) / productionTimes.length);
        console.log(`Gemiddelde productietijd van actieve orders: ${avgProductionTime} dagen`);
      }
    }
    
    // Stap 5: Bepaal de basis wachttijd op basis van beschikbare gegevens
    if (avgCompletionTime > 0) {
      // Als we voltooide orders hebben, gebruik die als basis
      baseWaitDays = avgCompletionTime;
      console.log(`Basis wachttijd op basis van voltooide orders: ${baseWaitDays} dagen`);
    } else {
      // Fallback naar een veilige standaardwaarde
      baseWaitDays = 90;
      console.log(`Geen geschikte data voor berekening, gebruik fallback: ${baseWaitDays} dagen`);
    }
    
    // Stap 6: Correctie voor 4-daagse werkweek (80%)
    const workdaysCorrectionFactor = 1.25; // 5 dagen / 4 dagen = 1.25
    const roundedAdjustedWaitDays = Math.round(baseWaitDays * workdaysCorrectionFactor);
    console.log(`Wachttijd gecorrigeerd voor 4-daagse werkweek: ${roundedAdjustedWaitDays} dagen (factor: ${workdaysCorrectionFactor})`);
    
    // Stap 7: Tel niet-werkdagen erbij op
    const totalWaitDays = roundedAdjustedWaitDays + totalNonWorkingDays;
    console.log(`Totale wachttijd met niet-werkdagen: ${totalWaitDays} dagen`);
    
    // Stap 8: Bepaal product mix en minimale wachttijd op basis van instrumenttypes
    // Analyseer lopende orders om productmix te bepalen
    const pendingOrders = allOrders.filter(order => 
      !['completed', 'delivered', 'cancelled', 'shipping'].includes(order.status)
    );
    
    // Bepaal productietijd per instrumenttype (in uren)
    // Directe werktijd per instrument (alleen het handwerk)
    const werkurenZEN = 0.5;       // ZEN: 30 minuten
    const werkurenNatey = 0.67;    // Natey: 40 minuten
    const werkurenDouble = 2;      // Double: 2 uur
    const werkurenInnato = 3;      // Innato: 3 uur
    const werkurenPakken = 0.25;   // Pakken: 15 minuten per instrument
    
    // Tel item types in wachtlijst
    const pendingItemTypes = {
      ZEN: 0,
      Natey: 0,
      Double: 0,
      Innato: 0,
      Other: 0
    };
    
    // Loop door orders om items te analyseren
    let totalPendingItems = 0;
    pendingOrders.forEach(order => {
      const items = order.items || [];
      items.forEach(item => {
        const itemType = item.itemType?.toUpperCase() || '';
        if (itemType.includes('ZEN')) pendingItemTypes.ZEN++;
        else if (itemType.includes('NATEY')) pendingItemTypes.Natey++;
        else if (itemType.includes('DOUBLE')) pendingItemTypes.Double++;
        else if (itemType.includes('INNATO')) pendingItemTypes.Innato++;
        else pendingItemTypes.Other++;
        
        totalPendingItems++;
      });
    });
    
    console.log(`Wachtlijst samenstelling: ZEN=${pendingItemTypes.ZEN}, Natey=${pendingItemTypes.Natey}, Double=${pendingItemTypes.Double}, Innato=${pendingItemTypes.Innato}, Other=${pendingItemTypes.Other}`);
    console.log(`Totaal aantal wachtende items: ${totalPendingItems}`);
    
    // Bereken totaal benodigde werkuren op basis van instrumentmix
    let totalWerkuren = 0;
    
    // Bereken de werktijd in uren voor elk instrument in de wachtrij
    if (totalPendingItems > 0) {
      // Bereken totale directe werktijd voor elk type instrument
      const urenZEN = pendingItemTypes.ZEN * werkurenZEN;
      const urenNatey = pendingItemTypes.Natey * werkurenNatey;
      const urenDouble = pendingItemTypes.Double * werkurenDouble;
      const urenInnato = pendingItemTypes.Innato * werkurenInnato;
      const urenOther = pendingItemTypes.Other * werkurenNatey; // Default is Natey
      
      // Totale directe werktijd voor alle instrumenten
      const directeWerktijd = urenZEN + urenNatey + urenDouble + urenInnato + urenOther;
      
      // Voeg tijd toe voor het inpakken (15 minuten per instrument)
      const inpakTijd = totalPendingItems * werkurenPakken;
      
      // Totale werktijd
      totalWerkuren = directeWerktijd + inpakTijd;
      
      console.log(`Directe werktijd: ${directeWerktijd.toFixed(1)} uur, inpaktijd: ${inpakTijd.toFixed(1)} uur`);
      console.log(`Totale werktijd voor alle instrumenten: ${totalWerkuren.toFixed(1)} uur`);
    }
    
    // Stap 9: Bereken wachttijd op basis van daadwerkelijke werk schema en capaciteit
    // Werkschema: 4-5 dagen per week, 6 uur per dag = 24-30 uur per week
    const werkurenPerWeek = 4.5 * 6; // 4.5 dagen * 6 uur = 27 uur per week
    const werkurenPerDag = werkurenPerWeek / 7; // gemiddeld aantal werkuren per kalenderdag
    
    // Bereken hoeveel dagen het duurt om de huidige wachtrij te verwerken
    // op basis van beschikbare werktijd
    const daysToProcessQueue = totalPendingItems > 0 ? 
      Math.ceil(totalWerkuren / werkurenPerDag) : 0;
      
    // Voeg extra tijd toe voor de beperkingen van batch-processes:
    // - Oven stook ongeveer 1x per 1-2 weken (20 instrumenten per keer)
    // - Verzending gebeurt ongeveer 1x per 2 weken
    const ovencycli = Math.ceil(totalPendingItems / 20); // Aantal keren dat de oven moet worden gestookt
    const ovenWachttijd = ovencycli > 0 ? (ovencycli - 1) * 7 : 0; // Wachttijd voor oven cycli (1 week per extra cyclus)
    
    // Verzend-wachttijd (gemiddeld 1 week wachttijd door 2-wekelijkse verzending)
    const verzendWachttijd = totalPendingItems > 0 ? 7 : 0;
    
    console.log(`Wachtrij verwerking (directe werktijd): ${daysToProcessQueue} dagen bij ${werkurenPerWeek} werkuren per week`);
    console.log(`Oven cycli: ${ovencycli}, extra wachttijd: ${ovenWachttijd} dagen`);
    console.log(`Verzend wachttijd: ${verzendWachttijd} dagen`);
    
    // Bereken de minimale wachttijd die we willen hanteren (nooit onder 14 dagen)
    const minimumWaitTime = 14; // Minimaal 2 weken
    
    // Bereken de uiteindelijke wachttijd als volgt:
    // 1. Basistijd = werktijd om de wachtrij te verwerken
    // 2. Voeg wachttijd toe voor batch processen (oven, verzending)
    // 3. Voeg niet-werkdagen toe (vakanties)
    // 4. Gebruik nooit minder dan de minimumWaitTime
    const processTijd = daysToProcessQueue + ovenWachttijd + verzendWachttijd;
    const processEnVakantieTijd = processTijd + totalNonWorkingDays;
    const finalWaitDays = Math.max(minimumWaitTime, processEnVakantieTijd);
    
    console.log(`Basis verwerktijd: ${processTijd} dagen`);
    console.log(`Totale wachttijd (incl. vakantiedagen): ${processEnVakantieTijd} dagen`);
    console.log(`Uiteindelijke wachttijd: ${finalWaitDays} dagen (minimum: ${minimumWaitTime})`);
    
    // Debug-loggen van de berekende waarde vóór het returnen
  console.log(`DEBUG FINAL WAIT DAYS: Returning ${Math.round(finalWaitDays)} days`);
      
  return {
      // Ruwe wachttijd
      baseWaitDays: daysToProcessQueue,
      
      // Afzonderlijke componenten
      workdaysCorrectionFactor: werkurenPerWeek / (7 * 24), // Fractie van de week die gewerkt wordt
      fourDayWeekAdjustment: 0, // Dit veld wordt niet meer gebruikt
      totalNonWorkingDays: totalNonWorkingDays,
      totalWaitDays: Math.round(processEnVakantieTijd),
      
      // Instrument mix gegevens
      pendingItemCount: totalPendingItems,
      wachtrijFactor: totalPendingItems > 0 ? Math.ceil(totalPendingItems / 20) : 0, // Queue factor based on batch size - FIXED
      
      // Batch process wachttijden
      ovenWachttijd: ovenWachttijd,
      verzendWachttijd: verzendWachttijd,
      
      // Uiteindelijke wachttijd
      finalWaitDays: Math.round(finalWaitDays),
      
      // Brondata
      recentCompletedOrders: recentCompletedOrders.length,
      buildingOrders: buildingOrders.length,
      avgCompletionTime: avgCompletionTime,
      avgProductionTime: processTijd,
      bufferDays: 0
    };
  } catch (error) {
    console.error("FOUT BIJ WACHTTIJD BEREKENING:", error);
    
    // Log de fout voor debugging
    console.error("BEREKENING FOUT - FALLBACK GEBRUIKT:", error);
    
    // Fallback waarden bij een fout - gebruik dynamische wachttijd van 52 dagen
    // gebaseerd op gemeten productiesnelheid van 7.5 instrumenten per week
    return {
      baseWaitDays: 52,
      workdaysCorrectionFactor: 0.16, // 4.5 * 6 / (7 * 24)
      fourDayWeekAdjustment: 0,
      totalNonWorkingDays: 0,
      totalWaitDays: 52,
      finalWaitDays: 52,
      
      // Instrument mix gegevens
      pendingItemCount: 0,
      wachtrijFactor: 0,
      
      // Batch process wachttijden
      ovenWachttijd: 0,
      verzendWachttijd: 0,
      
      // Brondata
      recentCompletedOrders: 0,
      buildingOrders: 0,
      avgCompletionTime: 0,
      avgProductionTime: 0,
      bufferDays: 0
    };
  }
}

// Export the wait time calculation function so it can be used in other components
export { calculateWaitTime, type WaitTimeResult, type NonWorkingPeriod };
export default WaitTimeStats;