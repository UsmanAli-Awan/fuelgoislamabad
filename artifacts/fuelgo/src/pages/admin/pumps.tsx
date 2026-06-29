import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useAdminListPumps, useApprovePump, useRejectPump,
  getAdminListPumpsQueryKey, getGetAdminStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Building2, MapPin, Clock, Phone, ChevronDown } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
  pending:   { label: "Pending",   bg: "bg-yellow-50 text-yellow-800",  dot: "bg-yellow-400" },
  approved:  { label: "Approved",  bg: "bg-green-50 text-green-800",   dot: "bg-green-500" },
  rejected:  { label: "Rejected",  bg: "bg-red-50 text-red-800",      dot: "bg-red-500" },
  suspended: { label: "Suspended", bg: "bg-gray-100 text-gray-700",   dot: "bg-gray-400" },
};

const FILTERS = ["all", "pending", "approved", "rejected"];

export default function AdminPumps() {
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
      onSuccess: () => { invalidate(); toast({ title: "Pump Approved ✓", description: "Pump is now live on FuelGo" }); },
      onError: (err: any) => toast({ title: "Error", description: err?.data?.error || "Failed", variant: "destructive" }),
    });
  };

  const handleReject = (id: number) => {
    if (!rejectReason.trim()) { toast({ title: "Reason required", variant: "destructive" }); return; }
    rejectMutation.mutate({ id, data: { reason: rejectReason } }, {
      onSuccess: () => { invalidate(); setRejectingId(null); setRejectReason(""); toast({ title: "Pump Rejected" }); },
      onError: (err: any) => toast({ title: "Error", description: err?.data?.error || "Failed", variant: "destructive" }),
    });
  };

  const pendingCount = pumps.filter(p => p.status === "pending").length;

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-black">Petrol Pumps</h1>
        {pendingCount > 0 && (
          <p className="text-sm text-yellow-600 font-medium mt-0.5">{pendingCount} pending approval</p>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              statusFilter === f
                ? "bg-primary text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
            data-testid={`filter-${f}`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      )}

      {!isLoading && pumps.length === 0 && (
        <div className="py-16 text-center space-y-2">
          <Building2 className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground text-sm">No pumps found</p>
        </div>
      )}

      <div className="space-y-3">
        {pumps.map(pump => {
          const cfg = STATUS_CONFIG[pump.status] || STATUS_CONFIG.pending;
          return (
            <Card key={pump.id} className="border-0 shadow-sm rounded-2xl overflow-hidden" data-testid={`card-pump-${pump.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold truncate">{pump.businessName}</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${cfg.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />{pump.address}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3 shrink-0" />{pump.ownerName} · {pump.phone}
                    </p>
                    {pump.operatingHoursStart && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />{pump.operatingHoursStart} – {pump.operatingHoursEnd}
                      </p>
                    )}
                    {pump.rejectionReason && (
                      <p className="text-xs text-destructive font-medium">↳ {pump.rejectionReason}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <p className="font-medium">{pump.deliveryRadius ?? "—"} km</p>
                    <p>PKR {pump.deliveryCharges ?? 0}</p>
                    <p className="text-[10px]">delivery</p>
                  </div>
                </div>

                {pump.fuelPrices && pump.fuelPrices.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {pump.fuelPrices.map(fp => (
                      <span key={fp.fuelType} className={`px-2.5 py-1 text-xs rounded-full font-medium border ${fp.isAvailable ? "bg-green-50 border-green-200 text-green-700" : "bg-muted border-border text-muted-foreground"}`}>
                        {fp.fuelType} · PKR {fp.pricePerLiter}
                      </span>
                    ))}
                  </div>
                )}

                {pump.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      className="flex-1 rounded-xl h-10 text-sm font-semibold"
                      onClick={() => handleApprove(pump.id)}
                      disabled={approveMutation.isPending}
                      data-testid={`button-approve-${pump.id}`}
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 rounded-xl h-10 text-sm font-semibold"
                      onClick={() => setRejectingId(rejectingId === pump.id ? null : pump.id)}
                      data-testid={`button-reject-${pump.id}`}
                    >
                      <XCircle className="w-4 h-4 mr-1.5" /> Reject
                    </Button>
                  </div>
                )}

                {rejectingId === pump.id && (
                  <div className="space-y-2 pt-1">
                    <Input
                      className="rounded-xl"
                      placeholder="Reason for rejection…"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      data-testid={`input-reject-reason-${pump.id}`}
                    />
                    <div className="flex gap-2">
                      <Button variant="destructive" className="flex-1 rounded-xl h-9 text-sm" onClick={() => handleReject(pump.id)} disabled={rejectMutation.isPending} data-testid={`button-confirm-reject-${pump.id}`}>
                        Confirm Reject
                      </Button>
                      <Button variant="ghost" className="rounded-xl h-9" onClick={() => setRejectingId(null)}>Cancel</Button>
                    </div>
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
