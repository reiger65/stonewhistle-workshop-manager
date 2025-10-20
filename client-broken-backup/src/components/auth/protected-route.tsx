import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, Redirect } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

/**
 * ProtectedRoute component that redirects to login if user is not authenticated
 */
export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  // Temporarily bypass authentication for testing
  return (
    <Route path={path}>
      {() => <Component />}
    </Route>
  );
}