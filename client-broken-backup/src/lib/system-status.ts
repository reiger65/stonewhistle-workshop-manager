/**
 * Systeem Status client voor real-time status updates via WebSocket
 * 
 * Deze module maakt een WebSocket verbinding met de server en ontvangt
 * real-time status updates over achtergrondtaken zoals Shopify synchronisatie
 * en database backups.
 */

import { create } from 'zustand'

// Status update type definitions
export interface SystemStatusUpdate {
  type: 'shopify_sync' | 'database_backup' | 'system_maintenance';
  status: 'started' | 'in_progress' | 'completed' | 'failed';
  progress?: number; // 0-100
  message?: string;
  timestamp: number;
}

export interface SystemStatus {
  activeProcesses: Record<string, SystemStatusUpdate>;
  lastBackupTimestamp: number | null;
  maxBackups: number;
  isBackupInProgress: boolean;
}

// Zustand store voor systeemstatus
export const useSystemStatus = create<{
  connected: boolean;
  status: SystemStatus | null;
  error: string | null;
  fetchStatus: () => Promise<void>;
}>((set: any) => ({
  connected: false,
  status: null,
  error: null,
  fetchStatus: async () => {
    try {
      const response = await fetch('/api/system-status');
      if (!response.ok) {
        throw new Error(`Error fetching system status: ${response.statusText}`);
      }
      const status = await response.json();
      set({ status, error: null });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  }
}));

// WebSocket verbinding opzetten
let socket: WebSocket | null = null;

export function initSystemStatusWebSocket() {
  if (socket) {
    // Als er al een socket is, deze sluiten
    socket.close();
  }

  // WebSocket verbinding opzetten met de juiste URL
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  console.log(`Setting up WebSocket connection to ${wsUrl}`);
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('WebSocket connection established');
    useSystemStatus.setState({ connected: true });
    
    // Bij verbinding meteen de status ophalen
    useSystemStatus.getState().fetchStatus();
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed');
    useSystemStatus.setState({ connected: false });
    
    // Probeer opnieuw te verbinden na 5 seconden
    setTimeout(() => {
      initSystemStatusWebSocket();
    }, 5000);
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    useSystemStatus.setState({ error: 'WebSocket connection error' });
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data && typeof data === 'object') {
        useSystemStatus.setState({ status: data, error: null });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
}

// Bepaal of er een actief process bezig is
export function hasActiveProcess(): boolean {
  const { status } = useSystemStatus.getState();
  if (!status) return false;
  
  return status.activeProcesses && Object.values(status.activeProcesses).some(
    (process: any) => ['started', 'in_progress'].includes(process.status)
  );
}

// Haal een specifiek actief proces op
export function getActiveProcess(type: string): SystemStatusUpdate | null {
  const { status } = useSystemStatus.getState();
  if (!status) return null;
  
  return status.activeProcesses[type] || null;
}

// Initialiseer de WebSocket verbinding bij het laden van de applicatie
export function initSystemStatus() {
  // Eerst de status ophalen via REST API
  useSystemStatus.getState().fetchStatus();
  
  // Dan de WebSocket verbinding opzetten
  initSystemStatusWebSocket();
}