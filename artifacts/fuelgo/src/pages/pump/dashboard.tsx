import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetMyPumpStats, useGetMyPump, getGetMyPumpStatsQueryKey } from "@workspace/api-client-react";
import { ShoppingBag, Clock, CheckCircle, XCircle, DollarSign, Users, TrendingUp, ArrowRight, Fuel } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  accepted: { label: "Accepted", variant: "default" },
  preparing: { label: "Preparing", variant: "default" },
  out_for_delivery: { label: "Out for Delivery", variant: "default" },
  delivered: { label: "Delivered", variant: "outline" },
  rejected: { label: "Rejected", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const FUEL_LABELS: Record<string, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  hi_octane: "Hi-Octane",
};

export default function PumpDashboard() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: stats, isLoading } = useGetMyPumpStats({ query: { queryKey: getGetMyPumpStatsQueryKey() } });
  const { data: pump } = useGetMyPump();

  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetMyPumpStatsQueryKey() });

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-pump-name">{pump?.businessName || "My Petrol Station"}</h1>
          <p className="text-muted-foreground text-sm">{pump?.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${pump?.isOpen ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm font-medium">{pump?.isOpen ? "Open" : "Closed"}</span>
          <Button size="sm" variant="outline" onClick={refresh}>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Orders", value: stats?.todayOrders ?? 0, icon: ShoppingBag, color: "text-primary" },
          { label: "Pending", value: stats?.pendingOrders ?? 0, icon: Clock, color: "text-yellow-600" },
          { label: "Completed", value: stats?.completedOrders ?? 0, icon: CheckCircle, color: "text-green-600" },
          { label: "Cancelled", value: stats?.cancelledOrders ?? 0, icon: XCircle, color: "text-destructive" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
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
              <p className="text-xs text-muted-foreground">Today's Revenue</p>
              <p className="text-xl font-bold">PKR {stats?.todayRevenue?.toLocaleString() ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><DollarSign className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold">PKR {stats?.totalRevenue?.toLocaleString() ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary"><Users className="w-5 h-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Customers</p>
              <p className="text-xl font-bold">{stats?.totalCustomers ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Manage Orders", path: "/pump/orders", icon: ShoppingBag },
          { label: "Fuel Prices", path: "/pump/fuel", icon: Fuel },
          { label: "Profile", path: "/pump/profile", icon: Users },
        ].map(({ label, path, icon: Icon }) => (
          <Button key={path} variant="outline" className="h-auto p-4 flex-col gap-2" onClick={() => setLocation(path)} data-testid={`link-${label.toLowerCase().replace(/\s+/g, "-")}`}>
            <Icon className="w-5 h-5 text-primary" />
            <span className="text-xs">{label}</span>
          </Button>
        ))}
      </div>

      {stats?.recentOrders && stats.recentOrders.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setLocation("/pump/orders")}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.recentOrders.map(order => (
              <div key={order.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setLocation(`/pump/orders/${order.id}`)}
                data-testid={`row-order-${order.id}`}
              >
                <div>
                  <p className="font-medium text-sm">{order.customerName || "Customer"}</p>
                  <p className="text-xs text-muted-foreground">{FUEL_LABELS[order.fuelType]} · {order.quantityLiters}L</p>
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
