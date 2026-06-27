import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet, UserCircle, Fuel, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export default function Landing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      if (user.role === 'customer') setLocation('/customer/home');
      else if (user.role === 'pump_owner') setLocation('/pump/dashboard');
      else if (user.role === 'admin') setLocation('/admin/dashboard');
    }
  }, [user, setLocation]);

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[80vh]">
      <div className="text-center max-w-2xl mb-12 animate-in slide-in-from-bottom-4 fade-in duration-500">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
          <Droplet className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
          Fuel Delivered to <br className="hidden md:block" />
          <span className="text-primary">Your Doorstep.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">
          Premium, fast, and trustworthy fuel delivery service in Islamabad.
          Order petrol, diesel, or hi-octane from nearby registered pumps.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl px-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150">
        <Card className="border-2 hover:border-primary/50 transition-all shadow-lg hover:shadow-xl group">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <UserCircle className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl">Customer</CardTitle>
            <CardDescription className="text-base">Order fuel anytime, anywhere.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-4">
            <Button asChild size="lg" className="w-full font-semibold group-hover:bg-primary">
              <Link href="/customer/login">
                Login <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/customer/register">Create Account</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-all shadow-lg hover:shadow-xl group">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Fuel className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl">Petrol Pump Owner</CardTitle>
            <CardDescription className="text-base">Register your pump and expand your reach.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-4">
            <Button asChild size="lg" className="w-full font-semibold group-hover:bg-primary">
              <Link href="/pump/login">
                Login <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/pump/register">Partner with us</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-10 animate-in fade-in duration-700 delay-300">
        <Link href="/admin/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ShieldCheck className="w-3.5 h-3.5" />
          Admin Portal
        </Link>
      </div>
    </div>
  );
}