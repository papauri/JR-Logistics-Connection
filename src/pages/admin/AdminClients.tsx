import { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  Package, 
  Truck, 
  MessageSquare, 
  Calendar, 
  ArrowUpRight, 
  ExternalLink,
  CheckCircle2,
  Clock,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Loader2,
  RefreshCw,
  Plus,
  Printer,
  Copy,
  Receipt,
  Check,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { fetchAllClients } from '../../lib/clientManager';
import type { ClientProfile, CustomerRequest, Shipment, ShipmentStatus } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ShipmentHistory from '../../components/ShipmentHistory';
import OnePageQuoteInvoiceModal from '../../components/OnePageQuoteInvoiceModal';

export default function AdminClients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  
  // Invoice / Quote Modal state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  
  // Tab state inside client view
  const [activeTab, setActiveTab] = useState<'all_shipments' | 'quotes_invoices' | 'profile'>('all_shipments');
  const [shipmentFilter, setShipmentFilter] = useState<string>('ALL');
  const [expandedShipmentId, setExpandedShipmentId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await fetchAllClients();
      setClients(data);
      if (data.length > 0) {
        if (!selectedClient) {
          setSelectedClient(data[0]);
        } else {
          const refreshed = data.find(c => c.id === selectedClient.id) || data[0];
          setSelectedClient(refreshed);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load clients directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredClients = clients.filter(client => {
    const q = searchTerm.toLowerCase();
    return (
      client.name.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q) ||
      (client.phone && client.phone.toLowerCase().includes(q)) ||
      (client.location && client.location.toLowerCase().includes(q)) ||
      client.shipments.some(s => s.id.toLowerCase().includes(q) || s.destination.toLowerCase().includes(q)) ||
      client.requests.some(r => r.reference.toLowerCase().includes(q))
    );
  });

  const totalQuotes = clients.reduce((acc, c) => acc + c.totalRequests, 0);
  const totalShipments = clients.reduce((acc, c) => acc + c.totalShipments, 0);
  const activeCargoClients = clients.filter(c => c.activeShipments > 0).length;

  const clientShipments = selectedClient?.shipments || [];
  const filteredClientShipments = clientShipments.filter(s => {
    if (shipmentFilter === 'ALL') return true;
    if (shipmentFilter === 'ACTIVE') return !['Delivered', 'Closed'].includes(s.currentStatus);
    if (shipmentFilter === 'DELIVERED') return s.currentStatus === 'Delivered';
    return s.currentStatus === shipmentFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-editorial-dark">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-editorial-accent font-bold block mb-1">
            Customer Directory & Accounts
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight">Our Clients.</h1>
          <p className="text-editorial-text font-serif text-sm mt-1">
            Comprehensive client dossiers showing all associated freight shipments, live milestones, and quote enquiries.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadClients}
            disabled={loading}
            className="px-4 py-2 border border-editorial-dark bg-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-bg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Directory
          </button>
        </div>
      </div>

      {/* Aggregate Metric Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setSearchTerm('')}
          className="text-left p-5 bg-white border border-editorial-dark shadow-sm hover:bg-editorial-bg transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold group-hover:text-editorial-dark transition-colors">Total Clients</span>
            <Users className="w-4 h-4 text-editorial-accent group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-serif font-bold">{clients.length}</div>
          <span className="text-[11px] text-editorial-muted font-serif mt-1 block">Click to view all clients</span>
        </button>

        <button
          onClick={() => {
            // Find a client who has active shipments or focus search
            const clientWithCargo = clients.find(c => c.shipments.some(s => s.currentStatus !== 'Delivered'));
            if (clientWithCargo) {
              setSearchTerm(clientWithCargo.name);
            }
          }}
          className="text-left p-5 bg-white border border-editorial-dark shadow-sm hover:bg-editorial-bg transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold group-hover:text-editorial-dark transition-colors">Active Shippers</span>
            <Truck className="w-4 h-4 text-editorial-dark group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-serif font-bold text-editorial-accent">{activeCargoClients}</div>
          <span className="text-[11px] text-editorial-muted font-serif mt-1 block">With cargo in transit</span>
        </button>

        <Link
          to="/admin/shipments"
          className="p-5 bg-white border border-editorial-dark shadow-sm hover:bg-editorial-bg transition-all group cursor-pointer block"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold group-hover:text-editorial-dark transition-colors">Total Shipments</span>
            <Package className="w-4 h-4 text-editorial-dark group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-serif font-bold">{totalShipments}</div>
          <span className="text-[11px] text-editorial-muted font-serif mt-1 block group-hover:text-editorial-accent transition-colors">Manage freight shipments →</span>
        </Link>

        <Link
          to="/admin/requests"
          className="p-5 bg-white border border-editorial-dark shadow-sm hover:bg-editorial-bg transition-all group cursor-pointer block"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold group-hover:text-editorial-dark transition-colors">Quote Enquiries</span>
            <Receipt className="w-4 h-4 text-editorial-dark group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-serif font-bold">{totalQuotes}</div>
          <span className="text-[11px] text-editorial-muted font-serif mt-1 block group-hover:text-editorial-accent transition-colors">Manage quotes & invoices →</span>
        </Link>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="flex flex-col lg:flex-row bg-white border border-editorial-dark min-h-[700px] shadow-sm">
        
        {/* Left: Client Directory List */}
        <div className="w-full lg:w-4/12 border-b lg:border-b-0 lg:border-r border-editorial-dark flex flex-col">
          {/* Search bar */}
          <div className="p-4 border-b border-editorial-dark bg-editorial-bg">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-editorial-muted pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, tracking #..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-editorial-dark bg-white focus:ring-0 font-medium"
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] uppercase font-bold tracking-widest text-editorial-muted">
              <span>Clients ({filteredClients.length})</span>
              <span>Sorted by activity</span>
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto p-3 bg-zinc-50 space-y-3 max-h-[750px]">
            {loading ? (
              <div className="p-12 text-center text-editorial-muted">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-editorial-accent" />
                <p className="text-xs font-serif">Loading client accounts...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-12 text-center text-editorial-muted font-serif text-sm">
                No clients matching criteria.
              </div>
            ) : (
              filteredClients.map(client => {
                const isSelected = selectedClient?.id === client.id;
                const initials = client.name
                  .split(' ')
                  .map(n => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'CL';

                return (
                  <div
                    key={client.id}
                    onClick={() => {
                      setSelectedClient(client);
                      setExpandedShipmentId(null);
                      if (window.innerWidth < 1024) {
                        setTimeout(() => {
                          document.getElementById('detail-panel')?.scrollIntoView({ behavior: 'smooth' });
                        }, 50);
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 shadow-xs hover:shadow-md ${
                      isSelected 
                        ? 'bg-white border-editorial-dark ring-1 ring-editorial-dark' 
                        : 'bg-white border-zinc-200 hover:border-editorial-dark/50'
                    }`}
                  >
                    {/* Initials Badge */}
                    <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs ${
                      client.activeShipments > 0 
                        ? 'bg-editorial-dark text-white' 
                        : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                    }`}>
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h4 className="font-serif font-bold text-sm text-editorial-dark truncate">{client.name}</h4>
                        {client.activeShipments > 0 && (
                          <span className="shrink-0 px-1.5 py-0.5 bg-editorial-accent text-editorial-dark text-[9px] uppercase font-bold tracking-wider rounded-sm">
                            {client.activeShipments} Active
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-editorial-text font-mono truncate mb-2">{client.email}</p>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-editorial-muted uppercase font-bold tracking-wider">
                        <span className="bg-zinc-100 px-1.5 py-0.5 rounded-sm text-editorial-dark font-bold">{client.totalShipments} Shipments</span>
                        <span className="bg-zinc-100 px-1.5 py-0.5 rounded-sm">{client.totalRequests} Quotes</span>
                        {client.location && (
                          <span className="bg-zinc-100 px-1.5 py-0.5 rounded-sm truncate max-w-[100px] lowercase capitalize font-serif">{client.location}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Comprehensive Client Dossier */}
        <div id="detail-panel" className="flex-1 flex flex-col bg-editorial-bg/20 overflow-y-auto">
          {selectedClient ? (
            <div className="p-6 lg:p-8 space-y-6">
              
              {/* Client Profile Header Card */}
              <div className="p-6 bg-white border border-editorial-dark shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-editorial-dark/10">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 border border-editorial-dark bg-editorial-bg flex items-center justify-center font-serif font-bold text-2xl text-editorial-dark shrink-0">
                      {selectedClient.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold">
                          Client Account Dossier
                        </span>
                        {selectedClient.activeShipments > 0 && (
                          <span className="px-2 py-0.5 bg-editorial-dark text-white text-[9px] uppercase tracking-widest font-bold font-mono">
                            Cargo Active ({selectedClient.activeShipments})
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-editorial-dark">{selectedClient.name}</h2>
                      <p className="text-xs text-editorial-muted font-serif mt-0.5">
                        Last Active: {format(selectedClient.lastActivity, 'MMMM d, yyyy - HH:mm')}
                      </p>
                    </div>
                  </div>

                  {/* Direct Contact & Document Shortcuts */}
                  <div className="flex flex-wrap items-center gap-2 self-start">
                    <button
                      type="button"
                      onClick={() => setIsInvoiceModalOpen(true)}
                      className="px-3.5 py-2 bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center gap-1.5"
                      title="Issue Official One-Page Quote or Invoice"
                    >
                      <Receipt className="w-3.5 h-3.5 text-editorial-accent" />
                      Issue Quote / Invoice
                    </button>
                    <a
                      href={`mailto:${selectedClient.email}`}
                      className="px-3.5 py-2 border border-editorial-dark bg-white text-editorial-dark text-xs uppercase tracking-widest font-bold hover:bg-editorial-bg flex items-center gap-1.5 transition-colors"
                      title="Send Email"
                    >
                      <Mail className="w-3.5 h-3.5 text-editorial-accent" />
                      Email
                    </a>
                    {selectedClient.phone && (
                      <a
                        href={`https://wa.me/${selectedClient.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-emerald-700 text-white text-xs uppercase tracking-widest font-bold hover:bg-emerald-800 transition-colors flex items-center gap-1.5"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    )}
                    <Link
                      to="/admin/shipments"
                      className="px-3.5 py-2 bg-editorial-accent text-editorial-dark text-xs uppercase tracking-widest font-bold hover:bg-editorial-dark hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Shipment
                    </Link>
                  </div>
                </div>

                {/* Coordinates Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="p-3.5 bg-editorial-bg border border-editorial-dark/10">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-editorial-muted block mb-1">Registered Email</span>
                    <span className="text-xs font-mono font-semibold text-editorial-dark select-all">{selectedClient.email}</span>
                  </div>
                  <div className="p-3.5 bg-editorial-bg border border-editorial-dark/10">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-editorial-muted block mb-1">Contact Phone / Mobile</span>
                    <span className="text-xs font-mono font-semibold text-editorial-dark select-all">
                      {selectedClient.phone || 'Not specified'}
                    </span>
                  </div>
                  <div className="p-3.5 bg-editorial-bg border border-editorial-dark/10">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-editorial-muted block mb-1">Location / Depot Hub</span>
                    <span className="text-xs font-semibold text-editorial-dark truncate block">
                      {selectedClient.location || 'Ireland / Malawi Corridor'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs for Client Dossier */}
              <div className="flex border-b border-editorial-dark bg-white">
                <button
                  onClick={() => setActiveTab('all_shipments')}
                  className={`px-6 py-3.5 text-xs uppercase tracking-widest font-bold border-b-2 flex items-center gap-2 transition-colors ${
                    activeTab === 'all_shipments'
                      ? 'border-editorial-dark bg-editorial-bg text-editorial-dark font-black'
                      : 'border-transparent text-editorial-muted hover:text-editorial-dark'
                  }`}
                >
                  <Truck className="w-4 h-4 text-editorial-accent" />
                  All Freight Shipments ({selectedClient.shipments.length})
                </button>

                <button
                  onClick={() => setActiveTab('quotes_invoices')}
                  className={`px-6 py-3.5 text-xs uppercase tracking-widest font-bold border-b-2 flex items-center gap-2 transition-colors ${
                    activeTab === 'quotes_invoices'
                      ? 'border-editorial-dark bg-editorial-bg text-editorial-dark font-black'
                      : 'border-transparent text-editorial-muted hover:text-editorial-dark'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-editorial-accent" />
                  Quotes & Invoices ({selectedClient.requests.length})
                </button>
              </div>

              {/* TAB 1: ALL SHIPMENTS OF THIS CLIENT */}
              {activeTab === 'all_shipments' && (
                <div className="space-y-4">
                  {/* Filter Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-editorial-dark">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-editorial-muted">Status Filter:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {['ALL', 'ACTIVE', 'DELIVERED'].map(f => (
                          <button
                            key={f}
                            onClick={() => setShipmentFilter(f)}
                            className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold border transition-colors ${
                              shipmentFilter === f
                                ? 'bg-editorial-dark text-white border-editorial-dark'
                                : 'bg-white text-editorial-dark border-editorial-dark/30 hover:border-editorial-dark'
                            }`}
                          >
                            {f === 'ALL' ? `All (${clientShipments.length})` : f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <span className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold">
                      Showing {filteredClientShipments.length} of {clientShipments.length} consignments
                    </span>
                  </div>

                  {filteredClientShipments.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-editorial-dark text-editorial-muted font-serif">
                      <Truck className="w-10 h-10 opacity-30 mx-auto mb-2" />
                      <p className="text-sm">No shipments found matching filter for {selectedClient.name}.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredClientShipments.map(ship => {
                        const isExpanded = expandedShipmentId === ship.id;
                        const hasEvents = (ship.events?.length || 0) > 0;

                        return (
                          <div
                            key={ship.id}
                            className="bg-white border border-editorial-dark shadow-sm overflow-hidden"
                          >
                            {/* Main Shipment Row */}
                            <div className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                  <span className="font-mono font-bold text-base text-editorial-dark tracking-wide">{ship.id}</span>
                                  <button
                                    onClick={() => handleCopy(ship.id, ship.id)}
                                    className="text-editorial-muted hover:text-editorial-dark p-1"
                                    title="Copy Tracking ID"
                                  >
                                    {copiedId === ship.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                  <span className="px-2.5 py-0.5 border border-editorial-dark bg-editorial-bg text-[9px] uppercase font-bold tracking-widest">
                                    {ship.currentStatus}
                                  </span>
                                  {ship.requestReference && (
                                    <span className="text-xs bg-zinc-100 px-2 py-0.5 font-mono text-zinc-600">
                                      Quote: {ship.requestReference}
                                    </span>
                                  )}
                                </div>

                                <div className="text-sm font-serif text-editorial-dark mb-1">
                                  <span className="text-editorial-text">{ship.origin}</span> → <strong>{ship.destination}</strong>
                                </div>

                                <p className="text-xs text-editorial-text font-serif">
                                  {ship.cargoType} • {ship.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-4 mt-3 text-[10px] uppercase font-bold tracking-widest text-editorial-muted">
                                  <span>Logged: {format(ship.createdAt, 'MMM d, yyyy')}</span>
                                  <span>•</span>
                                  <span>ETA: {ship.eta || 'Pending Dispatch'}</span>
                                  <span>•</span>
                                  <span>{ship.events?.length || 0} Milestones Logged</span>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
                                <button
                                  onClick={() => setExpandedShipmentId(isExpanded ? null : ship.id)}
                                  className="px-3.5 py-1.5 border border-editorial-dark bg-editorial-bg text-[10px] uppercase tracking-widest font-bold hover:bg-white flex items-center gap-1"
                                >
                                  {isExpanded ? 'Hide Milestones' : 'View Milestones'}
                                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                </button>
                                
                                <Link
                                  to={`/track/${ship.id}`}
                                  target="_blank"
                                  className="px-3.5 py-1.5 border border-editorial-dark bg-white text-[10px] uppercase tracking-widest font-bold hover:bg-editorial-bg flex items-center gap-1"
                                >
                                  Public Tracker <ExternalLink className="w-3 h-3" />
                                </Link>

                                <Link
                                  to="/admin/shipments"
                                  className="text-[10px] uppercase tracking-widest font-bold text-editorial-accent hover:underline flex items-center gap-1 mt-1"
                                >
                                  Manage In Shipments <ArrowUpRight className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>

                            {/* Consignee details bar if present */}
                            {(ship.consigneeName || ship.consigneePhone) && (
                              <div className="px-5 py-2.5 bg-editorial-bg/40 border-t border-editorial-dark/10 text-xs flex flex-wrap items-center justify-between gap-2">
                                <span className="font-serif text-editorial-text">
                                  Consignee: <strong className="text-editorial-dark not-italic">{ship.consigneeName}</strong>
                                  {ship.consigneePhone && ` (${ship.consigneePhone})`}
                                  {ship.consigneeEmail && ` • ${ship.consigneeEmail}`}
                                </span>
                              </div>
                            )}

                            {/* Expanded Milestone Timeline Drawer */}
                            {isExpanded && (
                              <div className="p-6 bg-editorial-bg border-t border-editorial-dark">
                                <h4 className="text-xs uppercase tracking-widest font-bold text-editorial-dark mb-4 flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-editorial-accent" />
                                  Live Transit Milestone History for {ship.id}
                                </h4>
                                {hasEvents ? (
                                  <ShipmentHistory events={ship.events || []} isPublicView={false} />
                                ) : (
                                  <p className="text-xs text-editorial-muted font-serif">No milestones logged yet for this consignment.</p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: QUOTES & INVOICES OF THIS CLIENT */}
              {activeTab === 'quotes_invoices' && (
                <div className="space-y-4">
                  {selectedClient.requests.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-editorial-dark text-editorial-muted font-serif">
                      <Receipt className="w-10 h-10 opacity-30 mx-auto mb-2" />
                      <p className="text-sm">No quote enquiries or invoices logged for {selectedClient.name}.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedClient.requests.map(req => (
                        <div
                          key={req.reference || req.id}
                          className="bg-white border border-editorial-dark p-5 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center gap-3 mb-1.5">
                              <span className="font-mono font-bold text-sm text-editorial-dark tracking-wide">{req.reference}</span>
                              <span className="px-2 py-0.5 border border-editorial-dark bg-editorial-bg text-[9px] uppercase font-bold tracking-widest">
                                {req.status}
                              </span>
                              {req.quotedAmount && (
                                <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-300">
                                  {req.currency || '€'} {req.quotedAmount.toLocaleString()}
                                </span>
                              )}
                            </div>

                            <p className="text-xs font-serif text-editorial-text mb-1">
                              {req.pickupLocation} → <strong>{req.destination}</strong> • {req.cargoType} ({req.quantity})
                            </p>

                            <span className="text-[10px] text-editorial-muted font-serif block">
                              Enquiry Date: {format(req.createdAt, 'MMMM d, yyyy - HH:mm')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            <Link
                              to={`/track/${req.reference}`}
                              target="_blank"
                              className="px-3 py-1.5 border border-editorial-dark bg-white text-[10px] uppercase tracking-widest font-bold hover:bg-editorial-bg flex items-center gap-1"
                            >
                              Track Quote <ExternalLink className="w-3 h-3" />
                            </Link>

                            <Link
                              to="/admin/requests"
                              className="px-3 py-1.5 bg-editorial-dark text-white text-[10px] uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center gap-1"
                            >
                              Open In Quotes <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-editorial-muted">
              <Users className="w-12 h-12 opacity-30 mb-3 text-editorial-dark" />
              <h3 className="font-serif font-bold text-xl text-editorial-dark">Select a Client</h3>
              <p className="font-serif text-xs text-editorial-text mt-1">
                Choose a customer from the left list to review their complete cargo history and contact coordinates.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* One-Page Official Quote / Invoice Modal */}
      {isInvoiceModalOpen && selectedClient && (
        <OnePageQuoteInvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          initialClientName={selectedClient.name}
          initialClientEmail={selectedClient.email}
          initialClientPhone={selectedClient.phone}
          onSaved={() => {
            loadClients();
          }}
        />
      )}
    </div>
  );
}
