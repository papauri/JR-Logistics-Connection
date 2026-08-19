import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { getOrSeedLegalDocuments } from '../data/defaultLegalDocs';
import type { LegalDocument } from '../types';
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Scale, 
  Warehouse, 
  Lock, 
  Clock, 
  CheckCircle2,
  ChevronRight,
  Printer
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  'shipping-terms': Scale,
  'customs-prohibited': AlertTriangle,
  'insurance-liability': ShieldCheck,
  'storage-collection': Warehouse,
  'privacy-policy': Lock,
};

export default function PublicLegal() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [activeDoc, setActiveDoc] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocs = async () => {
      setLoading(true);
      try {
        const docs = await getOrSeedLegalDocuments();
        setDocuments(docs);

        const currentSlug = slug || 'shipping-terms';
        const found = docs.find(d => d.id === currentSlug) || docs[0];
        setActiveDoc(found);
      } catch (err) {
        console.error('Failed to load legal docs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDocs();
  }, [slug]);

  const handleSelectDoc = (docId: string) => {
    navigate(`/legal/${docId}`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-editorial-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-editorial-dark border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-serif text-sm text-editorial-text">Loading regulatory agreements...</p>
        </div>
      </div>
    );
  }

  const IconComponent = activeDoc ? (ICON_MAP[activeDoc.id] || FileText) : FileText;

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-dark py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Page Header */}
        <div className="border-b border-editorial-dark pb-8 mb-12">
          <span className="text-[10px] uppercase tracking-[0.3em] text-editorial-accent font-bold block mb-2">
            Governance & Regulatory Agreements
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight mb-3">
            Legal & Shipping Terms.
          </h1>
          <p className="text-editorial-text font-serif text-lg max-w-3xl">
            Official carriage terms, customs compliance, carrier liability limitations, and data protection standards governing Ireland to Africa maritime and overland freight.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Document Navigation Sidebar */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold block mb-3 px-2">
              Statutory Agreements ({documents.length})
            </span>
            <div className="space-y-1.5 bg-white border border-editorial-dark p-2 shadow-sm">
              {documents.map((docItem) => {
                const isActive = activeDoc?.id === docItem.id;
                const DocIcon = ICON_MAP[docItem.id] || FileText;

                return (
                  <button
                    key={docItem.id}
                    onClick={() => handleSelectDoc(docItem.id)}
                    className={`w-full text-left p-4 transition-all flex items-center justify-between border ${
                      isActive 
                        ? 'border-editorial-dark bg-editorial-bg font-bold shadow-sm' 
                        : 'border-transparent hover:bg-zinc-50 hover:border-editorial-dark/20 text-editorial-text'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`p-2 rounded-none border ${isActive ? 'bg-editorial-dark text-white border-editorial-dark' : 'bg-editorial-bg border-editorial-dark/20 text-editorial-dark'}`}>
                        <DocIcon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs uppercase tracking-wider block truncate font-sans text-editorial-dark">
                          {docItem.title}
                        </span>
                        <span className="text-[10px] text-editorial-muted font-mono block">
                          {docItem.version} • {docItem.lastUpdated}
                        </span>
                      </div>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-editorial-dark shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Quick Contact Box */}
            <div className="p-6 bg-editorial-dark text-white border border-editorial-dark mt-6">
              <span className="text-[9px] uppercase tracking-widest text-editorial-accent font-bold block mb-1">
                Legal & Compliance Inquiries
              </span>
              <h4 className="font-serif font-bold text-lg mb-2">Need Contract Clarification?</h4>
              <p className="text-xs text-zinc-300 font-serif leading-relaxed mb-4">
                For questions regarding high-value marine insurance, dangerous goods declaration, or commercial charters, contact our compliance desk.
              </p>
              <a 
                href="mailto:compliance@jrlogistics.example.com"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-bold text-editorial-accent hover:text-white transition-colors"
              >
                Email Compliance Desk →
              </a>
            </div>
          </div>

          {/* Document Content View */}
          {activeDoc && (
            <div className="lg:col-span-8 bg-white border border-editorial-dark shadow-sm">
              {/* Document Banner */}
              <div className="p-8 lg:p-10 border-b border-editorial-dark bg-editorial-bg/30">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-editorial-dark text-white text-[9px] uppercase font-bold tracking-widest">
                      {activeDoc.category}
                    </span>
                    <span className="text-xs text-editorial-muted font-mono">
                      Edition: <strong>{activeDoc.version}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-editorial-muted font-serif flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Effective: {activeDoc.lastUpdated}
                    </span>
                    <button
                      onClick={handlePrint}
                      className="p-1.5 border border-editorial-dark/30 hover:border-editorial-dark text-editorial-dark hover:bg-white transition-colors"
                      title="Print Document"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-editorial-dark mb-2">
                  {activeDoc.title}
                </h2>
                <p className="text-editorial-text font-serif text-base">
                  {activeDoc.subtitle}
                </p>

                {/* Summary Key Highlights Box */}
                {activeDoc.summaryPoints && activeDoc.summaryPoints.length > 0 && (
                  <div className="mt-8 p-6 bg-white border border-editorial-dark">
                    <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold block mb-3">
                      Executive Summary & Key Clauses:
                    </span>
                    <div className="space-y-2.5">
                      {activeDoc.summaryPoints.map((pt, i) => (
                        <div key={i} className="flex items-start gap-2.5 text-xs text-editorial-dark font-sans leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-editorial-accent shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Full Markdown Body */}
              <div className="p-8 lg:p-12 text-editorial-dark leading-relaxed font-serif text-base">
                <div className="prose prose-zinc max-w-none prose-headings:font-serif prose-headings:font-bold prose-h2:text-2xl prose-h2:border-b prose-h2:border-editorial-dark/10 prose-h2:pb-2 prose-h2:mt-8 prose-h2:mb-4 prose-p:text-editorial-text prose-p:mb-4 prose-li:text-editorial-text prose-li:mb-1">
                  <Markdown>{activeDoc.content}</Markdown>
                </div>
              </div>

              {/* Footer acknowledgement */}
              <div className="p-6 bg-editorial-bg border-t border-editorial-dark flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <span className="text-editorial-muted font-serif">
                  By engaging JR Logistics Connection services, shippers and consignees consent to these conditions.
                </span>
                <Link
                  to="/quote"
                  className="px-5 py-2.5 bg-editorial-dark text-white uppercase tracking-widest font-bold text-[11px] hover:bg-editorial-accent hover:text-editorial-dark transition-colors shrink-0"
                >
                  Request Freight Quote →
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
