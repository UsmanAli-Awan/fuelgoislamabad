import { useAuth } from '@/lib/auth';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { LogOut, Fuel, LayoutDashboard, Building2, Users, ShoppingBag } from 'lucide-react';

function AdminBottomNav() {
  const [location] = useLocation();

  const tabs = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Pumps',     path: '/admin/pumps',     icon: Building2 },
    { label: 'Users',     path: '/admin/users',     icon: Users },
    { label: 'Orders',    path: '/admin/orders',    icon: ShoppingBag },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-stretch max-w-lg mx-auto">
        {tabs.map(({ label, path, icon: Icon }) => {
          const active = location === path;
          return (
            <Link key={path} href={path} className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => { logout(); setLocation('/'); };

  const isAdminPage = user?.role === 'admin';
  const isLoginPage = !user;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {!isLoginPage && (
        <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur-sm shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
                <Fuel className="w-4 h-4 text-white" />
              </div>
              <div className="leading-none">
                <span className="text-base font-black tracking-tight">FuelGo</span>
                {isAdminPage && <span className="block text-[10px] text-muted-foreground font-medium leading-none">Admin</span>}
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
                {user?.role === 'customer' && (
                  <>
                    <Link href="/customer/home" className="hover:text-primary transition-colors">Home</Link>
                    <Link href="/customer/orders" className="hover:text-primary transition-colors">Orders</Link>
                    <Link href="/customer/favorites" className="hover:text-primary transition-colors">Favorites</Link>
                  </>
                )}
                {user?.role === 'pump_owner' && (
                  <>
                    <Link href="/pump/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                    <Link href="/pump/orders" className="hover:text-primary transition-colors">Orders</Link>
                    <Link href="/pump/fuel" className="hover:text-primary transition-colors">Fuel Pricing</Link>
                  </>
                )}
                {user?.role === 'admin' && (
                  <div className="hidden md:flex gap-5">
                    <Link href="/admin/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                    <Link href="/admin/pumps" className="hover:text-primary transition-colors">Pumps</Link>
                    <Link href="/admin/users" className="hover:text-primary transition-colors">Users</Link>
                    <Link href="/admin/orders" className="hover:text-primary transition-colors">Orders</Link>
                  </div>
                )}
              </nav>

              <div className="flex items-center gap-2 border-l pl-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold leading-none">{user?.fullName}</span>
                  <span className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={handleLogout} title="Sign out">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 ${isAdminPage ? 'pb-24 md:pb-8' : ''}`}>
        {children}
      </main>

      {isAdminPage && <AdminBottomNav />}
    </div>
  );
}
