import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useGetMyPump, useUpdateMyPump, getGetMyPumpQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, LogOut } from "lucide-react";

const schema = z.object({
  businessName: z.string().min(2, "Required"),
  description: z.string().optional(),
  address: z.string().min(5, "Required"),
  deliveryRadius: z.coerce.number().min(1),
  deliveryCharges: z.coerce.number().min(0),
  operatingHoursStart: z.string().optional(),
  operatingHoursEnd: z.string().optional(),
  isOpen: z.boolean(),
});

export default function PumpProfile() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { data: pump, isLoading } = useGetMyPump({ query: { queryKey: getGetMyPumpQueryKey() } });
  const updateMutation = useUpdateMyPump();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: "", description: "", address: "",
      deliveryRadius: 5, deliveryCharges: 100,
      operatingHoursStart: "06:00", operatingHoursEnd: "23:00",
      isOpen: true,
    },
  });

  useEffect(() => {
    if (pump) {
      form.reset({
        businessName: pump.businessName,
        description: pump.description || "",
        address: pump.address,
        deliveryRadius: pump.deliveryRadius || 5,
        deliveryCharges: pump.deliveryCharges || 0,
        operatingHoursStart: pump.operatingHoursStart || "06:00",
        operatingHoursEnd: pump.operatingHoursEnd || "23:00",
        isOpen: pump.isOpen ?? true,
      });
    }
  }, [pump]);

  const onSubmit = (values: z.infer<typeof schema>) => {
    updateMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMyPumpQueryKey() });
          toast({ title: "Profile Updated", description: "Changes saved successfully" });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err?.data?.error || "Failed to save", variant: "destructive" });
        },
      }
    );
  };

  const handleLogout = () => { logout(); setLocation("/"); };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/pump/dashboard")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
        </Button>
        <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
          <LogOut className="w-4 h-4 mr-1" /> Sign Out
        </Button>
      </div>

      <h1 className="text-2xl font-bold">Pump Profile</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Station Details</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-pump-profile">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="businessName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl><Input data-testid="input-businessName" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl><Input data-testid="input-address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="deliveryRadius" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Radius (km)</FormLabel>
                    <FormControl><Input type="number" data-testid="input-deliveryRadius" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="deliveryCharges" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Charges (PKR)</FormLabel>
                    <FormControl><Input type="number" data-testid="input-deliveryCharges" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="operatingHoursStart" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opening Time</FormLabel>
                    <FormControl><Input type="time" data-testid="input-openingTime" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="operatingHoursEnd" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Closing Time</FormLabel>
                    <FormControl><Input type="time" data-testid="input-closingTime" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input placeholder="Tell customers about your station..." data-testid="input-description" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="isOpen" render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-isOpen" />
                  </FormControl>
                  <FormLabel className="!mt-0">Station is Open</FormLabel>
                </FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={updateMutation.isPending} data-testid="button-save-profile">
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
