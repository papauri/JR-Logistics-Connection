import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { 
  getOrSeedLegalDocuments, 
  saveLegalDocument, 
  DEFAULT_LEGAL_DOCUMENTS 
} from '../../data/defaultLegalDocs';
import type { LegalDocument } from '../../types';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';
import { 
  Save, 
  Loader2, 
  FileText, 
  Eye, 
  Edit3, 
  RotateCcw, 
  CheckCircle2, 
  Plus, 
  Trash2,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminLegal() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('');
  const [version, setVersion] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [summaryPoints, setSummaryPoints] = useState<string[]>([]);
  const [content, setContent] = useState('');

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await getOrSeedLegalDocuments();
      setDocuments(docs);
      if (docs.length > 0) {
        selectDocument(docs[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load legal agreements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const selectDocument = (docItem: LegalDocument) => {
    setSelectedDoc(docItem);
    setTitle(docItem.title);
    setSubtitle(docItem.subtitle);
    setCategory(docItem.category);
    setVersion(docItem.version);
    setLastUpdated(docItem.lastUpdated);
    setSummaryPoints(docItem.summaryPoints || []);
    setContent(docItem.content);
  };

  const handleAddSummaryPoint = () => {
    setSummaryPoints(prev => [...prev, '']);
  };

  const handleUpdateSummaryPoint = (idx: number, val: string) => {
    setSummaryPoints(prev => {
      const updated = [...prev];
      updated[idx] = val;
      return updated;
    });
  };

  const handleRemoveSummaryPoint = (idx: number) => {
    setSummaryPoints(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;

    setSaving(true);
    try {
      const updatedDoc: LegalDocument = {
        ...selectedDoc,
        title,
        subtitle,
        category,
        version,
        lastUpdated,
        summaryPoints: summaryPoints.filter(p => p.trim().length > 0),
        content,
        updatedAt: Date.now()
      };

      await saveLegalDocument(updatedDoc);

      setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
      setSelectedDoc(updatedDoc);
      toast.success(`"${updatedDoc.title}" saved successfully`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (!selectedDoc) return;
    const defaultDoc = DEFAULT_LEGAL_DOCUMENTS.find(d => d.id === selectedDoc.id);
    if (!defaultDoc) return;

    if (confirm(`Reset "${selectedDoc.title}" to standard baseline clauses? You must click "Save Changes" afterwards to commit.`)) {
      setTitle(defaultDoc.title);
      setSubtitle(defaultDoc.subtitle);
      setCategory(defaultDoc.category);
      setVersion(defaultDoc.version);
      setLastUpdated(defaultDoc.lastUpdated);
      setSummaryPoints(defaultDoc.summaryPoints);
      setContent(defaultDoc.content);
      toast('Baseline restored. Click "Save Changes" to apply.', { icon: 'ℹ️' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-editorial-dark" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-zinc-900">Legal Documents & Terms Manager</h1>
          <p className="text-zinc-500 font-serif text-sm mt-1">
            Manage shipping terms of carriage, customs compliance policies, liability limits, and GDPR agreements.
          </p>
        </div>

        {selectedDoc && (
          <Link
            to={`/legal/${selectedDoc.id}`}
            target="_blank"
            className="border border-zinc-300 bg-white text-zinc-700 px-4 py-2 text-xs uppercase tracking-widest font-bold hover:bg-zinc-50 transition-colors inline-flex items-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Public Page
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Document Selector Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs uppercase font-bold tracking-widest text-zinc-500 block px-1">
            Select Legal Document ({documents.length})
          </span>
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-100 shadow-sm">
            {documents.map((docItem) => {
              const isSelected = selectedDoc?.id === docItem.id;
              return (
                <button
                  key={docItem.id}
                  onClick={() => selectDocument(docItem)}
                  className={`w-full text-left p-4 transition-colors flex items-start gap-3 ${
                    isSelected ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50 text-zinc-800'
                  }`}
                >
                  <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-editorial-accent' : 'text-zinc-400'}`} />
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-sm block truncate">{docItem.title}</span>
                    <span className={`text-[11px] block truncate ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                      {docItem.category} • {docItem.version}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Enforceability Notice</span>
            </div>
            <p className="leading-relaxed">
              Updates made here immediately reflect on public legal URLs, quote request confirmations, and tracking portals across the application.
            </p>
          </div>
        </div>

        {/* Document Editor Form */}
        {selectedDoc && (
          <div className="lg:col-span-8 bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
            <form onSubmit={handleSave}>
              {/* Form Toolbar */}
              <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-zinc-200 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                      activeTab === 'edit' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                      activeTab === 'preview' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Live Preview
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 font-semibold flex items-center gap-1"
                    title="Restore standard baseline text"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Default
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-zinc-900 text-white px-5 py-2 rounded-lg text-xs uppercase tracking-widest font-bold hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-xs"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                {activeTab === 'edit' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                          Document Title
                        </label>
                        <input
                          value={title}
                          onChange={e => setTitle(e.target.value)}
                          required
                          className="w-full rounded-lg border-zinc-200 text-sm font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                          Category
                        </label>
                        <input
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                          required
                          className="w-full rounded-lg border-zinc-200 text-sm"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                          Subtitle / Scope
                        </label>
                        <input
                          value={subtitle}
                          onChange={e => setSubtitle(e.target.value)}
                          className="w-full rounded-lg border-zinc-200 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                          Version Tag
                        </label>
                        <input
                          value={version}
                          onChange={e => setVersion(e.target.value)}
                          placeholder="e.g. v2.4"
                          className="w-full rounded-lg border-zinc-200 text-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                          Effective Date String
                        </label>
                        <input
                          value={lastUpdated}
                          onChange={e => setLastUpdated(e.target.value)}
                          placeholder="e.g. February 2026"
                          className="w-full rounded-lg border-zinc-200 text-sm"
                        />
                      </div>
                    </div>

                    {/* Executive Summary Points */}
                    <div className="pt-4 border-t border-zinc-100">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                          Summary Highlights (Shown on top of public page)
                        </label>
                        <button
                          type="button"
                          onClick={handleAddSummaryPoint}
                          className="text-xs font-bold text-zinc-900 bg-zinc-100 px-3 py-1 rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Highlight
                        </button>
                      </div>

                      <div className="space-y-2">
                        {summaryPoints.map((pt, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              value={pt}
                              onChange={e => handleUpdateSummaryPoint(idx, e.target.value)}
                              placeholder={`Highlight #${idx + 1}`}
                              className="flex-1 rounded-lg border-zinc-200 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveSummaryPoint(idx)}
                              className="text-zinc-400 hover:text-red-500 p-1.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Markdown Body */}
                    <div className="pt-4 border-t border-zinc-100">
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                        Full Legal Markdown Content
                      </label>
                      <p className="text-xs text-zinc-500 mb-2">
                        Supports Markdown headings (##), bullet points (-), bold text (**text**), and numbered lists.
                      </p>
                      <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={16}
                        required
                        className="w-full font-mono text-xs rounded-lg border-zinc-200 p-4 leading-relaxed resize-y"
                      ></textarea>
                    </div>
                  </>
                ) : (
                  /* LIVE PREVIEW TAB */
                  <div className="bg-zinc-50 p-8 border border-zinc-200 rounded-xl space-y-6">
                    <div className="border-b border-zinc-200 pb-4">
                      <span className="text-xs uppercase font-bold text-zinc-500">{category} • {version}</span>
                      <h2 className="text-2xl font-serif font-bold text-zinc-900 mt-1">{title}</h2>
                      <p className="text-zinc-600 italic text-sm">{subtitle}</p>
                    </div>

                    {summaryPoints.length > 0 && (
                      <div className="p-4 bg-white border border-zinc-200 rounded-lg">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 block mb-2">Summary Highlights:</span>
                        <ul className="space-y-1 text-xs text-zinc-700">
                          {summaryPoints.map((pt, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="prose prose-zinc max-w-none text-sm leading-relaxed">
                      <Markdown>{content}</Markdown>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
