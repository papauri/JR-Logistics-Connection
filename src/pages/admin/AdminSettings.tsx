import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, Loader2, Info, Plus, Trash2, Package, Building2, MessageSquare, Search, Tag, Sparkles, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import type { SiteSettings, Review } from '../../types';
import AdminFreightPricingManager from '../../components/AdminFreightPricingManager';
import GoogleDriveUploader from '../../components/GoogleDriveUploader';

const defaultSettings: SiteSettings = {
  companyName: 'JR Logistics Connection',
  tradingName: 'JR Logistics Connection',
  registrationNumber: '',
  address: 'Dublin, Ireland',
  phone: '+353 00 000 0000',
  email: 'info@jrlogistics.example.com',
  whatsappNumber: '353000000000',
  collectionStartingPrice: 50,
  currency: '€',
  heroTitle: 'Shipping from Ireland, made simple.',
  heroSubtitle: 'We collect your goods in Dublin, prepare them for shipment and help get your cargo to destinations across Africa, including Malawi.',
  aboutText: '',
  galleryImages: [
    'https://images.unsplash.com/photo-1586528116311-ad8ed7450951?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800'
  ],
  reviews: [
    { text: "JR Logistics made moving my car to Malawi completely painless. They handled all the paperwork and kept me updated at every stage.", author: "Michael T.", location: "Dublin to Lilongwe", published: true },
    { text: "I've been sending barrels to my family for years, but this is the most reliable service I've found. Fast, secure, and great communication.", author: "Sarah M.", location: "Cork to Blantyre", published: true },
    { text: "Excellent service for our commercial equipment. The collection from our warehouse was seamless, and the tracking system is top-notch.", author: "David K.", location: "Galway to Mzuzu", published: true },
    { text: "Highly recommend! The team is professional, friendly, and they genuinely care about making sure your cargo arrives safely.", author: "Grace L.", location: "Dublin to Zomba", published: true }
  ],
  faqs: [
    { id: '1', question: 'How long does shipping to Malawi usually take?', answer: 'Shipping typically takes 6 to 8 weeks depending on vessel schedules and port clearance at destination.', published: true },
    { id: '2', question: 'Do you offer door-to-door collection?', answer: 'Yes, we offer collection from any location in Dublin and most areas in Ireland for an additional fee.', published: true },
    { id: '3', question: 'Are customs duties included in the quote?', answer: 'The quotes provided cover freight charges. Destination customs duties and taxes are payable by the receiver unless stated otherwise.', published: true },
    { id: '4', question: 'Can I track my cargo?', answer: 'Yes, once your cargo is loaded and departs, we provide a tracking number you can use on our website.', published: true }
  ],
  shippingCategories: [
    { id: '1', name: 'General Goods', pricingType: 'per_kg', rateEur: 5.5, rateUsd: 6.0, rateMwk: 10000 },
    { id: '2', name: 'Electronics', pricingType: 'per_kg', rateEur: 8.0, rateUsd: 9.0, rateMwk: 15000 },
    { id: '3', name: 'Large Barrel (200L)', pricingType: 'flat_rate', rateEur: 150, rateUsd: 165, rateMwk: 280000, isBulky: true }
  ],
  seoTitle: 'JR Logistics Connection | Shipping from Ireland to Africa',
  seoDescription: 'Delivering your cargo with care and precision. Specializing in secure, reliable transport from Ireland to destinations across Africa.',
  seoKeywords: 'shipping, logistics, ireland, africa, malawi, transport, cargo, freight',
  bankDetails: {
    bankName: 'Bank of Ireland',
    accountName: 'JR Logistics Connection Ltd',
    iban: 'IE00 BOFI 0000 0000 0000 00',
    bic: 'BOFIIE2D'
  },
  vatEnabled: true,
  vatRate: 23,
  enabledCurrencies: ['EUR', 'USD'],
  updatedAt: Date.now()
};

