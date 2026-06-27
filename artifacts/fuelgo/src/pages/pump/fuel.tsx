import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useGetPumpFuelPrices, useUpdatePumpFuelPrices, getGetPumpFuelPricesQueryKey } from "@workspace/api-client-react";
import { useGetMyPump } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

const FUEL_TYPES = [
  { key: "petrol", label: "Petrol (RON 87)", emoji: "⛽" },
  { key: "diesel", label: "Diesel", emoji: "🚛" },
  { key: "hi_octane", label: "Hi-Octane (RON 97)", emoji: "🏎️" },
];

interface FuelEntry {
  fuelType: string;
  pricePerLiter: number;
  isAvailable: boolean;
}

export default function PumpFuel() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: pump } = useGetMyPump();
  const pumpId = pump?.id;
  const { data: fuelPrices, isLoading } = useGetPumpFuelPrices(pumpId!, {
    query: { enabled: !!pumpId, queryKey: getGetPumpFuelPricesQueryKey(pumpId!) },
  });
  const updateMutation = useUpdatePumpFuelPrices();

  const [entries, setEntries] = useState<FuelEntry[]>(
    FUEL_TYPES.map(ft => ({ fuelType: ft.key, pricePerLiter: 0, isAvailable: false }))
  );

  useEffect(() => {
    if (fuelPrices) {
      setEntries(FUEL_TYPES.map(ft => {
        const existing = fuelPrices.find(fp => fp.fuelType === ft.key);
        return existing
          ? { fuelType: ft.key, pricePerLiter: existing.pricePerLiter, isAvailable: existing.isAvailable }
          : { fuelType: ft.key, pricePerLiter: 0, isAvailable: false };
      }));
    }
  }, [fuelPrices]);

  const handleChange = (fuelType: string, field: "pricePerLiter" | "isAvailable", value: number | boolean) => {
    setEntries(prev => prev.map(e => e.fuelType === fuelType ? { ...e, [field]: value } : e));
  };

  const handleSave = () => {
    if (!pumpId) return;
    updateMutation.mutate(
      { pumpId, data: { prices: entries } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPumpFuelPricesQueryKey(pumpId) });
          toast({ title: "Prices Updated", description: "Fuel prices saved successfully" });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err?.response?.data?.error || "Failed to save", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading fuel prices...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setLocation("/pump/dashboard")} data-testid="button-back">
        <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
      </Button>
      <h1 className="text-2xl font-bold">Fuel Prices</h1>
      <p className="text-muted-foreground text-sm">Set your current fuel prices and availability</p>

      <div className="space-y-4">
        {FUEL_TYPES.map(ft => {
          const entry = entries.find(e => e.fuelType === ft.key)!;
          return (
            <Card key={ft.key} data-testid={`card-fuel-${ft.key}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span>{ft.emoji}</span> {ft.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor={`price-${ft.key}`} className="text-sm mb-1 block">Price per Liter (PKR)</Label>
                    <Input
                      id={`price-${ft.key}`}
                      type="number"
                      min={0}
                      step={0.01}
                      value={entry?.pricePerLiter ?? 0}
                      onChange={e => handleChange(ft.key, "pricePerLiter", parseFloat(e.target.value) || 0)}
                      data-testid={`input-price-${ft.key}`}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Label className="text-sm">Available</Label>
                    <Switch
                      checked={entry?.isAvailable ?? false}
                      onCheckedChange={val => handleChange(ft.key, "isAvailable", val)}
                      data-testid={`switch-available-${ft.key}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full" data-testid="button-save-prices">
        {updateMutation.isPending ? "Saving..." : "Save Prices"}
      </Button>
    </div>
  );
}
