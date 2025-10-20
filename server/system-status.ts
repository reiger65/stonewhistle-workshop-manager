/**
 * Systeem Status Module
 * 
 * Deze module beheert de systeemstatus en biedt een WebSocket verbinding voor
 * real-time status updates over achtergrondtaken zoals Shopify synchronisatie
 * en database backups.
 */

import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';

// Interface voor status updates
export interface SystemStatusUpdate {
  type: 'shopify_sync' | 'database_backup' | 'system_maintenance';
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  progress?: number; // 0-100
  message?: string;
  timestamp: number;
}

// Interface voor de volledige systeem status
export interface SystemStatus {
  activeProcesses: Record<string, SystemStatusUpdate>;
  lastBackupTimestamp: number | null;
  maxBackups: number;
  isBackupInProgress: boolean;
}

// De huidige systeemstatus
let systemStatus: SystemStatus = {
  activeProcesses: {},
  lastBackupTimestamp: null,
  maxBackups: 10,
  isBackupInProgress: false
};

// WebSocket server en clients
let wss: WebSocketServer | null = null;
const clients: Set<WebSocket> = new Set();

/**
 * Initialiseer de WebSocket server voor systeemstatus updates
 * @param httpServer De HTTP server waaraan de WebSocket moet worden gekoppeld
 */
export function initStatusWebsocket(httpServer: HttpServer) {
  if (!wss) {
    wss = new WebSocketServer({ server: httpServer, path: '/ws' });
    console.log('Status WebSocket server initialized');

    wss.on('connection', (ws: WebSocket) => {
      console.log('Client connected to status WebSocket');
      clients.add(ws);

      // Stuur de huidige status naar de nieuwe client
      ws.send(JSON.stringify(systemStatus));

      ws.on('close', () => {
        console.log('Client disconnected from status WebSocket');
        clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clients.delete(ws);
      });
    });
  }
}

/**
 * Bijwerken van een specifiek proces in de systeemstatus en broadcast naar alle clients
 * @param update De nieuwe status voor het proces
 */
export function updateSystemStatus(update: SystemStatusUpdate) {
  // Update de status
  systemStatus.activeProcesses[update.type] = update;

  // Als het proces voltooid of mislukt is, verwijder het na 5 seconden
  if (update.status === 'completed' || update.status === 'failed') {
    setTimeout(() => {
      if (systemStatus.activeProcesses[update.type]) {
        delete systemStatus.activeProcesses[update.type];
        broadcastStatus();
      }
    }, 5000);
  }

  // Special case voor backup proces
  if (update.type === 'database_backup') {
    if (update.status === 'started') {
      systemStatus.isBackupInProgress = true;
    } else if (update.status === 'completed' || update.status === 'failed') {
      systemStatus.isBackupInProgress = false;
      if (update.status === 'completed') {
        systemStatus.lastBackupTimestamp = Date.now();
        updateLastBackupInfo();
      }
    }
  }

  // Broadcast de nieuwe status naar alle verbonden clients
  broadcastStatus();
}

/**
 * Stuur de huidige systeemstatus naar alle verbonden clients
 */
function broadcastStatus() {
  const message = JSON.stringify(systemStatus);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * Update de timestamp van de laatste backup
 */
function updateLastBackupInfo() {
  try {
    const lastBackupFile = path.join(process.cwd(), 'laatste-backup.txt');
    if (fs.existsSync(lastBackupFile)) {
      const content = fs.readFileSync(lastBackupFile, 'utf8');
      const match = content.match(/(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
      if (match) {
        const timestamp = new Date(match[1].replace(/_/g, 'T').replace(/-/g, ':'));
        systemStatus.lastBackupTimestamp = timestamp.getTime();
      }
    }
  } catch (error) {
    console.error('Error reading laatste-backup.txt:', error);
  }
}

/**
 * Set het maximum aantal backups dat bewaard wordt
 * @param max Aantal backups om te behouden
 */
export function setMaxBackups(max: number) {
  systemStatus.maxBackups = max;
  broadcastStatus();
}

/**
 * Get een schone versie van de systeemstatus om te delen met clients
 * (zonder gevoelige informatie)
 */
export function getPublicSystemStatus(): SystemStatus {
  return {
    ...systemStatus
  };
}

// Initialiseer bij het laden van de module
try {
  updateLastBackupInfo();
} catch (error) {
  console.error('Error initializing system status:', error);
}