import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { CustomerRequest, Shipment, ClientProfile } from '../types';

export async function fetchAllClients(): Promise<ClientProfile[]> {
  try {
    const [requestsSnap, shipmentsSnap] = await Promise.all([
      getDocs(query(collection(db, 'requests'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'shipments'), orderBy('createdAt', 'desc')))
    ]);

    const requests = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() } as CustomerRequest));
    const shipments = shipmentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Shipment));

    const clientMap = new Map<string, ClientProfile>();

    // Helper to get or create client bucket
    const getOrCreateClient = (key: string, defaultName: string, email: string, phone?: string, location?: string): ClientProfile => {
      const normKey = key.trim().toLowerCase();
      if (!clientMap.has(normKey)) {
        clientMap.set(normKey, {
          id: normKey,
          name: defaultName || 'Client',
          email: email || normKey,
          phone: phone || '',
          location: location || '',
          totalRequests: 0,
          totalShipments: 0,
          activeShipments: 0,
          totalEstimatedValue: 0,
          lastActivity: Date.now(),
          requests: [],
          shipments: []
        });
      }
      return clientMap.get(normKey)!;
    };

    // 1. Process Requests
    requests.forEach(req => {
      const email = req.email?.trim().toLowerCase();
      const clientKey = email || (req.customerName ? `name-${req.customerName.trim().toLowerCase()}` : `req-${req.reference}`);
      const client = getOrCreateClient(clientKey, req.customerName, req.email, req.phone, req.pickupLocation);

      client.totalRequests += 1;
      client.requests.push(req);
      if (req.quotedAmount) {
        client.totalEstimatedValue = (client.totalEstimatedValue || 0) + req.quotedAmount;
      }
      if (req.customerName && (client.name === 'Client' || !client.name)) {
        client.name = req.customerName;
      }
      if (req.phone && !client.phone) {
        client.phone = req.phone;
      }
      if (req.pickupLocation && !client.location) {
        client.location = req.pickupLocation;
      }
      if (req.createdAt && req.createdAt > client.lastActivity) {
        client.lastActivity = req.createdAt;
      }
    });

    // 2. Process Shipments (Link to existing client by email, requestRef, consignee email, or name)
    shipments.forEach(ship => {
      let targetClient: ClientProfile | null = null;

      // 2a. Match by customerEmail
      if (ship.customerEmail) {
        const norm = ship.customerEmail.trim().toLowerCase();
        if (clientMap.has(norm)) {
          targetClient = clientMap.get(norm)!;
        } else {
          targetClient = getOrCreateClient(norm, ship.customerName || 'Shipper', ship.customerEmail, ship.customerPhone, ship.origin);
        }
      }

      // 2b. Match by linked quote request reference
      if (!targetClient && ship.requestReference) {
        for (const c of clientMap.values()) {
          if (c.requests.some(r => r.reference === ship.requestReference)) {
            targetClient = c;
            break;
          }
        }
      }

      // 2c. Match by consigneeEmail
      if (!targetClient && ship.consigneeEmail) {
        const norm = ship.consigneeEmail.trim().toLowerCase();
        if (clientMap.has(norm)) {
          targetClient = clientMap.get(norm)!;
        }
      }

      // 2d. Match by customerName
      if (!targetClient && ship.customerName) {
        const nameKey = `name-${ship.customerName.trim().toLowerCase()}`;
        if (clientMap.has(nameKey)) {
          targetClient = clientMap.get(nameKey)!;
        } else {
          // Check if any client has this name
          for (const c of clientMap.values()) {
            if (c.name.toLowerCase() === ship.customerName.toLowerCase()) {
              targetClient = c;
              break;
            }
          }
        }
      }

      // 2e. If still no client bucket, create a standalone client bucket so NO shipment is lost
      if (!targetClient) {
        const fallbackKey = ship.customerEmail?.toLowerCase() || (ship.customerName ? `name-${ship.customerName.toLowerCase()}` : `ship-${ship.id}`);
        targetClient = getOrCreateClient(
          fallbackKey,
          ship.customerName || `Client (${ship.id})`,
          ship.customerEmail || '',
          ship.customerPhone || '',
          ship.origin
        );
      }

      // Avoid duplicate push
      if (!targetClient.shipments.some(s => s.id === ship.id)) {
        targetClient.totalShipments += 1;
        if (!['Delivered', 'Closed'].includes(ship.currentStatus)) {
          targetClient.activeShipments += 1;
        }
        targetClient.shipments.push(ship);
      }

      if (ship.updatedAt && ship.updatedAt > targetClient.lastActivity) {
        targetClient.lastActivity = ship.updatedAt;
      }
    });

    // Convert map to sorted array by latest activity
    const clients = Array.from(clientMap.values()).sort((a, b) => b.lastActivity - a.lastActivity);
    return clients;
  } catch (err) {
    console.error('Error fetching clients:', err);
    return [];
  }
}
