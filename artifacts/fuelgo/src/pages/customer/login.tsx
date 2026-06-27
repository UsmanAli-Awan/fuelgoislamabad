import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLogin, LoginCredentialsRole } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";
import { Droplet, ArrowLeft } from "lucide-react";

const loginSchema = z.object({
  phone: z.string().min(11, "Phone number must be at least 11 digits"),
  password: z.string().min(6, "Password is required"),
});

export default function CustomerLogin() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const loginMutation = useLogin();

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(
      {
        data: {
          phone: values.phone,
          password: values.password,
          role: LoginCredentialsRole.customer,
        },
      },
      {
        onSuccess: (response) => {
          login(response.token);
          toast({ title: "Welcome back!", description: "Successfully logged in." });
          setLocation("/customer/home");
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: error.data?.error || "Invalid credentials. Please try again.",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="space-y-2 text-center pb-6">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors absolute top-6 left-6">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Droplet className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Customer Login</CardTitle>
          <CardDescription>Enter your phone number to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="03001234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full font-bold text-base h-12" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Logging in..." : "Log In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-6">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/customer/register" className="text-primary hover:underline font-semibold">
              Register here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}