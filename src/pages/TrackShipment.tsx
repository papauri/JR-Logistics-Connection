import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Truck, 
  Calendar, 
  ArrowRight, 
  PhoneCall, 
  MessageSquare,
  PackageCheck,
  Shield,
  ShieldCheck,
  Lock,
  Unlock,
  Printer,
  Mail,
  User,
  ExternalLink,
  ChevronDown,
  Info,
  Receipt,
  CreditCard,
  DollarSign,
  Package
} from 'lucide-react';
import type { Shipment, CustomerRequest } from '../types';
import { format } from 'date-fns';
import ShipmentHistory from '../components/ShipmentHistory';
import { lookupAndValidateTracking, type TrackingResult } from '../lib/trackingValidator';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function TrackShipment() {
  const { trackingNumber: initialTracking } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuthStore();

  // Search mode: 'shipment' (cargo freight) or 'quote' (rate enquiries & invoicing)
  const [trackMode, setTrackMode] = useState<'shipment' | 'quote'>('shipment');

  const [trackingNumber, setTrackingNumber] = useState(initialTracking || '');
  const [emailInput, setEmailInput] = useState(searchParams.get('email') || '');
  const [verifyEmailForm, setVerifyEmailForm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Results
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  const performSearch = useCallback(async (searchCode: string, emailToVerify?: string) => {
    const code = searchCode.trim().toUpperCase();
    if (!code) return;

    setLoading(true);
    setError('');
    setVerificationError('');
    setResult(null);

    try {
      const email = emailToVerify !== undefined ? emailToVerify : (searchParams.get('email') || '');
      const searchResult = await lookupAndValidateTracking(code, email);

      if (searchResult.error && !searchResult.shipment && !searchResult.request) {
        setError(searchResult.error);
        setResult(null);
      } else {
        setResult(searchResult);
        if (searchResult.type === 'request') {
          setTrackMode('quote');
        } else {
          setTrackMode('shipment');
        }

        // If user is Admin or email matched
        if (isAdmin || searchResult.isVerified) {
          setIsVerified(true);
        } else {
          setIsVerified(false);
          if (email && !searchResult.isVerified) {
            setVerificationError(`Email "${email}" does not match the registered consignor or consignee email address for reference ${code}.`);
          }
        }
      }
    } catch (err: any) {
      console.error('Tracking search error:', err);
      setError('An error occurred while tracking. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchParams, isAdmin]);

  // Automatic search if URL has trackingNumber parameter
  useEffect(() => {
    if (initialTracking) {
      setTrackingNumber(initialTracking.toUpperCase());
      const email = searchParams.get('email') || '';
      if (email) setEmailInput(email);
      performSearch(initialTracking, email);
    }
  }, [initialTracking, performSearch, searchParams]);

  const handleSearchSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!trackingNumber.trim()) return;

    const clean = trackingNumber.trim().toUpperCase();
    const cleanEmail = emailInput.trim().toLowerCase();

    navigate({
      pathname: `/track/${clean}`,
      search: cleanEmail ? `?email=${encodeURIComponent(cleanEmail)}` : ''
    }, { replace: true });

    performSearch(clean, cleanEmail);
  };

  const handleVerifyEmailSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!verifyEmailForm.trim() || !result) return;
    
    const emailToCheck = verifyEmailForm.trim().toLowerCase();
    setEmailInput(emailToCheck);
    
    if (result.registeredEmails.includes(emailToCheck)) {
      setIsVerified(true);
      setVerificationError('');
      toast.success('Identity verified! Full consignment dossier unlocked.');
      setSearchParams({ email: emailToCheck }, { replace: true });
    } else {
      setIsVerified(false);
      setVerificationError(`Verification Failed: "${emailToCheck}" is not registered on this reference. Please check your spelling or quote email.`);
    }
  };

  const handlePrintDossier = () => {
    window.print();
  };

  // Helper for Request stages
  const getRequestStepStatus = (status: string) => {
    const steps = [
      { key: 'received', label: 'Quote Submitted', desc: 'Logged in system' },
      { key: 'review', label: 'Route & Tariff Review', desc: 'Freight calculation' },
      { key: 'quoted', label: 'Official Quote Issued', desc: 'Pricing sent to client' },
      { key: 'invoiced', label: 'Invoice & Payment', desc: 'Deposit / settlement' },
      { key: 'active', label: 'Cargo In Transit', desc: 'Converted to shipment' }
    ];

    let currentStepIndex = 0;
    if (['New'].includes(status)) currentStepIndex = 0;
    else if (['Contacted'].includes(status)) currentStepIndex = 1;
    else if (['Quoted'].includes(status)) currentStepIndex = 2;
    else if (['Invoiced', 'Paid', 'Collection Scheduled', 'Booked'].includes(status)) currentStepIndex = 3;
    else if (['Completed'].includes(status)) currentStepIndex = 4;

    return { steps, currentStepIndex };
  };

  const shipment = result?.shipment;
  const request = result?.request;
  const linkedShipment = result?.linkedShipment;

  return (
    <div className="min-h-[80vh] bg-editorial-bg py-12 lg:py-16 text-editorial-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase tracking-[0.3em] text-editorial-accent block mb-3 font-bold">
            Real-Time Logistics Status & Commercial Verification
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight mb-3">
            Track Status.
          </h1>
          <p className="text-base sm:text-lg text-editorial-text font-serif max-w-2xl mx-auto">
            Track physical cargo freight consignments moving between Ireland & Africa, or check quote enquiries and pro-forma invoice settlements.
          </p>
        </div>

        {/* DISTINCT TRACKING MODE TABS */}
        <div className="flex border-b border-editorial-dark mb-4 bg-white">
          <button
            type="button"
            onClick={() => {
              setTrackMode('shipment');
              if (trackingNumber.startsWith('REQ-')) {
                setTrackingNumber('');
                setResult(null);
              }
            }}
            className={`flex-1 py-3 px-4 text-xs uppercase tracking-widest font-bold border-b-2 flex items-center justify-center gap-2 transition-colors ${
              trackMode === 'shipment'
                ? 'border-editorial-dark bg-editorial-bg text-editorial-dark font-black'
                : 'border-transparent text-editorial-muted hover:text-editorial-dark bg-white'
            }`}
          >
            <Truck className="w-4 h-4 text-editorial-accent" />
            Cargo Freight Tracking (Consignments)
          </button>

          <button
            type="button"
            onClick={() => {
              setTrackMode('quote');
              if (trackingNumber.startsWith('JRLC-')) {
                setTrackingNumber('');
                setResult(null);
              }
            }}
            className={`flex-1 py-3 px-4 text-xs uppercase tracking-widest font-bold border-b-2 flex items-center justify-center gap-2 transition-colors ${
              trackMode === 'quote'
                ? 'border-editorial-dark bg-editorial-bg text-editorial-dark font-black'
                : 'border-transparent text-editorial-muted hover:text-editorial-dark bg-white'
            }`}
          >
            <Receipt className="w-4 h-4 text-editorial-accent" />
            Quote & Invoice Tracking (Enquiries)
          </button>
        </div>

        {/* Dual Search & Verification Input Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-6 border border-editorial-dark bg-white shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-editorial-dark">
            
            {/* Tracking Reference Input */}
            <div className="md:col-span-6 flex items-center px-4 py-3">
              <Search className="h-5 w-5 text-editorial-dark shrink-0 mr-3" />
              <div className="w-full">
                <label className="block text-[9px] uppercase tracking-widest text-editorial-muted font-bold">
                  {trackMode === 'shipment' ? 'Shipment Tracking Number' : 'Quote or Invoice Reference'}
                </label>
                <input
                  type="text"
                  className="w-full border-0 p-0 text-editorial-dark focus:ring-0 text-base font-bold uppercase tracking-wider placeholder:text-editorial-muted placeholder:normal-case font-mono bg-transparent"
                  placeholder={trackMode === 'shipment' ? 'e.g. JRLC-2026-IE882MW' : 'e.g. REQ-2026-001'}
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                  required
                />
              </div>
            </div>

            {/* Optional Registered Email Verification */}
            <div className="md:col-span-4 flex items-center px-4 py-3 bg-editorial-bg/30">
              <Mail className="h-4 w-4 text-editorial-muted shrink-0 mr-3" />
              <div className="w-full">
                <label className="block text-[9px] uppercase tracking-widest text-editorial-muted font-bold">
                  Registered Email (To Unlock Full Dossier)
                </label>
                <input
                  type="email"
                  className="w-full border-0 p-0 text-editorial-dark focus:ring-0 text-xs font-mono placeholder:text-editorial-muted bg-transparent"
                  placeholder="e.g. client@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2 flex items-center justify-center p-2 bg-editorial-dark">
              <button
                type="submit"
                disabled={loading || !trackingNumber.trim()}
                className="w-full h-full py-3 px-4 bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent hover:text-editorial-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Track'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Quick Sample References Bar */}
        <div className="mb-10 p-3.5 bg-white border border-editorial-dark/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-[10px] uppercase tracking-widest font-bold text-editorial-muted flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-editorial-accent" /> Sample Tracking Numbers:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTrackMode('shipment');
                setTrackingNumber('JRLC-2026-IE882MW');
                setEmailInput('chimwemwe.banda@example.com');
                performSearch('JRLC-2026-IE882MW', 'chimwemwe.banda@example.com');
              }}
              className="px-2.5 py-1 bg-editorial-bg border border-editorial-dark/20 text-[10px] font-mono hover:border-editorial-dark hover:bg-white transition-colors"
            >
              Consignment: JRLC-2026-IE882MW
            </button>
            <button
              type="button"
              onClick={() => {
                setTrackMode('quote');
                setTrackingNumber('REQ-2026-001');
                setEmailInput('chimwemwe.banda@example.com');
                performSearch('REQ-2026-001', 'chimwemwe.banda@example.com');
              }}
              className="px-2.5 py-1 bg-editorial-bg border border-editorial-dark/20 text-[10px] font-mono hover:border-editorial-dark hover:bg-white transition-colors"
            >
              Quote/Invoice: REQ-2026-001
            </button>
            <button
              type="button"
              onClick={() => {
                setTrackMode('shipment');
                setTrackingNumber('JRLC-2026-MW109IE');
                setEmailInput('m.phiri@blantyretrade.mw');
                performSearch('JRLC-2026-MW109IE', 'm.phiri@blantyretrade.mw');
              }}
              className="px-2.5 py-1 bg-editorial-bg border border-editorial-dark/20 text-[10px] font-mono hover:border-editorial-dark hover:bg-white transition-colors"
            >
              Consignment: JRLC-2026-MW109IE
            </button>
          </div>
        </div>

        {/* Security & Verification Banner */}
        {result && (
          <div className="mb-8 border border-editorial-dark bg-white p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {isVerified ? (
                  <div className="w-10 h-10 border border-emerald-600 bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 border border-editorial-dark bg-editorial-bg text-editorial-dark flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-editorial-muted">
                      {isVerified ? 'Security Clearance: Verified' : 'Security Clearance: Standard Public View'}
                    </span>
                    {isAdmin && (
                      <span className="px-1.5 py-0.2 text-[9px] bg-zinc-900 text-white font-mono uppercase font-bold">Admin Active</span>
                    )}
                  </div>
                  <h3 className="font-serif font-bold text-base text-editorial-dark">
                    {isVerified 
                      ? 'Full Consignment Dossier & Direct Contact Coordinates Unlocked' 
                      : 'Milestone Progress View (Contact Coordinates Redacted)'}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isVerified && (
                  <button
                    onClick={handlePrintDossier}
                    className="px-4 py-2 border border-editorial-dark bg-editorial-bg text-editorial-dark text-xs uppercase tracking-widest font-bold hover:bg-white flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Waybill
                  </button>
                )}
              </div>
            </div>

            {/* Email verification challenge if not verified */}
            {!isVerified && (
              <div className="mt-4 pt-4 border-t border-editorial-dark/10">
                <form onSubmit={handleVerifyEmailSubmit} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    placeholder="Enter registered shipper or consignee email to unlock..."
                    value={verifyEmailForm}
                    onChange={e => setVerifyEmailForm(e.target.value)}
                    className="flex-1 border border-editorial-dark py-2 px-3 text-xs bg-editorial-bg/30 font-mono"
                    required
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Verify Identity
                  </button>
                </form>
                {verificationError && (
                  <p className="text-xs text-red-600 font-serif italic mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {verificationError}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Errors */}
        {error && (
          <div className="p-6 border border-editorial-dark bg-white mb-8 shadow-sm">
            <div className="flex items-center gap-3 text-editorial-accent mb-2">
              <AlertCircle className="w-5 h-5" />
              <h3 className="font-serif font-bold text-lg text-editorial-dark">Tracking Reference Not Found</h3>
            </div>
            <p className="text-sm text-editorial-text font-serif leading-relaxed">{error}</p>
            <div className="mt-4 pt-4 border-t border-editorial-dark/10 flex items-center justify-between text-xs text-editorial-muted">
              <span>Looking for a new shipment quote instead?</span>
              <Link to="/request" className="text-editorial-accent font-bold uppercase tracking-wider hover:underline">
                Request Free Quote →
              </Link>
            </div>
          </div>
        )}

        {/* QUOTE & INVOICE ENQUIRY TRACKING VIEW */}
        {request && (
          <div className="bg-white border border-editorial-dark flex flex-col shadow-sm mb-12">
            
            {/* Header */}
            <div className="border-b border-editorial-dark p-8 md:p-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  <span className="text-[10px] uppercase tracking-widest block text-editorial-accent mb-1 font-bold">
                    Freight Quote & Invoice Tracking
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight">{request.reference}</h2>
                  <p className="text-editorial-text font-serif mt-1 text-base">
                    Route: <strong className="text-editorial-dark">{request.pickupLocation}</strong> → <strong className="text-editorial-dark">{request.destination}</strong>
                  </p>
                </div>
                <div className="inline-flex items-center px-4 py-2 border border-editorial-dark bg-editorial-bg text-editorial-dark text-xs uppercase tracking-widest font-bold">
                  Status: {request.status}
                </div>
              </div>

              {/* Commercial Pipeline Tracker Bar */}
              <div className="py-6 border-y border-editorial-dark/10">
                <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block mb-4">
                  Quotation & Booking Pipeline
                </span>
                {(() => {
                  const { steps, currentStepIndex } = getRequestStepStatus(request.status);
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {steps.map((st, idx) => {
                        const isDone = idx <= currentStepIndex;
                        const isCurrent = idx === currentStepIndex;
                        return (
                          <div 
                            key={st.key}
                            className={`p-3 border text-left transition-colors ${
                              isCurrent 
                                ? 'border-editorial-dark bg-editorial-dark text-white' 
                                : isDone 
                                  ? 'border-editorial-dark bg-editorial-bg text-editorial-dark' 
                                  : 'border-editorial-dark/20 bg-white text-editorial-muted'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-mono font-bold">0{idx + 1}</span>
                              {isDone && <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-editorial-accent' : 'text-emerald-700'}`} />}
                            </div>
                            <h4 className="text-xs font-bold uppercase tracking-wider leading-tight">{st.label}</h4>
                            <p className={`text-[10px] font-serif mt-1 ${isCurrent ? 'text-zinc-300' : 'text-editorial-muted'}`}>
                              {st.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Financial Quotation & Invoice Card */}
            <div className="p-8 md:p-12 bg-editorial-bg/30 border-b border-editorial-dark">
              <h3 className="font-serif font-bold text-2xl mb-6 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-editorial-accent" />
                Pricing Quotation & Invoice Status
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-6">
                <div className="p-5 bg-white border border-editorial-dark shadow-sm">
                  <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block mb-1">Quoted Price</span>
                  <span className="text-2xl font-mono font-bold text-editorial-dark">
                    {request.quotedAmount ? `${request.currency || '€'} ${request.quotedAmount.toLocaleString()}` : 'Pricing Under Review'}
                  </span>
                  <span className="text-[10px] text-editorial-muted font-serif block mt-1">Includes sea/air freight & port charges</span>
                </div>

                <div className="p-5 bg-white border border-editorial-dark shadow-sm">
                  <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block mb-1">Invoice Number</span>
                  <span className="text-base font-mono font-semibold text-editorial-dark block">
                    {request.invoiceNumber || 'Pending Confirmation'}
                  </span>
                  <span className="text-[10px] text-editorial-muted font-serif block mt-1">Commercial Billing Reference</span>
                </div>

                <div className="p-5 bg-white border border-editorial-dark shadow-sm">
                  <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block mb-1">Settlement Status</span>
                  <span className={`text-xs uppercase font-bold px-2 py-0.5 inline-block border mt-1 ${
                    request.invoiceStatus === 'Paid' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-editorial-dark bg-editorial-bg'
                  }`}>
                    {request.invoiceStatus || 'Not Invoiced'}
                  </span>
                </div>

                <div className="p-5 bg-white border border-editorial-dark shadow-sm">
                  <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block mb-1">Deposit Paid</span>
                  <span className="text-base font-mono font-semibold text-editorial-dark block">
                    {request.depositPaid ? `${request.currency || '€'} ${request.depositPaid.toLocaleString()}` : '€ 0.00'}
                  </span>
                  <span className="text-[10px] text-editorial-muted font-serif block mt-1">Confirmed received</span>
                </div>
              </div>

              {request.quoteNotes && (
                <div className="p-4 bg-white border border-editorial-dark text-xs font-serif text-editorial-dark leading-relaxed">
                  <strong className="block text-[9px] uppercase tracking-widest font-bold text-editorial-muted mb-1">Quotation Terms & Inclusions:</strong>
                  {request.quoteNotes}
                </div>
              )}
            </div>

            {/* Linked Live Shipment Notice */}
            {(linkedShipment || request.linkedShipmentId) && (
              <div className="bg-editorial-dark text-white p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-editorial-dark">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-editorial-accent/50 flex items-center justify-center shrink-0">
                    <Truck className="w-6 h-6 text-editorial-accent" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold block mb-1">Live Freight Shipment Generated</span>
                    <h3 className="text-xl font-serif font-bold text-white tracking-wide">
                      Waybill ID: {linkedShipment?.id || request.linkedShipmentId}
                    </h3>
                    <p className="text-xs text-zinc-300 font-serif">
                      Current Physical Transit Status: <strong className="text-white">{linkedShipment?.currentStatus || 'Booking Received'}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const targetId = (linkedShipment?.id || request.linkedShipmentId)!;
                    setTrackMode('shipment');
                    setTrackingNumber(targetId);
                    navigate(`/track/${targetId}${isVerified && emailInput ? `?email=${encodeURIComponent(emailInput)}` : ''}`, { replace: true });
                    performSearch(targetId, isVerified ? emailInput : undefined);
                  }}
                  className="px-6 py-3 bg-editorial-accent text-editorial-dark text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  Switch to Shipment Milestones <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Request Summary Details */}
            <div className="p-8 md:p-12 bg-white">
              <h3 className="font-serif font-bold text-2xl mb-8">Cargo Specifications</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10 pb-10 border-b border-editorial-dark/10">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold mb-2">Origin</p>
                  <p className="font-semibold text-editorial-dark">{request.pickupLocation}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold mb-2">Destination</p>
                  <p className="font-semibold text-editorial-dark">{request.destination}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold mb-2">Cargo Category</p>
                  <p className="font-semibold text-editorial-dark">{request.cargoType}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold mb-2">Quantity / Vol</p>
                  <p className="font-semibold text-editorial-dark">{request.quantity}</p>
                </div>
              </div>

              {/* Verified Contact Details Section */}
              {isVerified ? (
                <div className="mb-8 p-6 bg-emerald-50/50 border border-emerald-600/40">
                  <span className="text-[10px] uppercase tracking-widest text-emerald-800 font-bold block mb-3">
                    Verified Customer Contact Information
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block mb-1">Customer Full Name</span>
                      <span className="font-bold text-sm text-editorial-dark">{request.customerName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block mb-1">Registered Email</span>
                      <span className="font-mono text-xs text-editorial-dark">{request.email}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold block mb-1">Phone / WhatsApp</span>
                      <span className="font-mono text-xs text-editorial-dark">{request.phone}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-8 p-4 bg-zinc-50 border border-zinc-200 text-xs text-editorial-muted flex items-center justify-between">
                  <span>Customer contact phone and email masked for GDPR privacy.</span>
                  <span className="text-[10px] uppercase font-bold text-editorial-dark">Enter email above to verify</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="p-6 bg-editorial-bg border border-editorial-dark/10">
                  <h4 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-editorial-accent" /> Collection Service
                  </h4>
                  <p className="text-sm font-serif text-editorial-text leading-relaxed">
                    {request.collectionRequired ? (
                      <>
                        <strong className="text-editorial-dark">Door collection requested</strong> in Ireland.
                        {request.preferredDate && <span className="block mt-1">Preferred collection date: <strong className="text-editorial-dark">{request.preferredDate}</strong></span>}
                      </>
                    ) : (
                      'Customer will deliver goods directly to our Dublin depot facility.'
                    )}
                  </p>
                </div>

                <div className="p-6 bg-editorial-bg border border-editorial-dark/10">
                  <h4 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-editorial-accent" /> Cargo Notes
                  </h4>
                  <p className="text-sm font-serif text-editorial-text leading-relaxed">
                    {request.cargoDescription || 'No additional cargo specifications specified.'}
                  </p>
                </div>
              </div>

              {/* Status explanation & Action */}
              <div className="p-6 border border-editorial-dark bg-editorial-bg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-editorial-dark mb-1">Confirm Rate & Booking</h4>
                  <p className="text-xs text-editorial-text font-serif leading-relaxed max-w-xl">
                    To finalize collection or make a booking payment against reference <strong>{request.reference}</strong>, reach our Dublin logistics coordinator directly.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href="https://wa.me/353871234567"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 bg-editorial-dark text-white text-[11px] uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center gap-2"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Desk
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SHIPMENT TRACKING VIEW */}
        {shipment && (
          <div className="bg-white border border-editorial-dark flex flex-col shadow-sm">
            <div className="border-b border-editorial-dark p-8 md:p-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                <div>
                  <span className="text-[10px] uppercase tracking-widest block text-editorial-accent mb-2 font-bold">
                    Cargo Freight Waybill
                  </span>
                  <h2 className="text-4xl font-serif font-bold tracking-tight">{shipment.id}</h2>
                  <p className="text-editorial-text font-serif mt-2 text-lg">{shipment.cargoType} • {shipment.description}</p>
                </div>
                <div className="inline-flex items-center px-4 py-2 border border-editorial-dark bg-editorial-bg text-editorial-dark text-xs uppercase tracking-widest font-bold">
                  {shipment.currentStatus}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-editorial-muted mb-2 font-bold">Origin Depot</p>
                  <p className="font-semibold text-editorial-dark">{shipment.origin}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-editorial-muted mb-2 font-bold">Destination Hub</p>
                  <p className="font-semibold text-editorial-dark">{shipment.destination}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-editorial-muted mb-2 font-bold">Date Logged</p>
                  <p className="font-semibold text-editorial-dark">{format(shipment.createdAt, 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-editorial-muted mb-2 font-bold">Estimated Arrival</p>
                  <p className="font-semibold text-editorial-dark">{shipment.eta || 'Pending Dispatch'}</p>
                </div>
              </div>

              {/* Verified Consignor & Consignee Parties Dossier */}
              {isVerified && (
                <div className="mt-8 pt-8 border-t border-editorial-dark/10 grid grid-cols-1 md:grid-cols-2 gap-6 bg-editorial-bg/50 p-6 border border-editorial-dark/10">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold block mb-1">
                      Consignor (Shipper in Ireland)
                    </span>
                    <h4 className="font-bold text-sm text-editorial-dark">{shipment.customerName || 'Registered Shipper'}</h4>
                    {shipment.customerEmail && (
                      <p className="text-xs text-editorial-text font-mono mt-0.5">{shipment.customerEmail}</p>
                    )}
                    {shipment.customerPhone && (
                      <p className="text-xs text-editorial-muted font-mono mt-0.5">{shipment.customerPhone}</p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold block mb-1">
                      Consignee (Recipient in Malawi)
                    </span>
                    <h4 className="font-bold text-sm text-editorial-dark">{shipment.consigneeName || 'Consignee'}</h4>
                    {shipment.consigneeEmail && (
                      <p className="text-xs text-editorial-text font-mono mt-0.5">{shipment.consigneeEmail}</p>
                    )}
                    {shipment.consigneePhone && (
                      <p className="text-xs text-editorial-muted font-mono mt-0.5">{shipment.consigneePhone}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 md:p-12 bg-editorial-bg">
              <h3 className="font-serif font-bold text-2xl mb-10">Milestone Timeline</h3>
              <ShipmentHistory events={shipment.events || []} isPublicView={true} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
