import { Link, Outlet, useLocation } from 'react-router-dom';
import { Package, Menu, X, ArrowRight, ShieldCheck, Mail, Phone, MapPin, Calculator, Search, FileText, UserCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { SiteSettings } from '../types';

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteSettings;
          setSettings(data);
          
          // Update SEO Meta Tags
          if (data.seoTitle) {
            document.title = data.seoTitle;
          } else if (data.companyName) {
            document.title = data.companyName;
          }

          if (data.seoDescription) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
              metaDesc = document.createElement('meta');
              metaDesc.setAttribute('name', 'description');
              document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', data.seoDescription);
          }

          if (data.seoKeywords) {
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
              metaKeywords = document.createElement('meta');
              metaKeywords.setAttribute('name', 'keywords');
              document.head.appendChild(metaKeywords);
            }
            metaKeywords.setAttribute('content', data.seoKeywords);
          }
        }
      } catch (error) {
        console.error('Failed to fetch global settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', icon: Package },
    { name: 'Schedules', href: '/schedules', icon: Package },
    { name: 'Track Shipment', href: '/track', icon: Search },
    { name: 'Tariff Calculator', href: '/calculator', icon: Calculator },
    { name: 'Contact', href: '/contact', icon: Mail },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-editorial-bg font-sans text-editorial-dark relative">
      {/* Navbar */}
      <header className="bg-editorial-bg border-b border-editorial-dark sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 shrink-0 group">
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-sans font-bold tracking-tight leading-none text-editorial-dark">
                  {settings?.companyName || 'JR Logistics Connection'}
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-editorial-muted font-bold mt-1">
                  Ireland ⇄ Africa Freight Logistics
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8 text-[11px] uppercase tracking-[0.2em] font-semibold">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={cn(
                    "transition-opacity hover:opacity-100",
                    location.pathname === link.href ? "opacity-100 text-editorial-accent font-bold" : "opacity-70 text-editorial-dark"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex items-center ml-4">
                <Link
                  to="/quote"
                  className="px-4 py-2 bg-editorial-dark text-white hover:bg-editorial-accent transition-colors flex items-center gap-2"
                >
                  Get Quote <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </nav>

            {/* Mobile menu toggle button */}
            <div className="flex items-center gap-2 md:hidden">
              <Link
                to="/track"
                className="p-2 text-editorial-dark hover:text-editorial-accent"
                title="Track"
              >
                <Search className="w-5 h-5" />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 bg-white border border-editorial-dark text-editorial-dark hover:bg-editorial-dark hover:text-white transition-colors"
                aria-label="Toggle mobile menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer Dropdown */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 top-20 bg-black/40 z-40 md:hidden backdrop-blur-xs" 
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Mobile Menu Panel */}
            <div className="md:hidden bg-editorial-bg border-b-2 border-editorial-dark px-5 pt-4 pb-8 space-y-4 shadow-2xl absolute top-full left-0 right-0 w-full z-50 animate-in slide-in-from-top duration-200">
              <div className="space-y-1 divide-y divide-editorial-dark/10">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3 py-3.5 text-xs uppercase tracking-[0.2em] font-bold transition-colors",
                        isActive 
                          ? "bg-editorial-dark text-white px-4" 
                          : "text-editorial-dark hover:bg-white hover:text-editorial-accent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn("w-4 h-4", isActive ? "text-editorial-accent" : "text-editorial-muted")} />
                        <span>{link.name}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                    </Link>
                  );
                })}
              </div>

              {/* Action Buttons on Mobile */}
              <div className="pt-3 space-y-2.5">
                <Link
                  to="/quote"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3.5 px-4 bg-editorial-dark text-white text-xs uppercase tracking-widest font-black flex items-center justify-center gap-2 hover:bg-editorial-accent shadow-md transition-colors"
                >
                  <span>Request Instant Formal Quote</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 px-4 bg-white border border-editorial-dark text-editorial-dark text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-zinc-100 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-editorial-accent" />
                  <span>Admin Dispatch Portal</span>
                </Link>
              </div>

              {/* Direct Support Quick Links */}
              {settings && (
                <div className="mt-4 pt-4 border-t border-editorial-dark/15 flex items-center justify-around text-[10px] font-mono font-bold text-editorial-muted">
                  {settings.phone && (
                    <a 
                      href={`tel:${settings.phone}`} 
                      className="flex items-center gap-1.5 hover:text-editorial-dark"
                    >
                      <Phone className="w-3 h-3 text-editorial-accent" />
                      <span>{settings.phone}</span>
                    </a>
                  )}
                  {settings.email && (
                    <a 
                      href={`mailto:${settings.email}`} 
                      className="flex items-center gap-1.5 hover:text-editorial-dark"
                    >
                      <Mail className="w-3 h-3 text-editorial-accent" />
                      <span>Email Dispatch</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-editorial-dark py-12 bg-editorial-bg text-editorial-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center mb-6">
              <span className="text-2xl font-sans font-bold tracking-tighter">{settings?.companyName || 'JR Logistics Connection'}</span>
            </Link>
            <p className="text-editorial-text font-sans text-lg max-w-sm leading-relaxed mb-6">
              {settings?.seoDescription || 'Delivering your cargo with care and precision. Specializing in secure, reliable transport from Ireland to destinations across Africa.'}
            </p>
            {settings && (
              <div className="space-y-2 mt-8 text-sm font-medium">
                {settings.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-editorial-accent" />
                    <a href={`mailto:${settings.email}`} className="hover:text-editorial-accent transition-colors">{settings.email}</a>
                  </div>
                )}
                {settings.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-editorial-accent" />
                    <a href={`tel:${settings.phone}`} className="hover:text-editorial-accent transition-colors">{settings.phone}</a>
                  </div>
                )}
                {settings.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-editorial-accent" />
                    <span>{settings.address}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-editorial-muted block mb-4">Quick Links</h3>
            <ul className="space-y-3 text-[11px] uppercase tracking-[0.2em] font-semibold">
              <li><Link to="/track" className="hover:text-editorial-accent transition-colors">Track Shipment</Link></li>
              <li><Link to="/calculator" className="hover:text-editorial-accent transition-colors">Tariff Calculator</Link></li>
              <li><Link to="/quote" className="hover:text-editorial-accent transition-colors">Get a Quote</Link></li>
              <li><Link to="/admin" className="hover:text-editorial-accent transition-colors">Admin Portal</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-editorial-muted block mb-4">Legal & Terms</h3>
            <ul className="space-y-3 text-[11px] uppercase tracking-[0.2em] font-semibold">
              <li><Link to="/legal/shipping-terms" className="hover:text-editorial-accent transition-colors">Terms of Carriage</Link></li>
              <li><Link to="/legal/customs-prohibited" className="hover:text-editorial-accent transition-colors">Customs & Prohibited Items</Link></li>
              <li><Link to="/legal/insurance-liability" className="hover:text-editorial-accent transition-colors">Insurance & Liability</Link></li>
              <li><Link to="/legal/storage-collection" className="hover:text-editorial-accent transition-colors">Depot & Storage Policy</Link></li>
              <li><Link to="/legal/privacy-policy" className="hover:text-editorial-accent transition-colors">Privacy Policy (GDPR)</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mt-12 pt-8 border-t border-editorial-dark flex flex-col md:flex-row items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest flex gap-8">
            <span><strong className="mr-2">Status:</strong> Operational</span>
            {settings?.address && <span><strong className="mr-2">Location:</strong> {settings.address}</span>}
          </div>
          <div className="text-[10px] font-sans mt-4 md:mt-0">
            &copy; {new Date().getFullYear()} {settings?.tradingName || settings?.companyName || 'JR Logistics Connection'}. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Floating Quick Contact Button */}
      <Link
        to="/quote"
        className="fixed bottom-6 right-6 md:bottom-12 md:right-12 z-50 flex items-center justify-center p-4 bg-editorial-accent text-editorial-dark rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-yellow-400 transition-all duration-300"
        title="Quick Contact"
      >
        <Mail className="w-6 h-6" />
      </Link>
    </div>
  );
}
