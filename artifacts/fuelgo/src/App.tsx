import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";

import Landing from "@/pages/landing";

import CustomerLogin from "@/pages/customer/login";
import CustomerRegister from "@/pages/customer/register";
import CustomerHome from "@/pages/customer/home";
import CustomerPumpDetail from "@/pages/customer/pump-detail";
import CustomerOrders from "@/pages/customer/orders";
import CustomerFavorites from "@/pages/customer/favorites";
import CustomerProfile from "@/pages/customer/profile";

import PumpLogin from "@/pages/pump/login";
import PumpRegister from "@/pages/pump/register";
import PumpPending from "@/pages/pump/pending";
import PumpDashboard from "@/pages/pump/dashboard";
import PumpOrders from "@/pages/pump/orders";
import PumpOrderDetail from "@/pages/pump/order-detail";
import PumpFuel from "@/pages/pump/fuel";
import PumpProfile from "@/pages/pump/profile";

import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminPumps from "@/pages/admin/pumps";
import AdminUsers from "@/pages/admin/users";
import AdminOrders from "@/pages/admin/orders";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

function ProtectedRoute({
  component: Component,
  allowedRoles,
  componentProps,
}: {
  component: React.ComponentType<any>;
  allowedRoles: string[];
  componentProps?: Record<string, any>;
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!user) { setLocation("/"); return null; }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === "customer") setLocation("/customer/home");
    else if (user.role === "pump_owner") setLocation("/pump/dashboard");
    else if (user.role === "admin") setLocation("/admin/dashboard");
    else setLocation("/");
    return null;
  }

  return <Component {...(componentProps || {})} />;
}

function PumpOwnerRoute({ component: Component, componentProps }: { component: React.ComponentType<any>; componentProps?: Record<string, any> }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) { setLocation("/"); return null; }
  if (user.role !== "pump_owner") { setLocation("/"); return null; }

  return <Component {...(componentProps || {})} />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Landing} />

        <Route path="/customer/login" component={CustomerLogin} />
        <Route path="/customer/register" component={CustomerRegister} />
        <Route path="/customer/home">
          {() => <ProtectedRoute component={CustomerHome} allowedRoles={["customer"]} />}
        </Route>
        <Route path="/customer/pump/:id">
          {(params) => <ProtectedRoute component={CustomerPumpDetail} allowedRoles={["customer"]} componentProps={{ id: params.id }} />}
        </Route>
        <Route path="/customer/orders">
          {() => <ProtectedRoute component={CustomerOrders} allowedRoles={["customer"]} />}
        </Route>
        <Route path="/customer/favorites">
          {() => <ProtectedRoute component={CustomerFavorites} allowedRoles={["customer"]} />}
        </Route>
        <Route path="/customer/profile">
          {() => <ProtectedRoute component={CustomerProfile} allowedRoles={["customer"]} />}
        </Route>

        <Route path="/pump/login" component={PumpLogin} />
        <Route path="/pump/register" component={PumpRegister} />
        <Route path="/pump/pending">
          {() => <PumpOwnerRoute component={PumpPending} />}
        </Route>
        <Route path="/pump/dashboard">
          {() => <PumpOwnerRoute component={PumpDashboard} />}
        </Route>
        <Route path="/pump/orders/:id">
          {(params) => <PumpOwnerRoute component={PumpOrderDetail} componentProps={{ id: params.id }} />}
        </Route>
        <Route path="/pump/orders">
          {() => <PumpOwnerRoute component={PumpOrders} />}
        </Route>
        <Route path="/pump/fuel">
          {() => <PumpOwnerRoute component={PumpFuel} />}
        </Route>
        <Route path="/pump/profile">
          {() => <PumpOwnerRoute component={PumpProfile} />}
        </Route>

        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/dashboard">
          {() => <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />}
        </Route>
        <Route path="/admin/pumps">
          {() => <ProtectedRoute component={AdminPumps} allowedRoles={["admin"]} />}
        </Route>
        <Route path="/admin/users">
          {() => <ProtectedRoute component={AdminUsers} allowedRoles={["admin"]} />}
        </Route>
        <Route path="/admin/orders">
          {() => <ProtectedRoute component={AdminOrders} allowedRoles={["admin"]} />}
        </Route>

        <Route>
          <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
            <h1 className="text-6xl font-extrabold text-muted-foreground">404</h1>
            <p className="text-lg text-muted-foreground">Page not found.</p>
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
