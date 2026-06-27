import { useAuth } from '@/lib/auth';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { LogOut, User, Droplet, LayoutDashboard, Settings } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <Droplet className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">FuelGo</span>
          </Link>
          
          {user && (
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium mr-4">
                {user.role === 'customer' && (
                  <>
                    <Link href="/customer/home" className="hover:text-primary transition-colors">Home</Link>
                    <Link href="/customer/orders" className="hover:text-primary transition-colors">Orders</Link>
                  </>
                )}
                {user.role === 'pump_owner' && (
                  <>
                    <Link href="/pump/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                    <Link href="/pump/orders" className="hover:text-primary transition-colors">Orders</Link>
                    <Link href="/pump/fuel" className="hover:text-primary transition-colors">Fuel Pricing</Link>
                  </>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link href="/admin/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                    <Link href="/admin/pumps" className="hover:text-primary transition-colors">Pumps</Link>
                    <Link href="/admin/users" className="hover:text-primary transition-colors">Users</Link>
                  </>
                )}
              </nav>

              <div className="flex items-center gap-3 border-l pl-4">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-bold leading-none">{user.fullName}</span>
                  <span className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}