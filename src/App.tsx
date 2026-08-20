import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSettingsStore } from './store/settingsStore';
import { Toaster } from 'react-hot-toast';
import { Package, Menu, X, ArrowRight, ShieldCheck, MapPin, Truck, ChevronRight, CheckCircle2 } from 'lucide-react';

// Pages
import PublicHome from './pages/PublicHome';
import TrackShipment from './pages/TrackShipment';
import RequestQuote from './pages/RequestQuote';
import Calculator from './pages/Calculator';
import PublicLegal from './pages/PublicLegal';
import PublicSchedules from './pages/PublicSchedules';
import PublicContact from './pages/PublicContact';
import UnderConstruction from './pages/UnderConstruction';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminRequests from './pages/admin/AdminRequests';
import AdminShipments from './pages/admin/AdminShipments';
import AdminClients from './pages/admin/AdminClients';
import AdminSettings from './pages/admin/AdminSettings';
import AdminLegal from './pages/admin/AdminLegal';
import AdminSchedules from './pages/admin/AdminSchedules';
import AdminContacts from './pages/admin/AdminContacts';
import AdminFinance from './pages/admin/AdminFinance';
import AdminDocuments from './pages/admin/AdminDocuments';

import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';
import ScrollToTop from './components/ScrollToTop';

import { seedSampleData } from './data/seedSampleData';
import { getOrSeedLegalDocuments } from './data/defaultLegalDocs';

export default function App() {
  const { initialize: initAuth, loading: authLoading } = useAuthStore();
  const { initialize: initSettings, loading: settingsLoading, settings } = useSettingsStore();

  useEffect(() => {
    initAuth();
    initSettings();
    
    // Seed initial demo data & legal documents into DB if not present
    const initAppData = async () => {
      try {
        await Promise.all([
          getOrSeedLegalDocuments(),
          seedSampleData()
        ]);
      } catch (e) {
        console.warn('App data seeding non-blocking error:', e);
      }
    };
    initAppData();
  }, [initAuth, initSettings]);

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Wrapper for public routes that respects the under-construction flag
  const PublicRouteWrapper = () => {
    if (settings.isUnderConstruction) {
      return <UnderConstruction />;
    }
    return <PublicLayout />;
  };

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRouteWrapper />}>
          <Route path="/" element={<PublicHome />} />
          <Route path="/track" element={<TrackShipment />} />
          <Route path="/track/:trackingNumber" element={<TrackShipment />} />
          <Route path="/quote" element={<RequestQuote />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/schedules" element={<PublicSchedules />} />
          <Route path="/contact" element={<PublicContact />} />
          <Route path="/legal" element={<PublicLegal />} />
          <Route path="/legal/:slug" element={<PublicLegal />} />
          <Route path="/terms" element={<Navigate to="/legal/shipping-terms" replace />} />
          <Route path="/privacy" element={<Navigate to="/legal/privacy-policy" replace />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="finance" element={<AdminFinance />} />
          <Route path="shipments" element={<AdminShipments />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="schedules" element={<AdminSchedules />} />
          <Route path="contacts" element={<AdminContacts />} />
          <Route path="legal" element={<AdminLegal />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}
