import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { Building2 } from "lucide-react";

const schema = z.object({
  phone: z.string().min(11, "Enter a valid phone number"),
  password: z.string().min(6, "Password is required"),
});

export default function PumpLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const mutation = useLogin();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    mutation.mutate(
      { data: { phone: values.phone, password: values.password, role: "pump_owner" } },
      {
        onSuccess: (data) => {
          login(data.token);
          setLocation("/pump/dashboard");
        },
        onError: (err: any) => {
          toast({ title: "Login Failed", description: err?.response?.data?.error || "Invalid credentials", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Pump Owner Login</CardTitle>
          <CardDescription>Sign in to manage your petrol station</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-pump-login">
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input placeholder="03001234567" data-testid="input-phone" {...field} /></FormControl>
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
              <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-login">
                {mutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 text-sm text-center text-muted-foreground">
          <span>No account? <Link href="/pump/register" className="text-primary font-medium hover:underline">Register Your Pump</Link></span>
          <Link href="/" className="hover:underline">Back to Home</Link>
        </CardFooter>
      </Card>
    </div>
  );
}
