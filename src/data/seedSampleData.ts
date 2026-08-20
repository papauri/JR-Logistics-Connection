import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { CustomerRequest, Shipment } from '../types';

export const SAMPLE_REQUESTS: CustomerRequest[] = [
  {
    reference: 'REQ-2026-001',
    customerName: 'Chimwemwe Banda',
    email: 'chimwemwe.banda@example.com',
    phone: '+353 87 555 0192',
    pickupLocation: 'Dublin 15, Ireland',
    destination: 'Lilongwe Central Depot, Malawi',
    cargoType: 'Boxes, Drums & Barrels',
    cargoDescription: '2 Large Barrels (200L) containing family clothes, dry groceries, and kitchenware.',
    quantity: '2 Barrels (200L)',
    collectionRequired: true,
    preferredDate: '2026-03-05',
    message: 'Please collect from my house in Dublin 15 on Saturday morning.',
    status: 'Quoted',
    quotedAmount: 350.00,
    currency: 'EUR',
    quoteNotes: 'Rate includes Dublin doorstep collection (€50) and ocean freight to Beira.',
    internalNotes: 'Quoted €300 for 2x Barrels plus €50 Dublin doorstep collection. Customer confirmed on WhatsApp.',
    createdAt: Date.now() - 86400000 * 3, // 3 days ago
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    reference: 'REQ-2026-002',
    customerName: 'Patrick Phiri',
    email: 'patrick.phiri@example.com',
    phone: '+353 89 444 8831',
    pickupLocation: 'Cork City, Ireland',
    destination: 'Blantyre Distribution Depot, Malawi',
    cargoType: 'Cars & Motor Vehicles',
    cargoDescription: 'Toyota Hilux Double Cab (2018) plus 4 spare alloy wheels and vehicle documentation.',
    quantity: '1 Vehicle + Accessories',
    collectionRequired: false,
    preferredDate: '2026-03-10',
    message: 'Will deliver vehicle directly to your Dublin port terminal after deregistration.',
    status: 'Collection Scheduled',
    quotedAmount: 1850.00,
    currency: 'EUR',
    invoiceNumber: 'INV-2026-002',
    invoiceStatus: 'Paid',
    depositPaid: 1850.00,
    linkedShipmentId: 'JRLC-2026-MW109IE',
    internalNotes: 'Deregistration certificate checked. RORO booking reserved for Dublin to Durban with car carrier transshipment to Blantyre.',
    createdAt: Date.now() - 86400000 * 5, // 5 days ago
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    reference: 'REQ-2026-003',
    customerName: 'Dr. Grace Mvula',
    email: 'grace.mvula@example.com',
    phone: '+353 86 222 7619',
    pickupLocation: 'Galway Commercial Park, Ireland',
    destination: 'Mzuzu Regional Hospital, Malawi',
    cargoType: 'Equipment & Pallets',
    cargoDescription: '3 Wooden Crates with solar medical refrigeration units and lab spare parts.',
    quantity: '3 Crates (1.8 CBM / 420 kg)',
    collectionRequired: true,
    preferredDate: '2026-03-12',
    message: 'Medical equipment donation shipment for northern district clinics.',
    status: 'New',
    internalNotes: 'Charity consignment. Reviewing duty exemption certificate under Malawi Customs schedule 4.',
    createdAt: Date.now() - 3600000 * 4, // 4 hours ago
    updatedAt: Date.now() - 3600000 * 4,
  }
];

