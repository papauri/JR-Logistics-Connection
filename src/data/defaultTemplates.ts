import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import type { TrackingTemplate, ShipmentStatus } from '../types';

export const DEFAULT_TRACKING_TEMPLATES: Omit<TrackingTemplate, 'id'>[] = [
  {
    title: 'Cargo Received & Inspected (Dublin Depot)',
    status: 'Cargo Received',
    location: 'Dublin Logistics Depot, Ireland',
    description: 'Consignment received at Dublin central depot. Weight, volume, and packaging verified for export processing.',
    isPublic: true,
    category: 'Depot / Origin',
    createdAt: Date.now() - 100000,
  },
  {
    title: 'Export Consolidation & Container Packed',
    status: 'Warehouse Processing',
    location: 'Dublin Logistics Hub, Ireland',
    description: 'Cargo securely packed, palletized, and consolidated into ocean export shipping container. Customs declaration submitted.',
    isPublic: true,
    category: 'Depot / Origin',
    createdAt: Date.now() - 90000,
  },
  {
    title: 'Vessel Departed Port of Dublin',
    status: 'Shipped',
    location: 'Port of Dublin, Ireland',
    description: 'Container loaded aboard cargo vessel and departed Dublin Port en route to African maritime transit corridor.',
    isPublic: true,
    category: 'Transit',
    createdAt: Date.now() - 80000,
  },
  {
    title: 'In Maritime Transit (Ocean Freight)',
    status: 'In Transit',
    location: 'International Maritime Route',
    description: 'Vessel en route according to scheduled shipping itinerary. Container integrity and conditions monitored.',
    isPublic: true,
    category: 'Transit',
    createdAt: Date.now() - 70000,
  },
  {
    title: 'Arrival at Regional Transshipment Port',
    status: 'In Transit',
    location: 'Regional Port Terminal (Beira / Durban / Dar)',
    description: 'Container discharged at deep-sea transshipment terminal. Preparing for overland bonded transit convoy to Malawi.',
    isPublic: true,
    category: 'Transit',
    createdAt: Date.now() - 60000,
  },
  {
    title: 'Border Arrival & Customs Formalities',
    status: 'In Transit',
    location: 'Mwanza / Songwe Border Post, Malawi',
    description: 'Consignment arrived at Malawi border post. Malawi Revenue Authority (MRA) import clearance processing underway.',
    isPublic: true,
    category: 'Customs',
    createdAt: Date.now() - 50000,
  },
  {
    title: 'Customs Cleared - Released for Inland Transit',
    status: 'In Transit',
    location: 'Mwanza Border, Malawi',
    description: 'Customs duties and statutory clearances finalized. Truck dispatched for final leg to central distribution depot.',
    isPublic: true,
    category: 'Customs',
    createdAt: Date.now() - 40000,
  },
  {
    title: 'Arrived at Lilongwe Central Depot',
    status: 'Arrived',
    location: 'Lilongwe Warehouse, Area 4, Malawi',
    description: 'Container arrived at Lilongwe distribution hub. Goods unsealed, sorted, and undergoing consignment verification.',
    isPublic: true,
    category: 'Destination Depot',
    createdAt: Date.now() - 30000,
  },
  {
    title: 'Ready for Customer Collection (Lilongwe Depot)',
    status: 'Ready for Collection',
    location: 'Lilongwe Collection Depot, Area 4, Malawi',
    description: 'Consignment ready for collection. Consignee can collect during warehouse hours (Mon-Sat). Please bring ID and tracking number.',
    isPublic: true,
    category: 'Collection & Delivery',
    createdAt: Date.now() - 20000,
  },
  {
    title: 'Out for Local Doorstep Delivery',
    status: 'In Transit',
    location: 'Lilongwe / Blantyre Region, Malawi',
    description: 'Cargo loaded onto local distribution vehicle and dispatched for final door-to-door delivery.',
    isPublic: true,
    category: 'Collection & Delivery',
    createdAt: Date.now() - 10000,
  },
  {
    title: 'Delivered & Handover Signed',
    status: 'Delivered',
    location: 'Consignee Address, Malawi',
    description: 'Shipment successfully delivered and verified by recipient. Proof of delivery signed and logged in system.',
    isPublic: true,
    category: 'Collection & Delivery',
    createdAt: Date.now(),
  },
  {
    title: 'Customs Inspection / Clearance Delay',
    status: 'Delayed',
    location: 'Customs Examination Bay',
    description: 'Routine physical customs verification requested by port authorities. Clearance resolution expected in 24-48 hours.',
    isPublic: true,
    category: 'Exceptions',
    createdAt: Date.now(),
  },
];

// Fetch templates from Firestore or seed if empty
export async function getOrSeedTemplates(): Promise<TrackingTemplate[]> {
  try {
    const templatesCol = collection(db, 'tracking_templates');
    const snap = await getDocs(query(templatesCol, orderBy('createdAt', 'asc')));

    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as TrackingTemplate));
    }

    // Seed defaults into Firestore
    const seededTemplates: TrackingTemplate[] = [];
    for (const tpl of DEFAULT_TRACKING_TEMPLATES) {
      const docRef = await addDoc(templatesCol, tpl);
      seededTemplates.push({ id: docRef.id, ...tpl });
    }
    return seededTemplates;
  } catch (err) {
    console.error('Error fetching/seeding tracking templates:', err);
    // Return in-memory fallback if firestore fails
    return DEFAULT_TRACKING_TEMPLATES.map((t, idx) => ({ id: `default-${idx}`, ...t }));
  }
}

export async function createTrackingTemplate(template: Omit<TrackingTemplate, 'id'>): Promise<TrackingTemplate> {
  const docRef = await addDoc(collection(db, 'tracking_templates'), {
    ...template,
    createdAt: Date.now(),
  });
  return { id: docRef.id, ...template, createdAt: Date.now() };
}

export async function deleteTrackingTemplate(id: string): Promise<void> {
  await deleteDoc(doc(db, 'tracking_templates', id));
}

export async function updateTrackingTemplate(id: string, updates: Partial<TrackingTemplate>): Promise<void> {
  await updateDoc(doc(db, 'tracking_templates', id), updates);
}
