import { useState, useMemo, useEffect } from 'react';
import { 
  Calculator as CalcIcon, 
  Package, 
  Car, 
  Scale, 
  Layers, 
  Container as ContainerIcon, 
  ArrowRight, 
  CheckCircle2, 
  Info, 
  ShieldCheck, 
  Truck, 
  FileText,
  RotateCcw,
  Sparkles,
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { usePricing } from '../lib/usePricing';
import type { FreightSubOption } from '../data/freightCategories';

export default function Calculator() {
  const navigate = useNavigate();
  const { categories, addons, currencyRates, loading } = usePricing();

  // Category Selection
  const [selectedMainCatId, setSelectedMainCatId] = useState<string>('');
  const [selectedSubOptionId, setSelectedSubOptionId] = useState<string>('');

  // Specific calculation parameters
  const [quantity, setQuantity] = useState<number>(1);
  const [weightKg, setWeightKg] = useState<number>(30);
  const [cbmVolume, setCbmVolume] = useState<number>(1.5);
  const [vehicleMakeModel, setVehicleMakeModel] = useState<string>('');

  // Dynamic Add-on Selections (keyed by addon id, e.g. { dublinCollection: true, marineInsurance: false, ... })
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({
    dublinCollection: true,
    marineInsurance: false,
    customsDocumentation: false
  });
  const [goodsValueEur, setGoodsValueEur] = useState<number>(500);

  // Initialize selected category & sub-option once categories load
  useEffect(() => {
    if (categories && categories.length > 0) {
      if (!selectedMainCatId || !categories.some(c => c.id === selectedMainCatId)) {
        const firstCat = categories[0];
        setSelectedMainCatId(firstCat.id);
        if (firstCat.options && firstCat.options.length > 0) {
          setSelectedSubOptionId(firstCat.options[0].id);
        }
      }
    }
  }, [categories, selectedMainCatId]);

  // Active Main Category & Sub Option
  const currentMainCat = useMemo(() => {
    if (!categories || categories.length === 0) return null;
    return categories.find(c => c.id === selectedMainCatId) || categories[0];
  }, [categories, selectedMainCatId]);

  const currentSubOption = useMemo(() => {
    if (!currentMainCat || !currentMainCat.options || currentMainCat.options.length === 0) return null;
    return currentMainCat.options.find(o => o.id === selectedSubOptionId) || currentMainCat.options[0];
  }, [currentMainCat, selectedSubOptionId]);

  // When main category changes, default to its first sub-option
  const handleMainCategoryChange = (newCatId: string) => {
    setSelectedMainCatId(newCatId);
    const main = categories.find(c => c.id === newCatId);
    if (main && main.options.length > 0) {
      setSelectedSubOptionId(main.options[0].id);
      if (main.id === 'by_weight_kg') {
        setWeightKg(30);
      }
    }
  };

  const toggleAddonSelection = (addonKey: string) => {
    setSelectedAddons(prev => ({
      ...prev,
      [addonKey]: !prev[addonKey]
    }));
  };

  // Calculations
  const calculations = useMemo(() => {
    if (!currentSubOption) {
      return {
        freightCostEur: 0,
        freightCostUsd: 0,
        freightCostMwk: 0,
        addonsTotalEur: 0,
        addonsTotalUsd: 0,
        addonsTotalMwk: 0,
        itemizedAddons: [],
        totalEur: 0,
        totalUsd: 0,
        totalMwk: 0
      };
    }

    const usdRate = currencyRates?.usdPerEur || 1.10;
    const mwkRate = currencyRates?.mwkPerEur || 1850;

    let freightCostEur = 0;
    let freightCostUsd = 0;
    let freightCostMwk = 0;

    if (currentSubOption.pricingType === 'per_item') {
      freightCostEur = currentSubOption.rateEur * quantity;
      freightCostUsd = (currentSubOption.rateUsd || currentSubOption.rateEur * usdRate) * quantity;
      freightCostMwk = (currentSubOption.rateMwk || currentSubOption.rateEur * mwkRate) * quantity;
    } else if (currentSubOption.pricingType === 'per_kg') {
      freightCostEur = currentSubOption.rateEur * weightKg * quantity;
      freightCostUsd = (currentSubOption.rateUsd || currentSubOption.rateEur * usdRate) * weightKg * quantity;
      freightCostMwk = (currentSubOption.rateMwk || currentSubOption.rateEur * mwkRate) * weightKg * quantity;
    } else if (currentSubOption.pricingType === 'per_cbm') {
      freightCostEur = currentSubOption.rateEur * cbmVolume * quantity;
      freightCostUsd = (currentSubOption.rateUsd || currentSubOption.rateEur * usdRate) * cbmVolume * quantity;
      freightCostMwk = (currentSubOption.rateMwk || currentSubOption.rateEur * mwkRate) * cbmVolume * quantity;
    } else {
      freightCostEur = currentSubOption.rateEur * quantity;
      freightCostUsd = (currentSubOption.rateUsd || currentSubOption.rateEur * usdRate) * quantity;
      freightCostMwk = (currentSubOption.rateMwk || currentSubOption.rateEur * mwkRate) * quantity;
    }

    // Dynamic Add-ons Calculation
    let addonsTotalEur = 0;
    let addonsTotalUsd = 0;
    let addonsTotalMwk = 0;
    const itemizedAddons: Array<{ key: string; name: string; eur: number; usd: number; mwk: number }> = [];

    Object.entries(addons || {}).forEach(([key, config]) => {
      // Only calculate if the addon is enabled by admin AND selected by customer
      if (config.enabled && selectedAddons[key]) {
        let addEur = 0;
        let addUsd = 0;
        let addMwk = 0;

        if (config.calculationType === 'percentage') {
          const pct = config.percentage || 0.035;
          const minEur = config.minRateEur || 40;
          addEur = Math.max(minEur, goodsValueEur * pct);
          addUsd = addEur * usdRate;
          addMwk = addEur * mwkRate;
        } else {
          addEur = config.rateEur || 0;
          addUsd = config.rateUsd || addEur * usdRate;
          addMwk = config.rateMwk || addEur * mwkRate;
        }

        addonsTotalEur += addEur;
        addonsTotalUsd += addUsd;
        addonsTotalMwk += addMwk;

        itemizedAddons.push({
          key,
          name: config.name,
          eur: addEur,
          usd: addUsd,
          mwk: addMwk
        });
      }
    });

    const totalEur = freightCostEur + addonsTotalEur;
    const totalUsd = freightCostUsd + addonsTotalUsd;
    const totalMwk = freightCostMwk + addonsTotalMwk;

    return {
      freightCostEur,
      freightCostUsd,
      freightCostMwk,
      addonsTotalEur,
      addonsTotalUsd,
      addonsTotalMwk,
      itemizedAddons,
      totalEur,
      totalUsd,
      totalMwk
    };
  }, [currentSubOption, quantity, weightKg, cbmVolume, selectedAddons, goodsValueEur, addons, currencyRates]);

  // Navigate to quote with prefilled state
  const handleProceedToQuote = () => {
    if (!currentMainCat || !currentSubOption) return;

    let summaryQty = `${quantity} ${currentSubOption.defaultUnit}`;
    if (currentSubOption.pricingType === 'per_kg') {
      summaryQty = `${quantity * weightKg} kg (${quantity} item/pkg)`;
    } else if (currentSubOption.pricingType === 'per_cbm') {
      summaryQty = `${(cbmVolume * quantity).toFixed(2)} CBM`;
    }

    let cargoDesc = `${currentSubOption.name} - ${currentSubOption.description}`;
    if (vehicleMakeModel.trim()) {
      cargoDesc += ` (Vehicle Details: ${vehicleMakeModel.trim()})`;
    }

    const searchParams = new URLSearchParams({
      cargoCategory: currentMainCat.label,
      cargoSubOption: currentSubOption.name,
      quantity: summaryQty,
      description: cargoDesc,
      collection: selectedAddons.dublinCollection ? 'yes' : 'no',
      estimatedEur: calculations.totalEur.toFixed(2)
    });

    navigate(`/quote?${searchParams.toString()}`);
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Package': return <Package className="w-5 h-5" />;
      case 'Car': return <Car className="w-5 h-5" />;
      case 'Scale': return <Scale className="w-5 h-5" />;
      case 'Layers': return <Layers className="w-5 h-5" />;
      case 'Container': return <ContainerIcon className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  if (loading || !currentMainCat || !currentSubOption) {
    return (
      <div className="min-h-screen py-24 flex items-center justify-center bg-zinc-50">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-editorial-dark border-t-editorial-accent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest font-mono text-editorial-muted">
            Loading Live Freight Tariffs...
          </p>
        </div>
      </div>
    );
  }

  // Filter only active add-ons configured in admin AND applicable to current category
  const activeAddonList = Object.entries(addons || {}).filter(([addonKey, config]) => {
    if (!config.enabled) return false;
    // If applicableAddons is defined for the category, check if this addon is included
    if (currentMainCat.applicableAddons) {
      return currentMainCat.applicableAddons.includes(addonKey);
    }
    // If not defined, default to showing it for backward compatibility
    return true;
  });

  return (
    <div className="min-h-screen py-12 md:py-16 bg-editorial-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-editorial-dark text-[10px] uppercase font-bold tracking-widest text-editorial-dark mb-4">
            <CalcIcon className="w-3.5 h-3.5 text-editorial-accent" />
            <span>Official Tariff Calculator</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-editorial-dark tracking-tight">
            Calculate Your Shipment
          </h1>
          <p className="mt-3 text-sm md:text-base text-editorial-muted font-serif">
            Select your specific cargo type—from individual 200L shipping drums and boxes to motor vehicles, per-kg dry goods, and container freight from Dublin to Malawi.
          </p>
        </div>

        {/* Layout Grid: 12 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: CALCULATION CONFIGURATOR (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* STEP 1: SELECT PRIMARY CARGO CATEGORY */}
            <div className="bg-white border border-editorial-dark p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-editorial-dark/10">
                <label className="text-xs uppercase tracking-widest font-bold text-editorial-dark flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-editorial-dark text-white text-[10px] flex items-center justify-center font-mono">1</span>
                  Select Cargo Classification
                </label>
                <span className="text-[10px] uppercase font-mono text-editorial-muted">Step 1 of 3</span>
              </div>

              {/* Main Categories Tab Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {categories.map((cat) => {
                  const isSelected = cat.id === selectedMainCatId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleMainCategoryChange(cat.id)}
                      className={`p-3.5 border text-left transition-all relative flex flex-col justify-between ${
                        isSelected 
                          ? 'border-editorial-dark bg-editorial-dark text-white shadow-sm' 
                          : 'border-editorial-dark/20 bg-white text-editorial-dark hover:border-editorial-dark/60 hover:bg-editorial-bg/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={isSelected ? 'text-editorial-accent' : 'text-editorial-muted'}>
                          {getCategoryIcon(cat.iconName)}
                        </span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-editorial-accent" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold font-serif block leading-tight">
                          {cat.label}
                        </span>
                        <span className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? 'text-zinc-300' : 'text-editorial-muted'}`}>
                          {cat.shortDesc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: CHOOSE SPECIFIC ITEM / OPTION & QUANTITY */}
            <div className="bg-white border border-editorial-dark p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-editorial-dark/10">
                <label className="text-xs uppercase tracking-widest font-bold text-editorial-dark flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-editorial-dark text-white text-[10px] flex items-center justify-center font-mono">2</span>
                  Select Specific Item & Dimensions
                </label>
                <span className="text-[10px] uppercase font-mono text-editorial-muted">Step 2 of 3</span>
              </div>

              <div className="space-y-4">
                {/* Specific Sub-Option Selector */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-1.5">
                    Choose Specific {currentMainCat.label} Item
                  </label>
                  <select
                    value={selectedSubOptionId}
                    onChange={(e) => setSelectedSubOptionId(e.target.value)}
                    className="w-full border border-editorial-dark bg-editorial-bg py-3 px-3 text-xs font-bold text-editorial-dark focus:ring-0 focus:border-editorial-accent"
                  >
                    {currentMainCat.options.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name} — €{opt.rateEur.toLocaleString('en-US', { minimumFractionDigits: opt.pricingType === 'per_kg' ? 2 : 0 })} {opt.pricingType === 'per_kg' ? '/ kg' : opt.pricingType === 'per_cbm' ? '/ CBM' : ''} ({opt.description})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub-Option Details Banner */}
                <div className="p-3.5 bg-editorial-bg/70 border border-editorial-dark/20 text-xs flex items-start gap-3">
                  <Info className="w-4 h-4 text-editorial-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-editorial-dark block font-serif">
                      {currentSubOption.name}
                    </span>
                    <p className="text-editorial-muted font-serif mt-0.5">
                      {currentSubOption.description}
                    </p>
                    {currentSubOption.suggestedWeightKg && (
                      <span className="inline-block mt-1 text-[10px] font-mono uppercase bg-white px-2 py-0.5 border border-editorial-dark/20 font-bold">
                        Average gross weight: ~{currentSubOption.suggestedWeightKg} kg
                      </span>
                    )}
                  </div>
                </div>

                {/* Dynamic Parameter Inputs Based on Pricing Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Quantity Input */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-1.5">
                      Quantity of {currentSubOption.defaultUnit}s
                    </label>
                    <div className="flex items-center border border-editorial-dark bg-white">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3.5 py-2 text-sm font-bold bg-editorial-bg border-r border-editorial-dark hover:bg-editorial-accent hover:text-white transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full text-center border-0 py-2 font-mono font-bold text-base focus:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3.5 py-2 text-sm font-bold bg-editorial-bg border-l border-editorial-dark hover:bg-editorial-accent hover:text-white transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Weight in KG input (if pricing type is per_kg) */}
                  {currentSubOption.pricingType === 'per_kg' && (
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-1.5">
                        Weight per Item (KG)
                      </label>
                      <div className="flex items-center border border-editorial-dark bg-white">
                        <input
                          type="number"
                          min="1"
                          value={weightKg}
                          onChange={(e) => setWeightKg(Math.max(1, parseFloat(e.target.value) || 1))}
                          className="w-full text-center border-0 py-2.5 font-mono font-bold text-base focus:ring-0"
                        />
                        <span className="px-3 py-2.5 bg-editorial-bg text-xs font-bold uppercase border-l border-editorial-dark font-mono">
                          KG
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Per CBM Volume input (if pricing type is per_cbm) */}
                  {currentSubOption.pricingType === 'per_cbm' && (
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-1.5">
                        Volume (Cubic Meters / CBM)
                      </label>
                      <div className="flex items-center border border-editorial-dark bg-white">
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={cbmVolume}
                          onChange={(e) => setCbmVolume(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                          className="w-full text-center border-0 py-2.5 font-mono font-bold text-base focus:ring-0"
                        />
                        <span className="px-3 py-2.5 bg-editorial-bg text-xs font-bold uppercase border-l border-editorial-dark font-mono">
                          CBM (m³)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Vehicle Make / Model / Year (if vehicles category) */}
                  {selectedMainCatId === 'cars_vehicles' && (
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-1.5">
                        Vehicle Make, Model & Year (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2018 Toyota RAV4 2.0 Petrol Automatic"
                        value={vehicleMakeModel}
                        onChange={(e) => setVehicleMakeModel(e.target.value)}
                        className="w-full border border-editorial-dark bg-editorial-bg py-2.5 px-3 text-xs focus:ring-0 focus:border-editorial-accent"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 3: LOGISTICS ADD-ONS (COLLECTION, INSURANCE, CUSTOMS, CUSTOM ADD-ONS) */}
            {activeAddonList.length > 0 && (
              <div className="bg-white border border-editorial-dark p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-editorial-dark/10">
                  <label className="text-xs uppercase tracking-widest font-bold text-editorial-dark flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-editorial-dark text-white text-[10px] flex items-center justify-center font-mono">3</span>
                    Pickup & Logistics Add-Ons
                  </label>
                  <span className="text-[10px] uppercase font-mono text-editorial-muted">Optional Services</span>
                </div>

                <div className="space-y-4">
                  {activeAddonList.map(([addonKey, addon]) => {
                    const isSelected = !!selectedAddons[addonKey];
                    const isInsurance = addon.calculationType === 'percentage' || addonKey === 'marineInsurance';

                    return (
                      <div 
                        key={addonKey}
                        className={`p-4 border transition-colors ${
                          isSelected ? 'border-editorial-dark bg-editorial-bg/80' : 'border-editorial-dark/20 hover:border-editorial-dark/60'
                        }`}
                      >
                        <div 
                          className="flex items-start justify-between gap-4 cursor-pointer"
                          onClick={() => toggleAddonSelection(addonKey)}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAddonSelection(addonKey)}
                              className="mt-1 w-4 h-4 text-editorial-dark border-editorial-dark focus:ring-0 rounded-none cursor-pointer"
                            />
                            <div>
                              <span className="text-xs font-bold text-editorial-dark block flex items-center gap-1.5">
                                {isInsurance ? (
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                                ) : addonKey === 'dublinCollection' ? (
                                  <Truck className="w-3.5 h-3.5 text-editorial-accent" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-editorial-dark" />
                                )}
                                {addon.name}
                              </span>
                              <p className="text-xs text-editorial-muted font-serif mt-0.5">
                                {addon.description}
                              </p>
                            </div>
                          </div>

                          <span className="text-xs font-mono font-bold text-editorial-dark shrink-0">
                            {isInsurance 
                              ? (isSelected 
                                  ? `+€${Math.max(addon.minRateEur || 40, goodsValueEur * (addon.percentage || 0.035)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                                  : `From €${(addon.minRateEur || 40).toLocaleString()}`)
                              : `+€${(addon.rateEur || 0).toLocaleString()}`
                            }
                          </span>
                        </div>

                        {/* Special Value Input for Percentage-based Insurance */}
                        {isInsurance && isSelected && (
                          <div className="mt-3 pt-3 border-t border-editorial-dark/10 pl-7">
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-1">
                              Estimated Declared Goods Value (€ EUR):
                            </label>
                            <div className="flex items-center max-w-xs border border-editorial-dark bg-white">
                              <span className="px-3 py-1.5 text-xs font-mono font-bold bg-editorial-bg border-r border-editorial-dark">€</span>
                              <input
                                type="number"
                                min="100"
                                step="100"
                                value={goodsValueEur}
                                onChange={(e) => setGoodsValueEur(Math.max(50, parseFloat(e.target.value) || 100))}
                                className="w-full py-1.5 px-3 font-mono text-xs border-0 focus:ring-0"
                              />
                            </div>
                            <span className="text-[10px] text-editorial-muted font-serif mt-1 block">
                              Calculated at {((addon.percentage || 0.035) * 100).toFixed(1)}% of declared value (min. €{(addon.minRateEur || 40).toLocaleString()})
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: LIVE ESTIMATE BREAKDOWN & CALL TO ACTION (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            <div className="bg-editorial-dark text-white border border-editorial-dark p-8 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <span className="text-[10px] uppercase tracking-[0.25em] text-editorial-accent font-bold">
                  Instant Freight Estimate
                </span>
                <span className="px-2 py-0.5 bg-white/10 text-[10px] uppercase font-mono tracking-widest">
                  Indicative Rate
                </span>
              </div>

              {/* Total Highlight */}
              <div className="my-6 text-center">
                <span className="text-4xl md:text-5xl font-mono font-bold text-white tracking-tight block">
                  €{calculations.totalEur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-serif text-zinc-300 mt-1 block">
                  EUR (Euro Base Currency)
                </span>

                {/* Multi-Currency Conversions */}
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10 text-left">
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-xs">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold block">US Dollar</span>
                    <span className="text-base font-mono font-bold text-zinc-100">
                      ${calculations.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white/5 border border-white/10 rounded-xs">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold block">Malawi Kwacha</span>
                    <span className="text-base font-mono font-bold text-editorial-accent">
                      MK {calculations.totalMwk.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Itemized Calculation Summary */}
              <div className="space-y-2.5 text-xs border-t border-white/10 pt-4 font-mono text-zinc-300">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 truncate max-w-[200px]">{currentSubOption.name}</span>
                  <span className="font-bold text-white">€{calculations.freightCostEur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {calculations.itemizedAddons.map(addon => (
                  <div key={addon.key} className="flex justify-between items-center">
                    <span className="text-zinc-400 truncate max-w-[200px]">{addon.name}</span>
                    <span className="text-white">€{addon.eur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>

              {/* Proceed to Official Quote Button */}
              <button
                type="button"
                onClick={handleProceedToQuote}
                className="w-full mt-8 py-4 px-6 bg-editorial-accent text-white text-xs uppercase tracking-widest font-black hover:bg-editorial-accent/90 transition-all flex items-center justify-center gap-2 group shadow-lg"
              >
                <span>Request Formal Quote with this Configuration</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-[10px] text-zinc-400 font-serif text-center mt-3">
                Tariffs include ocean freight, warehouse export staging in Dublin, and arrival processing at destination hub. Final quotes are confirmed by JR Logistics dispatch.
              </p>
            </div>

            {/* Quick Tariff Reference Card */}
            <div className="bg-white border border-editorial-dark p-6 shadow-xs">
              <span className="text-[10px] uppercase tracking-widest font-bold text-editorial-accent block mb-1">
                Transparency Guarantee
              </span>
              <h3 className="text-sm font-serif font-bold text-editorial-dark">
                No Hidden Surcharges
              </h3>
              <p className="text-xs text-editorial-muted font-serif mt-1 leading-relaxed">
                Our rates are all-inclusive of standard port handling, sea-freight transit, and bill of lading documentation. Additional insurance is fully optional.
              </p>
              <div className="mt-4 pt-3 border-t border-editorial-dark/10 flex items-center justify-between text-xs font-mono font-bold text-editorial-dark">
                <span>Questions on tariffs?</span>
                <Link to="/quote" className="underline hover:text-editorial-accent">
                  Contact Dispatch &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
