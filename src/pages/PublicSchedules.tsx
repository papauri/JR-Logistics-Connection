import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import type { ShipmentSchedule } from '../types';
import { Loader2, Calendar, MapPin, Truck, Clock, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicSchedules() {
  const [schedules, setSchedules] = useState<ShipmentSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const q = query(
          collection(db, 'schedules'), 
          where('status', '==', 'Active'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShipmentSchedule));
        
        // Sort by shipmentDate
        data.sort((a, b) => new Date(a.shipmentDate).getTime() - new Date(b.shipmentDate).getTime());
        
        setSchedules(data);
      } catch (error) {
        console.error('Error fetching schedules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('en-GB', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Header section */}
      <div className="bg-editorial-dark text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 tracking-tight">Upcoming Shipments</h1>
          <p className="text-zinc-300 max-w-2xl mx-auto font-serif text-lg leading-relaxed">
            Plan your cargo deliveries. View our schedule for upcoming departures from Ireland to Africa and note the collection cut-off dates to ensure your freight departs on time.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-editorial-dark">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest text-zinc-500">Loading Schedules...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white border border-zinc-200 p-12 text-center shadow-sm">
            <Calendar className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold font-serif text-zinc-900 mb-2">No active schedules right now</h3>
            <p className="text-zinc-500 mb-6">We are currently updating our shipping calendar. Please check back shortly or request a quote directly.</p>
            <Link to="/quote" className="inline-flex items-center gap-2 bg-editorial-dark text-white px-6 py-3 text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors">
              <FileText className="w-4 h-4" /> Request Quote
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {schedules.map((schedule, idx) => {
              const isUrgent = new Date(schedule.cutoffDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // Less than 7 days
              
              return (
                <div key={schedule.id} className="bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  {/* Decorative timeline line */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-editorial-dark group-hover:bg-editorial-accent transition-colors"></div>
                  
                  <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="w-5 h-5 text-editorial-accent" />
                        <h2 className="text-2xl font-serif font-bold text-zinc-900">{schedule.destination}</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        <div className="bg-zinc-50 p-4 border border-zinc-100 rounded-sm">
                          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-zinc-500 mb-1">
                            <Clock className="w-3 h-3" /> Collection Cut-off
                          </span>
                          <span className={`text-base font-medium ${isUrgent ? 'text-red-700 font-bold' : 'text-zinc-900'}`}>
                            {formatDate(schedule.cutoffDate)}
                          </span>
                        </div>
                        <div className="bg-editorial-bg p-4 border border-zinc-200 rounded-sm">
                          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-1">
                            <Truck className="w-3 h-3" /> Departure Date
                          </span>
                          <span className="text-base font-bold text-zinc-900">
                            {formatDate(schedule.shipmentDate)}
                          </span>
                        </div>
                      </div>
                      
                      {schedule.notes && (
                        <p className="mt-4 text-sm text-zinc-600 border-l-2 border-zinc-200 pl-3">
                          {schedule.notes}
                        </p>
                      )}
                    </div>
                    
                    <div className="md:w-64 shrink-0 flex flex-col gap-3">
                      <div className="p-4 bg-zinc-950 text-white text-center">
                        <span className="block text-xs uppercase tracking-widest font-bold text-zinc-400 mb-1">Status</span>
                        <span className="block text-lg font-bold">Accepting Cargo</span>
                      </div>
                      <Link 
                        to={`/quote?dest=${encodeURIComponent(schedule.destination)}`} 
                        className="w-full py-3 bg-editorial-accent text-editorial-dark border border-transparent text-xs uppercase tracking-widest font-bold hover:bg-white hover:border-editorial-dark transition-all flex justify-center items-center gap-2"
                      >
                        Book Now <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-12 bg-zinc-900 text-white p-8 sm:p-12 text-center flex flex-col items-center">
          <ShieldCheck className="w-12 h-12 text-editorial-accent mb-4" />
          <h3 className="text-2xl font-serif font-bold mb-3">Don't see your destination?</h3>
          <p className="text-zinc-400 max-w-lg mb-6">We arrange custom freight handling and special routing upon request. Contact our dispatch team directly for customized solutions.</p>
          <Link to="/quote" className="px-6 py-3 border border-white text-white text-xs uppercase tracking-widest font-bold hover:bg-white hover:text-zinc-900 transition-colors">
            Request Custom Quote
          </Link>
        </div>
      </div>
    </div>
  );
}
