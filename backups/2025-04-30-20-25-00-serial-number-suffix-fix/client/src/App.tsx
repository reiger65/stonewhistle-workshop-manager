import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Completed from "@/pages/completed";
import Settings from "@/pages/settings";
import Stock from "@/pages/stock";
import Reports from "@/pages/reports";
import { LanguageProvider } from "./lib/languageContext";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { OfflineModeProvider } from "@/hooks/use-offline-mode";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { SearchProvider } from "@/hooks/use-search";
import Worksheet from "@/pages/worksheet";
import AuthPage from "@/pages/auth-page";
import Production from "@/pages/production";
import { AudioLoader } from "@/components/ui/audio-loader";
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
      <ProtectedRoute path="/stock" component={Stock} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/reports" component={Reports} />
      
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
  const version = "1.0.0";
  const buildDate = format(new Date(), "yyyy-MM-dd HH:mm");
  
  return (
    <div className="fixed bottom-1 right-1 text-[8px] text-gray-400 pointer-events-none z-10">
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
      <VersionInfo />
    </>
  );
}

export default App;