import { db } from './firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Shipment, CustomerRequest } from '../types';

export interface TrackingResult {
  type?: 'shipment' | 'request';
  shipment: Shipment | null;
  request: CustomerRequest | null;
  linkedShipment: Shipment | null;
  isVerified: boolean;
  registeredEmails: string[];
  matchedEmail?: string;
  error?: string;
}

/**
 * Searches for a shipment or quote request by reference code and validates against a provided email if supplied.
 */
export async function lookupAndValidateTracking(
  searchCode: string,
  verificationEmail?: string
): Promise<TrackingResult> {
  const code = searchCode.trim().toUpperCase();
  if (!code) {
    return { shipment: null, request: null, linkedShipment: null, isVerified: false, registeredEmails: [], error: 'Please provide a valid reference code.' };
  }

  const cleanEmail = verificationEmail ? verificationEmail.trim().toLowerCase() : '';
  const result: TrackingResult = {
    shipment: null,
    request: null,
    linkedShipment: null,
    isVerified: false,
    registeredEmails: [],
  };

  try {
    // 1. Direct Shipment Document by ID
    const shipmentDocRef = doc(db, 'shipments', code);
    const shipmentDocSnap = await getDoc(shipmentDocRef);

    if (shipmentDocSnap.exists()) {
      result.shipment = { id: shipmentDocSnap.id, ...shipmentDocSnap.data() } as Shipment;
    } else {
      // 2. Query shipments by reference or requestReference
      const shipmentRefQuery = query(collection(db, 'shipments'), where('reference', '==', code));
      const shipmentRefSnap = await getDocs(shipmentRefQuery);
      if (!shipmentRefSnap.empty) {
        const docData = shipmentRefSnap.docs[0];
        result.shipment = { id: docData.id, ...docData.data() } as Shipment;
      } else {
        const shipmentReqRefQuery = query(collection(db, 'shipments'), where('requestReference', '==', code));
        const shipmentReqRefSnap = await getDocs(shipmentReqRefQuery);
        if (!shipmentReqRefSnap.empty) {
          const docData = shipmentReqRefSnap.docs[0];
          result.shipment = { id: docData.id, ...docData.data() } as Shipment;
        }
      }
    }

    // 3. Query quote requests collection by reference
    const requestQuery = query(collection(db, 'requests'), where('reference', '==', code));
    const requestSnap = await getDocs(requestQuery);

    if (!requestSnap.empty) {
      result.request = { id: requestSnap.docs[0].id, ...requestSnap.docs[0].data() } as CustomerRequest;
    } else if (!result.shipment) {
      // Check request by document ID
      try {
        const reqDocRef = doc(db, 'requests', code);
        const reqDocSnap = await getDoc(reqDocRef);
        if (reqDocSnap.exists()) {
          result.request = { id: reqDocSnap.id, ...reqDocSnap.data() } as CustomerRequest;
        }
      } catch {
        // Non-blocking
      }
    }

    if (result.shipment) {
      result.type = 'shipment';
    } else if (result.request) {
      result.type = 'request';
    }

    // If request was found, check if there's a linked shipment
    if (result.request && !result.shipment) {
      try {
        const linkedQuery = query(collection(db, 'shipments'), where('requestReference', '==', result.request.reference));
        const linkedSnap = await getDocs(linkedQuery);
        if (!linkedSnap.empty) {
          result.linkedShipment = { id: linkedSnap.docs[0].id, ...linkedSnap.docs[0].data() } as Shipment;
        }
      } catch {
        // Non-blocking
      }
    }

    // If neither shipment nor request found
    if (!result.shipment && !result.request) {
      result.error = `No consignment or quote found for reference "${code}". Please check your tracking number and try again.`;
      return result;
    }

    // 4. Gather all registered emails associated with this record in the database
    const emails = new Set<string>();
    if (result.shipment?.customerEmail) emails.add(result.shipment.customerEmail.trim().toLowerCase());
    if (result.shipment?.consigneeEmail) emails.add(result.shipment.consigneeEmail.trim().toLowerCase());
    if (result.request?.email) emails.add(result.request.email.trim().toLowerCase());
    if (result.linkedShipment?.customerEmail) emails.add(result.linkedShipment.customerEmail.trim().toLowerCase());
    if (result.linkedShipment?.consigneeEmail) emails.add(result.linkedShipment.consigneeEmail.trim().toLowerCase());

    result.registeredEmails = Array.from(emails);

    // 5. Verification validation logic against database
    if (cleanEmail) {
      if (emails.has(cleanEmail)) {
        result.isVerified = true;
        result.matchedEmail = cleanEmail;
      } else {
        result.isVerified = false;
        result.error = `Email Verification: "${cleanEmail}" does not match the registered consignor or consignee email address on file for reference ${code}.`;
      }
    }

    return result;
  } catch (err: any) {
    console.error('Tracking query error:', err);
    result.error = 'An error occurred during database tracking validation. Please try again.';
    return result;
  }
}
