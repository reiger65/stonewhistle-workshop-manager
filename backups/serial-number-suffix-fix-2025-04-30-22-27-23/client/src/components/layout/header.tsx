import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu, User, Wifi, WifiOff, LogOut, PlusCircle, Search, Database, Upload, Cloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { useSearch } from '@/hooks/use-search';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';

import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TranslatedText } from '@/components/ui/translated-text';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Header({ currentPath, onNavigate }: HeaderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { isOnline, pendingChanges, triggerSync } = useOfflineMode();
  const { filter, setFilter } = useSearch();
  
  // Get the current page title based on path
  const getPageTitle = () => {
    switch(currentPath) {
      case '/': return 'Stonewhistle Buildlist';
      case '/completed': return 'Completed Orders';
      case '/reports': return 'Production Reports';
      case '/stock': return 'Inventory & Stock';
      case '/settings': return 'Workshop Settings';
      default: return 'Stonewhistle Workshop';
    }
  };

  return (
    <header className="sticky top-0 z-1 bg-white border-b shadow-sm">
      <div className="container-fluid px-0 py-0 -my-0.5">
        {/* Top row with logo, title and action buttons - more compact */}
        <div className="flex justify-between items-center h-10">
          {/* Logo and title - positioned at the left edge - more compact */}
          <div className="flex items-center gap-1 mr-8 pl-2">
            <Link href="/" className="ml-0">
              <div className="h-8 w-8 rounded-md overflow-hidden flex-shrink-0">
                <img src="/assets/logo-wit-blauw.jpeg" alt="Stonewhistle Logo" className="h-full w-full object-contain" />
              </div>
            </Link>
            <h1 className="text-base hidden sm:block truncate max-w-[180px] md:max-w-none font-condensed">
              <span className="font-bold">Stonewhistle</span><span className="font-light"> Workshop Manager</span>
            </h1>
          </div>
          
          {/* Tab buttons - colorful, touch-friendly layout - extra compact layout */}
          <div className="flex items-center justify-center gap-[2px] flex-1 px-1 py-0 -my-1 overflow-x-auto scrollbar-hide">
            <Button 
              variant={currentPath === '/' ? "default" : "outline"}
              className={cn(
                "h-8 min-w-[80px] px-2 font-bold rounded-md shadow-sm touch-target nav-button",
                currentPath === '/' 
                  ? "bg-[#015a6c] hover:bg-[#013e4a] text-white border border-[#015a6c]" 
                  : "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border border-[#015a6c]"
              )}
              onClick={() => onNavigate('/')}
            >
              <span className="text-sm">
                <TranslatedText translationKey="nav.buildlist" />
              </span>
            </Button>
            <Button 
              variant={currentPath === '/completed' ? "default" : "outline"}
              className={cn(
                "h-8 min-w-[80px] px-2 font-bold rounded-md shadow-sm touch-target nav-button",
                currentPath === '/completed' 
                  ? "bg-[#015a6c] hover:bg-[#013e4a] text-white border border-[#015a6c]" 
                  : "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border border-[#015a6c]"
              )}
              onClick={() => onNavigate('/completed')}
            >
              <span className="text-sm">
                <TranslatedText translationKey="nav.completed" />
              </span>
            </Button>
            <Button 
              variant={currentPath === '/reports' ? "default" : "outline"}
              className={cn(
                "h-8 min-w-[80px] px-2 font-bold rounded-md shadow-sm touch-target nav-button",
                currentPath === '/reports' 
                  ? "bg-[#015a6c] hover:bg-[#013e4a] text-white border border-[#015a6c]" 
                  : "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border border-[#015a6c]"
              )}
              onClick={() => onNavigate('/reports')}
            >
              <span className="text-sm">
                Reports
              </span>
            </Button>
            <Button 
              variant={currentPath === '/stock' ? "default" : "outline"}
              className={cn(
                "h-8 min-w-[80px] px-2 font-bold rounded-md shadow-sm touch-target nav-button",
                currentPath === '/stock' 
                  ? "bg-[#015a6c] hover:bg-[#013e4a] text-white border border-[#015a6c]" 
                  : "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border border-[#015a6c]"
              )}
              onClick={() => onNavigate('/stock')}
            >
              <span className="text-sm">
                <TranslatedText translationKey="nav.stock" />
              </span>
            </Button>
            
            <Button 
              variant={currentPath === '/settings' ? "default" : "outline"}
              className={cn(
                "h-8 min-w-[80px] px-2 font-bold rounded-md shadow-sm touch-target nav-button",
                currentPath === '/settings' 
                  ? "bg-[#015a6c] hover:bg-[#013e4a] text-white border border-[#015a6c]" 
                  : "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border border-[#015a6c]"
              )}
              onClick={() => onNavigate('/settings')}
            >
              <span className="text-sm">
                <TranslatedText translationKey="nav.settings" />
              </span>
            </Button>
            
            {/* Search field - consistent styling with other buttons */}
            {(currentPath === '/' || currentPath === '/completed') && (
              <div className="relative min-w-[160px] max-w-[200px] z-40">
                <Search className="absolute left-2 top-2 h-5 w-5 text-[#015a6c]" />
                <Input
                  placeholder="Zoek orders..."
                  className="pl-8 pr-6 py-1 h-8 font-bold rounded-md shadow-sm border-[#015a6c] border-[1px] focus-visible:ring-0 focus-visible:ring-offset-0 nav-button text-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                {filter && (
                  <button
                    className="absolute right-2 top-2.5 h-4 w-4 text-[#015a6c] hover:text-[#013e4a] bg-gray-100 rounded-full p-0.5 flex items-center justify-center"
                    onClick={() => setFilter('')}
                    aria-label="Clear search"
                  >
                    <svg width="10" height="10" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0 z-50 -my-1">
            
            {/* Database backup button */}
            <BackupButton />
            
            {/* Offline indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center rounded-md px-1 py-0.25 mr-1 transition-colors offline-indicator font-condensed",
                    isOnline 
                      ? "bg-green-100 text-green-700 border border-green-300" 
                      : "bg-red-100 text-red-700 border border-red-300 animate-pulse"
                  )}>
                    {isOnline ? (
                      <Wifi className="h-3 w-3 mr-0.5" />
                    ) : (
                      <WifiOff className="h-3 w-3 mr-0.5" />
                    )}
                    <span className="text-xs font-medium hidden sm:inline">
                      {isOnline ? "Online" : "Offline"}
                    </span>
                    {!isOnline && pendingChanges > 0 && (
                      <Badge variant="destructive" className="ml-0.5 h-4 text-[8px]">
                        {pendingChanges}
                      </Badge>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {isOnline 
                    ? "You're connected to the server. Changes are saved in real-time."
                    : `You're offline. ${pendingChanges > 0 
                        ? `${pendingChanges} change(s) will sync when you reconnect.` 
                        : "Changes will be saved locally until you reconnect."}`
                  }
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* Menu beperkt tot alleen de uitlogfunctie */}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 touch-target border border-gray-200"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 z-[9999]">
                {/* Alleen de uitlogknop behouden in het menu */}
                <LogoutButton />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

// Backup menu component met dropdown opties
function BackupButton() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [driveBackups, setDriveBackups] = useState<any[]>([]);
  const [showBackups, setShowBackups] = useState(false);
  
  // Mutation voor backup maken
  const backupMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/backup/database');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Er is een fout opgetreden bij het maken van een backup');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Backup gemaakt!',
        description: `Database backup is succesvol aangemaakt: ${data.filename || 'backup bestand'}`,
        duration: 5000,
      });
      setIsLoading(false);
      // Herlaad de lijst met backups na het maken van een nieuwe backup
      fetchBackups();
    },
    onError: (error) => {
      toast({
        title: 'Backup mislukt',
        description: error.message || 'Er is een fout opgetreden bij het maken van een backup',
        variant: 'destructive',
        duration: 5000,
      });
      setIsLoading(false);
    }
  });
  
  // Query voor het ophalen van beschikbare backups
  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/backup/list');
      const data = await response.json();
      
      if (data.success) {
        setBackups(data.backups);
      } else {
        console.error('Fout bij ophalen van backups:', data.error);
      }
      
      // Haal Google Drive backups op
      const driveResponse = await fetch('/api/backup/drive/list');
      const driveData = await driveResponse.json();
      
      if (driveData.success) {
        setDriveBackups(driveData.backups || []);
      } else {
        console.error('Fout bij ophalen van Google Drive backups:', driveData.error);
      }
    } catch (error) {
      console.error('Fout bij het ophalen van backups:', error);
    }
  };
  
  // Functie om een backup terug te zetten
  const handleRestore = async (filename: string, source?: string, fileId?: string) => {
    if (!confirm(`Weet u zeker dat u de database wilt herstellen met de backup: ${filename}?\n\nLet op: Dit overschrijft alle huidige gegevens!`)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Als het een Google Drive backup is, gebruik de drive/restore endpoint
      if (source === 'drive' && fileId) {
        const response = await fetch(`/api/backup/drive/restore/${fileId}`, {
          method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: 'Restore gestart vanaf Google Drive',
            description: 'Het downloaden en terugzetten van de database is gestart. De applicatie zal binnenkort herstarten.',
            duration: 8000,
          });
        } else {
          throw new Error(data.error || 'Er is een fout opgetreden bij het terugzetten van de Google Drive backup');
        }
      } else {
        // Anders gebruik de normale restore endpoint voor lokale backups
        const response = await fetch(`/api/backup/restore/${filename}`, {
          method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
          toast({
            title: 'Restore gestart',
            description: 'Het terugzetten van de database is gestart. De applicatie zal binnenkort herstarten.',
            duration: 8000,
          });
        } else {
          throw new Error(data.error || 'Er is een fout opgetreden bij het terugzetten van de backup');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Restore mislukt',
        description: error.message || 'Er is een fout opgetreden bij het terugzetten van de backup',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackup = () => {
    setIsLoading(true);
    backupMutation.mutate();
  };
  
  // Laad de lijst met backups wanneer het dropdown menu wordt geopend
  const handleDropdownOpen = (open: boolean) => {
    if (open) {
      fetchBackups();
    }
  };
  
  return (
    <DropdownMenu onOpenChange={handleDropdownOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                size="icon"
                className={cn(
                  "h-8 w-8 touch-target border",
                  isLoading ? "border-blue-300 bg-blue-50" : "border-gray-200"
                )}
                disabled={isLoading}
              >
                <Database className={cn(
                  "h-5 w-5", 
                  isLoading && "animate-pulse text-blue-500"
                )} />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Database backup opties</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <DropdownMenuContent align="end" className="w-72 max-h-96 overflow-y-auto z-[9999]">
        <div className="px-2 py-1.5 text-sm font-medium text-gray-500">Database Backup Menu</div>
        
        {/* Nieuwe backup maken */}
        <DropdownMenuItem 
          className="cursor-pointer py-2.5 text-base font-medium touch-target flex items-center"
          onClick={handleBackup}
          disabled={isLoading}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Nieuwe backup maken
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Lokale backups */}
        <div className="px-2 py-1.5 text-sm font-medium text-gray-500">Lokale Backups</div>
        
        {/* Toggle lokale backups weergeven */}
        <DropdownMenuItem 
          className="cursor-pointer py-2 flex justify-between items-center"
          onClick={() => setShowBackups(!showBackups)}
        >
          <span>Backups weergeven</span>
          <span className="text-xs text-gray-500">{showBackups ? '▼' : '►'}</span>
        </DropdownMenuItem>
        
        {/* Lijst van backups, alleen weergeven als showBackups true is */}
        {showBackups && (
          <div className="px-1 py-1 max-h-40 overflow-y-auto">
            {backups.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">Geen backups gevonden</div>
            ) : (
              backups.slice(0, 10).map((backup, index) => (
                <DropdownMenuItem 
                  key={index}
                  className="cursor-pointer py-2 text-sm flex justify-between items-center"
                  onSelect={(e) => {
                    e.preventDefault();
                    handleRestore(backup.filename);
                  }}
                >
                  <div className="truncate max-w-[200px]" title={backup.filename}>
                    <span className="text-xs text-gray-500 block">
                      {backup.created instanceof Date ? backup.created.toLocaleString() : new Date(backup.timestamp).toLocaleString()}
                    </span>
                    <span className="text-xs">{backup.size}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(backup.filename);
                    }}
                  >
                    Herstel
                  </Button>
                </DropdownMenuItem>
              ))
            )}
            {backups.length > 10 && (
              <div className="px-3 py-1 text-xs text-gray-500 text-center">
                + {backups.length - 10} meer backups beschikbaar
              </div>
            )}
          </div>
        )}
        
        <DropdownMenuSeparator />
        
        {/* Google Drive backups */}
        <div className="px-2 py-1.5 text-sm font-medium text-gray-500">Google Drive Backups</div>
        
        {/* Backup naar Drive uploaden */}
        <DropdownMenuItem 
          className="cursor-pointer py-2.5 text-sm touch-target flex items-center"
          onClick={async () => {
            try {
              setIsLoading(true);
              const response = await fetch('/api/backup/drive/upload', {
                method: 'POST'
              });
              
              const data = await response.json();
              
              if (data.success) {
                toast({
                  title: 'Backup naar Google Drive geüpload',
                  description: `Backup is succesvol naar Google Drive geüpload.`,
                  duration: 5000,
                });
                // Ververs de lijst met backups
                fetchBackups();
              } else {
                throw new Error(data.error || 'Er is een fout opgetreden bij het uploaden naar Google Drive');
              }
            } catch (error: any) {
              toast({
                title: 'Google Drive upload mislukt',
                description: error.message || 'Er is een fout opgetreden bij het uploaden naar Google Drive',
                variant: 'destructive',
                duration: 5000,
              });
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
        >
          <Upload className="h-4 w-4 mr-2" />
          Backup naar Google Drive
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Google Drive backups lijst */}
        <div className="px-2 py-1.5 text-xs font-medium text-gray-500">Drive Backups Lijst</div>
        
        {driveBackups.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500">
            Geen Drive backups gevonden of Drive integratie niet beschikbaar.
          </div>
        ) : (
          <div className="px-1 py-1 max-h-40 overflow-y-auto">
            {driveBackups.slice(0, 5).map((backup, index) => (
              <DropdownMenuItem 
                key={index}
                className="cursor-pointer py-2 text-sm flex justify-between items-center"
                onSelect={(e) => {
                  e.preventDefault();
                  handleRestore(backup.name, 'drive', backup.id);
                }}
              >
                <div className="truncate max-w-[200px]" title={backup.name}>
                  <span className="text-xs text-gray-500 block">
                    {new Date(backup.modifiedTime).toLocaleString()}
                  </span>
                  <span className="text-xs">{Math.round(backup.size / 1024)} KB</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore(backup.name, 'drive', backup.id);
                  }}
                >
                  <Cloud className="h-3 w-3 mr-1" />
                  Herstel
                </Button>
              </DropdownMenuItem>
            ))}
            {driveBackups.length > 5 && (
              <div className="px-3 py-1 text-xs text-gray-500 text-center">
                + {driveBackups.length - 5} meer Drive backups beschikbaar
              </div>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Logout button component
function LogoutButton() {
  const { logoutMutation } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out."
        });
      }
    });
  };

  return (
    <DropdownMenuItem
      className="cursor-pointer py-3 text-base font-medium touch-target text-red-600 font-condensed"
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </DropdownMenuItem>
  );
}
