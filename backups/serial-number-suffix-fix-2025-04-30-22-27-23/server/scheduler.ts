/**
 * Scheduler voor automatische Shopify en database synchronisatie
 * Dit zorgt ervoor dat de data 4x per dag wordt gesynchroniseerd
 */
import cron from 'node-cron';
import { syncShopifyOrders } from './shopify';
import { storage } from './storage';
import { EventEmitter } from 'events';

// Tijden waarop de synchronisatie moet plaatsvinden (4x per dag)
// '0 */6 * * *' betekent: elke 6 uur, om 00:00, 06:00, 12:00, 18:00
const SYNC_SCHEDULE = '0 */6 * * *'; 

// Vlag om bij te houden of de initiële sync is uitgevoerd bij opstarten
let initialSyncDone = false;

// Synchronisatie status tracker
export const syncStatus = {
  isRunning: false,
  startTime: null as Date | null,
  endTime: null as Date | null,
  progress: 0, // 0-100
  currentStep: '',
  totalSteps: 0,
  completedSteps: 0,
  currentOrderNumber: '',
  processedOrders: 0,
  totalOrders: 0,
  errors: [] as string[],
  lastMessage: '',
  lastSync: null as Date | null,
  success: null as boolean | null,
};

// Event emitter voor het bijhouden van de voortgang
export const syncEvents = new EventEmitter();

// Update de sync status en stuur een event
export function updateSyncStatus(updates: Partial<typeof syncStatus>) {
  Object.assign(syncStatus, updates);
  
  // Als we orders aan het verwerken zijn, update de voortgang als percentage
  if (syncStatus.totalOrders > 0) {
    syncStatus.progress = Math.floor((syncStatus.processedOrders / syncStatus.totalOrders) * 100);
  }
  
  // Stuur een event zodat clients kunnen updaten
  syncEvents.emit('sync-status-updated', syncStatus);
}

// Shopify synchronisatie callback - wordt aangeroepen door de shopify.ts module
export function onShopifyOrderProgress(data: {
  currentOrder: number;
  totalOrders: number;
  currentOrderNumber: string;
}) {
  updateSyncStatus({
    processedOrders: data.currentOrder,
    totalOrders: data.totalOrders,
    currentOrderNumber: data.currentOrderNumber,
    lastMessage: `Synchroniseren order ${data.currentOrderNumber} (${data.currentOrder}/${data.totalOrders})`,
  });
}

/**
 * Voert een volledige synchronisatie uit met Shopify en de database
 * @param {string} [period] - Optionele periode om de synchronisatie te beperken ("1week", "1month", "3months", "6months", "1year", "all")
 */
export async function runFullSync(period?: string) {
  // Als er al een synchronisatie loopt, voer deze niet opnieuw uit
  if (syncStatus.isRunning) {
    console.log('⚠️ Er loopt al een synchronisatie proces. Nieuwe aanvraag wordt genegeerd.');
    return { 
      success: false, 
      message: 'Er loopt al een synchronisatie proces' 
    };
  }
  
  // Reset de sync status
  updateSyncStatus({
    isRunning: true,
    startTime: new Date(),
    endTime: null,
    progress: 0,
    currentStep: 'Voorbereiden van synchronisatie...',
    totalSteps: 2,
    completedSteps: 0,
    currentOrderNumber: '',
    processedOrders: 0,
    totalOrders: 0,
    errors: [],
    lastMessage: 'Synchronisatie gestart...',
    success: null,
  });
  
  console.log(`🔄 Volledige synchronisatie gestart - ${new Date().toLocaleString()}`);
  
  try {
    // Stap 1: Sync met Shopify
    updateSyncStatus({
      currentStep: 'Stap 1: Shopify orders synchroniseren...',
      completedSteps: 0,
    });
    
    console.log(`Stap 1: Shopify orders synchroniseren met periode: ${period || '6 months (default)'}`);
    const shopifyResult = await syncShopifyOrders(period);
    console.log(`Shopify synchronisatie resultaat: ${shopifyResult.success ? 'Succesvol' : 'Mislukt'}`);
    
    updateSyncStatus({
      completedSteps: 1,
      lastMessage: `Shopify synchronisatie ${shopifyResult.success ? 'succesvol' : 'mislukt'}`
    });
    
    // Stap 2: Run database cleanup/maintenance (indien nodig)
    updateSyncStatus({
      currentStep: 'Stap 2: Database onderhoud...',
    });
    
    console.log('Stap 2: Database onderhoud...');
    // Hier kan later database onderhoud worden toegevoegd indien nodig
    
    updateSyncStatus({
      completedSteps: 2,
      progress: 100,
      lastMessage: 'Synchronisatie succesvol afgerond',
      endTime: new Date(),
      isRunning: false,
      lastSync: new Date(),
      success: true,
    });
    
    console.log(`✅ Volledige synchronisatie afgerond - ${new Date().toLocaleString()}`);
    return { success: true, message: 'Volledige synchronisatie succesvol afgerond' };
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error('❌ Fout tijdens volledige synchronisatie:', error);
    
    updateSyncStatus({
      errors: [...syncStatus.errors, errorMessage],
      lastMessage: `Synchronisatie mislukt: ${errorMessage}`,
      endTime: new Date(),
      isRunning: false,
      success: false,
    });
    
    return { success: false, message: `Synchronisatie mislukt: ${errorMessage}` };
  }
}

/**
 * Start automatische synchronisatie volgens schema
 */
export function startScheduledSync() {
  console.log(`🕒 Geplande synchronisatie ingesteld op schema: ${SYNC_SCHEDULE}`);
  
  // Run initiële sync bij opstarten als dat nog niet is gebeurd
  if (!initialSyncDone) {
    console.log('Initiële synchronisatie wordt uitgevoerd bij server opstart...');
    setTimeout(async () => {
      await runFullSync();
      initialSyncDone = true;
    }, 15000); // Wacht 15 seconden na opstart zodat de server eerst kan initialiseren
  }
  
  // Configureer geplande synchronisatie op het opgegeven schema
  cron.schedule(SYNC_SCHEDULE, async () => {
    console.log(`⏰ Geplande synchronisatie gestart volgens schema - ${new Date().toLocaleString()}`);
    await runFullSync();
  });
  
  console.log('Geautomatiseerde synchronisatie is actief.');
}