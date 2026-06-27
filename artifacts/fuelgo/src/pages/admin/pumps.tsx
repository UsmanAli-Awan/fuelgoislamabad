import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAdminListPumps, useApprovePump, useRejectPump,
  getAdminListPumpsQueryKey, getGetAdminStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, XCircle, Building2, MapPin, Clock } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  suspended: "bg-gray-100 text-gray-800",
};

export default function AdminPumps() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const params = statusFilter !== "all" ? { status: statusFilter } : {};
  const { data: pumps = [], isLoading } = useAdminListPumps(params, { query: { queryKey: getAdminListPumpsQueryKey(params) } });
  const approveMutation = useApprovePump();
  const rejectMutation = useRejectPump();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getAdminListPumpsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
  };

  const handleApprove = (id: number) => {
    approveMutation.mutate({ id }, {
      onSuccess: () => { invalidate(); toast({ title: "Pump Approved", description: "Pump is now live on FuelGo" }); },
      onError: (err: any) => { toast({ title: "Error", description: err?.data?.error || "Failed", variant: "destructive" }); },
    });
  };

  const handleReject = (id: number) => {
    if (!rejectReason.trim()) { toast({ title: "Reason Required", description: "Provide a rejection reason", variant: "destructive" }); return; }
    rejectMutation.mutate({ id, data: { reason: rejectReason } }, {
      onSuccess: () => { invalidate(); setRejectingId(null); setRejectReason(""); toast({ title: "Pump Rejected" }); },
      onError: (err: any) => { toast({ title: "Error", description: err?.data?.error || "Failed", variant: "destructive" }); },
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/dashboard")} data-testid="button-back"><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="text-2xl font-bold">Petrol Pumps</h1>
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48" data-testid="select-status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Pumps</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      {isLoading && <div className="py-8 text-center text-muted-foreground">Loading...</div>}
      {!isLoading && pumps.length === 0 && <div className="py-12 text-center text-muted-foreground">No pumps found</div>}

      <div className="space-y-3">
        {pumps.map(pump => (
          <Card key={pump.id} data-testid={`card-pump-${pump.id}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <p className="font-semibold">{pump.businessName}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[pump.status] || ""}`}>
                      {pump.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{pump.address}</p>
                  <p className="text-sm text-muted-foreground">Owner: {pump.ownerName} · {pump.phone}</p>
                  {pump.operatingHoursStart && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {pump.operatingHoursStart} – {pump.operatingHoursEnd}
                    </p>
                  )}
                  {pump.rejectionReason && <p className="text-xs text-destructive">Rejected: {pump.rejectionReason}</p>}
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>R: {pump.deliveryRadius ?? "N/A"} km</p>
                  <p>PKR {pump.deliveryCharges ?? 0} delivery</p>
                </div>
              </div>

              {pump.fuelPrices && pump.fuelPrices.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pump.fuelPrices.map(fp => (
                    <span key={fp.fuelType} className={`px-2 py-0.5 text-xs rounded-full border ${fp.isAvailable ? "bg-green-50 border-green-200 text-green-700" : "bg-muted text-muted-foreground"}`}>
                      {fp.fuelType} · PKR {fp.pricePerLiter}
                    </span>
                  ))}
                </div>
              )}

              {pump.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => handleApprove(pump.id)} disabled={approveMutation.isPending} data-testid={`button-approve-${pump.id}`}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setRejectingId(pump.id)} data-testid={`button-reject-${pump.id}`}>
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              )}

              {rejectingId === pump.id && (
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Reason for rejection..."
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    data-testid={`input-reject-reason-${pump.id}`}
                  />
                  <Button size="sm" variant="destructive" onClick={() => handleReject(pump.id)} disabled={rejectMutation.isPending} data-testid={`button-confirm-reject-${pump.id}`}>
                    Confirm
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>Cancel</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
