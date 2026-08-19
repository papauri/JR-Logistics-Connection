import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc, query, orderBy } from 'firebase/firestore';
import type { LegalDocument } from '../types';

export const DEFAULT_LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: 'shipping-terms',
    title: 'Terms & Conditions of Carriage',
    subtitle: 'Standard Freight Forwarding & Bill of Lading Conditions (Ireland to Africa / Malawi)',
    category: 'Operations & Carriage',
    version: 'v2.4',
    lastUpdated: 'February 2026',
    summaryPoints: [
      'Applies to all sea, air, and overland cargo booked through JR Logistics Connection from Ireland.',
      'Shippers must provide accurate consignment declarations, packing lists, and consignee contact details.',
      'Carrier reserves the right to inspect, weigh, and verify all packages prior to container stuffing.',
      'Transit times provided are estimates and subject to maritime weather, shipping lines, and port schedules.'
    ],
    updatedAt: Date.now(),
    content: `## 1. Application and Scope of Agreement
These Standard Terms and Conditions of Carriage govern all freight forwarding, logistics, warehousing, consolidation, and transport services arranged or executed by **JR Logistics Connection** ("the Carrier", "we", "us") for the Shipper ("Customer", "Consignor"). By submitting a quote request, booking collection, or handing over cargo to our depot in Ireland, the Shipper unconditionally accepts these terms.

## 2. Shipper's Declarations and Cargo Packaging
1. **Accurate Description:** The Shipper warrants that all goods presented for carriage are fully and accurately described in all documentation, invoices, and packing manifests.
2. **Packaging Integrity:** All items must be packed, secured, and sealed appropriately for international maritime and multimodal transport. Fragile, glass, or sensitive electronic items must have internal cushioning and heavy-duty external casing.
3. **Weight and Measurement:** The Carrier reserves the absolute right to re-weigh and re-measure cargo at our Dublin depot. Freight charges will be billed based on the higher of actual gross weight or volumetric weight.

## 3. Transit Schedules and Delays
- All published schedules, sailing dates, and Estimated Times of Arrival (ETA) are indicative estimates provided in good faith.
- The Carrier shall not be liable for direct, indirect, or consequential financial loss resulting from delays caused by maritime weather disruptions, port congestion, customs clearance holds, carrier vessel cancellations, or strikes.

## 4. Freight Charges, Payment, and Demurrage
1. Freight fees, handling charges, and agreed collection fees must be settled prior to container dispatch from Ireland, unless a credit agreement has been formally executed in writing.
2. The Carrier exercises a contractual general lien over all goods in our possession for unpaid freight, customs duties, storage, or handling fees.

## 5. Delivery and Consignee Collection
- Cargo consigned to our destination depots (including Lilongwe and Blantyre, Malawi) must be collected by the verified consignee presenting valid government-issued photographic identification and original tracking reference details.
- Doorstep deliveries require unhindered vehicular access. Where access is restricted, delivery will be effected to the nearest safe unloading point.`
  },
  {
    id: 'customs-prohibited',
    title: 'Customs Compliance & Prohibited Items',
    subtitle: 'Import Regulations, MRA Compliance, and Restricted Cargo Guidelines',
    category: 'Customs & Regulatory',
    version: 'v2.1',
    lastUpdated: 'February 2026',
    summaryPoints: [
      'Zero tolerance for narcotics, undeclared lithium batteries, weapons, ammunition, or contraband.',
      'Full compliance with Irish Revenue Commissioners export laws and Malawi Revenue Authority (MRA) import tariff regulations.',
      'Undeclared or prohibited items will be confiscated by border authorities without compensation, and the Shipper remains solely liable.',
      'Commercial shipments must provide authentic commercial invoices and origin certificates.'
    ],
    updatedAt: Date.now(),
    content: `## 1. Statutory Compliance
JR Logistics Connection operates in strict compliance with the **Irish Revenue Commissioners**, **European Union Export Controls**, and the **Malawi Revenue Authority (MRA)** customs directives.

## 2. Strictly Prohibited Goods (Zero Tolerance)
The following items are strictly forbidden from being shipped under any circumstances:
- **Weapons and Ammunition:** Firearms, replica weapons, ammunition, explosives, fireworks, and tactical gear.
- **Narcotics and Controlled Substances:** Illegal drugs, undeclared pharmaceuticals, and unprescribed medicines.
- **Flammable and Hazardous Materials:** Gas cylinders, aerosol sprays, corrosive chemicals, paints, solvents, and fuel.
- **Counterfeit Goods & Currency:** Pirated goods, fake currencies, unapproved cash remittances, and precious metals without export licenses.
- **Perishable Foodstuff & Plants:** Fresh meats, untreated soil, and unprocessed biological materials subject to phytosanitary quarantine.

## 3. Restricted Items (Advance Permission Required)
The following items require prior written declaration, manufacturer Safety Data Sheets (SDS), and authorization:
1. **Lithium-Ion Batteries:** Standalone power banks, loose batteries, and high-capacity battery packs.
2. **Motor Vehicles and Machinery:** Requires original vehicle logbooks (VRC), deregistration certificates, and engine degreasing certificates.
3. **Commercial Cargo & Machinery:** Subject to standard MRA valuation and customs duty assessment upon arrival in Malawi.

## 4. Shipper Liability for False Declarations
- Any shipper attempting to conceal prohibited or undeclared goods will be reported to statutory law enforcement authorities.
- The Shipper agrees to indemnify and hold harmless JR Logistics Connection against all fines, penalties, legal costs, or container seizure fees incurred due to non-compliant cargo.`
  },
  {
    id: 'insurance-liability',
    title: 'Cargo Insurance & Carrier Liability',
    subtitle: 'Valuation, Hague-Visby Standard Liability, and Marine Transit Cover',
    category: 'Insurance & Claims',
    version: 'v1.8',
    lastUpdated: 'February 2026',
    summaryPoints: [
      'Carrier liability is strictly limited under international maritime conventions (Hague-Visby Rules).',
      'Comprehensive Marine All-Risk Transit Insurance is strongly recommended for high-value cargo and vehicles.',
      'Claims for visible external damage or loss must be noted on the delivery receipt and lodged within 7 days.',
      'Indirect, incidental, or consequential economic losses are strictly excluded from liability.'
    ],
    updatedAt: Date.now(),
    content: `## 1. Limitation of Carrier Liability
Unless additional comprehensive marine transit insurance is explicitly purchased, the Carrier's statutory liability for loss or physical damage to cargo is strictly limited in accordance with the **Hague-Visby Rules** and the **Convention on the Contract for the International Carriage of Goods by Road (CMR)** where applicable, capped at a maximum of **€2.00 per gross kilogram** of the affected goods.

## 2. Optional Marine All-Risk Transit Insurance
1. Shippers are strongly advised to purchase optional **All-Risk Marine Cargo Insurance** prior to shipment departure.
2. Insurance premiums are calculated based on the declared commercial value of the consignment plus freight costs.
3. High-value electronics, vehicles, industrial machinery, and personal estates must submit a declared valuation schedule.

## 3. Notice of Claims and Protocol
- **Visible Damage or Shortage:** Must be noted on the official Proof of Delivery (POD) / Collection Receipt in the presence of the depot supervisor or delivery driver.
- **Written Notice Window:** Formal written notice with photographic evidence must be submitted to \`claims@jrlogistics.example.com\` within **7 days** of cargo receipt.
- **Required Documentation:** Valid claims require: (a) Original tracking reference, (b) Commercial purchase invoice or receipt, (c) Photos of damaged item and packaging, and (d) Incident description.`
  },
  {
    id: 'storage-collection',
    title: 'Collection & Depot Storage Policy',
    subtitle: 'Dublin Door-to-Door Pickup, Free Storage Allowances, and Demurrage',
    category: 'Depot & Storage',
    version: 'v2.0',
    lastUpdated: 'February 2026',
    summaryPoints: [
      'Door collection service operates across Dublin and surrounding counties by prior appointment.',
      '14 days of free storage provided at destination depots (Lilongwe and Blantyre) upon arrival.',
      'Demurrage storage fees apply after the free period at €5 / $6 / MK 8,500 per day per pallet/barrel.',
      'Cargo uncollected after 60 calendar days is deemed abandoned and subject to recovery auction.'
    ],
    updatedAt: Date.now(),
    content: `## 1. Dublin Collection Service
- Doorstep and warehouse collection is available throughout Dublin and surrounding regions.
- Shippers must ensure all cargo is packaged and ready at ground level or accessible by elevator at the scheduled pickup window.
- Failed collection attempts due to shipper unavailability or unprepared cargo may incur a re-booking fee.

## 2. Depot Storage & Free Grace Period
1. **Origin Hub (Dublin):** Up to **14 calendar days** of complimentary storage is provided while awaiting container consolidation.
2. **Destination Hubs (Lilongwe / Blantyre):** Consignees receive **14 calendar days** of free storage starting from the date the status changes to *"Ready for Collection"*.

## 3. Demurrage and Storage Surcharges
- After the initial 14-day free grace period, daily storage fees of **€5.00 / MWK 8,500 per piece/pallet/day** will accrue.
- Accrued storage charges must be fully settled prior to the release of cargo.

## 4. Abandoned Cargo Policy
Cargo remaining uncollected after **60 calendar days** from the initial arrival notification, without written extension agreement, will be deemed abandoned. The Carrier reserves the right to dispose of or auction the goods to recover unpaid freight and storage costs.`
  },
  {
    id: 'privacy-policy',
    title: 'Privacy & Data Protection Policy',
    subtitle: 'GDPR Compliance (Ireland/EU) and Consignee Data Processing Guidelines',
    category: 'Privacy & Compliance',
    version: 'v2.2',
    lastUpdated: 'February 2026',
    summaryPoints: [
      'We process sender and recipient personal data solely for freight forwarding, customs clearance, and delivery.',
      'Compliant with EU GDPR (Regulation 2016/679) and national Data Protection legislation.',
      'Your tracking reference and contact details are securely handled and never sold to third-party advertisers.',
      'Customers may request data access, rectification, or deletion in accordance with statutory retention mandates.'
    ],
    updatedAt: Date.now(),
    content: `## 1. Data Controller
JR Logistics Connection acts as the Data Controller responsible for the secure collection and processing of personal data provided by shippers and consignees.

## 2. Information We Collect
To process international freight bookings and customs clearance, we collect:
- Sender name, physical collection address, email, and phone number.
- Consignee name, destination address, email, WhatsApp contact number, and identification details for customs.
- Cargo manifests, commercial values, and tracking event histories.

## 3. Lawful Basis and Purpose of Processing
1. **Performance of Contract:** To organize transport, provide real-time tracking updates, and effect cargo delivery.
2. **Legal and Customs Compliance:** Mandatory reporting to Irish Revenue Commissioners and Malawi Revenue Authority (MRA).

## 4. Security and Retention
- All electronic customer records are encrypted and stored within secure cloud databases.
- Shipping documentation is retained for the statutory period required by international customs and maritime law (7 years).
- For privacy inquiries or data rights requests, email our data privacy desk at \`privacy@jrlogistics.example.com\`.`
  }
];

// Fetch or seed legal documents in Firestore
export async function getOrSeedLegalDocuments(): Promise<LegalDocument[]> {
  try {
    const colRef = collection(db, 'legal_documents');
    const snap = await getDocs(query(colRef, orderBy('id', 'asc')));

    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as LegalDocument));
    }

    // Seed defaults into Firestore
    for (const docItem of DEFAULT_LEGAL_DOCUMENTS) {
      await setDoc(doc(db, 'legal_documents', docItem.id), docItem);
    }
    return DEFAULT_LEGAL_DOCUMENTS;
  } catch (err) {
    console.error('Error fetching/seeding legal documents:', err);
    return DEFAULT_LEGAL_DOCUMENTS;
  }
}

export async function saveLegalDocument(document: LegalDocument): Promise<void> {
  const docRef = doc(db, 'legal_documents', document.id);
  await setDoc(docRef, {
    ...document,
    updatedAt: Date.now()
  });
}
