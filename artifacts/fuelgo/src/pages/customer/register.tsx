import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRegisterCustomer } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { Fuel } from "lucide-react";

const schema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(11, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm your password"),
  address: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords do not match", path: ["confirmPassword"] });

export default function CustomerRegister() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const mutation = useRegisterCustomer();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", phone: "", email: "", password: "", confirmPassword: "", address: "" },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    mutation.mutate(
      { data: { fullName: values.fullName, phone: values.phone, email: values.email || null, password: values.password, confirmPassword: values.confirmPassword, address: values.address || null } },
      {
        onSuccess: (data) => {
          login(data.token);
          setLocation("/customer/home");
        },
        onError: (err: any) => {
          toast({ title: "Registration Failed", description: err?.response?.data?.error || "Something went wrong", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
            <Fuel className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <CardDescription>Register as a customer</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-customer-register">
              <FormField control={form.control} name="fullName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="Muhammad Ali" data-testid="input-fullName" {...field} /></FormControl>
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
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl><Input type="email" placeholder="you@example.com" data-testid="input-email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery Address</FormLabel>
                  <FormControl><Input placeholder="House 12, Street 5, Islamabad" data-testid="input-address" {...field} /></FormControl>
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
              <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-register">
                {mutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-sm text-center text-muted-foreground">
          <span>Already have an account? <Link href="/customer/login" className="text-primary font-medium hover:underline">Sign In</Link></span>
          <Link href="/" className="hover:underline">Back to Home</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
