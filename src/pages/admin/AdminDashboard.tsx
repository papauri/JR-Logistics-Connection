import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Package, Inbox, Truck, Clock, ArrowRight, Activity, RefreshCw, ExternalLink, Receipt, Users, Plus, Printer, Globe, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import type { CustomerRequest, Shipment } from '../../types';
import toast from 'react-hot-toast';
import OnePageQuoteInvoiceModal from '../../components/OnePageQuoteInvoiceModal';

export default function AdminDashboard() {
  const [recentRequests, setRecentRequests] = useState<CustomerRequest[]>([]);
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [stats, setStats] = useState({
    newRequests: 0,
    activeShipments: 0
  });

  const fetchDashboardData = async () => {
    setRefreshing(true);
    try {
      // Fetch recent requests
      const requestsQuery = query(collection(db, 'requests'), orderBy('createdAt', 'desc'), limit(6));
      const requestsSnap = await getDocs(requestsQuery);
      const reqs = requestsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CustomerRequest));
      setRecentRequests(reqs);

      // Fetch recent shipments
      const shipmentsQuery = query(collection(db, 'shipments'), orderBy('updatedAt', 'desc'), limit(6));
      const shipmentsSnap = await getDocs(shipmentsQuery);
      const ships = shipmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shipment));
      setRecentShipments(ships);

      // Basic stats
      const newReqsQuery = query(collection(db, 'requests'), where('status', '==', 'New'));
      const newReqsSnap = await getDocs(newReqsQuery);
      
      setStats({
        newRequests: newReqsSnap.size,
        activeShipments: ships.filter(s => !['Delivered', 'Closed'].includes(s.currentStatus)).length
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 font-sans">Operations Dashboard</h1>
          <p className="text-zinc-500 mt-1 text-sm">Real-time dispatch overview of cargo requests, freight consignments, and customer invoices.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDashboardData()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 bg-white border border-zinc-300 text-zinc-700 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-zinc-50 disabled:opacity-50 transition-colors shadow-xs"
            title="Refresh records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="inline-flex items-center gap-1.5 bg-zinc-950 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-editorial-accent hover:text-zinc-950 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Issue Quote / Invoice
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link 
          to="/admin/requests" 
          className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs hover:shadow-md hover:border-zinc-400 hover:bg-zinc-50/60 transition-all flex items-start justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-sm font-medium text-zinc-500 group-hover:text-zinc-900 transition-colors">New Inbound Requests</p>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-3xl font-bold text-zinc-900">{stats.newRequests}</p>
            <span className="text-[11px] text-zinc-400 mt-1 block group-hover:text-zinc-600 transition-colors">Click to view quote queue →</span>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-100 transition-all">
            <Inbox className="w-6 h-6" />
          </div>
        </Link>
        
        <Link 
          to="/admin/shipments" 
          className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs hover:shadow-md hover:border-zinc-400 hover:bg-zinc-50/60 transition-all flex items-start justify-between group cursor-pointer"
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-sm font-medium text-zinc-500 group-hover:text-zinc-900 transition-colors">Active Cargo in Transit</p>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-3xl font-bold text-zinc-900">{stats.activeShipments}</p>
            <span className="text-[11px] text-zinc-400 mt-1 block group-hover:text-zinc-600 transition-colors">Click to track shipments →</span>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-100 transition-all">
            <Truck className="w-6 h-6" />
          </div>
        </Link>
        
        <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-900 shadow-xs sm:col-span-2 flex items-center justify-between">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Logistics Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Link to="/admin/requests" className="text-xs font-semibold text-zinc-200 hover:text-editorial-accent bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 flex items-center gap-1.5 transition-colors">
                <Receipt className="w-3.5 h-3.5" /> Quotes & Invoices
              </Link>
              <Link to="/admin/shipments" className="text-xs font-semibold text-zinc-200 hover:text-editorial-accent bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 flex items-center gap-1.5 transition-colors">
                <Truck className="w-3.5 h-3.5" /> Freight Shipments
              </Link>
              <Link to="/admin/clients" className="text-xs font-semibold text-zinc-200 hover:text-editorial-accent bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 flex items-center gap-1.5 transition-colors">
                <Users className="w-3.5 h-3.5" /> Clients Directory
              </Link>
              <Link to="/admin/schedules" className="text-xs font-semibold text-zinc-200 hover:text-editorial-accent bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 flex items-center gap-1.5 transition-colors">
                <Package className="w-3.5 h-3.5" /> Manage Schedules
              </Link>
              <Link to="/admin/settings" className="text-xs font-semibold text-zinc-200 hover:text-editorial-accent bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 flex items-center gap-1.5 transition-colors">
                <Globe className="w-3.5 h-3.5" /> Tariffs & Settings
              </Link>
            </div>
          </div>
          <Activity className="w-12 h-12 text-zinc-800 hidden sm:block" />
        </div>
      </div>

      {/* Main Consignment & Request Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Requests */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-zinc-700" />
              <h2 className="text-base font-bold text-zinc-900">Recent Customer Inquiries</h2>
            </div>
            <Link to="/admin/requests" className="text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-100 flex-1">
            {recentRequests.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-sm">No quote requests found.</div>
            ) : (
              recentRequests.map(req => (
                <Link key={req.id || req.reference} to={`/admin/requests?id=${req.id}`} className="block p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-1.5">
                    <div>
                      <span className="font-bold text-zinc-900 block text-sm group-hover:text-editorial-accent transition-colors">{req.customerName}</span>
                      <span className="text-xs text-zinc-500 font-mono">{req.cargoType} • {req.quantity || 'Standard'}</span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      {req.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 mt-2">
                    <span className="flex items-center gap-1 text-[11px]"><Clock className="w-3.5 h-3.5" /> {format(req.createdAt, 'MMM d, HH:mm')}</span>
                    <span className="font-mono text-[11px] font-bold text-zinc-700">{req.reference}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Shipments */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-zinc-700" />
              <h2 className="text-base font-bold text-zinc-900">Active Consignments</h2>
            </div>
            <Link to="/admin/shipments" className="text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-zinc-100 flex-1">
            {recentShipments.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-sm">No shipments logged.</div>
            ) : (
              recentShipments.map(ship => (
                <Link key={ship.id} to={`/admin/shipments?id=${ship.id}`} className="block p-4 sm:p-5 hover:bg-zinc-50/80 transition-colors cursor-pointer group">
                  <div className="flex justify-between items-start mb-1.5">
                    <div>
                      <span className="font-mono font-bold text-zinc-900 block text-sm group-hover:text-editorial-accent transition-colors">{ship.id}</span>
                      <span className="text-xs text-zinc-600">{ship.origin} → {ship.destination}</span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {ship.currentStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 mt-2">
                    <span className="flex items-center gap-1 text-[11px]"><Clock className="w-3.5 h-3.5" /> Updated: {format(ship.updatedAt, 'MMM d')}</span>
                    <span className="text-[11px] text-zinc-600">{ship.customerName}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* One-Page Official Quote / Invoice Modal */}
      {isInvoiceModalOpen && (
        <OnePageQuoteInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          onSaved={() => {
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
