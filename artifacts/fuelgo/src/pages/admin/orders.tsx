import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAdminListOrders, getAdminListOrdersQueryKey } from "@workspace/api-client-react";
import { ArrowLeft } from "lucide-react";

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

export default function AdminOrders() {
  const [, setLocation] = useLocation();
  const { data: orders = [], isLoading } = useAdminListOrders();

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/dashboard")} data-testid="button-back"><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-bold">All Orders</h1>
        <span className="text-muted-foreground text-sm">({orders.length} total)</span>
      </div>

      {isLoading && <div className="py-8 text-center text-muted-foreground">Loading...</div>}
      {!isLoading && orders.length === 0 && <div className="py-12 text-center text-muted-foreground">No orders yet</div>}

      <div className="space-y-3">
        {orders.map(order => (
          <Card key={order.id} data-testid={`card-order-${order.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-semibold">Order #{order.id}</p>
                  <p className="text-sm text-muted-foreground">Customer: {order.customerName} · {order.customerPhone}</p>
                  <p className="text-sm text-muted-foreground">Pump: {order.pumpName}</p>
                  <p className="text-sm">{FUEL_LABELS[order.fuelType]} · {order.quantityLiters}L</p>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">{order.deliveryAddress}</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-lg">PKR {order.totalAmount.toLocaleString()}</p>
                  <Badge variant={STATUS_LABELS[order.status]?.variant || "secondary"} className="text-xs">
                    {STATUS_LABELS[order.status]?.label || order.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
