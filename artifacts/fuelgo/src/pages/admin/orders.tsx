import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminListOrders } from "@workspace/api-client-react";
import { ShoppingBag, MapPin } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
  pending:          { label: "Pending",          bg: "bg-yellow-50 text-yellow-800",  dot: "bg-yellow-400" },
  accepted:         { label: "Accepted",         bg: "bg-blue-50 text-blue-800",      dot: "bg-blue-500" },
  preparing:        { label: "Preparing",        bg: "bg-indigo-50 text-indigo-800",  dot: "bg-indigo-500" },
  out_for_delivery: { label: "Out for Delivery", bg: "bg-orange-50 text-orange-800",  dot: "bg-orange-500" },
  delivered:        { label: "Delivered",        bg: "bg-green-50 text-green-800",    dot: "bg-green-500" },
  rejected:         { label: "Rejected",         bg: "bg-red-50 text-red-800",        dot: "bg-red-500" },
  cancelled:        { label: "Cancelled",        bg: "bg-gray-100 text-gray-700",     dot: "bg-gray-400" },
};

const FUEL_LABELS: Record<string, string> = { petrol: "Petrol", diesel: "Diesel", hi_octane: "Hi-Octane" };

const STATUS_FILTERS = ["all", "pending", "accepted", "preparing", "out_for_delivery", "delivered", "rejected", "cancelled"];
const FILTER_LABELS: Record<string, string> = {
  all: "All", pending: "Pending", accepted: "Accepted", preparing: "Preparing",
  out_for_delivery: "On the Way", delivered: "Delivered", rejected: "Rejected", cancelled: "Cancelled",
};

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState("all");
  const params = statusFilter !== "all" ? { status: statusFilter } : {};
  const { data: orders = [], isLoading } = useAdminListOrders(params as any);

  const activeCount = orders.filter(o => ["pending", "accepted", "preparing", "out_for_delivery"].includes(o.status)).length;

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black">Orders</h1>
        {activeCount > 0 && (
          <p className="text-sm text-primary font-medium mt-0.5">{activeCount} active</p>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              statusFilter === f
                ? "bg-primary text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="py-16 text-center space-y-2">
          <ShoppingBag className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground text-sm">No orders found</p>
        </div>
      )}

      <div className="space-y-2">
        {orders.map(order => {
          const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
          return (
            <Card key={order.id} className="border-0 shadow-sm rounded-2xl" data-testid={`row-order-${order.id}`}>
              <CardContent className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{order.customerName || "Customer"}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.pumpName}</p>
                    <p className="text-xs text-muted-foreground">{FUEL_LABELS[order.fuelType] || order.fuelType} · {order.quantityLiters}L</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-sm">PKR {order.totalAmount.toLocaleString()}</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold mt-0.5 ${cfg.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                </div>
                {order.deliveryAddress && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate border-t border-border/40 pt-1.5">
                    <MapPin className="w-3 h-3 shrink-0 text-primary" />
                    {order.deliveryAddress}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground/60">{new Date(order.createdAt).toLocaleString()}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
