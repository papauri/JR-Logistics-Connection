import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Package, LayoutDashboard, Receipt, Truck, Users, Settings, LogOut, FileText, Menu, X, ExternalLink, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function AdminLayout() {
  const { user, isAdmin } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Inbox & Contacts', href: '/admin/contacts', icon: Mail },
    { name: 'Quotes & Invoices', href: '/admin/requests', icon: Receipt },
    { name: 'Freight Shipments', href: '/admin/shipments', icon: Truck },
    { name: 'Clients Directory', href: '/admin/clients', icon: Users },
    { name: 'Manage Schedules', href: '/admin/schedules', icon: Package },
    { name: 'Legal & Terms', href: '/admin/legal', icon: FileText },
    { name: 'Settings & Tariffs', href: '/admin/settings', icon: Settings },
  ];

  const currentNav = navItems.find(item => item.href === location.pathname) || navItems[0];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-zinc-950 text-white border-b border-zinc-800 px-4 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <Link to="/admin" className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white text-zinc-950 rounded flex items-center justify-center font-bold text-xs">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block leading-tight">JR Logistics Connection</span>
            <span className="text-[10px] text-zinc-400 font-mono">Admin: {currentNav.name}</span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-zinc-900 border border-zinc-700 text-white rounded-md hover:bg-zinc-800 transition-colors"
          aria-label="Toggle admin navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-editorial-accent" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex flex-col justify-end" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="bg-zinc-950 text-white border-t border-zinc-800 max-h-[85vh] overflow-y-auto p-5 space-y-5 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-editorial-accent border border-zinc-700 font-mono">
                  {user.email?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-[200px]">{user.email}</p>
                  <span className="text-[10px] text-zinc-400 font-mono">Authorized Admin</span>
                </div>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-editorial-accent text-zinc-950 font-bold" 
                        : "text-zinc-300 hover:text-white hover:bg-zinc-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-zinc-950" />}
                  </Link>
                );
              })}
            </nav>

            {/* Action buttons */}
            <div className="pt-3 border-t border-zinc-800 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-zinc-900 border border-zinc-700 text-xs font-bold text-zinc-300 hover:text-white rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Public Customer Website</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-red-950/40 border border-red-800/60 text-xs font-bold text-red-300 hover:bg-red-900 hover:text-white rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out from Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-zinc-950 text-white flex-shrink-0 flex-col hidden md:flex min-h-screen">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-zinc-950 rounded flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight block leading-tight">JR Logistics Connection</span>
              <span className="text-[10px] text-zinc-400 font-mono">Admin Portal</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-zinc-800 text-white font-bold" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
              {user.email?.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
            </div>
          </div>
          <Link
            to="/"
            className="mt-3 flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900/60 rounded-lg transition-colors border border-zinc-800"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Public Website
          </Link>
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white bg-zinc-900 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
