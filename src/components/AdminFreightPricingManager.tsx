import { useState, useEffect } from 'react';
import { 
  Package, 
  Car, 
  Scale, 
  Layers, 
  Container as ContainerIcon, 
  Plane,
  Plus, 
  Trash2, 
  Save, 
  RotateCcw, 
  Check, 
  X, 
  Sparkles, 
  DollarSign, 
  ShieldCheck, 
  Truck, 
  FileText, 
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { usePricing } from '../lib/usePricing';
import { useAuthStore } from '../store/authStore';
import type { FreightPricingConfig, ServiceAddonConfig } from '../types';
import type { FreightMainCategory, FreightSubOption } from '../data/freightCategories';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const ICON_OPTIONS = [
  { value: 'Package', label: 'Package (Boxes/Barrels)', icon: Package },
  { value: 'Car', label: 'Car (Vehicles)', icon: Car },
  { value: 'Scale', label: 'Scale (Weight/KG)', icon: Scale },
  { value: 'Layers', label: 'Layers (Pallets)', icon: Layers },
  { value: 'Container', label: 'Container (FCL/LCL)', icon: ContainerIcon },
  { value: 'Plane', label: 'Plane (Air Freight)', icon: Plane }
];

export default function AdminFreightPricingManager() {
  const { user } = useAuthStore();
  const { pricing, loading, saving, updatePricing, resetToDefaults } = usePricing();

  // Local draft state for editing before saving
  const [draftPricing, setDraftPricing] = useState<FreightPricingConfig>(pricing);
  const [activeCatIndex, setActiveCatIndex] = useState<number>(0);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Sync draft whenever pricing loads or changes from server
  useEffect(() => {
    setDraftPricing(JSON.parse(JSON.stringify(pricing)));
    setHasChanges(false);
  }, [pricing]);

  if (loading) {
    return (
      <div className="bg-white border border-editorial-dark p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-editorial-muted">
          <RefreshCw className="w-4 h-4 animate-spin text-editorial-accent" />
          Loading Freight Tariffs & Add-on Rules...
        </div>
      </div>
    );
  }

  const markChanged = () => setHasChanges(true);

  // ===================== ADD-ON HANDLERS =====================
  const handleToggleAddon = (addonKey: string, enabled: boolean) => {
    setDraftPricing(prev => {
      const next = { ...prev };
      if (next.addons[addonKey]) {
        next.addons[addonKey] = {
          ...next.addons[addonKey],
          enabled
        };
      }
      return next;
    });
    markChanged();
  };

  const handleUpdateAddonField = (addonKey: string, field: keyof ServiceAddonConfig, value: any) => {
    setDraftPricing(prev => {
      const next = { ...prev };
      if (next.addons[addonKey]) {
        next.addons[addonKey] = {
          ...next.addons[addonKey],
          [field]: value
        };
      }
      return next;
    });
    markChanged();
  };

  const handleAutoConvertAddon = (addonKey: string) => {
    setDraftPricing(prev => {
      const next = { ...prev };
      const addon = next.addons[addonKey];
      if (addon) {
        const eur = addon.rateEur || 0;
        const usdRate = next.currencyRates.usdPerEur || 1.10;
        const mwkRate = next.currencyRates.mwkPerEur || 1850;
        addon.rateUsd = Math.round(eur * usdRate * 100) / 100;
        addon.rateMwk = Math.round(eur * mwkRate);
        if (addon.minRateEur) {
          addon.minRateUsd = Math.round(addon.minRateEur * usdRate * 100) / 100;
          addon.minRateMwk = Math.round(addon.minRateEur * mwkRate);
        }
      }
      return next;
    });
    markChanged();
    toast.success('Auto-calculated USD & MWK for add-on');
  };

  const handleAddCustomAddon = () => {
    const customId = `addon_${Date.now()}`;
    const newAddon: ServiceAddonConfig = {
      id: customId,
      name: 'New Custom Add-on Service',
      description: 'Special handling, packaging, or clearance service',
      enabled: true,
      calculationType: 'flat',
      rateEur: 35,
      rateUsd: 38.5,
      rateMwk: 64750
    };
    setDraftPricing(prev => ({
      ...prev,
      addons: {
        ...prev.addons,
        [customId]: newAddon
      }
    }));
    markChanged();
    toast.success('Added new custom add-on service');
  };

  const handleDeleteCustomAddon = (addonKey: string) => {
    // Preserve default 3 keys from deletion, only toggle off if needed
    if (['dublinCollection', 'marineInsurance', 'customsDocumentation'].includes(addonKey)) {
      handleToggleAddon(addonKey, false);
      toast.error('Default service disabled (cannot be permanently deleted)');
      return;
    }
    setDraftPricing(prev => {
      const nextAddons = { ...prev.addons };
      delete nextAddons[addonKey];
      return { ...prev, addons: nextAddons };
    });
    markChanged();
    toast.success('Removed custom add-on');
  };

  // ===================== CATEGORY & SUB-OPTION HANDLERS =====================
  const currentCategory = draftPricing.categories[activeCatIndex] || draftPricing.categories[0];

  const handleUpdateCategoryMeta = (field: keyof FreightMainCategory, value: any) => {
    setDraftPricing(prev => {
      const newCats = [...prev.categories];
      newCats[activeCatIndex] = {
        ...newCats[activeCatIndex],
        [field]: value
      };
      return { ...prev, categories: newCats };
    });
    markChanged();
  };

  const handleUpdateSubOption = (optionIndex: number, field: keyof FreightSubOption, value: any) => {
    setDraftPricing(prev => {
      const newCats = [...prev.categories];
      const currentCat = { ...newCats[activeCatIndex] };
      const newOptions = [...currentCat.options];
      newOptions[optionIndex] = {
        ...newOptions[optionIndex],
        [field]: value
      };
      currentCat.options = newOptions;
      newCats[activeCatIndex] = currentCat;
      return { ...prev, categories: newCats };
    });
    markChanged();
  };

  const handleAutoConvertSubOption = (optionIndex: number) => {
    setDraftPricing(prev => {
      const newCats = [...prev.categories];
      const currentCat = { ...newCats[activeCatIndex] };
      const newOptions = [...currentCat.options];
      const opt = { ...newOptions[optionIndex] };
      const eur = opt.rateEur || 0;
      const usdRate = prev.currencyRates.usdPerEur || 1.10;
      const mwkRate = prev.currencyRates.mwkPerEur || 1850;

      opt.rateUsd = Math.round(eur * usdRate * 100) / 100;
      opt.rateMwk = Math.round(eur * mwkRate);
      newOptions[optionIndex] = opt;
      currentCat.options = newOptions;
      newCats[activeCatIndex] = currentCat;
      return { ...prev, categories: newCats };
    });
    markChanged();
    toast.success('Auto-calculated USD & MWK');
  };

  const handleAddSubOption = () => {
    const newOption: FreightSubOption = {
      id: `opt_${Date.now()}`,
      name: 'New Freight Item / Vehicle / Rate',
      description: 'Enter detailed specifications and dimensions',
      defaultUnit: 'item',
      rateEur: 100,
      rateUsd: 110,
      rateMwk: 185000,
      pricingType: 'per_item'
    };
    setDraftPricing(prev => {
      const newCats = [...prev.categories];
      const currentCat = { ...newCats[activeCatIndex] };
      currentCat.options = [...currentCat.options, newOption];
      newCats[activeCatIndex] = currentCat;
      return { ...prev, categories: newCats };
    });
    markChanged();
    toast.success('Added new cargo sub-option');
  };

  const handleDeleteSubOption = (optionIndex: number) => {
    setDraftPricing(prev => {
      const newCats = [...prev.categories];
      const currentCat = { ...newCats[activeCatIndex] };
      currentCat.options = currentCat.options.filter((_, i) => i !== optionIndex);
      newCats[activeCatIndex] = currentCat;
      return { ...prev, categories: newCats };
    });
    markChanged();
    toast.success('Removed cargo item');
  };

  const handleAddCategory = () => {
    const newCat: FreightMainCategory = {
      id: `cat_${Date.now()}`,
      label: 'New Freight Category',
      iconName: 'Package',
      shortDesc: 'Custom freight classification for specialized logistics',
      options: [
        {
          id: `opt_${Date.now()}_1`,
          name: 'Standard Tariff Option',
          description: 'Basic rate description',
          defaultUnit: 'unit',
          rateEur: 150,
          rateUsd: 165,
          rateMwk: 277500,
          pricingType: 'per_item'
        }
      ]
    };
    setDraftPricing(prev => ({
      ...prev,
      categories: [...prev.categories, newCat]
    }));
    setActiveCatIndex(draftPricing.categories.length);
    markChanged();
    toast.success('Added new freight category');
  };

  const handleDeleteCategory = (catIndex: number) => {
    if (draftPricing.categories.length <= 1) {
      toast.error('You must keep at least one category');
      return;
    }
    setDraftPricing(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== catIndex)
    }));
    setActiveCatIndex(0);
    markChanged();
    toast.success('Removed category');
  };

  // ===================== CURRENCY EXCHANGE HANDLERS =====================
  const handleRecalculateAllCurrencies = () => {
    const usdRate = draftPricing.currencyRates.usdPerEur || 1.10;
    const mwkRate = draftPricing.currencyRates.mwkPerEur || 1850;

    setDraftPricing(prev => {
      // Recalculate categories
      const newCats = prev.categories.map(cat => ({
        ...cat,
        options: cat.options.map(opt => ({
          ...opt,
          rateUsd: Math.round(opt.rateEur * usdRate * 100) / 100,
          rateMwk: Math.round(opt.rateEur * mwkRate)
        }))
      }));

      // Recalculate add-ons
      const newAddons: Record<string, ServiceAddonConfig> = {};
      Object.entries(prev.addons).forEach(([k, addon]) => {
        newAddons[k] = {
          ...addon,
          rateUsd: Math.round(addon.rateEur * usdRate * 100) / 100,
          rateMwk: Math.round(addon.rateEur * mwkRate),
          minRateUsd: addon.minRateEur ? Math.round(addon.minRateEur * usdRate * 100) / 100 : undefined,
          minRateMwk: addon.minRateEur ? Math.round(addon.minRateEur * mwkRate) : undefined
        };
      });

      return {
        ...prev,
        categories: newCats,
        addons: newAddons
      };
    });
    markChanged();
    toast.success(`Recalculated all rates with 1 EUR = $${usdRate} USD and ${mwkRate} MWK!`);
  };

  // ===================== SAVE & RESET HANDLERS =====================
  const handleSaveAll = async () => {
    await updatePricing(draftPricing, user?.email || 'Admin');
    setHasChanges(false);
  };

  const handleConfirmReset = async () => {
    await resetToDefaults(user?.email || 'Admin');
    setShowResetConfirm(false);
    setHasChanges(false);
  };

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Bar */}
      <div className="bg-editorial-dark text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-editorial-accent text-white px-2 py-0.5 text-[9px] uppercase tracking-widest font-black">
              Admin Tariffs & Add-on Engine
            </span>
            {hasChanges && (
              <span className="bg-amber-500 text-black px-2 py-0.5 text-[9px] uppercase tracking-widest font-bold animate-pulse">
                Unsaved Price Changes
              </span>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-sans font-bold">
            Freight Pricing & Add-on Controls
          </h2>
          <p className="text-editorial-muted text-xs md:text-sm font-sans mt-1 max-w-2xl">
            Toggle optional customer add-on services on/off and easily edit all prices across boxes, cars, weight-based rates, pallets, and full container freight.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/calculator"
            target="_blank"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs uppercase tracking-widest font-bold flex items-center gap-2 transition-colors border border-white/20"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Public Calculator
          </Link>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2.5 bg-white/5 hover:bg-red-900/60 text-red-300 text-xs uppercase tracking-widest font-bold flex items-center gap-2 transition-colors border border-red-500/30"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Tariffs
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-6 py-2.5 bg-editorial-accent hover:bg-editorial-accent/90 text-white text-xs uppercase tracking-widest font-black flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving Tariffs...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* SECTION 1: ADD-ON SERVICES MANAGER (TOGGLE ON/OFF + EDIT PRICES) */}
      <div className="bg-white border border-editorial-dark shadow-sm">
        <div className="p-6 border-b border-editorial-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-editorial-bg/40">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-editorial-accent">Section 1</span>
            <h3 className="text-lg font-sans font-bold text-editorial-dark flex items-center gap-2">
              <Truck className="w-5 h-5 text-editorial-accent" /> Customer Add-on Services (Toggle On/Off)
            </h3>
            <p className="text-xs text-editorial-muted font-sans mt-0.5">
              Turn services on or off. Disabled add-ons will be hidden or deactivated in the client calculator and quote request flows.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddCustomAddon}
            className="px-4 py-2 bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Add Custom Add-on
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.entries(draftPricing.addons).map(([addonKey, addon]) => {
              const isDefault = ['dublinCollection', 'marineInsurance', 'customsDocumentation'].includes(addonKey);

              return (
                <div 
                  key={addonKey} 
                  className={`border transition-all flex flex-col justify-between ${
                    addon.enabled 
                      ? 'border-editorial-dark bg-white shadow-sm ring-1 ring-editorial-dark/10' 
                      : 'border-zinc-300 bg-zinc-50 opacity-70'
                  }`}
                >
                  <div className="p-5 space-y-4">
                    {/* Header with ON/OFF Toggle Switch */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-editorial-dark/10">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 bg-editorial-dark/5 text-editorial-dark">
                          {addon.calculationType === 'percentage' ? 'Percentage Based' : 'Flat Fee'}
                        </span>
                        <h4 className="text-sm font-sans font-bold text-editorial-dark mt-1">
                          {addon.name}
                        </h4>
                      </div>

                      {/* Prominent Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleAddon(addonKey, !addon.enabled)}
                        className={`relative inline-flex h-6 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          addon.enabled ? 'bg-emerald-600' : 'bg-zinc-300'
                        }`}
                        title={addon.enabled ? 'Click to Disable Add-on' : 'Click to Enable Add-on'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            addon.enabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center justify-between text-xs">
                      <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 ${
                        addon.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-200 text-zinc-600'
                      }`}>
                        {addon.enabled ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-zinc-500" />}
                        {addon.enabled ? 'Active on Public Calculator' : 'Disabled (Hidden)'}
                      </span>

                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomAddon(addonKey)}
                          className="text-red-600 hover:text-red-800 text-[10px] uppercase tracking-wider font-bold flex items-center gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      )}
                    </div>

                    {/* Service Name & Description Editors */}
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-1 text-editorial-muted">Display Title</label>
                        <input
                          type="text"
                          value={addon.name}
                          onChange={(e) => handleUpdateAddonField(addonKey, 'name', e.target.value)}
                          className="w-full border border-editorial-dark py-1 px-2 text-xs font-semibold bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest font-bold mb-1 text-editorial-muted">Description / Terms</label>
                        <textarea
                          rows={2}
                          value={addon.description}
                          onChange={(e) => handleUpdateAddonField(addonKey, 'description', e.target.value)}
                          className="w-full border border-editorial-dark py-1 px-2 text-xs font-sans bg-white resize-none"
                        />
                      </div>
                    </div>

                    {/* Specific Pricing Controls */}
                    {addon.calculationType === 'percentage' ? (
                      <div className="space-y-3 pt-2 border-t border-editorial-dark/10">
                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1 text-editorial-muted">
                            Insurance Rate (% of Cargo Value)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step="0.1"
                              value={Math.round((addon.percentage || 0.035) * 1000) / 10}
                              onChange={(e) => handleUpdateAddonField(addonKey, 'percentage', (parseFloat(e.target.value) || 0) / 100)}
                              className="w-24 border border-editorial-dark py-1 px-2 text-xs font-mono font-bold bg-white text-right"
                            />
                            <span className="text-xs font-bold font-mono">%</span>
                            <span className="text-[10px] text-editorial-muted font-sans">(default: 3.5%)</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase tracking-widest font-bold mb-1 text-editorial-muted">
                            Minimum Insurance Premium
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <span className="text-[9px] uppercase font-bold text-editorial-muted block">EUR (€)</span>
                              <input
                                type="number"
                                step="1"
                                value={addon.minRateEur || 40}
                                onChange={(e) => handleUpdateAddonField(addonKey, 'minRateEur', parseFloat(e.target.value) || 0)}
                                className="w-full border border-editorial-dark py-1 px-1.5 text-xs font-mono font-bold bg-white"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-editorial-muted block">USD ($)</span>
                              <input
                                type="number"
                                step="1"
                                value={addon.minRateUsd || 45}
                                onChange={(e) => handleUpdateAddonField(addonKey, 'minRateUsd', parseFloat(e.target.value) || 0)}
                                className="w-full border border-editorial-dark py-1 px-1.5 text-xs font-mono font-bold bg-white"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-bold text-editorial-muted block">MWK</span>
                              <input
                                type="number"
                                step="1000"
                                value={addon.minRateMwk || 74000}
                                onChange={(e) => handleUpdateAddonField(addonKey, 'minRateMwk', parseInt(e.target.value) || 0)}
                                className="w-full border border-editorial-dark py-1 px-1.5 text-xs font-mono font-bold bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-2 border-t border-editorial-dark/10">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-muted">
                            Fixed Service Fee
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAutoConvertAddon(addonKey)}
                            className="text-[9px] uppercase tracking-widest font-bold text-editorial-accent hover:underline flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5" /> Auto USD/MWK
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-editorial-muted block">EUR (€)</span>
                            <input
                              type="number"
                              step="0.5"
                              value={addon.rateEur}
                              onChange={(e) => handleUpdateAddonField(addonKey, 'rateEur', parseFloat(e.target.value) || 0)}
                              className="w-full border border-editorial-dark py-1 px-1.5 text-xs font-mono font-bold bg-white"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-editorial-muted block">USD ($)</span>
                            <input
                              type="number"
                              step="0.5"
                              value={addon.rateUsd}
                              onChange={(e) => handleUpdateAddonField(addonKey, 'rateUsd', parseFloat(e.target.value) || 0)}
                              className="w-full border border-editorial-dark py-1 px-1.5 text-xs font-mono font-bold bg-white"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-editorial-muted block">MWK</span>
                            <input
                              type="number"
                              step="500"
                              value={addon.rateMwk}
                              onChange={(e) => handleUpdateAddonField(addonKey, 'rateMwk', parseInt(e.target.value) || 0)}
                              className="w-full border border-editorial-dark py-1 px-1.5 text-xs font-mono font-bold bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-editorial-bg/30 border-t border-editorial-dark/10 flex items-center justify-between text-[10px] text-editorial-muted font-mono">
                    <span>Key: {addonKey}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleAddon(addonKey, !addon.enabled)}
                      className="font-bold underline text-editorial-dark"
                    >
                      {addon.enabled ? 'Turn Off' : 'Turn On'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: GLOBAL CURRENCY EXCHANGE CONVERTERS */}
      <div className="bg-white border border-editorial-dark p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-editorial-dark/10">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-editorial-accent">Section 2</span>
            <h3 className="text-lg font-sans font-bold text-editorial-dark flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-editorial-accent" /> Currency Multipliers & Exchange Rates
            </h3>
            <p className="text-xs text-editorial-muted font-sans mt-0.5">
              Set the base exchange rates per 1 Euro (€). You can click "Auto-calculate All Rates" to instantly update every freight item and add-on in the catalog.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRecalculateAllCurrencies}
            className="px-4 py-2 bg-editorial-dark hover:bg-editorial-accent text-white text-xs uppercase tracking-widest font-bold flex items-center gap-2 transition-colors self-start md:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Apply Multipliers to All Items
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-4">
          <div className="p-4 border border-editorial-dark bg-editorial-bg/20">
            <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Base Currency</label>
            <div className="text-xl font-sans font-bold text-editorial-dark">1.00 EUR (€)</div>
            <span className="text-[10px] text-editorial-muted font-sans">Euro is the primary pricing standard</span>
          </div>

          <div className="p-4 border border-editorial-dark bg-white">
            <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">USD Rate per 1 EUR</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono">$</span>
              <input
                type="number"
                step="0.01"
                value={draftPricing.currencyRates.usdPerEur}
                onChange={(e) => {
                  setDraftPricing(prev => ({
                    ...prev,
                    currencyRates: { ...prev.currencyRates, usdPerEur: parseFloat(e.target.value) || 1.10 }
                  }));
                  markChanged();
                }}
                className="w-full border border-editorial-dark py-1.5 px-2 text-sm font-mono font-bold bg-white"
              />
            </div>
            <span className="text-[10px] text-editorial-muted font-sans">Standard rate: ~1.10 USD</span>
          </div>

          <div className="p-4 border border-editorial-dark bg-white">
            <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">MWK Rate per 1 EUR</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono">MWK</span>
              <input
                type="number"
                step="10"
                value={draftPricing.currencyRates.mwkPerEur}
                onChange={(e) => {
                  setDraftPricing(prev => ({
                    ...prev,
                    currencyRates: { ...prev.currencyRates, mwkPerEur: parseInt(e.target.value) || 1850 }
                  }));
                  markChanged();
                }}
                className="w-full border border-editorial-dark py-1.5 px-2 text-sm font-mono font-bold bg-white"
              />
            </div>
            <span className="text-[10px] text-editorial-muted font-sans">Standard rate: ~1,850 MWK</span>
          </div>

          <div className="p-4 border border-editorial-dark bg-white">
            <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">GBP Rate per 1 EUR</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono">£</span>
              <input
                type="number"
                step="0.01"
                value={draftPricing.currencyRates.gbpPerEur || 0.85}
                onChange={(e) => {
                  setDraftPricing(prev => ({
                    ...prev,
                    currencyRates: { ...prev.currencyRates, gbpPerEur: parseFloat(e.target.value) || 0.85 }
                  }));
                  markChanged();
                }}
                className="w-full border border-editorial-dark py-1.5 px-2 text-sm font-mono font-bold bg-white"
              />
            </div>
            <span className="text-[10px] text-editorial-muted font-sans">Standard rate: ~0.85 GBP</span>
          </div>

          <div className="p-4 border border-editorial-dark bg-white">
            <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">ZAR Rate per 1 EUR</label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono">R</span>
              <input
                type="number"
                step="0.1"
                value={draftPricing.currencyRates.zarPerEur || 20.0}
                onChange={(e) => {
                  setDraftPricing(prev => ({
                    ...prev,
                    currencyRates: { ...prev.currencyRates, zarPerEur: parseFloat(e.target.value) || 20.0 }
                  }));
                  markChanged();
                }}
                className="w-full border border-editorial-dark py-1.5 px-2 text-sm font-mono font-bold bg-white"
              />
            </div>
            <span className="text-[10px] text-editorial-muted font-sans">Standard rate: ~20.0 ZAR</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: EDIT ALL FREIGHT CATEGORIES & SUBCATEGORY PRICES */}
      <div className="bg-white border border-editorial-dark shadow-sm">
        <div className="p-6 border-b border-editorial-dark flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-editorial-bg/40">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-editorial-accent">Section 3</span>
            <h3 className="text-lg font-sans font-bold text-editorial-dark flex items-center gap-2">
              <Package className="w-5 h-5 text-editorial-accent" /> Freight Cargo Categories & Itemized Tariffs
            </h3>
            <p className="text-xs text-editorial-muted font-sans mt-0.5">
              Select a category tab below to edit individual prices for boxes, barrels, vehicle models, per-kg rates, pallets, and container tariffs.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddCategory}
            className="px-4 py-2 bg-white border border-editorial-dark text-editorial-dark text-xs uppercase tracking-widest font-bold hover:bg-editorial-dark hover:text-white transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Category
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-editorial-dark overflow-x-auto bg-editorial-bg/10">
          {draftPricing.categories.map((cat, idx) => {
            const isActive = idx === activeCatIndex;
            return (
              <button
                key={cat.id || idx}
                type="button"
                onClick={() => setActiveCatIndex(idx)}
                className={`px-5 py-3 text-xs uppercase font-bold tracking-widest border-r border-editorial-dark whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isActive 
                    ? 'bg-editorial-dark text-white' 
                    : 'bg-white text-editorial-dark hover:bg-editorial-bg/50'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-editorial-accent text-white' : 'bg-editorial-bg text-editorial-muted'
                }`}>
                  {cat.options.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Category Editor */}
        {currentCategory && (
          <div className="p-6 space-y-6">
            {/* Category Meta Information */}
            <div className="p-4 bg-editorial-bg/20 border border-editorial-dark grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Category Title</label>
                <input
                  type="text"
                  value={currentCategory.label}
                  onChange={(e) => handleUpdateCategoryMeta('label', e.target.value)}
                  className="w-full border border-editorial-dark py-1.5 px-2 text-xs font-bold bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Short Subtitle / Description</label>
                <input
                  type="text"
                  value={currentCategory.shortDesc}
                  onChange={(e) => handleUpdateCategoryMeta('shortDesc', e.target.value)}
                  className="w-full border border-editorial-dark py-1.5 px-2 text-xs font-sans bg-white"
                />
              </div>

              <div className="flex items-end justify-between gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] uppercase tracking-widest font-bold mb-1">Category Icon</label>
                  <select
                    value={currentCategory.iconName}
                    onChange={(e) => handleUpdateCategoryMeta('iconName', e.target.value)}
                    className="w-full border border-editorial-dark py-1.5 px-2 text-xs bg-white"
                  >
                    {ICON_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteCategory(activeCatIndex)}
                  disabled={draftPricing.categories.length <= 1}
                  className="px-3 py-1.5 bg-red-100 border border-red-300 text-red-700 text-xs uppercase tracking-widest font-bold hover:bg-red-200 disabled:opacity-30"
                  title="Delete this entire category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <div className="md:col-span-3 pt-3 border-t border-editorial-dark/10">
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Applicable Services & Add-ons for this Category</label>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(draftPricing.addons).filter(([_, addon]) => addon.enabled).map(([addonKey, addon]) => {
                    const isSelected = currentCategory.applicableAddons?.includes(addonKey) ?? true; // Default true if undefined
                    return (
                      <label key={addonKey} className="flex items-center gap-1.5 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const current = currentCategory.applicableAddons || Object.keys(draftPricing.addons);
                            const next = e.target.checked 
                              ? [...current, addonKey] 
                              : current.filter(k => k !== addonKey);
                            handleUpdateCategoryMeta('applicableAddons', next);
                          }}
                          className="w-3.5 h-3.5 text-editorial-dark border-editorial-dark focus:ring-0"
                        />
                        {addon.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sub-Items List / Pricing Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs uppercase tracking-widest font-bold text-editorial-dark flex items-center gap-2">
                  Itemized Rates for "{currentCategory.label}" ({currentCategory.options.length} items)
                </h4>

                <button
                  type="button"
                  onClick={handleAddSubOption}
                  className="px-3 py-1.5 bg-editorial-dark text-white text-[10px] uppercase tracking-widest font-bold hover:bg-editorial-accent flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Cargo Item / Vehicle
                </button>
              </div>

              <div className="space-y-4">
                {currentCategory.options.map((opt, optIdx) => (
                  <div 
                    key={opt.id || optIdx}
                    className="p-4 border border-editorial-dark bg-white hover:bg-editorial-bg/10 transition-colors space-y-3"
                  >
                    {/* Top Row: Title, Pricing Type, Unit, Delete */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5">
                        <label className="block text-[9px] uppercase tracking-widest font-bold text-editorial-muted mb-0.5">Item Name</label>
                        <input
                          type="text"
                          value={opt.name}
                          onChange={(e) => handleUpdateSubOption(optIdx, 'name', e.target.value)}
                          className="w-full border border-editorial-dark py-1 px-2 text-xs font-bold bg-white"
                          placeholder="e.g. 200L Shipping Drum or Saloon Car"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[9px] uppercase tracking-widest font-bold text-editorial-muted mb-0.5">Pricing Model</label>
                        <select
                          value={opt.pricingType}
                          onChange={(e) => handleUpdateSubOption(optIdx, 'pricingType', e.target.value)}
                          className="w-full border border-editorial-dark py-1 px-2 text-xs bg-white font-medium"
                        >
                          <option value="per_item">Per Item / Flat Unit</option>
                          <option value="per_kg">Per KG (Weight)</option>
                          <option value="per_cbm">Per CBM (Volume m³)</option>
                          <option value="flat_rate">Flat Rate</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[9px] uppercase tracking-widest font-bold text-editorial-muted mb-0.5">Unit Label</label>
                        <input
                          type="text"
                          value={opt.defaultUnit}
                          onChange={(e) => handleUpdateSubOption(optIdx, 'defaultUnit', e.target.value)}
                          className="w-full border border-editorial-dark py-1 px-2 text-xs bg-white font-mono"
                          placeholder="e.g. barrel, kg, car"
                        />
                      </div>

                      <div className="md:col-span-2 flex items-center justify-end gap-2 pt-3 md:pt-0">
                        <button
                          type="button"
                          onClick={() => handleAutoConvertSubOption(optIdx)}
                          className="px-2 py-1 bg-editorial-bg border border-editorial-dark text-[9px] uppercase tracking-widest font-bold hover:bg-editorial-accent hover:text-white transition-colors flex items-center gap-1"
                          title="Auto-calculate USD and MWK from EUR rate"
                        >
                          <Sparkles className="w-2.5 h-2.5" /> Auto USD/MWK
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSubOption(optIdx)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete this cargo item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Middle Row: Description */}
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest font-bold text-editorial-muted mb-0.5">Specification & Dimensions Description</label>
                      <input
                        type="text"
                        value={opt.description}
                        onChange={(e) => handleUpdateSubOption(optIdx, 'description', e.target.value)}
                        className="w-full border border-editorial-dark py-1 px-2 text-xs font-sans bg-white"
                        placeholder="e.g. 200 Litre heavy drum or Toyota Land Cruiser / Prado"
                      />
                    </div>

                    {/* Bottom Row: Editable Rates in EUR, USD, MWK & Suggested Weight */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-editorial-dark/10">
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest font-bold text-editorial-dark mb-0.5">
                          Price in EUR (€)
                        </label>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-editorial-muted font-mono">€</span>
                          <input
                            type="number"
                            step="0.1"
                            value={opt.rateEur}
                            onChange={(e) => handleUpdateSubOption(optIdx, 'rateEur', parseFloat(e.target.value) || 0)}
                            className="w-full border border-editorial-dark py-1 px-2 text-xs font-mono font-bold bg-white text-right"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-widest font-bold text-editorial-dark mb-0.5">
                          Price in USD ($)
                        </label>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-editorial-muted font-mono">$</span>
                          <input
                            type="number"
                            step="0.1"
                            value={opt.rateUsd}
                            onChange={(e) => handleUpdateSubOption(optIdx, 'rateUsd', parseFloat(e.target.value) || 0)}
                            className="w-full border border-editorial-dark py-1 px-2 text-xs font-mono font-bold bg-white text-right"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-widest font-bold text-editorial-dark mb-0.5">
                          Price in MWK (Kwacha)
                        </label>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-editorial-muted font-mono">MWK</span>
                          <input
                            type="number"
                            step="1000"
                            value={opt.rateMwk}
                            onChange={(e) => handleUpdateSubOption(optIdx, 'rateMwk', parseInt(e.target.value) || 0)}
                            className="w-full border border-editorial-dark py-1 px-2 text-xs font-mono font-bold bg-white text-right"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase tracking-widest font-bold text-editorial-muted mb-0.5">
                          Suggested Weight (KG)
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="1"
                            value={opt.suggestedWeightKg || ''}
                            placeholder="optional"
                            onChange={(e) => handleUpdateSubOption(optIdx, 'suggestedWeightKg', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full border border-editorial-dark py-1 px-2 text-xs font-mono bg-white text-right"
                          />
                          <span className="text-[10px] font-mono text-editorial-muted">kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Save Reminder Bar */}
      {hasChanges && (
        <div className="sticky bottom-6 z-40 bg-editorial-dark text-white p-4 border border-editorial-accent flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs uppercase tracking-widest font-bold">
              You have unsaved changes in freight tariffs or add-on rules.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setDraftPricing(JSON.parse(JSON.stringify(pricing)));
                setHasChanges(false);
                toast.success('Reverted unsaved edits');
              }}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs uppercase tracking-widest font-bold"
            >
              Cancel / Revert
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              className="px-5 py-1.5 bg-editorial-accent hover:bg-editorial-accent/90 text-white text-xs uppercase tracking-widest font-black flex items-center gap-1.5"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save All Changes
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Resetting to Defaults */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-editorial-dark max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600">
              <RotateCcw className="w-6 h-6" />
              <h3 className="text-lg font-sans font-bold text-editorial-dark">Reset All Tariffs to Defaults?</h3>
            </div>
            <p className="text-xs text-editorial-muted font-sans leading-relaxed">
              This will restore all default freight pricing for boxes (€65-€160), cars (€1,450-€2,650), per-kg rates (€5.50-€8.00), pallets (€480-€780), and containers (€3,850-€6,400), as well as re-enable all 3 standard service add-ons.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-editorial-dark/10">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border border-editorial-dark text-xs uppercase tracking-widest font-bold hover:bg-editorial-bg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-red-600 text-white text-xs uppercase tracking-widest font-bold hover:bg-red-700"
              >
                Yes, Reset All Tariffs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
