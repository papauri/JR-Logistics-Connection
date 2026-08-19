import { MapPin } from 'lucide-react';
import { format } from 'date-fns';
import type { ShipmentEvent } from '../types';

interface ShipmentHistoryProps {
  events: ShipmentEvent[];
  isPublicView?: boolean;
}

export default function ShipmentHistory({ events, isPublicView = true }: ShipmentHistoryProps) {
  const displayEvents = isPublicView ? events.filter(e => e.isPublic) : events;
  const sortedEvents = [...displayEvents].sort((a, b) => b.timestamp - a.timestamp);

  if (sortedEvents.length === 0) {
    return <p className="text-editorial-muted font-serif">No tracking events available yet.</p>;
  }

  return (
    <div className="space-y-10">
      {sortedEvents.map((event, index) => (
        <div key={event.id} className={`relative pl-8 border-l ${index === 0 ? 'border-editorial-accent' : 'border-[#1A1A1A] opacity-60'}`}>
          {index === 0 && (
            <div className="absolute top-[-4px] left-[-4px] w-2 h-2 bg-editorial-accent rounded-full shadow-[0_0_10px_#E03E2D]"></div>
          )}
          
          {!isPublicView && !event.isPublic && (
            <span className="inline-block bg-editorial-dark text-white text-[9px] uppercase tracking-[0.2em] font-bold px-2 py-1 mb-2">
              Internal Note
            </span>
          )}

          <span className={`text-[10px] uppercase tracking-widest block mb-2 ${index === 0 ? 'text-editorial-accent' : 'text-editorial-dark'}`}>
            {format(event.timestamp, 'MMM d, yyyy - HH:mm')}
          </span>
          <h4 className="text-lg font-serif font-bold mb-2 text-editorial-dark">{event.status}</h4>
          <p className="text-sm text-editorial-text leading-relaxed mb-3">{event.description}</p>
          
          {event.location && (
            <p className="text-xs flex items-center gap-2 font-medium text-editorial-text">
              <MapPin className="w-3 h-3" /> {event.location}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
