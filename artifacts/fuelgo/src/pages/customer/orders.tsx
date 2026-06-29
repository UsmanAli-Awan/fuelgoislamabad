import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListOrders, useCancelOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { ShoppingBag, ArrowLeft, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { OrderTrackingMap } from "@/components/order-tracking-map";

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

export default function CustomerOrders() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedMap, setExpandedMap] = useState<number | null>(null);
  const params = statusFilter !== "all" ? { status: statusFilter } : {};
  const { data: orders = [], isLoading } = useListOrders(params, { query: { queryKey: getListOrdersQueryKey(params) } });
  const cancelMutation = useCancelOrder();

  const handleCancel = (id: number) => {
    cancelMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        toast({ title: "Order Cancelled" });
      },
      onError: (err: any) => toast({ title: "Error", description: err?.data?.error || "Cannot cancel", variant: "destructive" }),
    });
  };

  const toggleMap = (id: number) => {
    setExpandedMap(prev => prev === id ? null : id);
  };

  const activeStatuses = ["pending", "accepted", "preparing", "out_for_delivery"];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/customer/home")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">My Orders</h1>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" data-testid="select-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && <div className="py-8 text-center text-muted-foreground">Loading orders...</div>}

      {!isLoading && orders.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm text-muted-foreground">Order fuel from a nearby pump to get started</p>
          <Button onClick={() => setLocation("/customer/home")} data-testid="button-find-pumps">Find Pumps</Button>
        </div>
      )}

      <div className="space-y-3">
        {orders.map(order => {
          const hasMap = order.deliveryLat != null && order.deliveryLng != null;
          const isActive = activeStatuses.includes(order.status);
          const isMapOpen = expandedMap === order.id;

          return (
            <Card key={order.id} data-testid={`card-order-${order.id}`} className={isActive ? "border-primary/40 shadow-sm" : ""}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{order.pumpName}</p>
                    <p className="text-sm text-muted-foreground">{FUEL_LABELS[order.fuelType]} · {order.quantityLiters}L</p>
                    {order.deliveryAddress && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[200px]">{order.deliveryAddress}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">PKR {order.totalAmount.toLocaleString()}</p>
                    <Badge variant={STATUS_LABELS[order.status]?.variant || "secondary"} className="text-xs mt-1">
                      {STATUS_LABELS[order.status]?.label || order.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t gap-2 flex-wrap">
                  <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                  <div className="flex items-center gap-2">
                    {hasMap && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 gap-1"
                        onClick={() => toggleMap(order.id)}
                        data-testid={`button-track-${order.id}`}
                      >
                        <MapPin className="w-3 h-3" />
                        {isMapOpen ? "Hide Map" : "Track Order"}
                        {isMapOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                    )}
                    {order.status === "pending" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs px-2"
                        onClick={() => handleCancel(order.id)}
                        disabled={cancelMutation.isPending}
                        data-testid={`button-cancel-${order.id}`}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                {hasMap && isMapOpen && (
                  <div className="pt-1">
                    <OrderTrackingMap
                      deliveryLat={order.deliveryLat!}
                      deliveryLng={order.deliveryLng!}
                      pumpLat={order.pumpLat}
                      pumpLng={order.pumpLng}
                      pumpName={order.pumpName}
                      status={order.status}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
