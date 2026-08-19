import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { ContactMessage, ContactMessageStatus } from '../../types';
import toast from 'react-hot-toast';
import { Loader2, Mail, Phone, Calendar, User, MessageSquare, CheckCircle2, Archive, Trash2, Reply } from 'lucide-react';
import { format } from 'date-fns';

const STATUSES: ContactMessageStatus[] = ['New', 'Read', 'Responded', 'Archived'];

export default function AdminContacts() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ContactMessage));
      setMessages(data);
      if (data.length > 0 && !selectedMessage) {
        setSelectedMessage(data[0]);
      } else if (selectedMessage) {
        const refreshed = data.find(m => m.id === selectedMessage.id);
        if (refreshed) setSelectedMessage(refreshed);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load contact messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleStatusChange = async (id: string, newStatus: ContactMessageStatus) => {
    try {
      await updateDoc(doc(db, 'contact_messages', id), {
        status: newStatus,
        updatedAt: Date.now()
      });
      setMessages(msgs => msgs.map(m => m.id === id ? { ...m, status: newStatus } : m));
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status: newStatus });
      }
      toast.success(`Message marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message permanently?')) return;
    try {
      await deleteDoc(doc(db, 'contact_messages', id));
      setMessages(msgs => msgs.filter(m => m.id !== id));
      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const selectMsg = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    if (msg.status === 'New') {
      handleStatusChange(msg.id!, 'Read');
    }
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('detail-panel')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-editorial-dark">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-editorial-accent font-bold block mb-1">
            Inbox & Communications
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold italic tracking-tight">Contact Messages.</h1>
          <p className="text-editorial-text font-serif italic text-sm mt-1">
            Inquiries received from the public website contact form.
          </p>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="bg-white border border-editorial-dark flex flex-col lg:flex-row min-h-[650px] shadow-sm">
        
        {/* Left Side: Message List */}
        <div className="w-full lg:w-5/12 border-b lg:border-b-0 lg:border-r border-editorial-dark flex flex-col">
          <div className="p-3 bg-editorial-bg border-b border-editorial-dark flex items-center justify-between text-[10px] uppercase font-bold tracking-widest">
            <span>Inbox ({messages.length})</span>
          </div>

          <div className="overflow-y-auto flex-1 p-3 bg-zinc-50 max-h-[700px] space-y-3">
            {loading ? (
              <div className="flex justify-center p-12 text-editorial-muted">
                <Loader2 className="w-6 h-6 animate-spin text-editorial-accent" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center p-12 text-editorial-muted text-sm font-serif italic">
                No contact messages found.
              </div>
            ) : (
              messages.map(msg => {
                const isSelected = selectedMessage?.id === msg.id;
                const isUnread = msg.status === 'New';
                
                return (
                  <div
                    key={msg.id}
                    onClick={() => selectMsg(msg)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 shadow-xs hover:shadow-md ${
                      isSelected 
                        ? 'bg-white border-editorial-dark ring-1 ring-editorial-dark' 
                        : isUnread 
                          ? 'bg-white border-editorial-accent/50 shadow-editorial-accent/10 hover:border-editorial-accent' 
                          : 'bg-white border-zinc-200 hover:border-editorial-dark/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        {isUnread && <div className="w-2 h-2 rounded-full bg-editorial-accent shrink-0"></div>}
                        <span className={`font-serif text-sm truncate ${isUnread ? 'font-bold text-zinc-900' : 'font-medium text-zinc-700'}`}>
                          {msg.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-editorial-muted font-serif shrink-0">
                        {format(msg.createdAt, 'MMM d, HH:mm')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-sans font-bold text-xs text-editorial-dark truncate">{msg.subject}</h4>
                    </div>

                    <p className="text-xs text-editorial-text font-serif italic truncate">
                      {msg.message}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[9px] uppercase font-bold tracking-widest mt-1">
                      <span className={`px-2 py-0.5 border rounded-sm ${
                        msg.status === 'New' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        msg.status === 'Archived' ? 'bg-zinc-100 border-zinc-200 text-zinc-500' :
                        'bg-zinc-50 border-zinc-200 text-editorial-dark'
                      }`}>
                        {msg.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Message Detail */}
        <div id="detail-panel" className="flex-1 flex flex-col bg-editorial-bg/20 overflow-y-auto">
          {selectedMessage ? (
            <div className="p-6 lg:p-8 space-y-6">
              
              {/* Header Overview Card */}
              <div className="p-6 bg-white border border-editorial-dark shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-editorial-dark/10">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Direct Message
                      </span>
                      <span className="text-xs text-editorial-muted font-mono">
                        Received: {format(selectedMessage.createdAt, 'MMMM d, yyyy - HH:mm')}
                      </span>
                    </div>
                    <h2 className="text-2xl font-serif font-bold tracking-tight mt-2">{selectedMessage.subject}</h2>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex flex-col items-end gap-1.5 self-start sm:self-auto shrink-0">
                    <span className="text-[9px] uppercase tracking-widest text-editorial-muted font-bold">Message Status</span>
                    <select
                      value={selectedMessage.status}
                      onChange={(e) => handleStatusChange(selectedMessage.id!, e.target.value as ContactMessageStatus)}
                      className="bg-white border border-editorial-dark py-1.5 px-3 text-xs uppercase font-bold tracking-wider focus:ring-0 focus:border-editorial-dark"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded-sm">
                    <User className="w-4 h-4 text-editorial-dark shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold">Sender Name</p>
                      <p className="text-sm font-bold text-zinc-900 truncate">{selectedMessage.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded-sm">
                    <Mail className="w-4 h-4 text-editorial-dark shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold">Email Address</p>
                      <a href={`mailto:${selectedMessage.email}`} className="text-sm font-bold text-editorial-accent truncate block hover:underline">
                        {selectedMessage.email}
                      </a>
                    </div>
                  </div>

                  {selectedMessage.phone && (
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 border border-zinc-100 rounded-sm">
                      <Phone className="w-4 h-4 text-editorial-dark shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold">Phone Number</p>
                        <a href={`tel:${selectedMessage.phone}`} className="text-sm font-bold text-zinc-900 truncate block hover:underline">
                          {selectedMessage.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content */}
              <div className="bg-white border border-editorial-dark shadow-sm">
                <div className="px-6 py-4 border-b border-editorial-dark bg-editorial-bg/30 flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg text-editorial-dark">Message Content</h3>
                </div>
                <div className="p-6 lg:p-8">
                  <p className="text-editorial-dark font-serif text-base leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>
                
                <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-200 flex flex-wrap gap-3">
                  <a 
                    href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                    onClick={() => handleStatusChange(selectedMessage.id!, 'Responded')}
                    className="bg-editorial-dark text-white px-5 py-2 text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center gap-2"
                  >
                    <Reply className="w-4 h-4" /> Reply via Email
                  </a>
                  
                  {selectedMessage.status !== 'Archived' && (
                    <button 
                      onClick={() => handleStatusChange(selectedMessage.id!, 'Archived')}
                      className="bg-white border border-zinc-300 text-zinc-700 px-5 py-2 text-xs uppercase tracking-widest font-bold hover:bg-zinc-50 transition-colors flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4" /> Archive Message
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleDelete(selectedMessage.id!)}
                    className="bg-white border border-red-200 text-red-600 px-5 py-2 text-xs uppercase tracking-widest font-bold hover:bg-red-50 transition-colors flex items-center gap-2 ml-auto"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-editorial-muted">
              <Mail className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-xl font-serif italic mb-2">No Message Selected</h3>
              <p className="text-sm font-serif">Select a message from the inbox to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
