import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FormEvent } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, getDocs, doc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { 
  Search, 
  Loader2, 
  Plus, 
  Truck, 
  Package, 
  MapPin, 
  CheckSquare, 
  Square, 
  Layers, 
  Sparkles, 
  SlidersHorizontal, 
  Trash2, 
  BookOpen, 
  CheckCircle2, 
  X,
  Send,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import type { Shipment, ShipmentEvent, ShipmentStatus, TrackingTemplate } from '../../types';
import toast from 'react-hot-toast';
import ShipmentHistory from '../../components/ShipmentHistory';
import { 
  getOrSeedTemplates, 
  createTrackingTemplate, 
  deleteTrackingTemplate 
} from '../../data/defaultTemplates';

const ALL_STATUSES: ShipmentStatus[] = [
  'Booking Received', 
  'Cargo Received', 
  'Warehouse Processing', 
  'Shipped', 
  'In Transit', 
  'Arrived', 
  'Ready for Collection', 
  'Delivered', 
  'Delayed', 
  'Exception'
];

export default function AdminShipments() {
  const [searchParams] = useSearchParams();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Template Data Store State
  const [templates, setTemplates] = useState<TrackingTemplate[]>([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [selectedTemplateForForm, setSelectedTemplateForForm] = useState<TrackingTemplate | null>(null);

  // Quick form state for Single Update
  const [eventStatus, setEventStatus] = useState<ShipmentStatus>('In Transit');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventIsPublic, setEventIsPublic] = useState(true);

  // Bulk form state
  const [bulkStatus, setBulkStatus] = useState<ShipmentStatus>('In Transit');
  const [bulkLocation, setBulkLocation] = useState('');
  const [bulkDescription, setBulkDescription] = useState('');
  const [bulkIsPublic, setBulkIsPublic] = useState(true);

  const selectShipment = (ship: Shipment) => {
    setSelectedShipment(ship);
    setIsCreating(false);
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('detail-panel')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Shipment));
      setShipments(data);

      const paramId = searchParams.get('id');
      if (paramId) {
        const found = data.find(s => s.id === paramId);
        if (found) {
          selectShipment(found);
          setTimeout(() => {
            document.getElementById('detail-panel')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
          return;
        }
      }

      if (data.length > 0 && !selectedShipment) {
        selectShipment(data[0]);
      } else if (selectedShipment) {
        const refreshed = data.find(s => s.id === selectedShipment.id);
        if (refreshed) selectShipment(refreshed);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const tpls = await getOrSeedTemplates();
      setTemplates(tpls);
    } catch (error) {
      console.error('Failed to load tracking templates:', error);
    }
  };

  useEffect(() => {
    fetchShipments();
    loadTemplates();
  }, []);

  // Handle template selection for individual update
  const applyTemplateToSingle = (tpl: TrackingTemplate) => {
    setEventStatus(tpl.status);
    setEventLocation(tpl.location || '');
    setEventDescription(tpl.description);
    setEventIsPublic(tpl.isPublic);
    setSelectedTemplateForForm(tpl);
    toast.success(`Loaded "${tpl.title}"`);
  };

  // Handle template selection for bulk update
  const applyTemplateToBulk = (tpl: TrackingTemplate) => {
    setBulkStatus(tpl.status);
    setBulkLocation(tpl.location || '');
    setBulkDescription(tpl.description);
    setBulkIsPublic(tpl.isPublic);
    toast.success(`Applied "${tpl.title}" to bulk form`);
  };

  // Bulk Checkbox Toggles
  const toggleSelectShipment = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredShipments.map(s => s.id);
    setSelectedIds(ids);
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  // Handle Single Event Add
  const handleAddEvent = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedShipment) return;

    if (!eventDescription.trim()) {
      toast.error('Description is required');
      return;
    }

    try {
      const newEvent: ShipmentEvent = {
        id: Date.now().toString(),
        status: eventStatus,
        timestamp: Date.now(),
        location: eventLocation.trim() || undefined,
        description: eventDescription.trim(),
        isPublic: eventIsPublic,
        createdBy: 'Admin'
      };

      const updatedEvents = [...(selectedShipment.events || []), newEvent];

      await updateDoc(doc(db, 'shipments', selectedShipment.id), {
        currentStatus: eventStatus,
        events: updatedEvents,
        updatedAt: Date.now()
      });

      const updatedObj = {
        ...selectedShipment,
        currentStatus: eventStatus,
        events: updatedEvents,
        updatedAt: Date.now()
      };

      setSelectedShipment(updatedObj);
      setShipments(ships => ships.map(s => s.id === selectedShipment.id ? updatedObj : s));

      toast.success(`Tracking updated for ${selectedShipment.id}`);
      
      // Clear form
      setEventLocation('');
      setEventDescription('');
      setSelectedTemplateForForm(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update tracking');
    }
  };

  // Handle Group / Bulk Milestone Update
  const handleExecuteBulkUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;

    if (!bulkDescription.trim()) {
      toast.error('Event description is required');
      return;
    }

    setBulkLoading(true);
    try {
      const now = Date.now();
      const targetShipments = shipments.filter(s => selectedIds.includes(s.id));

      // Perform updates concurrently
      await Promise.all(targetShipments.map(async (ship) => {
        const newEvent: ShipmentEvent = {
          id: `${now}-${Math.random().toString(36).substr(2, 5)}`,
          status: bulkStatus,
          timestamp: now,
          location: bulkLocation.trim() || undefined,
          description: bulkDescription.trim(),
          isPublic: bulkIsPublic,
          createdBy: 'Admin (Bulk Update)'
        };

        const updatedEvents = [...(ship.events || []), newEvent];

        await updateDoc(doc(db, 'shipments', ship.id), {
          currentStatus: bulkStatus,
          events: updatedEvents,
          updatedAt: now
        });
      }));

      // Refresh list
      await fetchShipments();

      toast.success(`Successfully updated ${selectedIds.length} shipments to "${bulkStatus}"!`);
      setIsBulkModalOpen(false);
      setSelectedIds([]);
      
      // If currently viewed shipment was in selection, update it
      if (selectedShipment && selectedIds.includes(selectedShipment.id)) {
        const updated = shipments.find(s => s.id === selectedShipment.id);
        if (updated) setSelectedShipment(updated);
      }
    } catch (error) {
      console.error('Bulk update error:', error);
      toast.error('Failed to execute bulk update');
    } finally {
      setBulkLoading(false);
    }
  };

  // Handle Create Shipment
  const handleCreateShipment = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const trackingNumber = (formData.get('trackingNumber') as string)?.trim().toUpperCase();
    
    if (!trackingNumber) {
      toast.error('Tracking number is required');
      return;
    }

    try {
      const newShipment: Shipment = {
        id: trackingNumber,
        reference: (formData.get('reference') as string)?.trim() || trackingNumber,
        requestReference: (formData.get('requestReference') as string)?.trim() || undefined,
        customerName: (formData.get('customerName') as string)?.trim() || undefined,
        customerEmail: (formData.get('customerEmail') as string)?.trim() || undefined,
        customerPhone: (formData.get('customerPhone') as string)?.trim() || undefined,
        consigneeName: (formData.get('consigneeName') as string)?.trim() || undefined,
        consigneeEmail: (formData.get('consigneeEmail') as string)?.trim() || undefined,
        consigneePhone: (formData.get('consigneePhone') as string)?.trim() || undefined,
        origin: formData.get('origin') as string,
        destination: formData.get('destination') as string,
        cargoType: formData.get('cargoType') as string,
        description: formData.get('description') as string,
        currentStatus: 'Booking Received',
        events: [{
          id: Date.now().toString(),
          status: 'Booking Received',
          timestamp: Date.now(),
          location: formData.get('origin') as string,
          description: 'Shipment booking created and registered in logistics network.',
          isPublic: true,
          createdBy: 'Admin'
        }],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await setDoc(doc(db, 'shipments', trackingNumber), newShipment);
      toast.success(`Shipment ${trackingNumber} created`);
      setIsCreating(false);
      await fetchShipments();
      setSelectedShipment(newShipment);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create shipment');
    }
  };

  // Handle Adding New Template to Firestore Data Store
  const handleCreateNewTemplate = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    try {
      const newTpl = await createTrackingTemplate({
        title: formData.get('title') as string,
        status: formData.get('status') as ShipmentStatus,
        location: (formData.get('location') as string) || undefined,
        description: formData.get('description') as string,
        category: formData.get('category') as string || 'General',
        isPublic: formData.get('isPublic') === 'on',
      });

      setTemplates(prev => [...prev, newTpl]);
      toast.success('New template saved to data store');
      setIsCreatingTemplate(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create template');
    }
  };

  // Handle Deleting Template from Firestore Data Store
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template from the data store?')) return;
    try {
      await deleteTrackingTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete template');
    }
  };

  // Filtered shipments
  const filteredShipments = shipments.filter(ship => {
    const matchesSearch = 
      ship.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ship.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ship.requestReference && ship.requestReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      ship.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ship.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ship.cargoType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ship.customerName && ship.customerName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || ship.currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="h-full flex flex-col bg-editorial-bg text-editorial-dark pb-12">
      {/* Top Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-bold">Shipments & Live Tracking</h1>
            <span className="bg-editorial-dark text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1">
              {shipments.length} Active
            </span>
          </div>
          <p className="text-editorial-text mt-1 font-serif text-sm">
            Manage tracking milestones individually or in groups with pre-stored templates.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="border border-editorial-dark bg-white text-editorial-dark px-4 py-2.5 text-xs uppercase tracking-widest font-bold hover:bg-editorial-bg transition-colors flex items-center gap-2"
          >
            <BookOpen className="w-3.5 h-3.5 text-editorial-accent" />
            Template Data Store ({templates.length})
          </button>

          <button
            onClick={() => { setIsCreating(true); setSelectedShipment(null); }}
            className="bg-editorial-dark text-white px-5 py-2.5 text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New Shipment
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-editorial-dark text-white p-4 border border-editorial-dark flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-editorial-accent text-editorial-dark flex items-center justify-center font-bold text-xs">
              {selectedIds.length}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest font-bold">
                {selectedIds.length} Shipment{selectedIds.length > 1 ? 's' : ''} Selected
              </p>
              <p className="text-[11px] text-zinc-300 font-serif">
                Ready for synchronized group status update
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBulkModalOpen(true)}
              className="bg-editorial-accent text-editorial-dark px-5 py-2 text-xs uppercase tracking-widest font-bold hover:bg-white transition-colors flex items-center gap-2"
            >
              <Layers className="w-4 h-4" /> Group Update Status
            </button>
            <button
              onClick={deselectAll}
              className="text-xs text-zinc-300 hover:text-white uppercase tracking-widest underline underline-offset-4"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-editorial-dark p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-editorial-dark absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Tracking ID, Reference, Destination..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-editorial-dark/30 text-xs font-mono bg-editorial-bg/30 focus:border-editorial-dark focus:ring-0 uppercase placeholder:normal-case placeholder:font-sans"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold whitespace-nowrap">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-editorial-dark/30 bg-white text-xs font-semibold uppercase tracking-wider py-2 px-3 focus:border-editorial-dark focus:ring-0"
          >
            <option value="ALL">All Statuses ({shipments.length})</option>
            {ALL_STATUSES.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 bg-white border border-editorial-dark flex flex-col lg:flex-row min-h-[650px] shadow-sm">
        
        {/* Left Side: Shipment List with Checkboxes */}
        <div className="w-full lg:w-5/12 border-b lg:border-b-0 lg:border-r border-editorial-dark flex flex-col">
          {/* List Header */}
          <div className="p-4 bg-editorial-bg border-b border-editorial-dark flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button 
                onClick={selectedIds.length === filteredShipments.length ? deselectAll : selectAllFiltered}
                className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-bold text-editorial-dark hover:text-editorial-accent"
              >
                {selectedIds.length > 0 && selectedIds.length === filteredShipments.length ? (
                  <CheckSquare className="w-4 h-4 text-editorial-accent" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>Select All ({filteredShipments.length})</span>
              </button>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold">
              Showing {filteredShipments.length}
            </span>
          </div>

          {/* List Content */}
          <div className="overflow-y-auto flex-1 p-3 bg-zinc-50 max-h-[700px] space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-editorial-muted">
                <Loader2 className="w-6 h-6 animate-spin mb-3 text-editorial-accent" />
                <span className="text-xs font-serif">Loading live shipments...</span>
              </div>
            ) : filteredShipments.length === 0 ? (
              <div className="text-center p-12 text-editorial-muted text-sm font-serif">
                No shipments matching your filter criteria.
              </div>
            ) : (
              filteredShipments.map(ship => {
                const isSelected = selectedIds.includes(ship.id);
                const isCurrent = selectedShipment?.id === ship.id;

                return (
                  <div
                    key={ship.id}
                    onClick={() => selectShipment(ship)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 shadow-xs hover:shadow-md ${
                      isCurrent 
                        ? 'bg-white border-editorial-dark ring-1 ring-editorial-dark' 
                        : isSelected 
                          ? 'bg-editorial-bg/50 border-editorial-dark/50' 
                          : 'bg-white border-zinc-200 hover:border-editorial-dark/50'
                    }`}
                  >
                    {/* Checkbox */}
                    <div 
                      onClick={(e) => toggleSelectShipment(ship.id, e)}
                      className="pt-1 text-editorial-dark hover:text-editorial-accent cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-editorial-accent" />
                      ) : (
                        <Square className="w-5 h-5 text-editorial-muted hover:text-editorial-dark" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-mono font-bold text-base tracking-wide text-editorial-dark">{ship.id}</span>
                        <span className="text-[10px] uppercase tracking-widest text-editorial-muted whitespace-nowrap">
                          {format(ship.updatedAt || ship.createdAt, 'MMM d, HH:mm')}
                        </span>
                      </div>

                      <div className="text-xs text-editorial-text font-serif mb-2 truncate">
                        {ship.origin} → <strong className="text-editorial-dark not-italic">{ship.destination}</strong>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 border border-zinc-200 bg-zinc-50 rounded-sm text-[9px] uppercase tracking-widest font-bold">
                          {ship.currentStatus}
                        </span>
                        <span className="text-[10px] font-serif text-editorial-muted bg-zinc-100 px-1.5 py-0.5 rounded-sm">
                          {ship.events?.length || 0} Events
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detail / Create / Single Update Panel */}
        <div id="detail-panel" className="flex-1 flex flex-col bg-editorial-bg/30 overflow-y-auto">
          {isCreating ? (
            /* CREATE SHIPMENT FORM */
            <div className="p-8 max-w-2xl">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-editorial-dark">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold block mb-1">New Entry</span>
                  <h2 className="text-3xl font-serif font-bold">Register New Shipment</h2>
                </div>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="text-xs uppercase tracking-widest font-bold hover:text-editorial-accent"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleCreateShipment} className="space-y-6 bg-white p-8 border border-editorial-dark shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Tracking ID (Public)</label>
                    <input 
                      name="trackingNumber" 
                      required 
                      placeholder="e.g. JRLC-2026-8F42K" 
                      className="w-full border border-editorial-dark py-3 px-4 bg-editorial-bg/20 font-mono uppercase focus:ring-0 focus:border-editorial-dark" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Internal Reference</label>
                    <input 
                      name="reference" 
                      placeholder="e.g. BOOKING-994" 
                      className="w-full border border-editorial-dark py-3 px-4 bg-editorial-bg/20 focus:ring-0 focus:border-editorial-dark" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Linked Quote Ref (Optional)</label>
                    <input 
                      name="requestReference" 
                      placeholder="e.g. REQ-737759" 
                      className="w-full border border-editorial-dark py-3 px-4 bg-editorial-bg/20 font-mono uppercase focus:ring-0 focus:border-editorial-dark" 
                    />
                  </div>

                  {/* Customer / Shipper Information */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Shipper / Client Name</label>
                    <input 
                      name="customerName" 
                      placeholder="e.g. Chimwemwe Banda" 
                      className="w-full border border-editorial-dark py-3 px-4 bg-editorial-bg/20 focus:ring-0 focus:border-editorial-dark" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Shipper Registered Email</label>
                    <input 
                      name="customerEmail" 
                      type="email"
                      placeholder="e.g. client@example.com" 
                      className="w-full border border-editorial-dark py-3 px-4 bg-editorial-bg/20 focus:ring-0 focus:border-editorial-dark" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Shipper Phone / WhatsApp</label>
                    <input 
                      name="customerPhone" 
                      placeholder="e.g. +353 87 555 0192" 
                      className="w-full border border-editorial-dark py-3 px-4 bg-editorial-bg/20 focus:ring-0 focus:border-editorial-dark" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Consignee Name (Malawi)</label>
                    <input 
                      name="consigneeName" 
                      placeholder="e.g. Grace Banda" 
                      className="w-full border border-editorial-dark py-3 px-4 bg-editorial-bg/20 focus:ring-0 focus:border-editorial-dark" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Consignee Email</label>
                    <input 
                      name="consigneeEmail" 
                      type="email"
                      placeholder="e.g. recipient@example.com" 
                      className="w-full border border-editorial-dark py-3 px-4 bg-editorial-bg/20 focus:ring-0 focus:border-editorial-dark" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Consignee Phone</label>
                    <input 
                      name="consigneePhone" 
                      placeholder="e.g. +265 99 123 4567" 
                      className="w-full border border-editorial-dark py-3 px-4 bg-editorial-bg/20 focus:ring-0 focus:border-editorial-dark" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Origin</label>
                    <input 
                      name="origin" 
                      required 
                      defaultValue="Dublin Depot, Ireland"
                      className="w-full border border-editorial-dark py-3 px-4 bg-editorial-bg/20 focus:ring-0 focus:border-editorial-dark" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Destination</label>
                    <input 
                      name="destination" 
                      required 
                      defaultValue="Lilongwe Depot, Malawi"
                      className="w-full border border-editorial-dark py-3 px-4 bg-editorial-bg/20 focus:ring-0 focus:border-editorial-dark" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Primary Cargo Category</label>
                    <select 
                      name="cargoType" 
                      className="w-full border border-editorial-dark py-3 px-4 bg-white focus:ring-0 focus:border-editorial-dark font-medium"
                      defaultValue="Boxes, Drums & Barrels"
                    >
                      <option value="Boxes, Drums & Barrels">Boxes, Drums & Barrels (Cartons, Luggage, 200L Drums)</option>
                      <option value="Cars & Motor Vehicles">Cars & Motor Vehicles (Saloon, SUV, 4x4, Pickup, Van)</option>
                      <option value="By Weight (Per KG)">By Weight / Per KG (Personal Effects, Dry Goods, Hardware)</option>
                      <option value="Pallets & Heavy Machinery">Pallets & Heavy Machinery (Euro Pallet, Industrial, Crate)</option>
                      <option value="Full / Shared Container">Full & Shared Container (20ft FCL, 40ft FCL, LCL CBM)</option>
                      <option value="Other / Mixed Cargo">Other / Specialized Cargo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Item Classification / Units</label>
                    <input 
                      name="cargoUnits"
                      placeholder="e.g. 2 x 200L Barrels, or 1 x Toyota RAV4" 
                      className="w-full border border-editorial-dark py-3 px-4 bg-editorial-bg/20 focus:ring-0 focus:border-editorial-dark font-serif" 
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Cargo Specification & Packing List</label>
                    <textarea 
                      name="description" 
                      required 
                      rows={3} 
                      placeholder="e.g. 2 x 200L Plastic Drums containing clothes, household goods and non-perishable groceries."
                      className="w-full border border-editorial-dark py-3 px-4 bg-editorial-bg/20 focus:ring-0 focus:border-editorial-dark resize-none font-serif text-sm"
                    ></textarea>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="bg-editorial-dark text-white px-8 py-4 text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors w-full"
                >
                  Create & Initialize Tracking
                </button>
              </form>
            </div>
          ) : selectedShipment ? (
            /* SHIPMENT DETAIL & EVENT LOGGING WORKSPACE */
            <div className="p-6 lg:p-8 space-y-8">
              {/* Header Overview Card */}
              <div className="bg-white border border-editorial-dark p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-editorial-dark/20">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold">Tracking ID</span>
                      {selectedShipment.requestReference && (
                        <span className="text-xs bg-editorial-bg border border-editorial-dark/20 px-2 py-0.5 font-mono">
                          Linked Quote: {selectedShipment.requestReference}
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight">{selectedShipment.id}</h2>
                    <p className="text-editorial-text font-serif text-base mt-1">
                      {selectedShipment.cargoType} • {selectedShipment.description}
                    </p>
                  </div>

                  {/* Current Status Pill */}
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold">Current Milestone</span>
                    <span className="px-4 py-2 border border-editorial-dark bg-editorial-bg text-xs uppercase tracking-widest font-bold">
                      {selectedShipment.currentStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6">
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-editorial-muted font-bold mb-1">Origin</span>
                    <span className="font-semibold text-editorial-dark text-sm">{selectedShipment.origin}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-editorial-muted font-bold mb-1">Destination</span>
                    <span className="font-semibold text-editorial-dark text-sm">{selectedShipment.destination}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-editorial-muted font-bold mb-1">Total Events</span>
                    <span className="font-semibold text-editorial-dark text-sm">{selectedShipment.events?.length || 0} Milestones</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest text-editorial-muted font-bold mb-1">Last Updated</span>
                    <span className="font-semibold text-editorial-dark text-sm">
                      {format(selectedShipment.updatedAt || selectedShipment.createdAt, 'MMM d, HH:mm')}
                    </span>
                  </div>
                </div>

                {/* Client / Shipper & Consignee info banner */}
                {(selectedShipment.customerName || selectedShipment.customerEmail || selectedShipment.consigneeName) && (
                  <div className="mt-6 pt-6 border-t border-editorial-dark/10 grid grid-cols-1 md:grid-cols-2 gap-4 bg-editorial-bg/40 p-4 border border-editorial-dark/10">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold block mb-1">Registered Shipper</span>
                      <p className="font-semibold text-xs text-editorial-dark">{selectedShipment.customerName || 'Shipper'}</p>
                      {selectedShipment.customerEmail && (
                        <p className="text-xs text-editorial-text font-mono mt-0.5">{selectedShipment.customerEmail}</p>
                      )}
                      {selectedShipment.customerPhone && (
                        <p className="text-xs text-editorial-muted font-mono mt-0.5">{selectedShipment.customerPhone}</p>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold block mb-1">Consignee (Destination)</span>
                      <p className="font-semibold text-xs text-editorial-dark">{selectedShipment.consigneeName || 'Consignee'}</p>
                      {selectedShipment.consigneeEmail && (
                        <p className="text-xs text-editorial-text font-mono mt-0.5">{selectedShipment.consigneeEmail}</p>
                      )}
                      {selectedShipment.consigneePhone && (
                        <p className="text-xs text-editorial-muted font-mono mt-0.5">{selectedShipment.consigneePhone}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Event Creation & Milestone History Columns */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                
                {/* Single Event Logger */}
                <div className="bg-white border border-editorial-dark p-6 lg:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-editorial-dark/20">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold block mb-1">Event Dispatcher</span>
                      <h3 className="font-serif font-bold text-2xl">Add Tracking Milestone</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTemplateModalOpen(true)}
                      className="text-xs uppercase tracking-wider font-bold text-editorial-accent hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Template Store
                    </button>
                  </div>

                  {/* QUICK PRESET BADGES (One-Click Helpers) */}
                  <div className="mb-6">
                    <span className="block text-[10px] uppercase tracking-widest text-editorial-muted font-bold mb-2.5">
                      ⚡ Quick Template Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {templates.slice(0, 5).map(tpl => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => applyTemplateToSingle(tpl)}
                          className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 border border-editorial-dark/30 hover:border-editorial-dark hover:bg-editorial-bg transition-colors bg-white"
                        >
                          {tpl.title.split('(')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Single Update Form */}
                  <form onSubmit={handleAddEvent} className="space-y-5">
                    {/* Status selection */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Milestone Status</label>
                      <select 
                        value={eventStatus}
                        onChange={e => setEventStatus(e.target.value as ShipmentStatus)}
                        className="w-full border border-editorial-dark py-2.5 px-3 bg-white text-xs uppercase font-bold focus:ring-0 focus:border-editorial-dark"
                      >
                        {ALL_STATUSES.map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Location / Facility</label>
                      <input 
                        value={eventLocation}
                        onChange={e => setEventLocation(e.target.value)}
                        placeholder="e.g. Lilongwe Distribution Depot, Malawi" 
                        className="w-full border border-editorial-dark py-2.5 px-3 bg-editorial-bg/20 text-xs focus:ring-0 focus:border-editorial-dark" 
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Public Milestone Description</label>
                      <textarea 
                        value={eventDescription}
                        onChange={e => setEventDescription(e.target.value)}
                        required
                        rows={3} 
                        placeholder="Detailed cargo update visible to customers..."
                        className="w-full border border-editorial-dark py-2.5 px-3 bg-editorial-bg/20 text-xs focus:ring-0 focus:border-editorial-dark resize-none font-serif leading-relaxed"
                      ></textarea>
                    </div>

                    {/* Visibility Checkbox */}
                    <div className="flex items-center gap-3 pt-1">
                      <input 
                        type="checkbox" 
                        id="eventPublic" 
                        checked={eventIsPublic}
                        onChange={e => setEventIsPublic(e.target.checked)}
                        className="w-4 h-4 rounded-none border-editorial-dark bg-transparent text-editorial-dark focus:ring-editorial-dark" 
                      />
                      <label htmlFor="eventPublic" className="text-xs font-semibold cursor-pointer">
                        Public Milestone (Visible to customer on tracking page)
                      </label>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-editorial-dark text-white py-3.5 px-6 text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center justify-center gap-2 mt-4"
                    >
                      <Send className="w-3.5 h-3.5" /> Post Milestone Update
                    </button>
                  </form>
                </div>

                {/* Tracking History Timeline */}
                <div className="bg-white border border-editorial-dark p-6 lg:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-editorial-dark/20">
                    <h3 className="font-serif font-bold text-2xl">Milestone History</h3>
                    <span className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold">
                      {selectedShipment.events?.length || 0} Recorded
                    </span>
                  </div>
                  <ShipmentHistory events={selectedShipment.events || []} isPublicView={false} />
                </div>

              </div>
            </div>
          ) : (
            /* EMPTY STATE */
            <div className="flex-1 flex flex-col items-center justify-center text-editorial-muted p-12">
              <Truck className="w-16 h-16 mb-4 opacity-20 text-editorial-dark" />
              <h3 className="font-serif font-bold text-2xl text-editorial-dark mb-2">No Shipment Selected</h3>
              <p className="font-serif text-sm max-w-sm text-center text-editorial-text mb-6">
                Choose a shipment from the list on the left to review its events, or select multiple shipments to post a group update.
              </p>
              <button
                onClick={() => { setIsCreating(true); setSelectedShipment(null); }}
                className="px-6 py-3 border border-editorial-dark bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Shipment
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: GROUP / BULK STATUS UPDATE MODAL */}
      {/* ========================================================================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-editorial-dark max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 bg-editorial-dark text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-editorial-accent" />
                <div>
                  <h3 className="font-serif font-bold text-xl">Group Tracking Update</h3>
                  <p className="text-xs text-zinc-300 font-serif">
                    Updating <strong className="text-white">{selectedIds.length}</strong> selected shipments simultaneously
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsBulkModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleExecuteBulkUpdate} className="p-6 space-y-6">
              {/* Template Quick Selector */}
              <div className="p-4 bg-editorial-bg border border-editorial-dark/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-editorial-dark font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-editorial-accent" /> Choose Pre-Set Template
                  </span>
                  <span className="text-[10px] text-editorial-muted font-serif">Auto-fills all fields</span>
                </div>
                <select
                  onChange={(e) => {
                    const tpl = templates.find(t => t.id === e.target.value);
                    if (tpl) applyTemplateToBulk(tpl);
                  }}
                  defaultValue=""
                  className="w-full border border-editorial-dark bg-white py-2 px-3 text-xs font-semibold"
                >
                  <option value="" disabled>-- Select a template from data store --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.status}] {t.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status and Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">New Milestone Status</label>
                  <select
                    value={bulkStatus}
                    onChange={e => setBulkStatus(e.target.value as ShipmentStatus)}
                    className="w-full border border-editorial-dark py-2.5 px-3 text-xs uppercase font-bold bg-white"
                  >
                    {ALL_STATUSES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Location / Hub</label>
                  <input
                    value={bulkLocation}
                    onChange={e => setBulkLocation(e.target.value)}
                    placeholder="e.g. Mwanza Border / Lilongwe Depot"
                    className="w-full border border-editorial-dark py-2.5 px-3 text-xs bg-editorial-bg/20"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">
                  Public Update Description (Applied to all selected)
                </label>
                <textarea
                  value={bulkDescription}
                  onChange={e => setBulkDescription(e.target.value)}
                  required
                  rows={3}
                  placeholder="Enter message for customers..."
                  className="w-full border border-editorial-dark py-2.5 px-3 text-xs bg-editorial-bg/20 resize-none font-serif"
                ></textarea>
              </div>

              {/* Selected Identifiers preview */}
              <div className="p-3 bg-zinc-50 border border-zinc-200">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block mb-1.5">Target Shipments:</span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {selectedIds.map(id => (
                    <span key={id} className="font-mono text-[10px] bg-white border border-zinc-300 px-2 py-0.5">
                      {id}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-editorial-dark/10">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-5 py-2.5 border border-editorial-dark text-xs uppercase tracking-widest font-bold hover:bg-editorial-bg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkLoading}
                  className="px-6 py-2.5 bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {bulkLoading ? 'Applying Updates...' : `Apply to ${selectedIds.length} Shipments`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TEMPLATE DATA STORE MANAGER */}
      {/* ========================================================================= */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-editorial-dark max-w-4xl w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 bg-editorial-dark text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-editorial-accent" />
                <div>
                  <h3 className="font-serif font-bold text-xl">Tracking Template Library</h3>
                  <p className="text-xs text-zinc-300 font-serif">
                    Persisted in Firestore Data Store • {templates.length} Active Templates
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsCreatingTemplate(!isCreatingTemplate)}
                  className="bg-editorial-accent text-editorial-dark px-3.5 py-1.5 text-[11px] uppercase tracking-widest font-bold hover:bg-white transition-colors"
                >
                  {isCreatingTemplate ? 'View All Templates' : '+ Add New Template'}
                </button>
                <button 
                  onClick={() => { setIsTemplateModalOpen(false); setIsCreatingTemplate(false); }}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto">
              {isCreatingTemplate ? (
                /* NEW TEMPLATE FORM */
                <div className="max-w-xl mx-auto p-6 bg-editorial-bg border border-editorial-dark">
                  <h4 className="font-serif font-bold text-xl mb-6">Create Custom Tracking Template</h4>
                  <form onSubmit={handleCreateNewTemplate} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Template Title</label>
                      <input 
                        name="title" 
                        required 
                        placeholder="e.g. Vessel Departed Rotterdam Feeder" 
                        className="w-full border border-editorial-dark py-2 px-3 text-xs bg-white" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Default Status</label>
                        <select name="status" className="w-full border border-editorial-dark py-2 px-3 text-xs bg-white uppercase font-bold">
                          {ALL_STATUSES.map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Category</label>
                        <input 
                          name="category" 
                          defaultValue="Transit" 
                          placeholder="e.g. Transit / Customs" 
                          className="w-full border border-editorial-dark py-2 px-3 text-xs bg-white" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Default Location</label>
                      <input 
                        name="location" 
                        placeholder="e.g. Durban Ocean Terminal" 
                        className="w-full border border-editorial-dark py-2 px-3 text-xs bg-white" 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Standard Description</label>
                      <textarea 
                        name="description" 
                        required 
                        rows={3} 
                        placeholder="Standard template message displayed to customers..."
                        className="w-full border border-editorial-dark py-2 px-3 text-xs bg-white resize-none font-serif"
                      ></textarea>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        name="isPublic" 
                        id="tplPublic" 
                        defaultChecked 
                        className="w-4 h-4 rounded-none border-editorial-dark bg-transparent text-editorial-dark" 
                      />
                      <label htmlFor="tplPublic" className="text-xs font-semibold">Public by default</label>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsCreatingTemplate(false)}
                        className="px-4 py-2 border border-editorial-dark text-xs uppercase tracking-widest font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent"
                      >
                        Save Template
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* TEMPLATE LIST GRID */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(tpl => (
                    <div 
                      key={tpl.id} 
                      className="p-5 border border-editorial-dark bg-white hover:bg-editorial-bg/30 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-[10px] uppercase tracking-widest font-bold bg-editorial-bg border border-editorial-dark/20 px-2 py-0.5">
                            {tpl.category || 'General'}
                          </span>
                          <span className="text-[9px] uppercase tracking-widest font-bold text-editorial-accent">
                            {tpl.status}
                          </span>
                        </div>

                        <h4 className="font-serif font-bold text-base text-editorial-dark mb-1">{tpl.title}</h4>
                        {tpl.location && (
                          <p className="text-xs text-editorial-muted flex items-center gap-1.5 mb-2 font-mono">
                            <MapPin className="w-3 h-3" /> {tpl.location}
                          </p>
                        )}
                        <p className="text-xs text-editorial-text font-serif leading-relaxed mb-4">
                          {tpl.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-editorial-dark/10 flex items-center justify-between">
                        <button
                          onClick={() => {
                            if (selectedShipment) {
                              applyTemplateToSingle(tpl);
                              setIsTemplateModalOpen(false);
                            } else {
                              toast.success(`Template copied. Select a shipment to apply.`);
                              setIsTemplateModalOpen(false);
                            }
                          }}
                          className="text-[11px] uppercase tracking-widest font-bold text-editorial-dark hover:text-editorial-accent"
                        >
                          Use This Template →
                        </button>
                        {tpl.id && (
                          <button
                            onClick={() => handleDeleteTemplate(tpl.id!)}
                            className="text-zinc-400 hover:text-red-600 p-1"
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-editorial-bg border-t border-editorial-dark flex justify-end">
              <button
                onClick={() => { setIsTemplateModalOpen(false); setIsCreatingTemplate(false); }}
                className="px-6 py-2 bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
