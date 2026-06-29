import { useAuth } from '@/lib/auth';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { LogOut, Fuel, LayoutDashboard, Building2, Users, ShoppingBag } from 'lucide-react';

function AdminBottomNav() {
  const [location] = useLocation();

  const tabs = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Pumps', path: '/admin/pumps', icon: Building2 },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-pb">
      <div className="flex items-stretch max-w-lg mx-auto">
        {tabs.map(({ label, path, icon: Icon }) => {
          const active = location === path || location.startsWith(path);
          return (
            <Link key={path} href={path} className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon className={`w-5 h-5 ${active ? 'fill-primary/10' : ''}`} strokeWidth={active ? 2.5 : 1.75} />
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
  const [, setLocation] = useLocation();

  const handleLogout = () => { logout(); setLocation('/'); };

  const isAdminPage = user?.role === 'admin';
  const isLoginPage = !user;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {!isLoginPage && (
        <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur-sm shadow-sm">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
                <Fuel className="w-4 h-4 text-white" />
              </div>
              <div className="leading-none">
                <span className="text-base font-black tracking-tight">FuelGo</span>
                {isAdminPage && <span className="block text-[10px] text-muted-foreground font-medium leading-none">Admin</span>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user && (
                <div className="flex items-center gap-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-semibold leading-tight">{user.fullName}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight capitalize">{user.role.replace('_', ' ')}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={handleLogout} title="Sign out">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      <main className={`flex-1 w-full ${isAdminPage ? 'pb-20' : ''}`}>
        <div className="max-w-lg mx-auto">
          {children}
        </div>
      </main>

      {isAdminPage && <AdminBottomNav />}
    </div>
  );
}
