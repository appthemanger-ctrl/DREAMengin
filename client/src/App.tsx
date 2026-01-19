import React from "react";
import { Route, Switch, Redirect } from "wouter";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import NotFound from "./pages/not-found";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { ColorCycleProvider } from "./lib/useColorCycle";

function AuthedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <>{children}</> : <Redirect to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Landing} />
      <Route path="/discover" component={Discover} />
      <Route path="/@:username">
        {(params) => <Profile username={params.username} />}
      </Route>
      <Route path="/login">
        {user ? <Redirect to="/app" /> : <Login />}
      </Route>

      {/* Private */}
      <Route path="/app">
        <AuthedRoute>
          <Home />
        </AuthedRoute>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route>
        <Redirect to="/404" />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ColorCycleProvider>
        <AppRoutes />
      </ColorCycleProvider>
    </AuthProvider>
  );
}
