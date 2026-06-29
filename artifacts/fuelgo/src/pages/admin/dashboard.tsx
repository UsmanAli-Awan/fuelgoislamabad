import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetAdminStats } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Users, Building2, ShoppingBag, TrendingUp, Clock, CheckCircle, ArrowRight, AlertCircle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:          { label: "Pending",         color: "bg-yellow-100 text-yellow-800" },
  accepted:         { label: "Accepted",        color: "bg-blue-100 text-blue-800" },
  preparing:        { label: "Preparing",       color: "bg-indigo-100 text-indigo-800" },
  out_for_delivery: { label: "Out for Delivery",color: "bg-orange-100 text-orange-800" },
  delivered:        { label: "Delivered",       color: "bg-green-100 text-green-800" },
  rejected:         { label: "Rejected",        color: "bg-red-100 text-red-800" },
  cancelled:        { label: "Cancelled",       color: "bg-gray-100 text-gray-700" },
};

const FUEL_LABELS: Record<string, string> = { petrol: "Petrol", diesel: "Diesel", hi_octane: "Hi-Octane" };

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetAdminStats();

  return (
    <div className="p-4 space-y-5 animate-in fade-in duration-300">
      <div className="pt-1">
        <p className="text-muted-foreground text-sm">Welcome back,</p>
        <h1 className="text-2xl font-black">{user?.fullName || "Admin"}</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Customers", value: stats?.totalUsers ?? 0, icon: Users, color: "bg-blue-50 text-blue-600", ring: "ring-blue-100" },
              { label: "Total Pumps", value: stats?.totalPumps ?? 0, icon: Building2, color: "bg-purple-50 text-purple-600", ring: "ring-purple-100" },
              { label: "Pending Review", value: stats?.pendingPumps ?? 0, icon: AlertCircle, color: "bg-yellow-50 text-yellow-600", ring: "ring-yellow-100" },
              { label: "Active Pumps", value: stats?.approvedPumps ?? 0, icon: CheckCircle, color: "bg-green-50 text-green-600", ring: "ring-green-100" },
            ].map(({ label, value, icon: Icon, color, ring }) => (
              <Card key={label} className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ring-2 ${color} ${ring}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-2xl font-black leading-none" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4 flex flex-col gap-1">
                <TrendingUp className="w-5 h-5 opacity-80" />
                <p className="text-xl font-black leading-none">PKR {(stats?.totalRevenue ?? 0).toLocaleString()}</p>
                <p className="text-xs opacity-75">Total Revenue</p>
              </CardContent>
            </Card>
            <div className="grid grid-rows-2 gap-3">
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-black text-lg leading-none">{stats?.todayOrders ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">Today's Orders</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="font-black text-lg leading-none">{stats?.activeOrders ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">Active Orders</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {stats?.pendingPumps ? (
            <button
              onClick={() => setLocation("/admin/pumps")}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-yellow-50 border border-yellow-200 text-left group hover:bg-yellow-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-yellow-200 flex items-center justify-center">
                  <AlertCircle className="w-4.5 h-4.5 text-yellow-700" />
                </div>
                <div>
                  <p className="font-bold text-yellow-900 text-sm">{stats.pendingPumps} pump{stats.pendingPumps > 1 ? 's' : ''} need approval</p>
                  <p className="text-xs text-yellow-700">Tap to review</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-yellow-600 group-hover:translate-x-0.5 transition-transform" />
            </button>
          ) : null}

          {stats?.recentOrders && stats.recentOrders.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Recent Orders</h2>
                <button onClick={() => setLocation("/admin/orders")} className="text-xs text-primary font-semibold">View all</button>
              </div>
              <div className="space-y-2">
                {stats.recentOrders.slice(0, 5).map(order => {
                  const cfg = STATUS_CONFIG[order.status] || { label: order.status, color: "bg-muted text-muted-foreground" };
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/60 shadow-sm" data-testid={`row-order-${order.id}`}>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{order.customerName || "Customer"}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.pumpName} · {FUEL_LABELS[order.fuelType] || order.fuelType} · {order.quantityLiters}L</p>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className="font-bold text-sm">PKR {order.totalAmount.toLocaleString()}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
