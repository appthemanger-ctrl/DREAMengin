import type { ReactNode } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import Discover from "@/pages/Discover";
import { useAuth } from "@/hooks/use-auth";
import { useColorCycle } from "@/lib/useColorCycle";
import { Loader2 } from "lucide-react";

function PrivateRoute({ path, component: Component }: { path: string; component: any }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading your control room...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <Route path={path} component={Component} />;
}

function ColorCycleProvider({ children }: { children: ReactNode }) {
  useColorCycle();
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Landing} />
      <Route path="/discover" component={Discover} />

      {/* Private */}
      <PrivateRoute path="/app" component={Home} />

      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ColorCycleProvider>
          <Toaster />
          <Router />
        </ColorCycleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
