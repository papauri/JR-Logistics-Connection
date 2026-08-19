import { useState, useEffect } from 'react';
import { 
  getFreightPricing, 
  saveFreightPricing, 
  resetFreightPricingToDefaults, 
  subscribeFreightPricing,
  DEFAULT_FREIGHT_PRICING 
} from '../data/pricingService';
import type { FreightPricingConfig, ServiceAddonConfig } from '../types';
import type { FreightMainCategory, FreightSubOption } from '../data/freightCategories';
import toast from 'react-hot-toast';

export function usePricing() {
  const [pricing, setPricing] = useState<FreightPricingConfig>(DEFAULT_FREIGHT_PRICING);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    // Initial fetch
    getFreightPricing().then(data => {
      setPricing(data);
      setLoading(false);
    });

    // Real-time updates subscription
    const unsubscribe = subscribeFreightPricing((newPricing) => {
      setPricing(newPricing);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updatePricing = async (updated: FreightPricingConfig, adminEmail?: string) => {
    setSaving(true);
    try {
      await saveFreightPricing(updated, adminEmail);
      setPricing(updated);
      toast.success('Freight pricing & add-ons saved successfully!');
      return true;
    } catch (error) {
      console.error(error);
      toast.error('Failed to save freight pricing');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async (adminEmail?: string) => {
    setSaving(true);
    try {
      const defs = await resetFreightPricingToDefaults(adminEmail);
      setPricing(defs);
      toast.success('Reset all freight tariffs & add-ons to default rates');
      return true;
    } catch (error) {
      console.error(error);
      toast.error('Failed to reset pricing');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleAddon = async (addonKey: string, enabled: boolean, adminEmail?: string) => {
    if (!pricing.addons[addonKey]) return;
    const updatedAddons = {
      ...pricing.addons,
      [addonKey]: {
        ...pricing.addons[addonKey],
        enabled
      }
    };
    const updatedPricing: FreightPricingConfig = {
      ...pricing,
      addons: updatedAddons
    };
    await updatePricing(updatedPricing, adminEmail);
  };

  return {
    pricing,
    loading,
    saving,
    updatePricing,
    resetToDefaults,
    toggleAddon,
    categories: pricing.categories,
    addons: pricing.addons,
    currencyRates: pricing.currencyRates
  };
}
