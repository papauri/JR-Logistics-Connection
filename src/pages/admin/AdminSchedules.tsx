import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import type { ShipmentSchedule } from '../../types';
import toast from 'react-hot-toast';
import { Loader2, Plus, Calendar, MapPin, Trash2, Edit3, X, Save, Clock, Truck } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminSchedules() {
  const [schedules, setSchedules] = useState<ShipmentSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ShipmentSchedule | null>(null);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'schedules'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShipmentSchedule));
      
      // Sort by shipmentDate in memory to ensure upcoming are first
      data.sort((a, b) => new Date(a.shipmentDate).getTime() - new Date(b.shipmentDate).getTime());
      
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const id = editingSchedule?.id || doc(collection(db, 'schedules')).id;
    const now = Date.now();

    const scheduleData: ShipmentSchedule = {
      id,
      destination: formData.get('destination') as string,
      shipmentDate: formData.get('shipmentDate') as string,
      cutoffDate: formData.get('cutoffDate') as string,
      status: formData.get('status') as any,
      notes: formData.get('notes') as string || '',
      createdAt: editingSchedule?.createdAt || now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'schedules', id), scheduleData);
      toast.success(editingSchedule ? 'Schedule updated' : 'Schedule added');
      setIsModalOpen(false);
      fetchSchedules();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Failed to save schedule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await deleteDoc(doc(db, 'schedules', id));
      toast.success('Schedule deleted');
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Failed to delete schedule');
    }
  };

  const openEditModal = (schedule?: ShipmentSchedule) => {
    setEditingSchedule(schedule || null);
    setIsModalOpen(true);
  };

  if (loading && schedules.length === 0) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-editorial-dark" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-sans font-bold text-zinc-900">Shipment Schedules</h1>
          <p className="text-zinc-500 font-sans text-sm mt-1">Manage upcoming shipment dates and cutoff times for collection.</p>
        </div>
        <button
          onClick={() => openEditModal()}
          className="bg-editorial-dark text-white px-5 py-2.5 text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Schedule
        </button>
      </div>

      <div className="bg-white border border-editorial-dark shadow-sm">
        <div className="grid grid-cols-1 divide-y divide-editorial-dark/10">
          {schedules.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm font-sans">
              No schedules found. Click "Add Schedule" to create one.
            </div>
          ) : (
            schedules.map(schedule => (
              <div key={schedule.id} className="p-5 hover:bg-zinc-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-10 h-10 bg-editorial-bg flex items-center justify-center border border-editorial-dark shrink-0">
                    <Calendar className="w-5 h-5 text-editorial-dark" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-sans text-zinc-900 mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-editorial-accent" />
                      {schedule.destination}
                    </h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-600">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        <strong>Shipment:</strong> {schedule.shipmentDate}
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-700">
                        <Clock className="w-3.5 h-3.5" />
                        <strong>Cut-off:</strong> {schedule.cutoffDate}
                      </span>
                      <span className={`px-2 py-0.5 border text-[10px] uppercase tracking-widest font-bold ${
                        schedule.status === 'Active' ? 'bg-green-50 border-green-200 text-green-700' :
                        schedule.status === 'Completed' ? 'bg-zinc-100 border-zinc-300 text-zinc-600' :
                        'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        {schedule.status}
                      </span>
                    </div>
                    {schedule.notes && (
                      <p className="mt-2 text-sm text-zinc-500">"{schedule.notes}"</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 md:ml-auto w-full md:w-auto">
                  <button
                    onClick={() => openEditModal(schedule)}
                    className="flex-1 md:flex-none border border-zinc-200 bg-white text-zinc-700 px-3 py-2 text-xs uppercase tracking-widest font-bold hover:bg-zinc-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id!)}
                    className="flex-1 md:flex-none border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-xs uppercase tracking-widest font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white max-w-lg w-full shadow-2xl border border-editorial-dark animate-in slide-in-from-bottom-4 duration-200">
            <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-editorial-bg">
              <h2 className="text-lg font-bold font-sans flex items-center gap-2">
                <Calendar className="w-5 h-5 text-editorial-accent" />
                {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Destination</label>
                <input
                  name="destination"
                  type="text"
                  required
                  defaultValue={editingSchedule?.destination || ''}
                  placeholder="e.g., Malawi (Lilongwe & Blantyre)"
                  className="w-full rounded-none border-zinc-300 text-sm focus:border-editorial-dark focus:ring-0"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Shipment Date</label>
                  <input
                    name="shipmentDate"
                    type="date"
                    required
                    defaultValue={editingSchedule?.shipmentDate || ''}
                    className="w-full rounded-none border-zinc-300 text-sm focus:border-editorial-dark focus:ring-0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Cut-off Date</label>
                  <input
                    name="cutoffDate"
                    type="date"
                    required
                    defaultValue={editingSchedule?.cutoffDate || ''}
                    className="w-full rounded-none border-zinc-300 text-sm focus:border-editorial-dark focus:ring-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Status</label>
                <select
                  name="status"
                  defaultValue={editingSchedule?.status || 'Active'}
                  className="w-full rounded-none border-zinc-300 text-sm focus:border-editorial-dark focus:ring-0"
                >
                  <option value="Active">Active (Upcoming)</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingSchedule?.notes || ''}
                  placeholder="e.g., Expect slight delays due to port congestion"
                  className="w-full rounded-none border-zinc-300 text-sm focus:border-editorial-dark focus:ring-0"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-100 text-zinc-700 px-4 py-2 text-xs uppercase tracking-widest font-bold hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-editorial-dark text-white px-4 py-2 text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
