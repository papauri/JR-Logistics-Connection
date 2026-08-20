import { z } from 'zod';

export type UserRole = 'ADMIN';

export interface ActivityLog {
  id: string;
  actionType: 'UPDATE_SHIPMENT' | 'UPDATE_FINANCIALS' | 'UPDATE_SETTINGS' | 'UPDATE_DOCUMENT' | 'CREATE_SHIPMENT' | 'DELETE_SHIPMENT' | 'OTHER';
  entityId: string;
  entityType: 'shipment' | 'request' | 'settings' | 'document' | 'other';
  description: string;
  userId: string;
  userName: string;
  timestamp: number;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: number;
}

export interface Review {
  author: string;
  location: string;
  text: string;
  imageUrl?: string;
  published?: boolean;
}

export interface ShippingCategory {
  id: string;
  name: string;
  pricingType: 'per_kg' | 'flat_rate';
  rateEur: number;
  rateUsd: number;
  rateMwk: number;
  isBulky?: boolean;
}

export interface ServiceAddonConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rateEur: number;
  rateUsd: number;
  rateMwk: number;
  calculationType: 'flat' | 'percentage';
  percentage?: number; // e.g. 0.035 for 3.5%
  minRateEur?: number;
  minRateUsd?: number;
  minRateMwk?: number;
}

export interface FreightPricingConfig {
  id?: string;
  categories: import('./data/freightCategories').FreightMainCategory[];
  addons: Record<string, ServiceAddonConfig>;
  currencyRates: {
    usdPerEur: number;
    mwkPerEur: number;
    gbpPerEur?: number;
    zarPerEur?: number;
  };
  updatedAt: number;
  updatedBy?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  published: boolean;
}

export interface SiteSettings {
  companyName: string;
  tradingName: string;
  registrationNumber: string;
  address: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  collectionStartingPrice: number;
  currency: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  logoUrl?: string;
  galleryImages: string[];
  reviews: Review[];
  faqs?: FAQ[];
  shippingCategories?: ShippingCategory[];
  freightPricing?: FreightPricingConfig;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    iban: string;
    bic: string;
  };
  vatEnabled?: boolean;
  vatRate?: number;
  enabledCurrencies?: string[];
  isUnderConstruction?: boolean;
  updatedAt: number;
}

export type RequestStatus = 'New' | 'Contacted' | 'Quoted' | 'Invoiced' | 'Paid' | 'Collection Scheduled' | 'Booked' | 'Completed' | 'Closed' | 'Spam';

export interface CustomerRequest {
  id?: string;
  reference: string;
  customerName: string;
  email: string;
  phone: string;
  pickupLocation: string;
  destination: string;
  cargoType: string;
  cargoDescription: string;
  quantity: string;
  collectionRequired: boolean;
  selectedAddons?: Record<string, boolean>;
  preferredDate?: string;
  message?: string;
  status: RequestStatus;
  quotedAmount?: number;
  currency?: string;
  invoiceNumber?: string;
  invoiceStatus?: 'Not Invoiced' | 'Issued' | 'Paid' | 'Partially Paid' | 'Cancelled';
  depositPaid?: number;
  quoteNotes?: string;
  linkedShipmentId?: string;
  internalNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export type ShipmentStatus = 'Booking Received' | 'Cargo Received' | 'Warehouse Processing' | 'Shipped' | 'In Transit' | 'Arrived' | 'Ready for Collection' | 'Delivered' | 'Delayed' | 'Exception';

export interface ShipmentEvent {
  id: string;
  status: ShipmentStatus;
  timestamp: number;
  location?: string;
  description: string;
  internalNote?: string;
  isPublic: boolean;
  createdBy: string;
}

export interface TrackingTemplate {
  id?: string;
  title: string;
  status: ShipmentStatus;
  location?: string;
  description: string;
  isPublic: boolean;
  category?: string;
  createdAt?: number;
}

export interface LegalDocument {
  id: string; // slug e.g. 'shipping-terms', 'customs-prohibited', 'insurance-liability', 'privacy-policy', 'storage-collection'
  title: string;
  subtitle: string;
  category: string;
  version: string;
  lastUpdated: string;
  summaryPoints: string[];
  content: string; // Markdown formatted
  updatedAt: number;
}

export interface Shipment {
  id: string; // The Tracking Number acts as the ID (e.g., JRLC-2026-8F42K)
  reference: string;
  requestReference?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  consigneeName?: string;
  consigneeEmail?: string;
  consigneePhone?: string;
  origin: string;
  destination: string;
  cargoType: string;
  description: string;
  eta?: string;
  currentStatus: ShipmentStatus;
  publicNotes?: string;
  internalNotes?: string;
  events: ShipmentEvent[];
  createdAt: number;
  updatedAt: number;
}

export interface ClientProfile {
  id: string; // Email or generated ID
  name: string;
  email: string;
  phone: string;
  location?: string;
  totalRequests: number;
  totalShipments: number;
  activeShipments: number;
  totalEstimatedValue?: number;
  lastActivity: number;
  requests: CustomerRequest[];
  shipments: Shipment[];
}

export interface Testimonial {
  id?: string;
  customerName: string;
  location: string;
  cargoType: string;
  story: string;
  imageUrl?: string;
  published: boolean;
  featured: boolean;
  displayOrder: number;
  createdAt: number;
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';

export interface Quote {
  id?: string;
  quoteNumber: string;
  requestReference: string;
  customerName: string;
  email: string;
  origin: string;
  destination: string;
  cargoDescription: string;
  collectionFee: number;
  shippingFee: number;
  additionalFees: number;
  total: number;
  currency: string;
  validUntil: number;
  notes?: string;
  status: QuoteStatus;
  createdAt: number;
  updatedAt: number;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';

export interface Invoice {
  id?: string;
  invoiceNumber: string;
  quoteReference?: string;
  customerName: string;
  email: string;
  description: string;
  total: number;
  currency: string;
  dueDate: number;
  paymentInstructions?: string;
  status: InvoiceStatus;
  createdAt: number;
  updatedAt: number;
}

export type ScheduleStatus = 'Active' | 'Completed' | 'Cancelled';

export interface ShipmentSchedule {
  id?: string;
  destination: string;
  shipmentDate: string; // ISO date string or formatted date
  cutoffDate: string; // ISO date string or formatted date
  status: ScheduleStatus;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type ContactMessageStatus = 'New' | 'Read' | 'Responded' | 'Archived';

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: number;
  updatedAt: number;
}
