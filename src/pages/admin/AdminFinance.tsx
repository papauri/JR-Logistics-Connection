import { useState, useEffect } from 'react';
import { Search, Filter, Download, ArrowUpRight, DollarSign, Clock, CheckCircle2, AlertCircle, ChevronRight, FileText, X, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../lib/utils';
import toast from 'react-hot-toast';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { SiteSettings } from '../../types';

// Mock data for finance invoices
const mockInvoices = [
  { 
    id: 'INV-2024-001', client: 'Malawi Traders Ltd', amount: 4500, currency: 'GBP', date: '2024-08-15', dueDate: '2024-08-30', status: 'paid', type: 'Container Shipping',
    email: 'billing@malawitraders.com', phone: '+265 99 123 4567',
    items: [
      { description: '20ft Container Transport (Dublin to Lilongwe)', amount: 4000 },
      { description: 'Customs Clearance Agent Fee', amount: 500 }
    ]
  },
  { 
    id: 'INV-2024-002', client: 'James Phiri', amount: 35000, currency: 'ZAR', date: '2024-08-18', dueDate: '2024-09-02', status: 'pending', type: 'Vehicle Clearance',
    email: 'james.phiri@example.com', phone: '+265 88 765 4321',
    items: [
      { description: 'Vehicle Clearance (Songwe Border)', amount: 25000 },
      { description: 'Direct Vehicle Delivery (Mzuzu)', amount: 10000 }
    ]
  },
  { 
    id: 'INV-2024-003', client: 'Automotive MW', amount: 10500, currency: 'USD', date: '2024-07-20', dueDate: '2024-08-05', status: 'overdue', type: 'Groupage Freight',
    email: 'accounts@automotivemw.com', phone: '+265 99 333 4444',
    items: [
      { description: 'Groupage Freight - 4 Vehicles (RoRo)', amount: 9000 },
      { description: 'Port Handling & Documentation', amount: 1500 }
    ]
  },
  { 
    id: 'INV-2024-004', client: 'Sarah Banda', amount: 950, currency: 'EUR', date: '2024-08-19', dueDate: '2024-09-03', status: 'pending', type: 'Express Air Freight',
    email: 'sarah.banda@example.com', phone: '+265 88 111 2222',
    items: [
      { description: 'Express Air Freight (50kg)', amount: 850 },
      { description: 'Home Delivery (Lilongwe)', amount: 100 }
    ]
  },
  { 
    id: 'INV-2024-005', client: 'Global Importers', amount: 12000, currency: 'GBP', date: '2024-08-10', dueDate: '2024-08-25', status: 'paid', type: 'Container Shipping',
    email: 'finance@globalimporters.mw', phone: '+265 99 888 7777',
    items: [
      { description: '40ft HC Container (Dublin to Blantyre)', amount: 10000 },
      { description: 'Full Customs Clearance Package', amount: 1500 },
      { description: 'Insurance Coverage', amount: 500 }
    ]
  },
];

export default function AdminFinance() {
  const [invoices, setInvoices] = useState(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<typeof mockInvoices[0] | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

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
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || inv.status === filter;
    return matchesSearch && matchesFilter;
  });

  const totalOutstanding = invoices.filter(i => i.status !== 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const totalCollected = invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;

  const handleSendReminder = (id: string) => {
    toast.success(`Payment reminder sent to client for invoice ${id}`);
  };

  const handleMarkAsPaid = (id: string) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: 'paid' } : inv));
    toast.success(`Invoice ${id} marked as paid`);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-60px)] md:h-screen overflow-hidden bg-zinc-50">
      <div className="p-6 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-editorial-accent mb-2 block font-bold">Financial Operations</span>
              <h1 className="text-3xl font-sans font-bold text-zinc-900">Finance & Collections</h1>
              <p className="text-zinc-500 font-sans text-sm mt-1">Manage payments, invoices, and automated follow-ups.</p>
            </div>
            <button className="bg-editorial-dark text-white px-6 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors w-full md:w-auto justify-center">
              <FileText className="w-4 h-4" /> Generate Invoice
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 border border-zinc-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Total Collected</span>
                <DollarSign className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="text-3xl font-sans font-bold">£{totalCollected.toLocaleString()}</div>
              <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> +12% from last month
              </p>
            </div>
            
            <div className="bg-white p-6 border border-zinc-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Outstanding Balance</span>
                <Clock className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="text-3xl font-sans font-bold">£{totalOutstanding.toLocaleString()}</div>
              <p className="text-xs text-zinc-500 font-medium mt-2">
                Across {invoices.filter(i => i.status !== 'paid').length} pending invoices
              </p>
            </div>

            <div className="bg-white p-6 border border-editorial-accent/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest text-editorial-accent font-bold">Overdue Invoices</span>
                <AlertCircle className="w-5 h-5 text-editorial-accent" />
              </div>
              <div className="text-3xl font-sans font-bold text-editorial-accent">{overdueCount}</div>
              <p className="text-xs text-editorial-accent font-medium mt-2">
                Requires immediate follow-up
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search by invoice ID or client name..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 text-sm focus:outline-none focus:border-editorial-dark font-sans"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="bg-white border border-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:border-editorial-dark font-sans min-w-[150px]"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
              <button className="bg-white border border-zinc-200 px-4 py-2.5 text-zinc-600 hover:bg-zinc-50 transition-colors" title="Export to CSV">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white border border-zinc-200">
            {filteredInvoices.length > 0 ? (
              <div className="divide-y divide-zinc-100">
                {filteredInvoices.map(invoice => (
                  <div 
                    key={invoice.id} 
                    onClick={() => setSelectedInvoice(invoice)}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`mt-1 p-2 rounded-sm ${
                        invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {invoice.status === 'paid' ? <CheckCircle2 className="w-4 h-4" /> : 
                         invoice.status === 'overdue' ? <AlertCircle className="w-4 h-4" /> : 
                         <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold font-sans text-editorial-dark">{invoice.id}</span>
                          <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm font-bold ${
                            invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-zinc-900">{invoice.client}</p>
                        <p className="text-xs text-zinc-500 mt-1">{invoice.type} • Billed on {invoice.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto">
                      <div className="text-left sm:text-right">
                        <span className="block text-xs uppercase tracking-widest text-zinc-400 mb-1">Amount</span>
                        <span className="text-lg font-bold text-editorial-dark">{formatCurrency(invoice.amount, invoice.currency)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {invoice.status !== 'paid' && (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleSendReminder(invoice.id); }}
                              className="text-xs font-bold text-editorial-accent bg-editorial-accent/10 hover:bg-editorial-accent/20 px-3 py-2 transition-colors border border-editorial-accent/20"
                            >
                              Remind
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(invoice.id); }}
                              className="text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-3 py-2 transition-colors border border-zinc-200"
                            >
                              Mark Paid
                            </button>
                          </>
                        )}
                        <button className="p-2 text-zinc-400 hover:text-editorial-dark transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <DollarSign className="w-8 h-8 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold font-sans text-editorial-dark">No invoices found</h3>
                <p className="text-sm text-zinc-500 mt-1">Adjust your search or filters to see more results.</p>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* Invoice Details Drawer */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedInvoice(null)}
          />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-editorial-dark" />
                <h2 className="text-xl font-bold font-sans text-editorial-dark">Invoice Details</h2>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="p-2 text-zinc-400 hover:text-editorial-dark hover:bg-zinc-200 rounded-sm transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold font-sans">{selectedInvoice.id}</h3>
                  <p className="text-sm text-zinc-500 mt-1">{selectedInvoice.type}</p>
                </div>
                <span className={`text-xs uppercase tracking-widest px-3 py-1 rounded-sm font-bold ${
                  selectedInvoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                  selectedInvoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {selectedInvoice.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8 bg-zinc-50 p-4 border border-zinc-200">
                <div>
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Billed To</span>
                  <p className="font-bold text-sm text-editorial-dark">{selectedInvoice.client}</p>
                  <p className="text-xs text-zinc-600 mt-1 flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedInvoice.email}</p>
                  <p className="text-xs text-zinc-600 mt-1">{selectedInvoice.phone}</p>
                </div>
                <div>
                  <div className="mb-3">
                    <span className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Date of Issue</span>
                    <p className="text-sm font-medium">{selectedInvoice.date}</p>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Due Date</span>
                    <p className={`text-sm font-medium ${selectedInvoice.status === 'overdue' ? 'text-red-600' : ''}`}>
                      {selectedInvoice.dueDate}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <span className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4 border-b border-zinc-200 pb-2">Line Items</span>
                <div className="space-y-4">
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-zinc-700">{item.description}</span>
                      <span className="font-medium text-zinc-900">{formatCurrency(item.amount, selectedInvoice.currency)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-200 space-y-3">
                  {settings?.vatEnabled ? (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-500 font-bold">Subtotal</span>
                        <span className="font-medium text-zinc-900">{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-zinc-500 font-bold">VAT ({settings.vatRate || 23}%)</span>
                        <span className="font-medium text-zinc-900">{formatCurrency(selectedInvoice.amount * ((settings.vatRate || 23) / 100), selectedInvoice.currency)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-zinc-100">
                        <span className="font-bold text-editorial-dark">Total Amount</span>
                        <span className="text-2xl font-bold font-sans text-editorial-dark">
                          {formatCurrency(selectedInvoice.amount * (1 + (settings.vatRate || 23) / 100), selectedInvoice.currency)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-editorial-dark">Total Amount</span>
                      <span className="text-2xl font-bold font-sans text-editorial-dark">{formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}</span>
                    </div>
                  )}
                </div>
              </div>

              {settings?.bankDetails && settings.bankDetails.bankName && (
                <div className="mb-8 bg-zinc-50 p-4 border border-zinc-200">
                  <span className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-3">Bank Transfer Details</span>
                  <div className="space-y-1 text-sm font-sans">
                    <p><span className="text-zinc-500 w-24 inline-block">Bank:</span> <strong className="text-editorial-dark">{settings.bankDetails.bankName}</strong></p>
                    <p><span className="text-zinc-500 w-24 inline-block">Account:</span> <strong className="text-editorial-dark">{settings.bankDetails.accountName}</strong></p>
                    <p><span className="text-zinc-500 w-24 inline-block">IBAN:</span> <strong className="text-editorial-dark font-mono">{settings.bankDetails.iban}</strong></p>
                    <p><span className="text-zinc-500 w-24 inline-block">BIC/SWIFT:</span> <strong className="text-editorial-dark font-mono">{settings.bankDetails.bic}</strong></p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-zinc-200 bg-zinc-50 flex gap-3">
              {selectedInvoice.status !== 'paid' && (
                <>
                  <button 
                    onClick={() => {
                      handleMarkAsPaid(selectedInvoice.id);
                      setSelectedInvoice({ ...selectedInvoice, status: 'paid' });
                    }}
                    className="flex-1 bg-zinc-900 text-white px-4 py-3 text-sm font-bold hover:bg-zinc-800 transition-colors"
                  >
                    Mark as Paid
                  </button>
                  <button 
                    onClick={() => handleSendReminder(selectedInvoice.id)}
                    className="flex-1 bg-white border border-editorial-accent text-editorial-accent px-4 py-3 text-sm font-bold hover:bg-editorial-accent/5 transition-colors"
                  >
                    Send Reminder
                  </button>
                </>
              )}
              {selectedInvoice.status === 'paid' && (
                <button className="flex-1 bg-white border border-zinc-300 text-zinc-700 px-4 py-3 text-sm font-bold hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Download Receipt
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