import { logActivity } from '../../lib/activityLogger';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'pricing' | 'company' | 'content' | 'seo' | 'finance'>('pricing');
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings({ ...defaultSettings, ...docSnap.data() } as SiteSettings);
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = { ...settings, updatedAt: Date.now() };
      await setDoc(doc(db, 'settings', 'global'), dataToSave);
      setSettings(dataToSave);
      
      await logActivity(
        'UPDATE_SETTINGS',
        'global',
        'settings',
        `Updated ${activeTab} settings`
      );

      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleAddReview = () => {
    setSettings(prev => ({
      ...prev,
      reviews: [...prev.reviews, { author: '', location: '', text: '', published: true }]
    }));
  };

  const handleUpdateReview = (index: number, field: keyof Review, value: string | boolean) => {
    const updatedReviews = [...settings.reviews];
    updatedReviews[index] = { ...updatedReviews[index], [field]: value };
    setSettings(prev => ({ ...prev, reviews: updatedReviews }));
  };

  const handleRemoveReview = (index: number) => {
    setSettings(prev => ({
      ...prev,
      reviews: prev.reviews.filter((_, i) => i !== index)
    }));
  };

  const handleAddFaq = () => {
    setSettings(prev => ({
      ...prev,
      faqs: [...(prev.faqs || []), { id: Date.now().toString(), question: '', answer: '', published: true }]
    }));
  };

  const handleUpdateFaq = (index: number, field: keyof typeof defaultSettings.faqs[0], value: string | boolean) => {
    const updatedFaqs = [...(settings.faqs || [])];
    updatedFaqs[index] = { ...updatedFaqs[index], [field]: value };
    setSettings(prev => ({ ...prev, faqs: updatedFaqs }));
  };

  const handleRemoveFaq = (index: number) => {
    setSettings(prev => ({
      ...prev,
      faqs: (prev.faqs || []).filter((_, i) => i !== index)
    }));
  };

  const handleUpdateGalleryImage = (index: number, value: string) => {
    const updatedImages = [...settings.galleryImages];
    updatedImages[index] = value;
    setSettings(prev => ({ ...prev, galleryImages: updatedImages }));
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>;
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Top Header */}
      <div>
        <span className="text-[10px] uppercase tracking-widest font-bold text-editorial-accent block mb-1">
          System Administration
        </span>
        <h1 className="text-3xl font-sans font-bold text-editorial-dark">Business Settings & Pricing Engine</h1>
        <p className="text-editorial-muted text-sm font-sans mt-1">
          Configure live tariffs, customer add-on services, exchange rates, and business details.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-editorial-dark overflow-x-auto bg-white">
        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`px-6 py-3 text-xs uppercase font-bold tracking-widest border-r border-editorial-dark flex items-center gap-2 transition-colors ${
            activeTab === 'pricing'
              ? 'bg-editorial-dark text-white'
              : 'text-editorial-dark hover:bg-editorial-bg'
          }`}
        >
          <Tag className="w-4 h-4 text-editorial-accent" />
          <span>Freight Tariffs & Add-on Prices</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('company')}
          className={`px-6 py-3 text-xs uppercase font-bold tracking-widest border-r border-editorial-dark flex items-center gap-2 transition-colors ${
            activeTab === 'company'
              ? 'bg-editorial-dark text-white'
              : 'text-editorial-dark hover:bg-editorial-bg'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company & Contact</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`px-6 py-3 text-xs uppercase font-bold tracking-widest border-r border-editorial-dark flex items-center gap-2 transition-colors ${
            activeTab === 'content'
              ? 'bg-editorial-dark text-white'
              : 'text-editorial-dark hover:bg-editorial-bg'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Reviews & Gallery</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('finance')}
          className={`px-6 py-3 text-xs uppercase font-bold tracking-widest border-r border-editorial-dark flex items-center gap-2 transition-colors ${
            activeTab === 'finance'
              ? 'bg-editorial-dark text-white'
              : 'text-editorial-dark hover:bg-editorial-bg'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Finance & Billing</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seo')}
          className={`px-6 py-3 text-xs uppercase font-bold tracking-widest flex items-center gap-2 transition-colors ${
            activeTab === 'seo'
              ? 'bg-editorial-dark text-white'
              : 'text-editorial-dark hover:bg-editorial-bg'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>SEO & Meta</span>
        </button>
      </div>

      {/* TAB 1: FREIGHT PRICING & ADD-ONS MANAGER */}
      {activeTab === 'pricing' && (
        <AdminFreightPricingManager />
      )}

      {/* TAB 2: COMPANY & CONTACT */}
      {activeTab === 'company' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white border border-editorial-dark shadow-sm">
            <div className="px-6 py-4 border-b border-editorial-dark bg-editorial-bg/30">
              <h2 className="font-sans font-bold text-lg text-editorial-dark">Company Information & Contact Coordinates</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-editorial-dark mb-1">Company Trading Name</label>
                <input 
                  name="companyName" 
                  value={settings.companyName} 
                  onChange={handleChange} 
                  className="w-full border border-editorial-dark py-2 px-3 text-sm bg-white" 
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-editorial-dark mb-1">Company Registration Number</label>
                <input 
                  name="registrationNumber" 
                  value={settings.registrationNumber} 
                  onChange={handleChange} 
                  className="w-full border border-editorial-dark py-2 px-3 text-sm bg-white font-mono" 
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-editorial-dark mb-1">Contact Email Address</label>
                <input 
                  name="email" 
                  type="email"
                  value={settings.email} 
                  onChange={handleChange} 
                  className="w-full border border-editorial-dark py-2 px-3 text-sm bg-white font-mono" 
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-editorial-dark mb-1">Telephone Line</label>
                <input 
                  name="phone" 
                  value={settings.phone} 
                  onChange={handleChange} 
                  className="w-full border border-editorial-dark py-2 px-3 text-sm bg-white font-mono" 
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-editorial-dark mb-1">WhatsApp Direct Number (e.g. 353890000000)</label>
                <input 
                  name="whatsappNumber" 
                  value={settings.whatsappNumber} 
                  onChange={handleChange} 
                  className="w-full border border-editorial-dark py-2 px-3 text-sm bg-white font-mono" 
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-editorial-dark mb-1">Base Currency Symbol</label>
                <input 
                  name="currency" 
                  value={settings.currency} 
                  onChange={handleChange} 
                  className="w-full border border-editorial-dark py-2 px-3 text-sm bg-white font-bold" 
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-widest font-bold text-editorial-dark mb-1">Physical Depot / Head Office Address</label>
                <textarea 
                  name="address" 
                  value={settings.address} 
                  onChange={handleChange} 
                  rows={2} 
                  className="w-full border border-editorial-dark py-2 px-3 text-sm bg-white resize-none font-sans"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-editorial-dark text-white px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving Changes...' : 'Save Company Details'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: CONTENT & REVIEWS */}
      {activeTab === 'content' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white border border-editorial-dark shadow-sm">
            <div className="px-6 py-4 border-b border-editorial-dark bg-editorial-bg/30">
              <h2 className="font-sans font-bold text-lg text-editorial-dark">Website Gallery & Client Testimonials</h2>
            </div>
            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-xs uppercase tracking-widest font-bold text-editorial-dark mb-4 border-b border-editorial-dark/10 pb-2">
                  Homepage Cargo Gallery
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {settings.galleryImages.map((img, idx) => (
                    <div key={idx} className="flex gap-4 items-start p-3 border border-editorial-dark bg-editorial-bg/10">
                      <img src={img} alt={`Gallery ${idx + 1}`} className="w-16 h-16 object-cover border border-editorial-dark bg-zinc-100" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-muted">Image URL #{idx + 1}</label>
                          <GoogleDriveUploader onUploadSuccess={(url) => handleUpdateGalleryImage(idx, url)} label="Upload to Drive" />
                        </div>
                        <input 
                          type="url" 
                          value={img} 
                          onChange={(e) => handleUpdateGalleryImage(idx, e.target.value)} 
                          className="w-full border border-editorial-dark py-1 px-2 text-xs bg-white font-mono" 
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4 border-b border-editorial-dark/10 pb-2">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-editorial-dark">Client Testimonials & Reviews</h3>
                  <button type="button" onClick={handleAddReview} className="text-[10px] uppercase tracking-widest font-bold text-white bg-editorial-dark px-3 py-1.5 flex items-center gap-1 hover:bg-editorial-accent transition-colors">
                    <Plus className="w-3 h-3" /> Add Review
                  </button>
                </div>
                <div className="space-y-4">
                  {settings.reviews.map((review, idx) => (
                    <div key={idx} className="p-4 border border-editorial-dark relative bg-white space-y-3">
                      <button type="button" onClick={() => handleRemoveReview(idx)} className="absolute top-4 right-4 text-zinc-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" checked={review.published !== false} onChange={(e) => handleUpdateReview(idx, 'published', e.target.checked)} className="w-4 h-4 text-editorial-dark border-editorial-dark focus:ring-editorial-accent" />
                        <label className="text-xs font-bold text-editorial-dark uppercase tracking-widest">Published on Website</label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-8">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-muted mb-1">Customer / Shipper Name</label>
                          <input value={review.author} onChange={(e) => handleUpdateReview(idx, 'author', e.target.value)} className="w-full border border-editorial-dark py-1.5 px-2 text-xs font-bold bg-white" />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-muted mb-1">Route / Hub</label>
                          <input value={review.location} onChange={(e) => handleUpdateReview(idx, 'location', e.target.value)} className="w-full border border-editorial-dark py-1.5 px-2 text-xs bg-white" />
                        </div>
                      </div>
                      <div className="pr-8">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-muted">Optional Image URL</label>
                          <GoogleDriveUploader onUploadSuccess={(url) => handleUpdateReview(idx, 'imageUrl', url)} label="Upload to Drive" />
                        </div>
                        <input value={review.imageUrl || ''} onChange={(e) => handleUpdateReview(idx, 'imageUrl', e.target.value)} className="w-full border border-editorial-dark py-1.5 px-2 text-xs bg-white" placeholder="https://..." />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-muted mb-1">Review Statement</label>
                        <textarea value={review.text} onChange={(e) => handleUpdateReview(idx, 'text', e.target.value)} rows={2} className="w-full border border-editorial-dark py-1.5 px-2 text-xs font-sans bg-white resize-none"></textarea>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4 border-b border-editorial-dark/10 pb-2">
                  <h3 className="text-xs uppercase tracking-widest font-bold text-editorial-dark">Frequently Asked Questions (FAQ)</h3>
                  <button type="button" onClick={handleAddFaq} className="text-[10px] uppercase tracking-widest font-bold text-white bg-editorial-dark px-3 py-1.5 flex items-center gap-1 hover:bg-editorial-accent transition-colors">
                    <Plus className="w-3 h-3" /> Add FAQ
                  </button>
                </div>
                <div className="space-y-4">
                  {(settings.faqs || []).map((faq, idx) => (
                    <div key={idx} className="p-4 border border-editorial-dark relative bg-white space-y-3">
                      <button type="button" onClick={() => handleRemoveFaq(idx)} className="absolute top-4 right-4 text-zinc-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2 mb-2">
                        <input type="checkbox" checked={faq.published !== false} onChange={(e) => handleUpdateFaq(idx, 'published', e.target.checked)} className="w-4 h-4 text-editorial-dark border-editorial-dark focus:ring-editorial-accent" />
                        <label className="text-xs font-bold text-editorial-dark uppercase tracking-widest">Published on Website</label>
                      </div>
                      <div className="pr-8">
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-muted mb-1">Question</label>
                        <input value={faq.question} onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)} className="w-full border border-editorial-dark py-1.5 px-2 text-xs font-bold bg-white" placeholder="e.g. How long does shipping take?" />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-muted mb-1">Answer</label>
                        <textarea value={faq.answer} onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)} rows={2} className="w-full border border-editorial-dark py-1.5 px-2 text-xs font-sans bg-white resize-none" placeholder="Provide a detailed answer..."></textarea>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-editorial-dark text-white px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving Changes...' : 'Save Reviews & Gallery'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: SEO & META */}
      {activeTab === 'seo' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white border border-editorial-dark shadow-sm">
            <div className="px-6 py-4 border-b border-editorial-dark bg-editorial-bg/30">
              <h2 className="font-sans font-bold text-lg text-editorial-dark">Search Engine Optimization (SEO)</h2>
            </div>
            <div className="p-6 grid grid-cols-1 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-editorial-dark mb-1">SEO Title (Browser Tab)</label>
                <input name="seoTitle" value={settings.seoTitle || ''} onChange={handleChange} className="w-full border border-editorial-dark py-2 px-3 text-sm bg-white" placeholder="e.g. JR Logistics Connection | Shipping from Ireland to Africa" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-editorial-dark mb-1">SEO Meta Description</label>
                <textarea name="seoDescription" value={settings.seoDescription || ''} onChange={handleChange} rows={3} className="w-full border border-editorial-dark py-2 px-3 text-sm bg-white resize-none font-sans" placeholder="Brief description for Google search results..."></textarea>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-editorial-dark mb-1">SEO Keywords (Comma-separated)</label>
                <input name="seoKeywords" value={settings.seoKeywords || ''} onChange={handleChange} className="w-full border border-editorial-dark py-2 px-3 text-sm bg-white font-mono" placeholder="shipping, logistics, ireland, malawi, barrels, car transport" />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-editorial-dark text-white px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving SEO...' : 'Save SEO Configuration'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 5: FINANCE & BILLING */}
      {activeTab === 'finance' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white border border-editorial-dark shadow-sm">
            <div className="px-6 py-4 border-b border-editorial-dark bg-editorial-bg/30">
              <h2 className="font-sans font-bold text-lg text-editorial-dark">Bank Details for Invoicing</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-editorial-dark mb-1">Bank Name</label>
                <input 
                  value={settings.bankDetails?.bankName || ''} 
                  onChange={(e) => setSettings(prev => ({ ...prev, bankDetails: { ...(prev.bankDetails || { bankName: '', accountName: '', iban: '', bic: '' }), bankName: e.target.value } }))} 
                  className="w-full border border-editorial-dark py-2 px-3 text-sm bg-white font-sans" 
                  placeholder="e.g. Bank of Ireland" 
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-editorial-dark mb-1">Account Name</label>
                <input 
                  value={settings.bankDetails?.accountName || ''} 
                  onChange={(e) => setSettings(prev => ({ ...prev, bankDetails: { ...(prev.bankDetails || { bankName: '', accountName: '', iban: '', bic: '' }), accountName: e.target.value } }))} 
                  className="w-full border border-editorial-dark py-2 px-3 text-sm bg-white font-sans" 
                  placeholder="e.g. JR Logistics Connection Ltd" 
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-editorial-dark mb-1">IBAN</label>
                <input 
                  value={settings.bankDetails?.iban || ''} 
                  onChange={(e) => setSettings(prev => ({ ...prev, bankDetails: { ...(prev.bankDetails || { bankName: '', accountName: '', iban: '', bic: '' }), iban: e.target.value } }))} 
                  className="w-full border border-editorial-dark py-2 px-3 text-sm bg-white font-mono uppercase" 
                  placeholder="IE00 BOFI 0000 0000 0000 00" 
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest font-bold text-editorial-dark mb-1">BIC / SWIFT</label>
                <input 
                  value={settings.bankDetails?.bic || ''} 
                  onChange={(e) => setSettings(prev => ({ ...prev, bankDetails: { ...(prev.bankDetails || { bankName: '', accountName: '', iban: '', bic: '' }), bic: e.target.value } }))} 
                  className="w-full border border-editorial-dark py-2 px-3 text-sm bg-white font-mono uppercase" 
                  placeholder="BOFIIE2D" 
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-editorial-dark shadow-sm">
            <div className="px-6 py-4 border-b border-editorial-dark bg-editorial-bg/30">
              <h2 className="font-sans font-bold text-lg text-editorial-dark">VAT Configuration</h2>
            </div>
            <div className="p-6 space-y-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.vatEnabled || false} 
                  onChange={(e) => setSettings(prev => ({ ...prev, vatEnabled: e.target.checked }))}
                  className="w-4 h-4 text-editorial-dark focus:ring-0 border-editorial-dark rounded-none"
                />
                <span className="text-sm font-bold text-editorial-dark uppercase tracking-widest">Apply VAT to Quotes & Invoices</span>
              </label>

              {settings.vatEnabled && (
                <div className="w-1/3">
                  <label className="block text-xs uppercase tracking-widest font-bold text-editorial-dark mb-1">VAT Percentage (%)</label>
                  <input 
                    type="number"
                    value={settings.vatRate || 23} 
                    onChange={(e) => setSettings(prev => ({ ...prev, vatRate: Number(e.target.value) }))}
                    className="w-full border border-editorial-dark py-2 px-3 text-sm bg-white font-mono" 
                    placeholder="23"
                  />
                  <p className="text-xs text-editorial-text mt-2">Standard IE VAT rate is 23%. This will be applied as a line item on generation.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-editorial-dark shadow-sm">
            <div className="px-6 py-4 border-b border-editorial-dark bg-editorial-bg/30">
              <h2 className="font-sans font-bold text-lg text-editorial-dark">Supported Currencies</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-editorial-text mb-4">Select which currencies should be available for quoting and invoicing.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['EUR', 'USD', 'GBP', 'ZAR', 'MWK'].map(currency => {
                  const isEnabled = (settings.enabledCurrencies || ['EUR', 'USD']).includes(currency);
                  return (
                    <label key={currency} className="flex items-center gap-3 p-3 border border-editorial-dark/20 cursor-pointer hover:bg-editorial-bg transition-colors">
                      <input 
                        type="checkbox" 
                        checked={isEnabled} 
                        onChange={(e) => {
                          const current = settings.enabledCurrencies || ['EUR', 'USD'];
                          const next = e.target.checked 
                            ? [...current, currency] 
                            : current.filter(c => c !== currency);
                          // Ensure at least one currency is always selected
                          if (next.length === 0) return;
                          setSettings(prev => ({ ...prev, enabledCurrencies: next }));
                        }}
                        className="w-4 h-4 text-editorial-dark focus:ring-0 border-editorial-dark rounded-none"
                      />
                      <span className="text-sm font-bold text-editorial-dark uppercase tracking-widest">{currency}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-editorial-dark text-white px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving Finance Settings...' : 'Save Finance Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

