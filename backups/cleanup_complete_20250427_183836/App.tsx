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
import TestPage from "@/pages/test-page";
import BadgeExample from "@/pages/badge-example";
import OrderListTest from "@/pages/order-list-test";
import Production from "@/pages/production";


function Router() {
  return (
    <Switch>
      {/* Authentication routes */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Public test route - not protected */}
      <Route path="/public-test" component={TestPage} />
      <Route path="/badge-example" component={BadgeExample} />
      
      {/* Testing route for order display without auth */}
      <Route path="/order-list-test" component={OrderListTest} />
      
      {/* Protected routes that require authentication */}
      <ProtectedRoute path="/" component={Worksheet} />
      <ProtectedRoute path="/production" component={Production} />
      <ProtectedRoute path="/completed" component={Completed} />
      <ProtectedRoute path="/stock" component={Stock} />
      <ProtectedRoute path="/settings" component={Settings} />
      {/* Removed flute-settings route */}
      <ProtectedRoute path="/reports" component={Reports} />
      <ProtectedRoute path="/test-page" component={TestPage} />
      
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

// Provider component for auto-syncing
function AutoSyncProvider({ children }: { children: React.ReactNode }) {
  // Use the auto-sync hook
  useAutoSync();
  
  return (
    <>
      {children}

    </>
  );
}

export default App;