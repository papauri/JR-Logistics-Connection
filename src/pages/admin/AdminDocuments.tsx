import { useState } from 'react';
import { Search, Filter, Download, FileText, UploadCloud, Folder, File, Trash2, Eye, Truck, User, HardDrive, FilePlus, X, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

// Mock data for documents logically tied to shipments and clients
const mockDocs = [
  { id: 'DOC-001', name: 'Bill of Lading - SHP-88392.pdf', type: 'Customs', relatedTo: 'SHP-88392', entityType: 'shipment', client: 'Malawi Traders Ltd', date: '2024-08-15', size: '2.4 MB', uploadedBy: 'Admin' },
  { id: 'DOC-002', name: 'V5C Logbook - Toyota Hilux.pdf', type: 'Vehicle', relatedTo: 'SHP-88393', entityType: 'shipment', client: 'James Phiri', date: '2024-08-18', size: '1.1 MB', uploadedBy: 'Client Portal' },
  { id: 'DOC-003', name: 'Commercial Invoice - INV-003.pdf', type: 'Finance', relatedTo: 'INV-2024-003', entityType: 'invoice', client: 'Automotive MW', date: '2024-07-20', size: '0.8 MB', uploadedBy: 'Admin' },
  { id: 'DOC-004', name: 'Passport Copy - S. Banda.jpeg', type: 'Identification', relatedTo: 'CLI-092', entityType: 'client', client: 'Sarah Banda', date: '2024-08-19', size: '3.5 MB', uploadedBy: 'Client Portal' },
  { id: 'DOC-005', name: 'Packing List - Container 40ft.pdf', type: 'Logistics', relatedTo: 'SHP-88401', entityType: 'shipment', client: 'Global Importers', date: '2024-08-10', size: '1.2 MB', uploadedBy: 'Admin' },
];

const mockEntities = [
  { id: 'SHP-88392', client: 'Malawi Traders Ltd', type: 'shipment' },
  { id: 'SHP-88393', client: 'James Phiri', type: 'shipment' },
  { id: 'SHP-88401', client: 'Global Importers', type: 'shipment' },
  { id: 'INV-2024-001', client: 'Sarah Banda', type: 'invoice' },
  { id: 'INV-2024-003', client: 'Automotive MW', type: 'invoice' },
  { id: 'CLI-092', client: 'Sarah Banda', type: 'client' },
  { id: 'CLI-095', client: 'John Doe', type: 'client' },
  { id: 'QT-2024-089', client: 'Malawi Traders Ltd', type: 'quote' }
];

export default function AdminDocuments() {
  const [documents, setDocuments] = useState(mockDocs);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  
  // View Document State
  const [viewDoc, setViewDoc] = useState<typeof mockDocs[0] | null>(null);

  // Upload Form State
  const [uploadType, setUploadType] = useState('');
  const [uploadEntityType, setUploadEntityType] = useState('');
  const [uploadEntitySearch, setUploadEntitySearch] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [showEntitySuggestions, setShowEntitySuggestions] = useState(false);
  
  const suggestedEntities = uploadEntitySearch.length > 0 
    ? mockEntities.filter(e => 
        (uploadEntityType === '' || e.type === uploadEntityType) &&
        (e.id.toLowerCase().includes(uploadEntitySearch.toLowerCase()) || 
         e.client.toLowerCase().includes(uploadEntitySearch.toLowerCase()))
      )
    : [];

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.relatedTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || doc.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    if (!acc[doc.relatedTo]) {
      acc[doc.relatedTo] = {
        entityId: doc.relatedTo,
        client: doc.client,
        entityType: doc.entityType,
        docs: []
      };
    }
    acc[doc.relatedTo].docs.push(doc);
    return acc;
  }, {} as Record<string, { entityId: string, client: string, entityType: string, docs: typeof mockDocs }>);

  const toggleGroup = (groupId: string) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      setDocuments(documents.filter(d => d.id !== id));
      toast.success('Document deleted successfully');
    }
  };

  const selectEntity = (entity: typeof mockEntities[0]) => {
    setUploadEntitySearch(entity.id);
    setUploadEntityType(entity.type);
    setShowEntitySuggestions(false);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!uploadType || !uploadEntityType || !uploadEntitySearch) {
      toast.error('Please fill all required fields');
      return;
    }

    const matchedEntity = mockEntities.find(ent => ent.id === uploadEntitySearch) || { client: 'Unknown Client' };

    const newDoc = {
      id: `DOC-00${documents.length + 1}`,
      name: uploadFileName,
      type: uploadType,
      relatedTo: uploadEntitySearch,
      entityType: uploadEntityType,
      client: matchedEntity.client,
      date: new Date().toISOString().split('T')[0],
      size: `${(Math.random() * 4 + 0.1).toFixed(1)} MB`,
      uploadedBy: 'Admin'
    };

    setDocuments([newDoc, ...documents]);
    
    // Reset form
    setUploadType('');
    setUploadEntityType('');
    setUploadEntitySearch('');
    setUploadFileName('');
    setIsUploadModalOpen(false);
    setExpandedGroup(newDoc.relatedTo); // Open the group so they can see it
    toast.success('Document uploaded and linked successfully');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-60px)] md:h-screen overflow-hidden bg-zinc-50">
      <div className="p-6 md:p-12 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-editorial-accent mb-2 block font-bold">Document Management System</span>
              <h1 className="text-3xl font-sans font-bold text-zinc-900">Document Center</h1>
              <p className="text-zinc-500 font-sans text-sm mt-1">Centralized vault for customs, vehicle, and logistics paperwork.</p>
            </div>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-editorial-dark text-white px-6 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors w-full md:w-auto justify-center"
            >
              <FilePlus className="w-4 h-4" /> Upload Document
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 border border-zinc-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Total Documents</span>
                <Folder className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="text-3xl font-sans font-bold">{documents.length}</div>
              <p className="text-xs text-zinc-500 font-medium mt-2 flex items-center gap-1">
                Across all shipments and clients
              </p>
            </div>
            
            <div className="bg-white p-6 border border-zinc-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Storage Used</span>
                <HardDrive className="w-5 h-5 text-zinc-400" />
              </div>
              <div className="text-3xl font-sans font-bold">9.0 MB</div>
              <p className="text-xs text-zinc-500 font-medium mt-2">
                Of 5 GB allocated storage
              </p>
            </div>

            <div className="bg-white p-6 border border-editorial-accent/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-widest text-editorial-accent font-bold">Pending Review</span>
                <FileText className="w-5 h-5 text-editorial-accent" />
              </div>
              <div className="text-3xl font-sans font-bold text-editorial-accent">2</div>
              <p className="text-xs text-editorial-accent font-medium mt-2">
                Uploaded by clients via portal
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search by file name, shipment ID, or client..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 text-sm focus:outline-none focus:border-editorial-dark font-sans"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <select 
                className="bg-white border border-zinc-200 px-4 py-2.5 text-sm focus:outline-none focus:border-editorial-dark font-sans min-w-[150px]"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Document Types</option>
                <option value="customs">Customs Forms</option>
                <option value="vehicle">Vehicle (V5C)</option>
                <option value="finance">Finance / Invoices</option>
                <option value="identification">Identification</option>
                <option value="logistics">Logistics / Packing</option>
              </select>
            </div>
          </div>

          {/* Documents List (Grouped) */}
          <div className="space-y-4">
            {Object.keys(groupedDocs).length > 0 ? (
              Object.values(groupedDocs).map(group => (
                <div key={group.entityId} className="bg-white border border-zinc-200">
                  <div 
                    className="p-4 sm:p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-50 transition-colors"
                    onClick={() => toggleGroup(group.entityId)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="mt-1 p-2 bg-zinc-100 text-zinc-600 rounded-sm">
                        {group.entityType === 'shipment' ? <Truck className="w-5 h-5" /> : 
                         group.entityType === 'client' ? <User className="w-5 h-5" /> : 
                         <FileText className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold font-sans text-editorial-dark text-lg">{group.entityId}</span>
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-sm font-bold bg-zinc-100 text-zinc-600">
                            {group.entityType}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-600">{group.client}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{group.docs.length} Document{group.docs.length > 1 ? 's' : ''}</span>
                      </div>
                      <button className="p-2 text-zinc-400 hover:text-editorial-dark transition-colors">
                        {expandedGroup === group.entityId ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {expandedGroup === group.entityId && (
                    <div className="border-t border-zinc-200 bg-zinc-50/50 p-4 sm:p-6">
                      <div className="space-y-3">
                        {group.docs.map(doc => (
                          <div key={doc.id} className="bg-white border border-zinc-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="p-2 bg-zinc-50 text-zinc-500 rounded-sm">
                                {doc.name.endsWith('.pdf') ? <FileText className="w-4 h-4" /> : <File className="w-4 h-4" />}
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-editorial-dark">{doc.name}</h4>
                                <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                  <span>{doc.type}</span>
                                  <span>•</span>
                                  <span>{doc.size}</span>
                                  <span>•</span>
                                  <span>Uploaded {doc.date}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setViewDoc(doc); }}
                                className="p-2 text-zinc-500 hover:text-editorial-dark bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-200" title="View Document">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-zinc-500 hover:text-editorial-dark bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-200" title="Download">
                                <Download className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                className="p-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 transition-colors border border-red-100" 
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white border border-zinc-200 p-12 text-center">
                <Folder className="w-8 h-8 text-zinc-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold font-sans text-editorial-dark">No documents found</h3>
                <p className="text-sm text-zinc-500 mt-1">Adjust your search or filters, or upload a new document.</p>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsUploadModalOpen(false)}></div>
          <div className="bg-white border border-zinc-200 p-6 sm:p-8 w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-editorial-dark transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold font-sans text-editorial-dark mb-1">Upload Document</h2>
            <p className="text-sm text-zinc-500 mb-6">Securely upload and link documents to shipments or clients.</p>
            
            <form onSubmit={handleUploadSubmit} className="space-y-5">
              
              {/* Drag and drop zone */}
              <div 
                onClick={() => setUploadFileName(uploadFileName ? '' : 'Scanned_Document_v2.pdf')}
                className={`border-2 border-dashed ${uploadFileName ? 'border-editorial-accent bg-editorial-accent/5' : 'border-zinc-200 bg-zinc-50'} p-8 text-center hover:bg-zinc-100 transition-colors cursor-pointer group`}
              >
                {uploadFileName ? (
                  <>
                    <FileText className="w-8 h-8 text-editorial-accent mx-auto mb-3" />
                    <p className="text-sm font-bold text-editorial-dark mb-1">{uploadFileName}</p>
                    <p className="text-xs text-zinc-500">Click to change file</p>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-zinc-400 mx-auto mb-3 group-hover:text-editorial-accent transition-colors" />
                    <p className="text-sm font-bold text-editorial-dark mb-1">Click to browse or drag file here</p>
                    <p className="text-xs text-zinc-500">Supports PDF, JPEG, PNG up to 10MB</p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Document Type</label>
                  <select 
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full bg-white border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-editorial-dark" required>
                    <option value="">Select type...</option>
                    <option value="Customs">Customs Form</option>
                    <option value="Vehicle">Vehicle V5C</option>
                    <option value="Finance">Invoice / Receipt</option>
                    <option value="Identification">Identification</option>
                    <option value="Logistics">Logistics / Packing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Link To (Entity)</label>
                  <select 
                    value={uploadEntityType}
                    onChange={(e) => setUploadEntityType(e.target.value)}
                    className="w-full bg-white border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-editorial-dark" required>
                    <option value="">Select entity...</option>
                    <option value="shipment">Shipment ID</option>
                    <option value="client">Client Profile</option>
                    <option value="invoice">Invoice ID</option>
                    <option value="quote">Quote ID</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">Entity Reference Search</label>
                <input 
                  type="text" 
                  placeholder="Start typing name or ID (e.g. James or SHP-)..." 
                  className="w-full bg-white border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:border-editorial-dark"
                  required
                  value={uploadEntitySearch}
                  onChange={(e) => {
                    setUploadEntitySearch(e.target.value);
                    setShowEntitySuggestions(true);
                  }}
                  onFocus={() => setShowEntitySuggestions(true)}
                />
                
                {/* Autocomplete Suggestions Dropdown */}
                {showEntitySuggestions && suggestedEntities.length > 0 && (
                  <div className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-zinc-200 shadow-xl z-20 max-h-48 overflow-y-auto">
                    {suggestedEntities.map((ent) => (
                      <div 
                        key={ent.id} 
                        className="px-3 py-2 hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 last:border-b-0"
                        onClick={() => selectEntity(ent)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm font-sans text-editorial-dark">{ent.id}</span>
                          <span className="text-[10px] uppercase text-zinc-500">{ent.type}</span>
                        </div>
                        <p className="text-xs text-zinc-500 mt-0.5">{ent.client}</p>
                      </div>
                    ))}
                  </div>
                )}
                {showEntitySuggestions && uploadEntitySearch.length > 0 && suggestedEntities.length === 0 && (
                  <div className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-zinc-200 shadow-xl z-20 px-3 py-2 text-sm text-zinc-500">
                    No matching records found.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-editorial-dark text-white px-6 py-2 text-sm font-bold hover:bg-zinc-800 transition-colors"
                >
                  Upload & Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {viewDoc && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewDoc(null)}></div>
          <div className="bg-white border border-zinc-200 w-full max-w-4xl h-[80vh] relative z-10 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-4 border-b border-zinc-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-100 text-zinc-600 rounded-sm">
                  {viewDoc.name.endsWith('.pdf') ? <FileText className="w-5 h-5" /> : <File className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold font-sans text-editorial-dark leading-tight">{viewDoc.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500 mt-1">
                    <span>{viewDoc.type}</span>
                    <span>•</span>
                    <span>Linked to {viewDoc.relatedTo}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-zinc-500 hover:text-editorial-dark bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-200" title="Download">
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewDoc(null)}
                  className="p-2 text-zinc-400 hover:text-editorial-dark transition-colors border border-transparent"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-zinc-100 p-8 flex items-center justify-center overflow-auto">
              <div className="bg-white shadow-sm border border-zinc-200 w-full max-w-2xl h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12">
                {viewDoc.name.endsWith('.pdf') ? (
                  <>
                    <FileText className="w-16 h-16 text-zinc-300 mb-4" />
                    <h4 className="text-lg font-bold font-sans text-zinc-700">PDF Preview Not Available</h4>
                    <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                      This is a secure document viewer. In production, this would render the PDF canvas directly in the browser or via a secure signed URL.
                    </p>
                  </>
                ) : (
                  <>
                    <File className="w-16 h-16 text-zinc-300 mb-4" />
                    <h4 className="text-lg font-bold font-sans text-zinc-700">Image Preview Not Available</h4>
                    <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                      This is a secure image viewer. In production, this would display the JPEG/PNG via a secure signed URL.
                    </p>
                  </>
                )}
                
                <button className="mt-8 bg-editorial-dark text-white px-6 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-zinc-800 transition-colors">
                  <Download className="w-4 h-4" /> Download Original File
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
