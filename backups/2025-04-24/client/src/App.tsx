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
import { TunerSettingsProvider } from "@/hooks/use-tuner-settings";
import Worksheet from "@/pages/worksheet";
import AuthPage from "@/pages/auth-page";
import TestPage from "@/pages/test-page";
import BadgeExample from "@/pages/badge-example";
import TunerTest from "@/pages/tuner-test";
import AudioDebug from "@/pages/audio-debug";
import SimpleMicTest from "@/pages/simple-mic-test";
import BasicTuner from "@/pages/basic-tuner";
import NoFilterTuner from "@/pages/no-filter-tuner";
import DirectMicTest from "@/pages/direct-mic-test";
import StandaloneTuner from "@/pages/standalone-tuner";
import BasicTunerTest from "@/pages/basic-tuner-test";
import BasicStandaloneTuner from "@/pages/basic-standalone-tuner";
import EnhancedStandaloneTuner from "@/pages/enhanced-standalone-tuner";
import FluteSettings from "@/pages/flute-settings";
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
      <Route path="/tuner-test" component={TunerTest} />
      <Route path="/basic-tuner-test" component={BasicTunerTest} />
      <Route path="/audio-debug" component={AudioDebug} />
      <Route path="/simple-mic-test" component={SimpleMicTest} />
      <Route path="/basic-tuner" component={BasicTuner} />
      <Route path="/no-filter-tuner" component={NoFilterTuner} />
      <Route path="/direct-mic-test" component={DirectMicTest} />
      <Route path="/tuner" component={StandaloneTuner} />
      <Route path="/standalone-tuner" component={BasicStandaloneTuner} />
      <Route path="/enhanced-tuner" component={EnhancedStandaloneTuner} />
      
      {/* Testing route for order display without auth */}
      <Route path="/order-list-test" component={OrderListTest} />
      
      {/* Protected routes that require authentication */}
      <ProtectedRoute path="/" component={Worksheet} />
      <ProtectedRoute path="/production" component={Production} />
      <ProtectedRoute path="/completed" component={Completed} />
      <ProtectedRoute path="/stock" component={Stock} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/flute-settings" component={FluteSettings} />
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
            <TunerSettingsProvider>
              <AutoSyncProvider>
                <Router />
                <Toaster />
              </AutoSyncProvider>
            </TunerSettingsProvider>
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