export const SAMPLE_SHIPMENTS: Shipment[] = [
  {
    id: 'JRLC-2026-IE882MW',
    reference: 'REF-MARITIME-882',
    requestReference: 'REQ-2026-001',
    customerName: 'Chimwemwe Banda',
    customerEmail: 'chimwemwe.banda@example.com',
    customerPhone: '+353 87 555 0192',
    consigneeName: 'Grace Banda',
    consigneeEmail: 'grace.banda@example.com',
    consigneePhone: '+265 99 123 4567',
    origin: 'Dublin Depot, Ireland',
    destination: 'Lilongwe Central Depot, Malawi',
    cargoType: 'Boxes, Drums & Barrels',
    description: '2x 200L Sealed Shipping Barrels with personal effects, dry groceries, and kitchenware.',
    currentStatus: 'In Transit',
    eta: '2026-04-12',
    events: [
      {
        id: 'evt-101',
        status: 'Cargo Received',
        timestamp: Date.now() - 86400000 * 14,
        location: 'Dublin 15, Ireland',
        description: 'Doorstep pickup completed by JR Logistics collection team. Barrels sealed with security tags #IE-8921 and #IE-8922.',
        isPublic: true,
        createdBy: 'Admin'
      },
      {
        id: 'evt-102',
        status: 'Warehouse Processing',
        timestamp: Date.now() - 86400000 * 12,
        location: 'Dublin Central Logistics Hub',
        description: 'Cargo weighed (215kg gross), inspected, customs SAD manifest registered and palletized.',
        isPublic: true,
        createdBy: 'Admin'
      },
      {
        id: 'evt-103',
        status: 'Shipped',
        timestamp: Date.now() - 86400000 * 8,
        location: 'Port of Dublin, Ireland',
        description: 'Vessel MSC ANNA departed Dublin Port on direct maritime feeder route.',
        isPublic: true,
        createdBy: 'Admin'
      },
      {
        id: 'evt-104',
        status: 'In Transit',
        timestamp: Date.now() - 86400000 * 3,
        location: 'South Atlantic Maritime Transit',
        description: 'Ocean carrier en route to transshipment port (Beira corridor). Current ETA 12 April 2026.',
        isPublic: true,
        createdBy: 'Admin'
      }
    ],
    createdAt: Date.now() - 86400000 * 14,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'JRLC-2026-MW109IE',
    reference: 'REF-COMM-109',
    requestReference: 'REQ-2026-002',
    customerName: 'Patrick Phiri',
    customerEmail: 'patrick.phiri@example.com',
    customerPhone: '+353 89 444 8831',
    consigneeName: 'Blantyre Auto Distributors',
    consigneeEmail: 'm.phiri@blantyretrade.mw',
    consigneePhone: '+265 88 765 4321',
    origin: 'Dublin Commercial Terminal, Ireland',
    destination: 'Blantyre Distribution Depot, Malawi',
    cargoType: 'Cars & Motor Vehicles',
    description: '1x 2018 Toyota Hilux 2.8 D-4D Double Cab + Spare wheels & deregistration packet.',
    currentStatus: 'Warehouse Processing',
    eta: '2026-03-28',
    events: [
      {
        id: 'evt-105',
        status: 'Cargo Received',
        timestamp: Date.now() - 86400000 * 25,
        location: 'Dublin Terminal, Ireland',
        description: 'Vehicle received at terminal. Condition inspection report & photographic log recorded.',
        isPublic: true,
        createdBy: 'Admin'
      },
      {
        id: 'evt-106',
        status: 'Shipped',
        timestamp: Date.now() - 86400000 * 20,
        location: 'Port of Dublin, Ireland',
        description: 'Loaded onto RORO carrier.',
        isPublic: true,
        createdBy: 'Admin'
      },
      {
        id: 'evt-107',
        status: 'In Transit',
        timestamp: Date.now() - 86400000 * 5,
        location: 'Port of Beira, Mozambique',
        description: 'Discharged at Beira terminal. Transit bond manifest filed for Mwanza border entry.',
        isPublic: true,
        createdBy: 'Admin'
      },
      {
        id: 'evt-108',
        status: 'Warehouse Processing',
        timestamp: Date.now() - 86400000 * 1,
        location: 'Mwanza Border Post, Malawi',
        description: 'Malawi Revenue Authority (MRA) transit clearance and documentation processing underway.',
        isPublic: true,
        createdBy: 'Admin'
      }
    ],
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'JRLC-2026-MZ440IE',
    reference: 'REF-CHARITY-440',
    requestReference: 'REQ-2026-003',
    customerName: 'Dr. Grace Mvula',
    customerEmail: 'grace.mvula@example.com',
    customerPhone: '+353 86 222 7619',
    consigneeName: 'Mzuzu Central Hospital Dispatch',
    consigneeEmail: 'logistics@mzuzuhospital.mw',
    consigneePhone: '+265 13 332 990',
    origin: 'Galway Logistics Park, Ireland',
    destination: 'Mzuzu Regional Hub, Malawi',
    cargoType: 'Equipment & Pallets',
    description: '3 Crates with solar medical refrigeration units and lab spare parts.',
    currentStatus: 'Delivered',
    eta: '2026-02-28',
    events: [
      {
        id: 'evt-201',
        status: 'Cargo Received',
        timestamp: Date.now() - 86400000 * 35,
        location: 'Galway, Ireland',
        description: 'Collected from medical supply depot.',
        isPublic: true,
        createdBy: 'Admin'
      },
      {
        id: 'evt-202',
        status: 'Shipped',
        timestamp: Date.now() - 86400000 * 28,
        location: 'Dublin Port, Ireland',
        description: 'Vessel departure confirmed.',
        isPublic: true,
        createdBy: 'Admin'
      },
      {
        id: 'evt-203',
        status: 'Arrived',
        timestamp: Date.now() - 86400000 * 4,
        location: 'Lilongwe Hub, Malawi',
        description: 'Arrived at central distribution hub.',
        isPublic: true,
        createdBy: 'Admin'
      },
      {
        id: 'evt-204',
        status: 'Delivered',
        timestamp: Date.now() - 86400000 * 2,
        location: 'Mzuzu Regional Hub, Malawi',
        description: 'Handed over and proof of delivery signed by hospital consignee Dr. Mvula representative.',
        isPublic: true,
        createdBy: 'Admin'
      }
    ],
    createdAt: Date.now() - 86400000 * 35,
    updatedAt: Date.now() - 86400000 * 2,
  }
];

export async function seedSampleData(): Promise<{ requestsCount: number; shipmentsCount: number }> {
  let requestsCount = 0;
  let shipmentsCount = 0;

  try {
    for (const req of SAMPLE_REQUESTS) {
      await setDoc(doc(db, 'requests', req.reference), req);
      requestsCount++;
    }

    for (const ship of SAMPLE_SHIPMENTS) {
      await setDoc(doc(db, 'shipments', ship.id), ship);
      shipmentsCount++;
    }

    return { requestsCount, shipmentsCount };
  } catch (err) {
    console.error('Error seeding sample consignments:', err);
    throw err;
  }
}
