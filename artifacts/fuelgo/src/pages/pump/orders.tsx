import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";

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

export default function PumpOrders() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: orders = [], isLoading } = useListOrders(
    statusFilter !== "all" ? { status: statusFilter } : {},
    { query: { queryKey: getListOrdersQueryKey(statusFilter !== "all" ? { status: statusFilter } : {}) } }
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <div className="text-center py-8 text-muted-foreground">Loading orders...</div>}

      {!isLoading && orders.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm">Orders will appear here when customers place them</p>
        </div>
      )}

      <div className="space-y-3">
        {orders.map(order => (
          <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation(`/pump/orders/${order.id}`)} data-testid={`card-order-${order.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="font-semibold">{order.customerName || "Customer"}</p>
                  <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                  <p className="text-sm">{FUEL_LABELS[order.fuelType]} · {order.quantityLiters}L</p>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">{order.deliveryAddress}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-lg">PKR {order.totalAmount.toLocaleString()}</p>
                  <Badge variant={STATUS_LABELS[order.status]?.variant || "secondary"} className="text-xs">
                    {STATUS_LABELS[order.status]?.label || order.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
