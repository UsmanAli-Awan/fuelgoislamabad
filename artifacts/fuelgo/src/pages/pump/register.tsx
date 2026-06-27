import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRegisterPump } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { Building2 } from "lucide-react";

const schema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  phone: z.string().min(11, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm your password"),
  cnic: z.string().min(13, "CNIC must be 13 digits"),
  licenseNumber: z.string().min(3, "License number required"),
  businessRegNumber: z.string().min(3, "Business registration number required"),
  address: z.string().min(5, "Address is required"),
  deliveryRadius: z.coerce.number().min(1, "Delivery radius is required"),
  deliveryCharges: z.coerce.number().min(0, "Delivery charges required"),
  operatingHoursStart: z.string().optional(),
  operatingHoursEnd: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export default function PumpRegister() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const mutation = useRegisterPump();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: "", ownerName: "", phone: "", email: "", password: "", confirmPassword: "",
      cnic: "", licenseNumber: "", businessRegNumber: "", address: "",
      deliveryRadius: 5, deliveryCharges: 100,
      operatingHoursStart: "06:00", operatingHoursEnd: "23:00",
    },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    mutation.mutate(
      { data: { ...values, deliveryRadius: values.deliveryRadius, deliveryCharges: values.deliveryCharges } },
      {
        onSuccess: (data) => {
          login(data.token);
          setLocation("/pump/pending");
        },
        onError: (err: any) => {
          toast({ title: "Registration Failed", description: err?.data?.error || "Something went wrong", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Register Your Petrol Pump</CardTitle>
          <CardDescription>Submit your details for admin approval</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-pump-register">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="businessName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl><Input placeholder="Al-Hamd Petrol Station" data-testid="input-businessName" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="ownerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Name</FormLabel>
                    <FormControl><Input placeholder="Muhammad Ahmed" data-testid="input-ownerName" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="03001234567" data-testid="input-phone" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="owner@pump.com" data-testid="input-email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cnic" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNIC</FormLabel>
                    <FormControl><Input placeholder="34201-1234567-1" data-testid="input-cnic" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="licenseNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Petrol Pump License No.</FormLabel>
                    <FormControl><Input placeholder="PSO-2024-001" data-testid="input-licenseNumber" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="businessRegNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Registration No.</FormLabel>
                    <FormControl><Input placeholder="BRN-001" data-testid="input-businessRegNumber" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pump Address</FormLabel>
                    <FormControl><Input placeholder="Blue Area, Islamabad" data-testid="input-address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="deliveryRadius" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Radius (km)</FormLabel>
                    <FormControl><Input type="number" min={1} max={50} data-testid="input-deliveryRadius" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="deliveryCharges" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Charges (PKR)</FormLabel>
                    <FormControl><Input type="number" min={0} data-testid="input-deliveryCharges" {...field} /></FormControl>
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
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" data-testid="input-password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" data-testid="input-confirm-password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full mt-2" disabled={mutation.isPending} data-testid="button-register-pump">
                {mutation.isPending ? "Submitting..." : "Submit Registration"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-sm text-center text-muted-foreground flex flex-col gap-1">
          <span>Already have an account? <Link href="/pump/login" className="text-primary font-medium hover:underline">Sign In</Link></span>
          <Link href="/" className="hover:underline">Back to Home</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
