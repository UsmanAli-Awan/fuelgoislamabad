import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAdminLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password is required"),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const mutation = useAdminLogin();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    mutation.mutate(
      { data: { email: values.email, password: values.password } },
      {
        onSuccess: (data) => {
          login(data.token);
          setLocation("/admin/dashboard");
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
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Portal</CardTitle>
          <CardDescription>Sign in to manage FuelGo Islamabad</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="form-admin-login">
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Email</FormLabel>
                  <FormControl><Input type="email" placeholder="admin@fuelgo.pk" data-testid="input-email" {...field} /></FormControl>
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
              <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-admin-login">
                {mutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/" className="text-sm text-muted-foreground hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Back to Home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
