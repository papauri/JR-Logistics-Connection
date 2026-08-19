import { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Send, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Receipt, 
  Truck, 
  MessageSquare, 
  Mail, 
  Copy, 
  Check, 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  ShieldCheck,
  Save,
  Loader2,
  FileText,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import type { CustomerRequest, Shipment } from '../types';
import { db } from '../lib/firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { usePricing } from '../lib/usePricing';
import { getDoc } from 'firebase/firestore';
import type { SiteSettings } from '../types';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: number;
  total: number;
}

export type DocumentType = 'QUOTATION' | 'PROFORMA_INVOICE' | 'COMMERCIAL_INVOICE' | 'RECEIPT';

interface OnePageQuoteInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRequest?: CustomerRequest | null;
  initialShipment?: Shipment | null;
  initialClientEmail?: string;
  initialClientName?: string;
  initialClientPhone?: string;
  onSaved?: () => void;
}

export default function OnePageQuoteInvoiceModal({
  isOpen,
  onClose,
  initialRequest,
  initialShipment,
  initialClientEmail,
  initialClientName,
  initialClientPhone,
  onSaved
}: OnePageQuoteInvoiceModalProps) {
  const { categories, addons, currencyRates } = usePricing();
  const [docType, setDocType] = useState<DocumentType>('QUOTATION');
  const [docNumber, setDocNumber] = useState('');
  const [issueDate, setIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [validUntil, setValidUntil] = useState(format(new Date(Date.now() + 14 * 86400000), 'yyyy-MM-dd'));
  const [currency, setCurrency] = useState('EUR');
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const loadedSettings = docSnap.data() as SiteSettings;
          setSettings(loadedSettings);
          if (loadedSettings.vatEnabled && loadedSettings.vatRate) {
            setVatRate(loadedSettings.vatRate);
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    };
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  // Parties
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  const [consigneeName, setConsigneeName] = useState('');
  const [consigneePhone, setConsigneePhone] = useState('');
  const [consigneeAddress, setConsigneeAddress] = useState('');

  // Routing
  const [origin, setOrigin] = useState('Dublin, Ireland');
  const [destination, setDestination] = useState('Lilongwe, Malawi');
  const [cargoType, setCargoType] = useState('General Cargo / Barrels');
  const [transitTime, setTransitTime] = useState('30 - 45 Days (Sea Freight)');

  // Line items
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      id: '1',
      description: 'Ocean Sea Freight & Port Handling (Dublin to Beira)',
      quantity: '1 Consignment',
      unitPrice: 850,
      total: 850
    },
    {
      id: '2',
      description: 'Dublin Depot Door Collection & Cargo Handling',
      quantity: '1 Trip',
      unitPrice: 60,
      total: 60
    },
    {
      id: '3',
      description: 'Export Customs Declaration, Manifesting & Bill of Lading',
      quantity: '1 Set',
      unitPrice: 90,
      total: 90
    }
  ]);

  const [discount, setDiscount] = useState<number>(0);
  const [vatRate, setVatRate] = useState<number>(0); // 0% international freight
  const [depositPaid, setDepositPaid] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Paid' | 'Partially Paid'>('Pending');
  const [notes, setNotes] = useState('Rates include sea freight carriage to Beira and overland bonded transport to Lilongwe clearing depot. Excludes destination local import duties if applicable.');

  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize data from props
  useEffect(() => {
    if (initialRequest) {
      const ref = initialRequest.reference || `REQ-${Date.now().toString().slice(-6)}`;
      setDocNumber(docType === 'QUOTATION' ? `JRLC-QT-${ref.replace('REQ-', '')}` : `INV-${ref.replace('REQ-', '')}`);
      setCustomerName(initialRequest.customerName || '');
      setCustomerEmail(initialRequest.email || '');
      setCustomerPhone(initialRequest.phone || '');
      setCustomerAddress(initialRequest.pickupLocation || 'Dublin, Ireland');
      setOrigin(initialRequest.pickupLocation || 'Dublin, Ireland');
      setDestination(initialRequest.destination || 'Lilongwe, Malawi');
      setCargoType(initialRequest.cargoType || 'Commercial Freight');

      if (initialRequest.quotedAmount) {
        setLineItems([
          {
            id: '1',
            description: `${initialRequest.cargoType} Freight Carriage (${initialRequest.pickupLocation} → ${initialRequest.destination})`,
            quantity: initialRequest.quantity || '1 Lot',
            unitPrice: initialRequest.quotedAmount,
            total: initialRequest.quotedAmount
          }
        ]);
      }
      if (initialRequest.currency) setCurrency(initialRequest.currency);
      if (initialRequest.depositPaid) setDepositPaid(initialRequest.depositPaid);
      if (initialRequest.invoiceStatus === 'Paid') setPaymentStatus('Paid');
    } else if (initialShipment) {
      setDocNumber(`INV-${initialShipment.id.replace('JRLC-2026-', '')}`);
      setCustomerName(initialShipment.customerName || 'Shipper');
      setCustomerEmail(initialShipment.customerEmail || '');
      setCustomerPhone(initialShipment.customerPhone || '');
      setCustomerAddress(initialShipment.origin || 'Dublin, Ireland');
      setConsigneeName(initialShipment.consigneeName || 'Consignee in Malawi');
      setConsigneePhone(initialShipment.consigneePhone || '');
      setOrigin(initialShipment.origin || 'Dublin, Ireland');
      setDestination(initialShipment.destination || 'Lilongwe, Malawi');
      setCargoType(initialShipment.cargoType || 'Freight Shipment');
    } else {
      const rand = Math.floor(100000 + Math.random() * 900000);
      setDocNumber(docType === 'QUOTATION' ? `JRLC-QT-${rand}` : `INV-${rand}`);
      if (initialClientName) setCustomerName(initialClientName);
      if (initialClientEmail) setCustomerEmail(initialClientEmail);
      if (initialClientPhone) setCustomerPhone(initialClientPhone);
    }
  }, [initialRequest, initialShipment, initialClientName, initialClientEmail, initialClientPhone, docType]);

  if (!isOpen) return null;

  // Calculations
  const subtotal = lineItems.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
  const discountedSubtotal = Math.max(0, subtotal - (Number(discount) || 0));
  const vatAmount = (discountedSubtotal * (Number(vatRate) || 0)) / 100;
  const totalAmount = discountedSubtotal + vatAmount;
  const balanceDue = Math.max(0, totalAmount - (Number(depositPaid) || 0));

  const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : currency === 'ZAR' ? 'R' : 'MWK ';

  // Line item handlers
  const handleItemChange = (id: string, field: keyof InvoiceLineItem, value: any) => {
    setLineItems(items => items.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'unitPrice') {
        const qtyNum = parseFloat(item.quantity) || 1;
        updated.total = (parseFloat(value) || 0) * (qtyNum > 0 ? qtyNum : 1);
      }
      return updated;
    }));
  };

  const handleAddItem = () => {
    const newItem: InvoiceLineItem = {
      id: Date.now().toString(),
      description: 'Additional Logistics Service / Cargo Item',
      quantity: '1',
      unitPrice: 100,
      total: 100
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(items => items.filter(i => i.id !== id));
  };

  const handleSaveToDatabase = async () => {
    setSaving(true);
    try {
      if (initialRequest?.id) {
        await updateDoc(doc(db, 'requests', initialRequest.id), {
          quotedAmount: totalAmount,
          currency,
          invoiceNumber: docNumber,
          invoiceStatus: paymentStatus === 'Paid' ? 'Paid' : depositPaid > 0 ? 'Partially Paid' : 'Issued',
          depositPaid,
          quoteNotes: notes,
          status: paymentStatus === 'Paid' ? 'Paid' : 'Quoted',
          updatedAt: Date.now()
        });
      }

      // Also persist dedicated invoice record in 'invoices' collection
      const invoiceId = docNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
      await setDoc(doc(db, 'invoices', invoiceId), {
        id: invoiceId,
        invoiceNumber: docNumber,
        docType,
        customerName,
        email: customerEmail,
        phone: customerPhone,
        customerAddress,
        consigneeName,
        consigneePhone,
        origin,
        destination,
        cargoType,
        transitTime,
        lineItems,
        subtotal,
        discount,
        vatRate,
        total: totalAmount,
        depositPaid,
        balanceDue,
        currency,
        issueDate,
        validUntil,
        paymentStatus,
        notes,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      toast.success(`${docType === 'QUOTATION' ? 'Quotation' : 'Invoice'} saved to Firestore database!`);
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save document to database');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getShareableText = () => {
    return `*JR LOGISTICS CONNECTION*\n` +
      `*${docType === 'QUOTATION' ? 'OFFICIAL FREIGHT QUOTATION' : 'COMMERCIAL INVOICE'}*\n` +
      `Reference: ${docNumber}\n` +
      `Client: ${customerName}\n` +
      `Route: ${origin} ➔ ${destination}\n` +
      `Total: ${currencySymbol}${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n` +
      (depositPaid > 0 ? `Deposit Paid: ${currencySymbol}${depositPaid.toLocaleString()}\n` : '') +
      `Balance Due: ${currencySymbol}${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}\n` +
      `Valid/Due: ${validUntil}\n\n` +
      `Payment Options: Bank of Ireland Transfer / Revolut Business / Airtel Money / TNM Mpamba\n` +
      `Phone/WhatsApp: +353 87 123 4567\n` +
      `Web Tracking: https://jrlogistics.example.com/track/${initialRequest?.reference || docNumber}`;
  };

  const handleWhatsAppSend = () => {
    const phone = customerPhone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(getShareableText());
    window.open(`https://wa.me/${phone ? phone : ''}?text=${text}`, '_blank');
  };

  const handleEmailSend = () => {
    const subject = encodeURIComponent(`[${docType === 'QUOTATION' ? 'Quotation' : 'Invoice'}] ${docNumber} - JR Logistics Connection`);
    const body = encodeURIComponent(getShareableText());
    window.open(`mailto:${customerEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/80 backdrop-blur-sm flex justify-center p-2 sm:p-4 md:p-6">
      
      {/* Container with Print CSS rule wrapper */}
      <div className="relative w-full max-w-5xl bg-white border border-editorial-dark shadow-2xl flex flex-col my-auto max-h-[96vh]">
        
        {/* Top Control Bar (Hidden during print) */}
        <div className="print:hidden p-4 bg-editorial-bg border-b border-editorial-dark flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-editorial-dark text-white flex items-center justify-center font-bold font-sans text-sm">
              JR
            </div>
            <div>
              <h2 className="font-sans font-bold text-base text-editorial-dark leading-tight">
                One-Page Document Generator
              </h2>
              <span className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold block">
                JR Logistics Connection • Official Template
              </span>
            </div>
          </div>

          {/* Mode switch */}
          <div className="flex items-center gap-2">
            <div className="inline-flex border border-editorial-dark bg-white p-0.5">
              <button
                type="button"
                onClick={() => setDocType('QUOTATION')}
                className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                  docType === 'QUOTATION' ? 'bg-editorial-dark text-white' : 'text-editorial-dark hover:bg-editorial-bg'
                }`}
              >
                Quote
              </button>
              <button
                type="button"
                onClick={() => setDocType('PROFORMA_INVOICE')}
                className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                  docType === 'PROFORMA_INVOICE' ? 'bg-editorial-dark text-white' : 'text-editorial-dark hover:bg-editorial-bg'
                }`}
              >
                Pro-Forma
              </button>
              <button
                type="button"
                onClick={() => setDocType('COMMERCIAL_INVOICE')}
                className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                  docType === 'COMMERCIAL_INVOICE' ? 'bg-editorial-dark text-white' : 'text-editorial-dark hover:bg-editorial-bg'
                }`}
              >
                Invoice
              </button>
              <button
                type="button"
                onClick={() => setDocType('RECEIPT')}
                className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                  docType === 'RECEIPT' ? 'bg-editorial-dark text-white' : 'text-editorial-dark hover:bg-editorial-bg'
                }`}
              >
                Receipt
              </button>
            </div>

            <div className="inline-flex border border-editorial-dark bg-white p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                  viewMode === 'preview' ? 'bg-editorial-dark text-white' : 'text-editorial-dark'
                }`}
              >
                One-Page View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                  viewMode === 'edit' ? 'bg-editorial-dark text-white' : 'text-editorial-dark'
                }`}
              >
                Edit Fields
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToDatabase}
              disabled={saving}
              className="px-3.5 py-1.5 bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save to DB
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 border border-editorial-dark bg-white text-editorial-dark text-xs uppercase tracking-widest font-bold hover:bg-editorial-bg flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>

            <button
              onClick={handleWhatsAppSend}
              className="px-3 py-1.5 bg-emerald-700 text-white text-xs uppercase tracking-widest font-bold hover:bg-emerald-800 transition-colors flex items-center gap-1.5"
              title="Share to WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp
            </button>

            <button
              onClick={handleEmailSend}
              className="px-3 py-1.5 border border-editorial-dark bg-white text-editorial-dark text-xs uppercase tracking-widest font-bold hover:bg-editorial-bg flex items-center gap-1.5 transition-colors"
              title="Send Email"
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-editorial-muted hover:text-editorial-dark transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-zinc-100 print:bg-white print:p-0">
          
          {/* EDIT FORM MODE */}
          {viewMode === 'edit' && (
            <div className="bg-white border border-editorial-dark p-6 space-y-6 shadow-sm">
              <h3 className="font-sans font-bold text-xl pb-3 border-b border-editorial-dark/20">
                Document Details & Line Items Editor
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Doc Reference #</label>
                  <input
                    type="text"
                    value={docNumber}
                    onChange={e => setDocNumber(e.target.value)}
                    className="w-full border border-editorial-dark py-1.5 px-2 text-xs font-mono uppercase bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full border border-editorial-dark py-1.5 px-2 text-xs font-bold bg-white"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="ZAR">ZAR (R)</option>
                    <option value="MWK">MWK (Kwacha)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={e => setIssueDate(e.target.value)}
                    className="w-full border border-editorial-dark py-1.5 px-2 text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Valid Until / Due</label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                    className="w-full border border-editorial-dark py-1.5 px-2 text-xs bg-white"
                  />
                </div>
              </div>

              {/* Shipper & Consignee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-editorial-dark/10">
                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-widest font-bold text-editorial-dark">Shipper / Bill To</h4>
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full border border-editorial-dark py-1.5 px-2 text-xs bg-white font-semibold"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      className="w-full border border-editorial-dark py-1.5 px-2 text-xs bg-white font-mono"
                    />
                    <input
                      type="text"
                      placeholder="Phone / WhatsApp"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full border border-editorial-dark py-1.5 px-2 text-xs bg-white font-mono"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Pickup / Billing Address (Dublin, Ireland)"
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    className="w-full border border-editorial-dark py-1.5 px-2 text-xs bg-white"
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs uppercase tracking-widest font-bold text-editorial-dark">Consignee / Destination in Malawi</h4>
                  <input
                    type="text"
                    placeholder="Consignee Name"
                    value={consigneeName}
                    onChange={e => setConsigneeName(e.target.value)}
                    className="w-full border border-editorial-dark py-1.5 px-2 text-xs bg-white font-semibold"
                  />
                  <input
                    type="text"
                    placeholder="Consignee Phone (Malawi +265)"
                    value={consigneePhone}
                    onChange={e => setConsigneePhone(e.target.value)}
                    className="w-full border border-editorial-dark py-1.5 px-2 text-xs bg-white font-mono"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Origin Depot (Dublin)"
                      value={origin}
                      onChange={e => setOrigin(e.target.value)}
                      className="w-full border border-editorial-dark py-1.5 px-2 text-xs bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Destination Hub (Lilongwe)"
                      value={destination}
                      onChange={e => setDestination(e.target.value)}
                      className="w-full border border-editorial-dark py-1.5 px-2 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Editor Table */}
              <div className="pt-4 border-t border-editorial-dark/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs uppercase tracking-widest font-bold text-editorial-dark">
                    Itemized Freight Services & Tariffs
                  </h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Quick Category Preset Selector */}
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        
                        // Check if it matches an addon
                        if (val.startsWith('addon_')) {
                          const addonKey = val.replace('addon_', '');
                          const addon = addons[addonKey];
                          if (addon) {
                            const unitPrice = addon.rateEur || addon.minRateEur || 45;
                            setLineItems(prev => [...prev, {
                              id: Date.now().toString(),
                              description: `${addon.name} - ${addon.description}`,
                              quantity: '1 Service',
                              unitPrice,
                              total: unitPrice
                            }]);
                            toast.success(`Added ${addon.name}`);
                          }
                        } else {
                          // Find in categories
                          for (const cat of categories) {
                            const opt = cat.options.find(o => o.id === val);
                            if (opt) {
                              const qtyLabel = opt.pricingType === 'per_kg' ? '50 KG' : opt.pricingType === 'per_cbm' ? '1 CBM' : `1 ${opt.defaultUnit}`;
                              const unitPrice = opt.pricingType === 'per_kg' ? (opt.rateEur * 50) : opt.rateEur;
                              setLineItems(prev => [...prev, {
                                id: Date.now().toString(),
                                description: `${opt.name} (${cat.label} - Dublin ➔ Malawi)`,
                                quantity: qtyLabel,
                                unitPrice: opt.rateEur,
                                total: unitPrice
                              }]);
                              toast.success(`Added ${opt.name}`);
                              break;
                            }
                          }
                        }
                        e.target.value = '';
                      }}
                      className="border border-editorial-dark py-1 px-2 text-[10px] uppercase font-bold bg-editorial-bg cursor-pointer max-w-xs"
                      defaultValue=""
                    >
                      <option value="" disabled>+ Add Categorized Preset...</option>
                      {categories.map(cat => (
                        <optgroup key={cat.id} label={cat.label}>
                          {cat.options.map(opt => (
                            <option key={opt.id} value={opt.id}>
                              {opt.name} (€{opt.rateEur}{opt.pricingType === 'per_kg' ? '/kg' : opt.pricingType === 'per_cbm' ? '/CBM' : ''})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      {Object.entries(addons || {}).filter(([_, a]) => a.enabled).length > 0 && (
                        <optgroup label="🚚 Logistics & Customs Add-Ons">
                          {Object.entries(addons || {})
                            .filter(([_, a]) => a.enabled)
                            .map(([key, addon]) => (
                              <option key={key} value={`addon_${key}`}>
                                {addon.name} (€{addon.rateEur || addon.minRateEur || 40})
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3 py-1 bg-editorial-dark text-white text-[10px] uppercase tracking-widest font-bold hover:bg-editorial-accent flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Custom Line
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {lineItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-editorial-bg/30 p-2 border border-editorial-dark">
                      <input
                        type="text"
                        placeholder="Service Description"
                        value={item.description}
                        onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                        className="flex-1 border border-editorial-dark py-1 px-2 text-xs bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Qty / Lot"
                        value={item.quantity}
                        onChange={e => handleItemChange(item.id, 'quantity', e.target.value)}
                        className="w-28 border border-editorial-dark py-1 px-2 text-xs bg-white font-mono"
                      />
                      <div className="flex items-center gap-1 w-32">
                        <span className="text-xs font-bold text-editorial-muted">{currencySymbol}</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={item.unitPrice}
                          onChange={e => handleItemChange(item.id, 'unitPrice', e.target.value)}
                          className="w-full border border-editorial-dark py-1 px-2 text-xs bg-white font-mono text-right"
                        />
                      </div>
                      <div className="w-24 text-right font-mono font-bold text-xs">
                        {currencySymbol}{item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={lineItems.length <= 1}
                        className="p-1 text-red-600 hover:text-red-800 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Adjustments */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-editorial-dark/10">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Discount / Promotion ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={discount}
                    onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full border border-editorial-dark py-1.5 px-2 text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Deposit Paid / Advance ({currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={depositPaid}
                    onChange={e => setDepositPaid(parseFloat(e.target.value) || 0)}
                    className="w-full border border-editorial-dark py-1.5 px-2 text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Settlement Status</label>
                  <select
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value as any)}
                    className="w-full border border-editorial-dark py-1.5 px-2 text-xs font-bold bg-white"
                  >
                    <option value="Pending">Payment Pending</option>
                    <option value="Partially Paid">Partially Paid (Deposit Received)</option>
                    <option value="Paid">Fully Settled / Paid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Terms & Conditions / Special Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full border border-editorial-dark py-1.5 px-2 text-xs bg-white resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-editorial-dark/10">
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className="px-6 py-2 bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent"
                >
                  Generate One-Page Template Preview →
                </button>
              </div>
            </div>
          )}

          {/* LIVE ONE-PAGE PRINTABLE TEMPLATE (Strictly formatted for 1 A4 page) */}
          <div 
            id="printable-one-page-document" 
            className={`mx-auto bg-white border border-editorial-dark shadow-lg p-8 sm:p-10 max-w-[800px] text-editorial-dark font-sans leading-normal print:shadow-none print:border-none print:m-0 print:p-6 print:max-w-none print:w-full ${
              viewMode === 'edit' ? 'hidden' : 'block'
            }`}
            style={{ minHeight: '1050px', display: viewMode === 'edit' ? 'none' : 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            
            {/* TOP HEADER */}
            <div>
              <div className="flex justify-between items-start pb-6 border-b-2 border-editorial-dark">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-editorial-dark text-white flex items-center justify-center font-sans font-black text-sm">
                      JR
                    </div>
                    <h1 className="text-2xl font-sans font-black tracking-tight text-editorial-dark">
                      JR LOGISTICS CONNECTION
                    </h1>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-editorial-muted">
                    Ireland ⇄ Africa International Freight Forwarding
                  </p>
                  <p className="text-[9px] text-editorial-text mt-1">
                    Company Reg: <strong className="text-editorial-dark">IE 749210-B</strong> • EORI / VAT: <strong className="text-editorial-dark">IE3892014MH</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-3 py-1 border border-editorial-dark font-mono font-bold text-xs uppercase tracking-widest mb-1 ${
                    docType === 'QUOTATION' ? 'bg-editorial-bg text-editorial-dark' : 'bg-editorial-dark text-white'
                  }`}>
                    {docType === 'QUOTATION' ? 'OFFICIAL FREIGHT QUOTE' : docType === 'PROFORMA_INVOICE' ? 'PRO-FORMA INVOICE' : docType === 'RECEIPT' ? 'OFFICIAL RECEIPT' : 'COMMERCIAL INVOICE'}
                  </span>
                  <div className="text-sm font-mono font-bold text-editorial-dark">{docNumber}</div>
                  <div className="text-[10px] text-editorial-muted font-sans">Issue Date: <strong>{issueDate}</strong></div>
                  <div className="text-[10px] text-editorial-muted font-sans">Valid / Due: <strong>{validUntil}</strong></div>
                </div>
              </div>

              {/* COMPANY HUBS & CONTACT STRIP */}
              <div className="grid grid-cols-3 gap-2 py-3 border-b border-editorial-dark text-[9px] bg-editorial-bg/30 px-3 mt-1">
                <div>
                  <strong className="block text-[8px] uppercase tracking-widest text-editorial-muted">Dublin Terminal Hub</strong>
                  Unit 14, Dublin Freight Park, D11, Ireland
                </div>
                <div>
                  <strong className="block text-[8px] uppercase tracking-widest text-editorial-muted">Malawi Hubs</strong>
                  Kanengo Lilongwe & Chirimba Blantyre
                </div>
                <div className="text-right">
                  <strong className="block text-[8px] uppercase tracking-widest text-editorial-muted">Direct Dispatch</strong>
                  +353 87 123 4567 • quotes@jrlogistics.com
                </div>
              </div>

              {/* PARTIES & ROUTING BOX */}
              <div className="grid grid-cols-2 gap-6 py-4 border-b border-editorial-dark text-xs">
                {/* Shipper */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-editorial-muted block">
                    Shipper / Client (Bill To)
                  </span>
                  <h4 className="font-sans font-bold text-sm text-editorial-dark">{customerName || 'Registered Shipper'}</h4>
                  {customerAddress && <p className="text-editorial-text">{customerAddress}</p>}
                  <p className="font-mono text-[11px] text-editorial-dark">
                    {customerPhone && `Tel: ${customerPhone}`} {customerEmail && `• ${customerEmail}`}
                  </p>
                </div>

                {/* Consignee & Route */}
                <div className="space-y-1 bg-editorial-bg/20 p-3 border border-editorial-dark/15">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-editorial-accent">
                      Route & Destination
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-white px-1.5 py-0.5 border border-editorial-dark/20">
                      {cargoType}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-editorial-dark">
                    {origin} <span className="text-editorial-accent">➔</span> {destination}
                  </div>
                  <p className="text-[10px] text-editorial-muted font-sans">
                    Consignee in Malawi: <strong className="text-editorial-dark">{consigneeName || 'Consignee on Arrival'}</strong>
                    {consigneePhone && ` (${consigneePhone})`}
                  </p>
                  <p className="text-[9px] text-editorial-muted">Est. Transit: {transitTime}</p>
                </div>
              </div>

              {/* ITEMIZED CHARGES TABLE */}
              <div className="py-4">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-editorial-dark text-[9px] uppercase tracking-widest font-bold bg-editorial-bg">
                      <th className="py-2 px-3">Item / Service Description</th>
                      <th className="py-2 px-3 text-center w-28">Quantity</th>
                      <th className="py-2 px-3 text-right w-28">Unit Rate</th>
                      <th className="py-2 px-3 text-right w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-editorial-dark/15">
                    {lineItems.map((item, idx) => (
                      <tr key={item.id} className={idx % 2 === 1 ? 'bg-zinc-50' : 'bg-white'}>
                        <td className="py-2 px-3 font-sans text-editorial-dark font-medium">
                          {item.description}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-editorial-text">
                          {item.quantity}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[11px]">
                          {currencySymbol}{item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-editorial-dark">
                          {currencySymbol}{item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* FINANCIAL SUMMARY & TOTALS */}
              <div className="flex justify-end pt-2 border-t border-editorial-dark">
                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-editorial-dark/10 text-editorial-text">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold">{currencySymbol}{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between py-1 border-b border-editorial-dark/10 text-emerald-800">
                      <span>Promotional Discount</span>
                      <span className="font-mono font-semibold">-{currencySymbol}{discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  {vatRate > 0 && (
                    <div className="flex justify-between py-1 border-b border-editorial-dark/10 text-editorial-text">
                      <span>VAT ({vatRate}%)</span>
                      <span className="font-mono">{currencySymbol}{vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-2 border-y-2 border-editorial-dark bg-editorial-bg px-2 font-bold text-sm text-editorial-dark">
                    <span>Total {docType === 'QUOTATION' ? 'Quotation' : 'Invoice'}</span>
                    <span className="font-mono text-base">{currencySymbol}{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>

                  {depositPaid > 0 && (
                    <div className="flex justify-between py-1 border-b border-editorial-dark/10 text-emerald-800 text-xs">
                      <span>Deposit Received</span>
                      <span className="font-mono font-semibold">-{currencySymbol}{depositPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-2 border-b-2 border-editorial-dark bg-editorial-dark text-white px-2 font-bold text-sm">
                    <span>Balance Due</span>
                    <span className="font-mono text-base text-editorial-accent">
                      {currencySymbol}{balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION: PAYMENT INSTRUCTIONS, TERMS & SIGN-OFF */}
            <div className="pt-4 border-t-2 border-editorial-dark mt-4">
              <div className="grid grid-cols-2 gap-6 text-[9px] leading-relaxed">
                
                {/* Payment Channels */}
                <div className="p-3 bg-editorial-bg border border-editorial-dark">
                  <strong className="block uppercase tracking-widest text-[9px] font-bold text-editorial-dark mb-1 flex items-center gap-1">
                    <Receipt className="w-3 h-3 text-editorial-accent" /> Official Payment Channels
                  </strong>
                  <div className="space-y-1 text-editorial-text">
                    {settings?.bankDetails && settings.bankDetails.bankName ? (
                      <p><strong>Bank Wire (Ireland):</strong> {settings.bankDetails.bankName} • Account: <span className="font-mono">{settings.bankDetails.accountName}</span> • IBAN: <span className="font-mono">{settings.bankDetails.iban}</span> • BIC: <span className="font-mono">{settings.bankDetails.bic}</span></p>
                    ) : (
                      <p><strong>Bank Wire (Ireland):</strong> Bank of Ireland • IBAN: <span className="font-mono">IE29 BOFI 9000 1234 5678 90</span> • BIC: <span className="font-mono">BOFIIE2D</span></p>
                    )}
                    <p><strong>Revolut Business / Card:</strong> @jrlogistics • Phone: <span className="font-mono">+353 87 123 4567</span></p>
                    <p><strong>Malawi Kwacha Mobile Money:</strong> Airtel Money / TNM Mpamba: <span className="font-mono">+265 99 123 4567</span></p>
                    <p className="text-[8px] text-editorial-muted mt-0.5">Please quote reference: <strong>{docNumber}</strong> with your transfer.</p>
                  </div>
                </div>

                {/* Regulatory Carriage Terms & Signature Stamp */}
                <div className="flex flex-col justify-between">
                  <div>
                    <strong className="block uppercase tracking-widest text-[9px] font-bold text-editorial-dark mb-1">
                      Terms of Carriage & Liability
                    </strong>
                    <p className="text-editorial-text font-sans text-[8.5px]">
                      {notes}
                    </p>
                  </div>

                  <div className="flex justify-between items-end pt-3 border-t border-editorial-dark/20 mt-2">
                    <div>
                      <div className="font-sans text-xs font-bold text-editorial-dark">JR Logistics Connection</div>
                      <span className="text-[8px] text-editorial-muted uppercase tracking-wider block">Authorized Logistics Dispatch</span>
                    </div>
                    <div className="border border-editorial-dark px-2.5 py-1 text-center bg-white">
                      <span className="text-[7px] uppercase tracking-widest text-emerald-800 font-bold block">Official Seal</span>
                      <span className="text-[9px] font-sans font-black text-editorial-dark">APPROVED</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Micro-footer */}
              <div className="text-center text-[8px] text-editorial-muted uppercase tracking-widest pt-3 mt-2 border-t border-editorial-dark/10">
                JR Logistics Connection • Freight Forwarding • www.jrlogistics.example.com • Dublin • Lilongwe • Blantyre
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
