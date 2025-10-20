import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
// Removed theme toggle
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Menu, User, Wifi, WifiOff, CloudSun, LogOut, Music, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOfflineMode } from '@/hooks/use-offline-mode';
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
  onOpenAddOrder: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function Header({ onOpenAddOrder, currentPath, onNavigate }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { isOnline, pendingChanges, triggerSync } = useOfflineMode();
  
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
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container-fluid px-0 py-0.5">
        {/* Top row with logo, title and action buttons */}
        <div className="flex justify-between items-center h-10">
          {/* Logo and title - positioned at the left edge */}
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
          
          {/* Tab buttons - colorful, touch-friendly layout */}
          <div className="flex items-center justify-center gap-2 flex-1 px-2 overflow-x-auto scrollbar-hide">
            <Button 
              variant={currentPath === '/' ? "default" : "outline"}
              className={cn(
                "h-10 min-w-[100px] px-4 text-base font-bold rounded-md shadow-md touch-target font-condensed",
                currentPath === '/' 
                  ? "bg-[#015a6c] hover:bg-[#013e4a] text-white border-3 border-[#015a6c]" 
                  : "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border-3 border-[#015a6c]"
              )}
              onClick={() => onNavigate('/')}
            >
              <TranslatedText translationKey="nav.buildlist" />
            </Button>
            <Button 
              variant={currentPath === '/completed' ? "default" : "outline"}
              className={cn(
                "h-10 min-w-[100px] px-4 text-base font-bold rounded-md shadow-md touch-target font-condensed",
                currentPath === '/completed' 
                  ? "bg-[#015a6c] hover:bg-[#013e4a] text-white border-3 border-[#015a6c]" 
                  : "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border-3 border-[#015a6c]"
              )}
              onClick={() => onNavigate('/completed')}
            >
              <TranslatedText translationKey="nav.completed" />
            </Button>
            <Button 
              variant={currentPath === '/reports' ? "default" : "outline"}
              className={cn(
                "h-10 min-w-[100px] px-4 text-base font-bold rounded-md shadow-md touch-target font-condensed",
                currentPath === '/reports' 
                  ? "bg-[#015a6c] hover:bg-[#013e4a] text-white border-3 border-[#015a6c]" 
                  : "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border-3 border-[#015a6c]"
              )}
              onClick={() => onNavigate('/reports')}
            >
              Reports
            </Button>
            <Button 
              variant={currentPath === '/stock' ? "default" : "outline"}
              className={cn(
                "h-10 min-w-[100px] px-4 text-base font-bold rounded-md shadow-md touch-target font-condensed",
                currentPath === '/stock' 
                  ? "bg-[#015a6c] hover:bg-[#013e4a] text-white border-3 border-[#015a6c]" 
                  : "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border-3 border-[#015a6c]"
              )}
              onClick={() => onNavigate('/stock')}
            >
              <TranslatedText translationKey="nav.stock" />
            </Button>
            <Button 
              variant={currentPath === '/settings' ? "default" : "outline"}
              className={cn(
                "h-10 min-w-[100px] px-4 text-base font-bold rounded-md shadow-md touch-target font-condensed",
                currentPath === '/settings' 
                  ? "bg-[#015a6c] hover:bg-[#013e4a] text-white border-3 border-[#015a6c]" 
                  : "bg-white hover:bg-[#F5F5F0] text-[#015a6c] border-3 border-[#015a6c]"
              )}
              onClick={() => onNavigate('/settings')}
            >
              <TranslatedText translationKey="nav.settings" />
            </Button>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Offline indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn(
                    "flex items-center rounded-md px-2 py-1 mr-1 transition-colors offline-indicator font-condensed",
                    isOnline 
                      ? "bg-green-100 text-green-700 border border-green-300" 
                      : "bg-red-100 text-red-700 border border-red-300 animate-pulse"
                  )}>
                    {isOnline ? (
                      <Wifi className="h-4 w-4 mr-1" />
                    ) : (
                      <WifiOff className="h-4 w-4 mr-1" />
                    )}
                    <span className="text-xs font-medium hidden sm:inline">
                      {isOnline ? "Online" : "Offline"}
                    </span>
                    {!isOnline && pendingChanges > 0 && (
                      <Badge variant="destructive" className="ml-1 h-5 text-[10px]">
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
            
            {/* New Order Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="touch-target h-8 w-8 border border-gray-200 bg-green-50 text-green-600"
                    onClick={onOpenAddOrder}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Create New Order
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            

            
            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="touch-target h-8 w-8 border border-gray-200"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input 
                    className="w-full pl-9 touch-target text-sm h-9" 
                    placeholder="Search orders, customers..." 
                  />
                </div>
              </PopoverContent>
            </Popover>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 touch-target border border-gray-200"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem 
                  className={cn("cursor-pointer py-3 text-base font-medium touch-target font-condensed", currentPath === '/' && "bg-gray-100")}
                  onClick={() => onNavigate('/')}
                >
                  <TranslatedText translationKey="nav.buildlist" />
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={cn("cursor-pointer py-3 text-base font-medium touch-target font-condensed", currentPath === '/completed' && "bg-gray-100")}
                  onClick={() => onNavigate('/completed')}
                >
                  <TranslatedText translationKey="nav.completed" />
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={cn("cursor-pointer py-3 text-base font-medium touch-target font-condensed", currentPath === '/reports' && "bg-gray-100")}
                  onClick={() => onNavigate('/reports')}
                >
                  Reports
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={cn("cursor-pointer py-3 text-base font-medium touch-target font-condensed", currentPath === '/stock' && "bg-gray-100")}
                  onClick={() => onNavigate('/stock')}
                >
                  <TranslatedText translationKey="nav.stock" />
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={cn("cursor-pointer py-3 text-base font-medium touch-target font-condensed", currentPath === '/settings' && "bg-gray-100")}
                  onClick={() => onNavigate('/settings')}
                >
                  <TranslatedText translationKey="nav.settings" />
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className={cn("cursor-pointer py-3 text-base font-medium touch-target font-condensed", currentPath === '/enhanced-tuner' && "bg-gray-100")}
                  onClick={() => onNavigate('/enhanced-tuner')}
                >
                  <Music className="h-4 w-4 mr-2" />
                  Enhanced Flute Tuner
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className={cn("cursor-pointer py-3 text-base font-medium touch-target font-condensed", currentPath === '/tuner' && "bg-gray-100")}
                  onClick={() => onNavigate('/tuner')}
                >
                  <Music className="h-4 w-4 mr-2" />
                  Classic Flute Tuner
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  className={cn("cursor-pointer py-3 text-base font-medium touch-target font-condensed", currentPath === '/tuner-test' && "bg-gray-100")}
                  onClick={() => onNavigate('/tuner-test')}
                >
                  <Music className="h-4 w-4 mr-2" />
                  Tuner Testing Tool
                </DropdownMenuItem>
                
                {/* Logout button */}
                <DropdownMenuSeparator />
                <LogoutButton />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
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
