import React from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Completed from "@/pages/completed";
import Settings from "@/pages/settings";
import StockNew from "@/pages/stock-new";
import Reports from "@/pages/reports";
import FixOrder1555 from "@/pages/fix-order-1555";
import { LanguageProvider } from "./lib/languageContext";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { OfflineModeProvider } from "@/hooks/use-offline-mode";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SearchProvider } from "@/hooks/use-search";
import Worksheet from "@/pages/worksheet";
import AuthPage from "@/pages/auth-page";
import Production from "@/pages/production";
import DiagnosePage from "@/pages/diagnose";
import DatabaseManager from "@/pages/database-manager";
import DatabaseBackup from "@/pages/database-backup";
import TimesheetPage from "@/pages/timesheet-page";
import { AudioLoader } from "@/components/ui/audio-loader";
import { SystemStatusIndicator } from "@/components/ui/system-status-indicator";

import { format } from "date-fns";


function Router() {
  return (
    <Switch>
      {/* Authentication routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Protected routes that require authentication */}
      <ProtectedRoute path="/" component={Worksheet} />
      <ProtectedRoute path="/production" component={Production} />
      <ProtectedRoute path="/completed" component={Completed} />
      <ProtectedRoute path="/stock-new" component={StockNew} />
      <Route path="/stock">
        {() => <Redirect to="/stock-new" />}
      </Route>
      <ProtectedRoute path="/time" component={TimesheetPage} />
      <ProtectedRoute path="/timesheet" component={TimesheetPage} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/fix-order-1555" component={FixOrder1555} />
      <ProtectedRoute path="/diagnose" component={DiagnosePage} />
      <ProtectedRoute path="/database" component={DatabaseManager} />
      <ProtectedRoute path="/database-backup" component={DatabaseBackup} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <OfflineModeProvider>
          <AuthProvider>
            <SearchProvider>
              <AutoSyncProvider>
                <Router />
                <Toaster />
              </AutoSyncProvider>
            </SearchProvider>
          </AuthProvider>
        </OfflineModeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

// Version info component displayed in the bottom right corner
function VersionInfo() {
  // Base version
  const baseVersion = "1.0";
  
  // Get change counter from localStorage or initialize to 1
  const [changeCounter, setChangeCounter] = React.useState(() => {
    const savedCounter = localStorage.getItem('versionChangeCounter');
    return savedCounter ? parseInt(savedCounter, 10) : 1;
  });
  
  // Format the version with the counter
  const version = `${baseVersion}.${changeCounter}`;
  
  // Current timestamp
  const buildDate = format(new Date(), "yyyy-MM-dd HH:mm");
  
  // Increment the counter when specific actions happen
  React.useEffect(() => {
    // Listen for custom version increment events
    const handleVersionIncrement = () => {
      const newCounter = changeCounter + 1;
      setChangeCounter(newCounter);
      localStorage.setItem('versionChangeCounter', newCounter.toString());
    };
    
    window.addEventListener('incrementVersion', handleVersionIncrement);
    
    return () => {
      window.removeEventListener('incrementVersion', handleVersionIncrement);
    };
  }, [changeCounter]);
  
  return (
    <div className="fixed bottom-[15px] right-1 text-[10px] text-gray-400 pointer-events-none z-10 font-bold">
      Stonewhistle Workflow Manager V{version} ({buildDate})
    </div>
  );
}

// Provider component for auto-syncing
function AutoSyncProvider({ children }: { children: React.ReactNode }) {
  // Use the auto-sync hook
  useAutoSync();
  
  return (
    <>
      {children}
      <AudioLoader />
      <SystemStatusIndicator />
      <VersionInfo />
    </>
  );
}

export default App;