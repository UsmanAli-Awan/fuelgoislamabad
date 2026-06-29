import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useUpdateCustomerProfile } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, LogOut, User } from "lucide-react";

const schema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  address: z.string().optional(),
});

export default function CustomerProfile() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateCustomerProfile();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", email: "", address: "" },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName,
        email: user.email || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const onSubmit = (values: z.infer<typeof schema>) => {
    updateMutation.mutate(
      { data: { fullName: values.fullName, email: values.email || undefined, address: values.address || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          toast({ title: "Profile Updated", description: "Your changes have been saved" });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err?.data?.error || "Failed to save", variant: "destructive" });
        },
      }
    );
  };

  const handleLogout = () => { logout(); setLocation("/"); };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/customer/home")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-1" /> Home
        </Button>
        <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
          <LogOut className="w-4 h-4 mr-1" /> Sign Out
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{user?.fullName}</h1>
          <p className="text-sm text-muted-foreground">{user?.phone}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Edit Profile</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-customer-profile">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input data-testid="input-fullName" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl><Input type="email" data-testid="input-email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Delivery Address</FormLabel>
                  <FormControl><Input placeholder="House 12, Street 5, Islamabad" data-testid="input-address" {...field} /></FormControl>
                  <FormMessage />
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
