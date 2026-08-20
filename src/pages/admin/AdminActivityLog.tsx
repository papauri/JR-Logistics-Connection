import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Activity, 
  Settings, 
  DollarSign, 
  Truck, 
  FileText,
  Clock,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import type { ActivityLog } from '../../types';

export default function AdminActivityLog() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const q = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(50));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog));
        setLogs(data);
      } catch (err) {
        console.error('Failed to fetch activity logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getIcon = (actionType: string) => {
    if (actionType === 'UPDATE_SETTINGS') return <Settings className="w-4 h-4 text-zinc-500" />;
    if (actionType === 'UPDATE_FINANCIALS') return <DollarSign className="w-4 h-4 text-green-600" />;
    if (actionType === 'UPDATE_DOCUMENT') return <FileText className="w-4 h-4 text-blue-500" />;
    if (actionType === 'CREATE_SHIPMENT' || actionType === 'UPDATE_SHIPMENT' || actionType === 'DELETE_SHIPMENT') return <Truck className="w-4 h-4 text-editorial-accent" />;
    return <Activity className="w-4 h-4 text-zinc-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-editorial-dark"></div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-editorial-dark shadow-sm">
      <div className="px-6 py-4 border-b border-editorial-dark bg-editorial-bg/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-editorial-dark" />
          <h2 className="font-sans font-bold text-lg text-editorial-dark">System Activity Log</h2>
        </div>
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{logs.length} Actions Recorded</span>
      </div>
      
      <div className="p-6">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">
            No activity logs found.
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map(log => (
              <div key={log.id} className="flex gap-4 p-4 border border-editorial-dark/10 hover:bg-zinc-50 transition-colors">
                <div className="shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                    {getIcon(log.actionType)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
                    <span className="text-sm font-bold text-editorial-dark font-sans">
                      {log.description}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {format(log.timestamp, 'dd MMM yyyy, HH:mm')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] uppercase tracking-wider text-zinc-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.userName}
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 font-bold">
                      {log.entityType}: {log.entityId}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
