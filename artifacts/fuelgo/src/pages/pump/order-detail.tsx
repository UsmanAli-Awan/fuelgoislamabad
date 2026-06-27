import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useGetOrder, useUpdateOrderStatus, getGetOrderQueryKey, getListOrdersQueryKey, getGetMyPumpStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, User, Fuel, MapPin, DollarSign } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  accepted: { label: "Accepted", variant: "default" },
  preparing: { label: "Preparing", variant: "default" },
  out_for_delivery: { label: "Out for Delivery", variant: "default" },
  delivered: { label: "Delivered", variant: "outline" },
  rejected: { label: "Rejected", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const NEXT_STATUSES: Record<string, { status: string; label: string; variant: "default" | "destructive" | "outline" }[]> = {
  pending: [{ status: "accepted", label: "Accept Order", variant: "default" }, { status: "rejected", label: "Reject", variant: "destructive" }],
  accepted: [{ status: "preparing", label: "Mark Preparing", variant: "default" }],
  preparing: [{ status: "out_for_delivery", label: "Out for Delivery", variant: "default" }],
  out_for_delivery: [{ status: "delivered", label: "Mark Delivered", variant: "default" }],
};

const FUEL_LABELS: Record<string, string> = { petrol: "Petrol", diesel: "Diesel", hi_octane: "Hi-Octane" };

export default function PumpOrderDetail({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const orderId = parseInt(id, 10);
  const queryClient = useQueryClient();
  const { data: order, isLoading } = useGetOrder(orderId, { query: { queryKey: getGetOrderQueryKey(orderId) } });
  const updateStatus = useUpdateOrderStatus();

  const handleStatusUpdate = (status: string) => {
    updateStatus.mutate(
      { id: orderId, data: { status: status as any } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMyPumpStatsQueryKey() });
          toast({ title: "Status Updated", description: `Order marked as ${status}` });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err?.response?.data?.error || "Failed to update status", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading order...</div>;
  if (!order) return <div className="p-8 text-center text-muted-foreground">Order not found</div>;

  const nextStatuses = NEXT_STATUSES[order.status] || [];

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setLocation("/pump/orders")} data-testid="button-back">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Order #{order.id}</h1>
        <Badge variant={STATUS_LABELS[order.status]?.variant || "secondary"}>
          {STATUS_LABELS[order.status]?.label || order.status}
        </Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> Customer Details</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><span className="font-medium">Name:</span> {order.customerName || "N/A"}</p>
          <p><span className="font-medium">Phone:</span> {order.customerPhone || "N/A"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Fuel className="w-4 h-4" /> Fuel Order</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Fuel Type</span><span className="font-medium">{FUEL_LABELS[order.fuelType]}</span></div>
          <div className="flex justify-between"><span>Quantity</span><span className="font-medium">{order.quantityLiters}L</span></div>
          <div className="flex justify-between"><span>Price/Liter</span><span className="font-medium">PKR {order.pricePerLiter}</span></div>
          <div className="flex justify-between"><span>Delivery Charges</span><span className="font-medium">PKR {order.deliveryCharges}</span></div>
          <div className="flex justify-between border-t pt-2 font-bold text-base"><span>Total</span><span>PKR {order.totalAmount.toLocaleString()}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" /> Delivery</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>{order.deliveryAddress}</p>
          {order.notes && <p className="text-muted-foreground">Notes: {order.notes}</p>}
        </CardContent>
      </Card>

      {nextStatuses.length > 0 && (
        <div className="flex gap-3">
          {nextStatuses.map(({ status, label, variant }) => (
            <Button
              key={status}
              variant={variant}
              className="flex-1"
              disabled={updateStatus.isPending}
              onClick={() => handleStatusUpdate(status)}
              data-testid={`button-status-${status}`}
            >
              {updateStatus.isPending ? "Updating..." : label}
            </Button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Placed {new Date(order.createdAt).toLocaleString()} · Updated {new Date(order.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}
