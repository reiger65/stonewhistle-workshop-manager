import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu, User, Wifi, WifiOff, LogOut, PlusCircle, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOfflineMode } from '@/hooks/use-offline-mode';
import { useSearch } from '@/hooks/use-search';
import { Input } from '@/components/ui/input';
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
            
            {/* Search field - only show on workshop and completed pages */}
            {(currentPath === '/' || currentPath === '/completed') && (
              <div className="relative min-w-[180px] max-w-[220px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Zoek orders..."
                  className="pl-8 pr-8 py-2 h-10 border-[#015a6c] border-[1px] focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                {filter && (
                  <button
                    className="absolute right-2 top-3 h-4 w-4 text-gray-500 hover:text-gray-900 bg-gray-100 rounded-full p-0.5 flex items-center justify-center"
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
