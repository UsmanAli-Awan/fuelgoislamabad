import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";

import Landing from "@/pages/landing";
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

function AdminRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    setLocation("/admin/login");
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin/dashboard">
          {() => <AdminRoute component={AdminDashboard} />}
        </Route>
        <Route path="/admin/pumps">
          {() => <AdminRoute component={AdminPumps} />}
        </Route>
        <Route path="/admin/users">
          {() => <AdminRoute component={AdminUsers} />}
        </Route>
        <Route path="/admin/orders">
          {() => <AdminRoute component={AdminOrders} />}
        </Route>
        <Route>
          <div className="flex h-screen flex-col items-center justify-center space-y-3">
            <p className="text-6xl font-black text-muted-foreground/30">404</p>
            <p className="text-muted-foreground">Page not found</p>
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
