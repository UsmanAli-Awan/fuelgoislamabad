import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetAdminStats, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Users, Building2, ShoppingBag, TrendingUp, Clock, CheckCircle, LogOut, ArrowRight, Shield } from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  accepted: { label: "Accepted", variant: "default" },
  preparing: { label: "Preparing", variant: "default" },
  out_for_delivery: { label: "Out for Delivery", variant: "default" },
  delivered: { label: "Delivered", variant: "outline" },
  rejected: { label: "Rejected", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const FUEL_LABELS: Record<string, string> = { petrol: "Petrol", diesel: "Diesel", hi_octane: "Hi-Octane" };

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const { data: stats, isLoading } = useGetAdminStats({ query: { queryKey: getGetAdminStatsQueryKey() } });

  const handleLogout = () => { logout(); setLocation("/"); };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
          <LogOut className="w-4 h-4 mr-1" /> Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Customers", value: stats?.totalUsers ?? 0, icon: Users },
          { label: "Total Pumps", value: stats?.totalPumps ?? 0, icon: Building2 },
          { label: "Pending Approvals", value: stats?.pendingPumps ?? 0, icon: Clock },
          { label: "Active Pumps", value: stats?.approvedPumps ?? 0, icon: CheckCircle },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary"><Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><TrendingUp className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold">PKR {stats?.totalRevenue?.toLocaleString() ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><ShoppingBag className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Today's Orders</p>
              <p className="text-xl font-bold">{stats?.todayOrders ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><Clock className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Active Orders</p>
              <p className="text-xl font-bold">{stats?.activeOrders ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Manage Pumps", path: "/admin/pumps", icon: Building2 },
          { label: "Manage Users", path: "/admin/users", icon: Users },
          { label: "View All Orders", path: "/admin/orders", icon: ShoppingBag },
        ].map(({ label, path, icon: Icon }) => (
          <Button key={path} variant="outline" className="h-auto p-4 flex items-center justify-between" onClick={() => setLocation(path)} data-testid={`link-${label.toLowerCase().replace(/\s+/g, "-")}`}>
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-primary" />
              <span className="font-medium">{label}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </Button>
        ))}
      </div>

      {stats?.recentOrders && stats.recentOrders.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setLocation("/admin/orders")}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border" data-testid={`row-order-${order.id}`}>
                <div>
                  <p className="font-medium text-sm">{order.customerName || "Customer"}</p>
                  <p className="text-xs text-muted-foreground">{order.pumpName} · {FUEL_LABELS[order.fuelType]} · {order.quantityLiters}L</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">PKR {order.totalAmount.toLocaleString()}</p>
                  <Badge variant={STATUS_LABELS[order.status]?.variant || "secondary"} className="text-xs">
                    {STATUS_LABELS[order.status]?.label || order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
