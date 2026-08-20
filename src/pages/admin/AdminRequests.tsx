import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { 
  Search, 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  Inbox, 
  DollarSign, 
  Receipt, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ExternalLink,
  BrainCircuit, 
  Sparkles,
  ArrowRight,
  Plus,
  RefreshCw,
  Printer,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import type { CustomerRequest, RequestStatus, Shipment, SiteSettings } from '../../types';
import toast from 'react-hot-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import OnePageQuoteInvoiceModal from '../../components/OnePageQuoteInvoiceModal';
import { formatCurrency, formatNumber } from '../../lib/utils';
import { logActivity } from '../../lib/activityLogger';

const STATUSES: RequestStatus[] = ['New', 'Contacted', 'Quoted', 'Invoiced', 'Paid', 'Collection Scheduled', 'Booked', 'Completed', 'Closed', 'Spam'];

const getApplicableStatuses = (currentStatus: RequestStatus): RequestStatus[] => {
  const base: RequestStatus[] = ['Closed', 'Spam'];
  switch(currentStatus) {
    case 'New': return ['New', 'Contacted', 'Quoted', ...base];
    case 'Contacted': return ['New', 'Contacted', 'Quoted', ...base];
    case 'Quoted': return ['Contacted', 'Quoted', 'Invoiced', ...base];
    case 'Invoiced': return ['Quoted', 'Invoiced', 'Paid', ...base];
    case 'Paid': return ['Invoiced', 'Paid', 'Collection Scheduled', 'Booked', ...base];
    case 'Collection Scheduled': return ['Paid', 'Collection Scheduled', 'Booked', 'Completed', 'Closed'];
    case 'Booked': return ['Paid', 'Booked', 'Collection Scheduled', 'Completed', 'Closed'];
    case 'Completed': return ['Booked', 'Completed', 'Closed'];
    case 'Closed': return ['New', 'Closed'];
    case 'Spam': return ['New', 'Spam'];
    default: return STATUSES;
  }
};

export default function AdminRequests() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<CustomerRequest | null>(null);

  // One-Page Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateDocType, setTemplateDocType] = useState<'QUOTATION' | 'COMMERCIAL_INVOICE' | 'RECEIPT'>('QUOTATION');

  // Quote & Invoice Form State
  const [isEditingFinancials, setIsEditingFinancials] = useState(false);
  const [quotedAmount, setQuotedAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('EUR');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceStatus, setInvoiceStatus] = useState<string>('Not Invoiced');
  const [depositPaid, setDepositPaid] = useState<string>('');
  const [quoteNotes, setQuoteNotes] = useState<string>('');

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Converting state
  const [converting, setConverting] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerRequest));
      setRequests(data);
      
      const paramId = searchParams.get('id');
      if (paramId) {
        const found = data.find(r => r.id === paramId);
        if (found) {
          selectReq(found);
          setTimeout(() => {
            document.getElementById('detail-panel')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          return;
        }
      }
      
      if (data.length > 0 && !selectedRequest) {
        selectReq(data[0]);
      } else if (selectedRequest) {
        const refreshed = data.find(r => r.id === selectedRequest.id);
        if (refreshed) selectReq(refreshed);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load quotes & invoices');
    } finally {
      setLoading(false);
    }
  };

  const selectReq = (req: CustomerRequest) => {
    setSelectedRequest(req);
    setQuotedAmount(req.quotedAmount ? String(req.quotedAmount) : '');
    setCurrency(req.currency || 'EUR');
    setInvoiceNumber(req.invoiceNumber || `INV-${req.reference.replace('REQ-', '')}`);
    setInvoiceStatus(req.invoiceStatus || 'Not Invoiced');
    setDepositPaid(req.depositPaid ? String(req.depositPaid) : '');
    setQuoteNotes(req.quoteNotes || '');
    setIsEditingFinancials(false);
    setAiResponse(null);
    
    // Auto-scroll on mobile
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('detail-panel')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as SiteSettings);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    fetchSettings();
    fetchRequests();
  }, []);

  const handleStatusChange = async (id: string, newStatus: RequestStatus) => {
    try {
      await updateDoc(doc(db, 'requests', id), {
        status: newStatus,
        updatedAt: Date.now()
      });
      setRequests(reqs => reqs.map(r => r.id === id ? { ...r, status: newStatus } : r));
      if (selectedRequest?.id === id) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
      
      await logActivity(
        'UPDATE_DOCUMENT',
        id,
        'request',
        `Changed quote request status to ${newStatus}`
      );

      toast.success(`Quote status updated to "${newStatus}"`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSaveFinancials = async () => {
    if (!selectedRequest?.id) return;
    try {
      const updates = {
        quotedAmount: quotedAmount ? parseFloat(quotedAmount) : undefined,
        currency,
        invoiceNumber: invoiceNumber.trim() || undefined,
        invoiceStatus: invoiceStatus as any,
        depositPaid: depositPaid ? parseFloat(depositPaid) : undefined,
        quoteNotes: quoteNotes.trim() || undefined,
        status: invoiceStatus === 'Paid' ? 'Paid' : invoiceNumber?.startsWith('INV') ? 'Invoiced' : quotedAmount ? 'Quoted' : selectedRequest.status,
        updatedAt: Date.now()
      };

      await updateDoc(doc(db, 'requests', selectedRequest.id), updates);
      
      const updatedReq = { ...selectedRequest, ...updates };
      setSelectedRequest(updatedReq);
      setRequests(reqs => reqs.map(r => r.id === selectedRequest.id ? updatedReq : r));
      setIsEditingFinancials(false);

      await logActivity(
        'UPDATE_FINANCIALS',
        selectedRequest.id,
        'request',
        `Updated financial details (Quoted: ${quotedAmount || 'N/A'}, Status: ${invoiceStatus})`
      );

      toast.success('Quote & Invoice records updated in database');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save financial details');
    }
  };

  // Convert Quote into a live Cargo Freight Shipment
  const handleConvertToShipment = async () => {
    if (!selectedRequest) return;
    setConverting(true);
    try {
      // Generate tracking ID
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const trackingId = `JRLC-2026-${randomSuffix}`;

      const newShipment: Shipment = {
        id: trackingId,
        reference: selectedRequest.reference,
        requestReference: selectedRequest.reference,
        customerName: selectedRequest.customerName,
        customerEmail: selectedRequest.email,
        customerPhone: selectedRequest.phone,
        origin: selectedRequest.pickupLocation,
        destination: selectedRequest.destination,
        cargoType: selectedRequest.cargoType,
        description: `${selectedRequest.cargoDescription} (${selectedRequest.quantity})`,
        currentStatus: 'Booking Received',
        events: [{
          id: Date.now().toString(),
          status: 'Booking Received',
          timestamp: Date.now(),
          location: selectedRequest.pickupLocation,
          description: `Consignment initialized from quote reference ${selectedRequest.reference}.`,
          isPublic: true,
          createdBy: 'Admin Quote Conversion'
        }],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Save shipment
      await setDoc(doc(db, 'shipments', trackingId), newShipment);

      // Update quote request
      await updateDoc(doc(db, 'requests', selectedRequest.id!), {
        status: 'Booked',
        linkedShipmentId: trackingId,
        updatedAt: Date.now()
      });

      setSelectedRequest({
        ...selectedRequest,
        status: 'Booked',
        linkedShipmentId: trackingId
      });

      await logActivity(
        'CREATE_SHIPMENT',
        trackingId,
        'shipment',
        `Converted quote request ${selectedRequest.reference} into shipment`
      );

      toast.success(`Converted! Live Cargo Shipment ${trackingId} created.`);
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast.error('Failed to convert quote to shipment');
    } finally {
      setConverting(false);
    }
  };

  const handleAIAnalyze = async () => {
    if (!selectedRequest) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await fetch('/api/ai/analyze-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestData: selectedRequest,
          userPrompt: 'Please analyze this quote request. Provide estimated sea freight calculation guidelines, customs tariff recommendations for Malawi/destination, and a formal quotation email reply to the customer.'
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze');
      setAiResponse(data.text);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.invoiceNumber && r.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    
    let matchesCategory = true;
    if (categoryFilter === 'UNQUOTED') matchesCategory = ['New', 'Contacted'].includes(r.status) || (r.status === 'Quoted' && (!r.quotedAmount || r.quotedAmount === 0));
    if (categoryFilter === 'QUOTED') matchesCategory = r.status === 'Quoted' && !!r.quotedAmount && r.quotedAmount > 0;
    if (categoryFilter === 'INVOICED') matchesCategory = ['Invoiced', 'Paid'].includes(r.status);
    if (categoryFilter === 'CONVERTED') matchesCategory = ['Booked', 'Collection Scheduled', 'Completed', 'Closed'].includes(r.status);

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-editorial-dark">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-editorial-accent font-bold block mb-1">
            Commercial & Pricing Operations
          </span>
          <h1 className="text-3xl sm:text-4xl font-sans font-bold tracking-tight">Quotes & Invoices.</h1>
          <p className="text-editorial-text font-sans text-sm mt-1">
            Manage rate requests, issue pro-forma invoices, track payment settlements, and convert confirmed quotes into freight shipments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedRequest(null);
              setIsTemplateModalOpen(true);
            }}
            className="px-4 py-2 bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Quote / Invoice
          </button>

          <button
            onClick={fetchRequests}
            disabled={loading}
            className="px-4 py-2 border border-editorial-dark bg-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-bg flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white border border-editorial-dark flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-editorial-muted absolute left-3 top-3 pointer-events-none" />
          <input 
            type="text"
            placeholder="Search by customer name, quote ref (REQ-...), invoice #, or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-editorial-dark bg-editorial-bg/20 text-xs font-medium focus:ring-0 focus:border-editorial-dark"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-[10px] uppercase tracking-widest font-bold text-editorial-muted whitespace-nowrap">Filter:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-editorial-dark py-2 px-3 text-xs bg-white uppercase font-bold"
          >
            <option value="ALL">All Quotes ({requests.length})</option>
            {STATUSES.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="bg-white border border-editorial-dark flex flex-col lg:flex-row min-h-[650px] shadow-sm">
        
        {/* Left Side: Quotes & Invoices List */}
        <div className="w-full lg:w-5/12 border-b lg:border-b-0 lg:border-r border-editorial-dark flex flex-col">
          <div className="p-3 bg-editorial-bg border-b border-editorial-dark flex items-center justify-between text-[10px] uppercase font-bold tracking-widest">
            <span>Enquiries & Invoices ({filteredRequests.length})</span>
            <span className="text-editorial-muted">Sort: Newest</span>
          </div>

          {/* Category Tabs */}
          <div className="flex bg-white border-b border-editorial-dark overflow-x-auto text-[10px] uppercase tracking-widest font-bold scrollbar-hide">
            <button 
              onClick={() => setCategoryFilter('ALL')}
              className={`flex-1 py-3 px-3 min-w-[70px] text-center border-r border-editorial-dark transition-colors ${categoryFilter === 'ALL' ? 'bg-editorial-dark text-white' : 'hover:bg-editorial-bg text-editorial-muted hover:text-editorial-dark'}`}
            >
              All
            </button>
            <button 
              onClick={() => setCategoryFilter('UNQUOTED')}
              className={`flex-1 py-3 px-3 min-w-[70px] text-center border-r border-editorial-dark transition-colors ${categoryFilter === 'UNQUOTED' ? 'bg-amber-100 text-amber-900' : 'hover:bg-amber-50 text-editorial-muted hover:text-amber-800'}`}
            >
              Unquoted
            </button>
            <button 
              onClick={() => setCategoryFilter('QUOTED')}
              className={`flex-1 py-3 px-3 min-w-[70px] text-center border-r border-editorial-dark transition-colors ${categoryFilter === 'QUOTED' ? 'bg-blue-100 text-blue-900' : 'hover:bg-blue-50 text-editorial-muted hover:text-blue-800'}`}
            >
              Quotes
            </button>
            <button 
              onClick={() => setCategoryFilter('INVOICED')}
              className={`flex-1 py-3 px-3 min-w-[70px] text-center border-r border-editorial-dark transition-colors ${categoryFilter === 'INVOICED' ? 'bg-purple-100 text-purple-900' : 'hover:bg-purple-50 text-editorial-muted hover:text-purple-800'}`}
            >
              Invoices
            </button>
            <button 
              onClick={() => setCategoryFilter('CONVERTED')}
              className={`flex-1 py-3 px-3 min-w-[70px] text-center transition-colors ${categoryFilter === 'CONVERTED' ? 'bg-emerald-100 text-emerald-900' : 'hover:bg-emerald-50 text-editorial-muted hover:text-emerald-800'}`}
            >
              Converted
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-3 bg-zinc-50 max-h-[700px] space-y-3">
            {loading ? (
              <div className="flex justify-center p-12 text-editorial-muted">
                <Loader2 className="w-6 h-6 animate-spin text-editorial-accent" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center p-12 text-editorial-muted text-sm font-sans">
                No quote enquiries matching criteria.
              </div>
            ) : (
              filteredRequests.map(req => {
                const isSelected = selectedRequest?.id === req.id;
                return (
                  <div
                    key={req.id}
                    onClick={() => selectReq(req)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 shadow-xs hover:shadow-md ${
                      isSelected 
                        ? 'bg-white border-editorial-dark ring-1 ring-editorial-dark' 
                        : 'bg-white border-zinc-200 hover:border-editorial-dark/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-xs text-editorial-dark tracking-wider">{req.reference}</span>
                      <span className="text-[10px] text-editorial-muted font-sans">
                        {format(req.createdAt, 'MMM d, HH:mm')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-sans font-bold text-sm text-editorial-dark truncate">{req.customerName}</h4>
                      {req.quotedAmount ? (
                        <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-300 rounded-sm">
                          {formatCurrency(req.quotedAmount, req.currency || 'EUR')}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-editorial-text font-sans truncate">
                      {req.pickupLocation} → <strong>{req.destination}</strong> • {req.cargoType}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[9px] uppercase font-bold tracking-widest">
                      <span className={`px-2 py-0.5 border rounded-sm ${
                        ['New', 'Contacted'].includes(req.status) ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        req.status === 'Quoted' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                        req.status === 'Invoiced' ? 'bg-purple-50 border-purple-200 text-purple-700' :
                        ['Paid', 'Booked', 'Collection Scheduled', 'Completed'].includes(req.status) ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        'bg-zinc-50 border-zinc-200 text-zinc-600'
                      }`}>
                        {req.status}
                      </span>
                      {req.linkedShipmentId && (
                        <span className="text-editorial-accent font-mono">
                          Linked: {req.linkedShipmentId}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed Quote & Invoice Workspace */}
        <div id="detail-panel" className="flex-1 flex flex-col bg-editorial-bg/20 overflow-y-auto">
          {selectedRequest ? (
            <div className="p-6 lg:p-8 space-y-6">
              
              {/* Header Overview Card */}
              <div className="p-6 bg-white border border-editorial-dark shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-editorial-dark/10">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold">
                        Quote Enquiry
                      </span>
                      <span className="text-xs text-editorial-muted font-mono">
                        Logged: {format(selectedRequest.createdAt, 'MMMM d, yyyy - HH:mm')}
                      </span>
                    </div>
                    <h2 className="text-3xl font-sans font-bold tracking-tight">{selectedRequest.reference}</h2>
                    <p className="text-xs text-editorial-text font-sans mt-1">
                      Client: <strong className="text-editorial-dark">{selectedRequest.customerName}</strong> ({selectedRequest.email})
                    </p>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex flex-col items-end gap-1.5 self-start sm:self-auto">
                    <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold">Quote Stage</span>
                    <select
                      value={selectedRequest.status}
                      onChange={(e) => handleStatusChange(selectedRequest.id!, e.target.value as RequestStatus)}
                      className="bg-white border border-editorial-dark py-1.5 px-3 text-xs uppercase font-bold tracking-wider"
                    >
                      {getApplicableStatuses(selectedRequest.status).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Conversion / Linked Shipment Bar */}
                {selectedRequest.linkedShipmentId ? (
                  <div className="mt-6 p-4 bg-editorial-dark text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Truck className="w-5 h-5 text-editorial-accent shrink-0" />
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-editorial-accent font-bold block">Live Freight Consignment</span>
                        <p className="text-sm font-mono font-bold">{selectedRequest.linkedShipmentId}</p>
                      </div>
                    </div>
                    <Link
                      to="/admin/shipments"
                      className="px-4 py-2 bg-editorial-accent text-editorial-dark text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                    >
                      Open in Shipments <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="mt-6 p-4 bg-editorial-bg border border-editorial-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs uppercase tracking-widest font-bold text-editorial-dark">Generate Freight Consignment</h4>
                      <p className="text-xs text-editorial-text font-sans mt-0.5">
                        {['Paid', 'Booked', 'Collection Scheduled', 'Completed'].includes(selectedRequest.status)
                          ? 'Payment secured. Initialize an active tracked consignment (`JRLC-...`) with origin, destination, and customer contacts pre-filled.'
                          : 'Real-world logistics lock: The enquiry must be officially Invoiced and marked as Paid before cargo can be generated.'}
                      </p>
                    </div>
                    <button
                      onClick={handleConvertToShipment}
                      disabled={converting || !['Paid', 'Booked', 'Collection Scheduled', 'Completed'].includes(selectedRequest.status)}
                      className={`px-5 py-2.5 text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto ${
                        !['Paid', 'Booked', 'Collection Scheduled', 'Completed'].includes(selectedRequest.status)
                          ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                          : 'bg-editorial-dark text-white hover:bg-editorial-accent'
                      }`}
                    >
                      {converting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
                      Generate Shipment
                    </button>
                  </div>
                )}
              </div>

              {/* COMMERCIAL & INVOICE MANAGEMENT DRAWER */}
              <div className="bg-white border border-editorial-dark p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-editorial-dark/10">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-editorial-accent" />
                    <h3 className="font-sans font-bold text-xl">Commercial Workflow</h3>
                  </div>
                  <button
                    onClick={() => setIsEditingFinancials(!isEditingFinancials)}
                    className="text-xs uppercase tracking-wider font-bold text-editorial-accent hover:underline"
                  >
                    {isEditingFinancials ? 'Cancel Edit' : 'Edit Financials'}
                  </button>
                </div>

                {/* Workflow Status Tracker */}
                <div className="mb-8 p-4 bg-editorial-bg border border-editorial-dark/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-editorial-accent" />
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-4">Recommended Next Steps</h4>
                  
                  <div className="flex flex-col gap-4">
                    {['New', 'Contacted'].includes(selectedRequest.status) && (
                      <div className="flex items-start gap-3 bg-white p-3 border border-editorial-dark/10">
                        <div className="w-6 h-6 rounded-full bg-editorial-dark text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</div>
                        <div className="flex-1">
                          <span className="font-bold text-sm text-editorial-dark block">Issue an Official Quote</span>
                          <p className="text-xs text-editorial-text mt-1">Fill in the pricing details and generate a <strong>QUOTATION</strong> to send to the client.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setTemplateDocType('QUOTATION');
                              setIsTemplateModalOpen(true);
                            }}
                            className="mt-3 px-4 py-2 bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center gap-2"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Generate Quote
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {selectedRequest.status === 'Quoted' && (
                      <div className="flex items-start gap-3 bg-white p-3 border border-editorial-dark/10">
                        <div className="w-6 h-6 rounded-full bg-editorial-dark text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</div>
                        <div className="flex-1">
                          <span className="font-bold text-sm text-editorial-dark block">Client Accepted? Generate Invoice</span>
                          <p className="text-xs text-editorial-text mt-1">If the client accepts the quote, generate a <strong>COMMERCIAL INVOICE</strong> to bill them.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setTemplateDocType('COMMERCIAL_INVOICE');
                              setIsTemplateModalOpen(true);
                            }}
                            className="mt-3 px-4 py-2 bg-editorial-accent text-editorial-dark text-xs uppercase tracking-widest font-bold hover:bg-white border border-editorial-accent hover:border-editorial-dark transition-colors flex items-center gap-2"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Generate Invoice
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedRequest.status === 'Invoiced' && (
                      <div className="flex items-start gap-3 bg-white p-3 border border-editorial-dark/10">
                        <div className="w-6 h-6 rounded-full bg-editorial-dark text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</div>
                        <div className="flex-1">
                          <span className="font-bold text-sm text-editorial-dark block">Await Payment & Convert</span>
                          <p className="text-xs text-editorial-text mt-1">Once payment (or deposit) is secured, mark the financials as <strong>Paid</strong> or use the "Generate Shipment" button above to track the cargo.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setTemplateDocType('RECEIPT');
                              setIsTemplateModalOpen(true);
                            }}
                            className="mt-3 px-4 py-2 bg-editorial-bg border border-editorial-dark text-editorial-dark text-xs uppercase tracking-widest font-bold hover:bg-editorial-dark hover:text-white transition-colors flex items-center gap-2"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Generate Receipt
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {['Paid', 'Booked', 'Collection Scheduled', 'Completed', 'Closed'].includes(selectedRequest.status) && (
                      <div className="flex items-start gap-3 bg-emerald-50 p-3 border border-emerald-200">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✓</div>
                        <div>
                          <span className="font-bold text-sm text-emerald-800 block">Financials Settled</span>
                          <p className="text-xs text-emerald-700/80 mt-1">The invoice is paid and the request has moved into fulfillment operations.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {isEditingFinancials ? (
                  /* Financial Editor Form */
                  <div className="space-y-4 bg-editorial-bg/30 p-5 border border-editorial-dark">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Total Quoted Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 1450.00"
                          value={quotedAmount}
                          onChange={e => setQuotedAmount(e.target.value)}
                          className="w-full border border-editorial-dark py-2 px-3 text-xs bg-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Currency</label>
                        <select
                          value={currency}
                          onChange={e => setCurrency(e.target.value)}
                          className="w-full border border-editorial-dark py-2 px-3 text-xs bg-white font-bold"
                        >
                          {(settings?.enabledCurrencies || ['EUR', 'USD']).map(cur => (
                            <option key={cur} value={cur}>
                              {cur === 'EUR' ? 'EUR (€)' : 
                               cur === 'USD' ? 'USD ($)' : 
                               cur === 'GBP' ? 'GBP (£)' : 
                               cur === 'ZAR' ? 'ZAR (R)' : 
                               'MWK (Kwacha)'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Invoice Status</label>
                        <select
                          value={invoiceStatus}
                          onChange={e => setInvoiceStatus(e.target.value)}
                          className="w-full border border-editorial-dark py-2 px-3 text-xs bg-white font-bold"
                        >
                          <option value="Not Invoiced">Not Invoiced</option>
                          <option value="Issued">Issued</option>
                          <option value="Partially Paid">Partially Paid</option>
                          <option value="Paid">Paid</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Invoice Reference #</label>
                        <input
                          type="text"
                          placeholder="e.g. INV-737759"
                          value={invoiceNumber}
                          onChange={e => setInvoiceNumber(e.target.value)}
                          className="w-full border border-editorial-dark py-2 px-3 text-xs bg-white font-mono uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Deposit Paid / Advance</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 500.00"
                          value={depositPaid}
                          onChange={e => setDepositPaid(e.target.value)}
                          className="w-full border border-editorial-dark py-2 px-3 text-xs bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Quotation Notes / Terms</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Rate includes Dublin warehouse packing, ocean freight to Beira, and overland transport to Lilongwe depot."
                        value={quoteNotes}
                        onChange={e => setQuoteNotes(e.target.value)}
                        className="w-full border border-editorial-dark py-2 px-3 text-xs bg-white resize-none font-sans"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingFinancials(false)}
                        className="px-4 py-2 border border-editorial-dark text-xs uppercase tracking-widest font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveFinancials}
                        className="px-6 py-2 bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent"
                      >
                        Save Financial Records
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Financial Summary Display */
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-editorial-bg border border-editorial-dark/10">
                      <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block mb-1">Quoted Price</span>
                      <span className="text-xl font-mono font-bold text-editorial-dark">
                        {selectedRequest.quotedAmount ? formatCurrency(selectedRequest.quotedAmount, selectedRequest.currency || 'EUR') : 'Pending Quote'}
                      </span>
                    </div>

                    <div className="p-4 bg-editorial-bg border border-editorial-dark/10">
                      <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block mb-1">Invoice Ref</span>
                      <span className="text-sm font-mono font-semibold text-editorial-dark truncate block">
                        {selectedRequest.invoiceNumber || 'None'}
                      </span>
                    </div>

                    <div className="p-4 bg-editorial-bg border border-editorial-dark/10">
                      <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block mb-1">Deposit Received</span>
                      <span className="text-sm font-mono font-semibold text-editorial-dark">
                        {formatCurrency(selectedRequest.depositPaid || 0, selectedRequest.currency || 'EUR')}
                      </span>
                    </div>

                    <div className="p-4 bg-editorial-bg border border-editorial-dark/10">
                      <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block mb-1">Balance Due</span>
                      <span className="text-sm font-mono font-bold text-editorial-accent">
                        {formatCurrency(
                          Math.max(0, (selectedRequest.quotedAmount || 0) - (selectedRequest.depositPaid || 0)),
                          selectedRequest.currency || 'EUR'
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action button to open full one-page template */}
                <div className="mt-5 pt-4 border-t border-editorial-dark/10 flex flex-wrap items-center justify-between gap-3 opacity-60 hover:opacity-100 transition-opacity">
                  <div>
                    <span className="text-[10px] text-editorial-muted uppercase tracking-widest font-bold block">
                      Freeform Document Generator
                    </span>
                    <p className="text-[11px] text-editorial-text font-sans">
                      Need a different document type? Open the blank generator template.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateDocType('QUOTATION');
                      setIsTemplateModalOpen(true);
                    }}
                    className="px-3 py-1.5 border border-editorial-dark text-editorial-dark text-[10px] uppercase tracking-widest font-bold hover:bg-editorial-dark hover:text-white transition-colors flex items-center gap-2"
                  >
                    <Printer className="w-3 h-3" />
                    Open Generator
                  </button>
                </div>
              </div>

              {/* Enquiry Route & Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-editorial-dark p-6 shadow-sm">
                  <h3 className="font-sans font-bold text-lg mb-4 text-editorial-dark">Route & Pickup Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block">Pickup / Collection</span>
                      <p className="font-semibold text-xs text-editorial-dark mt-0.5">{selectedRequest.pickupLocation}</p>
                      {selectedRequest.collectionRequired && (
                        <span className="text-[10px] text-editorial-accent font-bold mt-0.5 block">
                          Door Collection Required {selectedRequest.preferredDate && `(Preferred Date: ${selectedRequest.preferredDate})`}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block">Destination Depot</span>
                      <p className="font-semibold text-xs text-editorial-dark mt-0.5">{selectedRequest.destination}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-editorial-dark p-6 shadow-sm">
                  <h3 className="font-sans font-bold text-lg mb-4 text-editorial-dark">Cargo Specification</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block">Category & Quantity</span>
                      <p className="font-semibold text-xs text-editorial-dark mt-0.5">{selectedRequest.cargoType} ({selectedRequest.quantity})</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block">Description</span>
                      <p className="text-xs font-sans text-editorial-text mt-0.5">{selectedRequest.cargoDescription || 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Strategic Logistics Assistant */}
              <div className="bg-white border border-editorial-dark p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 border-b border-editorial-dark/10 pb-4">
                  <div>
                    <h3 className="font-sans font-bold text-lg flex items-center gap-2 text-editorial-dark">
                      <Sparkles className="w-4 h-4 text-editorial-accent" />
                      AI Pricing & Customs Tariff Advisory
                    </h3>
                    <p className="text-xs text-editorial-text mt-1 max-w-lg">
                      Generate an automated logistics analysis based on the cargo description above. This will estimate freight charges, outline customs duties in Malawi, and draft a professional email reply for you to send to the customer.
                    </p>
                  </div>
                  <button
                    onClick={handleAIAnalyze}
                    disabled={aiLoading}
                    className="px-3.5 py-2 shrink-0 bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                    Analyze & Draft Rate Quote
                  </button>
                </div>

                {aiResponse && (
                  <div className="mt-4 p-5 bg-editorial-bg border border-editorial-dark">
                    <pre className="whitespace-pre-wrap font-sans text-xs text-editorial-dark leading-relaxed">{aiResponse}</pre>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-editorial-muted p-12">
              <Inbox className="w-12 h-12 opacity-30 mb-3 text-editorial-dark" />
              <h3 className="font-sans font-bold text-xl text-editorial-dark">Select a Quote</h3>
              <p className="font-sans text-xs text-editorial-text mt-1">
                Choose a quote enquiry from the left to calculate rates, issue invoices, or convert to a shipment.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* One-Page Official Quote / Invoice Modal */}
      {isTemplateModalOpen && (
        <OnePageQuoteInvoiceModal
          isOpen={isTemplateModalOpen}
          initialDocType={templateDocType}
          onClose={() => setIsTemplateModalOpen(false)}
          initialRequest={selectedRequest}
          onSaved={() => {
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}
