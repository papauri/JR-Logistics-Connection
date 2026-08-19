import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { FREIGHT_MAIN_CATEGORIES, type FreightMainCategory, type FreightSubOption } from './freightCategories';
import type { FreightPricingConfig, ServiceAddonConfig } from '../types';

export const DEFAULT_SERVICE_ADDONS: Record<string, ServiceAddonConfig> = {
  dublinCollection: {
    id: 'dublinCollection',
    name: 'Dublin Door-to-Door Collection Service',
    description: 'Driver collection directly from your Dublin residential or commercial address',
    enabled: true,
    rateEur: 50,
    rateUsd: 55,
    rateMwk: 92500,
    calculationType: 'flat'
  },
  marineInsurance: {
    id: 'marineInsurance',
    name: 'Comprehensive Marine Transit Insurance',
    description: 'All-risk cargo coverage against loss, damage, or maritime general average',
    enabled: true,
    calculationType: 'percentage',
    percentage: 0.035, // 3.5%
    minRateEur: 40,
    minRateUsd: 45,
    minRateMwk: 74000,
    rateEur: 40,
    rateUsd: 45,
    rateMwk: 74000
  },
  customsDocumentation: {
    id: 'customsDocumentation',
    name: 'Export Clearance & Malawi Bill of Lading Docs',
    description: 'Export customs filing, manifest registration, and official consignee release paperwork',
    enabled: true,
    rateEur: 45,
    rateUsd: 50,
    rateMwk: 83000,
    calculationType: 'flat'
  },
  vehicleTowing: {
    id: 'vehicleTowing',
    name: 'Vehicle Pick up / Towing',
    description: 'Specialized vehicle recovery or pick-up service directly from your driveway',
    enabled: true,
    rateEur: 150,
    rateUsd: 165,
    rateMwk: 277500,
    calculationType: 'flat'
  },
  containerHaulage: {
    id: 'containerHaulage',
    name: 'Container Terminal Haulage',
    description: 'Haulage of container from loading site to departure terminal',
    enabled: true,
    rateEur: 350,
    rateUsd: 385,
    rateMwk: 647500,
    calculationType: 'flat'
  }
};

export const DEFAULT_FREIGHT_PRICING: FreightPricingConfig = {
  id: 'global_freight_pricing',
  categories: JSON.parse(JSON.stringify(FREIGHT_MAIN_CATEGORIES)),
  addons: JSON.parse(JSON.stringify(DEFAULT_SERVICE_ADDONS)),
  currencyRates: {
    usdPerEur: 1.10,
    mwkPerEur: 1850
  },
  updatedAt: Date.now()
};

// In-memory cache for fast synchronous rendering
let cachedPricing: FreightPricingConfig = DEFAULT_FREIGHT_PRICING;

export function getCachedPricing(): FreightPricingConfig {
  return cachedPricing;
}

/**
 * Fetch freight pricing from Firestore document `settings/freight_pricing`.
 * If document doesn't exist, saves and returns defaults.
 */
export async function getFreightPricing(): Promise<FreightPricingConfig> {
  try {
    const docRef = doc(db, 'settings', 'freight_pricing');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as FreightPricingConfig;
      // Merge with defaults to ensure any newly introduced fields exist
      const merged: FreightPricingConfig = {
        id: 'global_freight_pricing',
        categories: (data.categories && data.categories.length > 0) ? data.categories : DEFAULT_FREIGHT_PRICING.categories,
        addons: {
          ...DEFAULT_FREIGHT_PRICING.addons,
          ...(data.addons || {})
        },
        currencyRates: data.currencyRates || DEFAULT_FREIGHT_PRICING.currencyRates,
        updatedAt: data.updatedAt || Date.now(),
        updatedBy: data.updatedBy
      };
      cachedPricing = merged;
      return merged;
    } else {
      // Seed default pricing
      await setDoc(docRef, DEFAULT_FREIGHT_PRICING);
      cachedPricing = DEFAULT_FREIGHT_PRICING;
      return DEFAULT_FREIGHT_PRICING;
    }
  } catch (error) {
    console.warn('Error fetching freight pricing, using defaults:', error);
    return cachedPricing;
  }
}

/**
 * Save updated pricing and add-on configuration to Firestore.
 */
export async function saveFreightPricing(config: FreightPricingConfig, adminEmail?: string): Promise<void> {
  const docRef = doc(db, 'settings', 'freight_pricing');
  const payload: FreightPricingConfig = {
    ...config,
    updatedAt: Date.now(),
    updatedBy: adminEmail || 'Admin'
  };
  await setDoc(docRef, payload);
  cachedPricing = payload;
}

/**
 * Reset all tariffs and add-ons back to factory defaults.
 */
export async function resetFreightPricingToDefaults(adminEmail?: string): Promise<FreightPricingConfig> {
  const resetConfig: FreightPricingConfig = {
    id: 'global_freight_pricing',
    categories: JSON.parse(JSON.stringify(FREIGHT_MAIN_CATEGORIES)),
    addons: JSON.parse(JSON.stringify(DEFAULT_SERVICE_ADDONS)),
    currencyRates: {
      usdPerEur: 1.10,
      mwkPerEur: 1850
    },
    updatedAt: Date.now(),
    updatedBy: adminEmail || 'Admin'
  };
  const docRef = doc(db, 'settings', 'freight_pricing');
  await setDoc(docRef, resetConfig);
  cachedPricing = resetConfig;
  return resetConfig;
}

/**
 * Real-time listener for freight pricing updates across tabs and client devices.
 */
export function subscribeFreightPricing(callback: (pricing: FreightPricingConfig) => void): () => void {
  const docRef = doc(db, 'settings', 'freight_pricing');
  const unsubscribe = onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as FreightPricingConfig;
      const merged: FreightPricingConfig = {
        id: 'global_freight_pricing',
        categories: (data.categories && data.categories.length > 0) ? data.categories : DEFAULT_FREIGHT_PRICING.categories,
        addons: {
          ...DEFAULT_FREIGHT_PRICING.addons,
          ...(data.addons || {})
        },
        currencyRates: data.currencyRates || DEFAULT_FREIGHT_PRICING.currencyRates,
        updatedAt: data.updatedAt || Date.now(),
        updatedBy: data.updatedBy
      };
      cachedPricing = merged;
      callback(merged);
    } else {
      callback(DEFAULT_FREIGHT_PRICING);
    }
  }, (err) => {
    console.warn('Pricing snapshot listener error:', err);
    callback(cachedPricing);
  });

  return unsubscribe;
}
