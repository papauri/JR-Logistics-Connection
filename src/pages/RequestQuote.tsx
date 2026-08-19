import { useState, useEffect, useMemo } from 'react';
import { useForm as useHookForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import { generateReference } from '../lib/utils';
import { CheckCircle2, Loader2, ArrowRight, Package, Car, Scale, Layers, Container as ContainerIcon, Info, Calculator as CalcIcon } from 'lucide-react';
import type { CustomerRequest } from '../types';
import { useSearchParams } from 'react-router-dom';
import { usePricing } from '../lib/usePricing';

const requestSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone / WhatsApp number is required'),
  pickupLocation: z.string().min(2, 'Pickup location is required'),
  destination: z.string().min(2, 'Destination is required'),
  cargoCategory: z.string().min(1, 'Category is required'),
  cargoSubOption: z.string().min(1, 'Item type is required'),
  quantity: z.string().min(1, 'Quantity is required'),
  weightKg: z.string().optional(),
  cargoDescription: z.string().min(5, 'Please provide cargo details or description'),
  collectionRequired: z.boolean().optional(),
  selectedAddons: z.record(z.string(), z.boolean()).optional(),
  goodsValueEur: z.number().optional(),
  preferredDate: z.string().optional(),
  message: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

export default function RequestQuote() {
  const [searchParams] = useSearchParams();
  const { categories, addons, loading } = usePricing();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState('');

  // Initial category values from query params if coming from Calculator
  const initialCategory = searchParams.get('cargoCategory') || 'Boxes, Drums & Barrels';
  const initialSubOption = searchParams.get('cargoSubOption') || '';
  const initialQty = searchParams.get('quantity') || '1 item/barrel';
  const initialDesc = searchParams.get('description') || '';
  
  // Try to parse selectedAddons from query params if coming from Calculator
  // (We'd need to modify Calculator to pass this, or just rely on default selection)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useHookForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      pickupLocation: 'Dublin, Ireland',
      destination: 'Lilongwe, Malawi',
      cargoCategory: initialCategory,
      cargoSubOption: initialSubOption,
      quantity: initialQty,
      cargoDescription: initialDesc,
      collectionRequired: false,
      selectedAddons: {},
      goodsValueEur: 500
    }
  });

  const selectedCategory = watch('cargoCategory');
  const selectedSubOption = watch('cargoSubOption');
  const selectedAddons = watch('selectedAddons') || {};
  const goodsValueEur = watch('goodsValueEur') || 500;

  // Match active main category configuration from live pricing
  const activeMainCat = useMemo(() => {
    if (!categories || categories.length === 0) return null;
    return categories.find(c => c.label === selectedCategory || c.id === selectedCategory) || categories[0];
  }, [categories, selectedCategory]);

  // Determine which addons are applicable to this category
  const activeAddonList = useMemo(() => {
    return Object.entries(addons || {}).filter(([addonKey, config]) => {
      if (!config.enabled) return false;
      if (activeMainCat?.applicableAddons) {
        return activeMainCat.applicableAddons.includes(addonKey);
      }
      return true;
    });
  }, [addons, activeMainCat]);

  // When active category changes, if sub-option is not in list, pick first
  useEffect(() => {
    if (activeMainCat && activeMainCat.options && activeMainCat.options.length > 0) {
      const exists = activeMainCat.options.some(o => o.name === selectedSubOption);
      if (!exists) {
        setValue('cargoSubOption', activeMainCat.options[0].name);
        if (!initialDesc) {
          setValue('cargoDescription', `${activeMainCat.options[0].name} - ${activeMainCat.options[0].description}`);
        }
      }
    }
  }, [activeMainCat, selectedSubOption, setValue, initialDesc]);

  // Estimated ballpark calculation
  const activeSubOption = useMemo(() => {
    if (!activeMainCat || !activeMainCat.options || activeMainCat.options.length === 0) return null;
    return activeMainCat.options.find(o => o.name === selectedSubOption) || activeMainCat.options[0];
  }, [activeMainCat, selectedSubOption]);

  const estimatedBallparkEur = useMemo(() => {
    if (!activeSubOption) return 0;
    const baseRate = activeSubOption.rateEur || 0;
    let total = baseRate;
    
    // Calculate selected addons
    Object.entries(selectedAddons).forEach(([addonKey, isSelected]) => {
      if (isSelected && addons?.[addonKey]?.enabled) {
        const config = addons[addonKey];
        if (config.calculationType === 'percentage') {
          total += Math.max(config.minRateEur || 40, goodsValueEur * (config.percentage || 0.035));
        } else {
          total += config.rateEur || 0;
        }
      }
    });

    return total;
  }, [activeSubOption, selectedAddons, addons, goodsValueEur]);

  const onSubmit = async (data: RequestFormValues) => {
    setSubmitting(true);
    try {
      const ref = generateReference('REQ');
      const formattedCargoType = `${data.cargoCategory} — ${data.cargoSubOption}`;
      
      const requestData: Partial<CustomerRequest> = {
        reference: ref,
        customerName: data.customerName,
        email: data.email,
        phone: data.phone,
        pickupLocation: data.pickupLocation,
        destination: data.destination,
        cargoType: formattedCargoType,
        cargoDescription: data.cargoDescription,
        quantity: data.quantity,
        collectionRequired: !!data.selectedAddons?.['dublinCollection'],
        selectedAddons: data.selectedAddons,
        preferredDate: data.preferredDate || '',
        message: data.message || '',
        status: 'New',
        currency: '€',
        quotedAmount: estimatedBallparkEur,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await addDoc(collection(db, 'requests'), requestData);
      
      try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey) {
          await emailjs.send(
            serviceId,
            templateId,
            {
              customerName: data.customerName,
              email: data.email,
              phone: data.phone,
              pickupLocation: data.pickupLocation,
              destination: data.destination,
              cargoType: formattedCargoType,
              cargoDescription: data.cargoDescription,
              quantity: data.quantity,
              collectionRequired: data.collectionRequired ? 'Yes' : 'No',
              preferredDate: data.preferredDate || 'Not specified',
              referenceNumber: ref,
              message: data.message || 'No additional message',
              to_email: data.email,
              admin_email: 'johnpaulchirwa@gmail.com'
            },
            publicKey
          );
        }
      } catch (emailError) {
        console.warn('Email notification skipped:', emailError);
      }

      setReference(ref);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting quote request:', error);
      alert('An error occurred submitting your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-editorial-bg py-16 px-4">
        <div className="max-w-md w-full text-center bg-white p-12 border border-editorial-dark shadow-md">
          <div className="w-16 h-16 border border-editorial-dark rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <div className="absolute inset-1 border border-dashed border-editorial-dark rounded-full"></div>
            <CheckCircle2 className="w-6 h-6 text-emerald-700" />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold block mb-2">Enquiry Logged</span>
          <h2 className="text-3xl font-serif font-bold text-editorial-dark mb-4">Request Received</h2>
          <p className="text-editorial-text mb-6 leading-relaxed font-serif text-sm">
            Thank you for choosing <strong>JR Logistics Connection</strong>. Your official quote reference number is:
          </p>
          <div className="p-4 bg-editorial-bg border border-editorial-dark font-mono font-bold text-lg text-editorial-dark tracking-wider mb-6 select-all">
            {reference}
          </div>
          <p className="text-xs text-editorial-muted font-serif mb-8">
            Our operations team is reviewing your cargo specifications and will issue your formal quotation and collection schedule shortly via email and WhatsApp.
          </p>
          <div className="space-y-3">
            <a
              href={`/track/${reference}`}
              className="w-full py-3.5 bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors block text-center"
            >
              Track Quote Status
            </a>
            <a
              href="/"
              className="w-full py-3 bg-white border border-editorial-dark text-editorial-dark text-xs uppercase tracking-widest font-bold hover:bg-editorial-bg transition-colors block text-center"
            >
              Return to Homepage
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-editorial-bg py-16 text-editorial-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[10px] uppercase tracking-[0.3em] text-editorial-accent font-bold block mb-3">JR Logistics Connection</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight mb-4">Request a Formal Quote</h1>
          <p className="text-base text-editorial-text font-serif max-w-2xl mx-auto">
            Categorized cargo quotation service from Dublin, Ireland to Malawi & Africa. Fill out your shipment details below for a tailored, guaranteed freight rate.
          </p>
        </div>

        <div className="bg-white border border-editorial-dark shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* SECTION 01: CONTACT INFORMATION */}
            <div className="p-8 md:p-12 border-b border-editorial-dark">
              <h3 className="text-xl font-serif font-bold mb-8 flex items-center gap-4 text-editorial-dark">
                <span className="text-[10px] uppercase tracking-widest bg-editorial-dark text-white px-2.5 py-1 font-mono">01</span>
                Contact & Shipper Coordinates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-2">
                    Full Name / Company Name *
                  </label>
                  <input 
                    {...register('customerName')} 
                    placeholder="e.g. Chimwemwe Banda" 
                    className="w-full rounded-none border-0 border-b border-editorial-dark py-3 px-0 text-editorial-dark bg-transparent focus:ring-0 focus:border-editorial-accent transition-colors font-serif" 
                  />
                  {errors.customerName && <p className="text-editorial-accent text-xs mt-2">{errors.customerName.message}</p>}
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-2">
                    Email Address *
                  </label>
                  <input 
                    type="email" 
                    {...register('email')} 
                    placeholder="e.g. client@example.com" 
                    className="w-full rounded-none border-0 border-b border-editorial-dark py-3 px-0 text-editorial-dark bg-transparent focus:ring-0 focus:border-editorial-accent transition-colors font-serif" 
                  />
                  {errors.email && <p className="text-editorial-accent text-xs mt-2">{errors.email.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-2">
                    Phone / WhatsApp Number (with country code) *
                  </label>
                  <input 
                    type="tel" 
                    {...register('phone')} 
                    placeholder="e.g. +353 87 123 4567 or +265 99 123 4567" 
                    className="w-full rounded-none border-0 border-b border-editorial-dark py-3 px-0 text-editorial-dark bg-transparent focus:ring-0 focus:border-editorial-accent transition-colors font-mono" 
                  />
                  {errors.phone && <p className="text-editorial-accent text-xs mt-2">{errors.phone.message}</p>}
                </div>
              </div>
            </div>

            {/* SECTION 02: CATEGORIZED CARGO SPECIFICATION */}
            <div className="p-8 md:p-12 border-b border-editorial-dark">
              <h3 className="text-xl font-serif font-bold mb-8 flex items-center gap-4 text-editorial-dark">
                <span className="text-[10px] uppercase tracking-widest bg-editorial-dark text-white px-2.5 py-1 font-mono">02</span>
                Cargo Classification & Dropdowns
              </h3>

              <div className="space-y-6">
                {/* Routing: Origin and Destination */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-2">
                      Pickup Origin (City / Depot) *
                    </label>
                    <input 
                      {...register('pickupLocation')} 
                      defaultValue="Dublin, Ireland" 
                      className="w-full rounded-none border-0 border-b border-editorial-dark py-3 px-0 text-editorial-dark bg-transparent focus:ring-0 focus:border-editorial-accent transition-colors" 
                    />
                    {errors.pickupLocation && <p className="text-editorial-accent text-xs mt-2">{errors.pickupLocation.message}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-2">
                      Destination Terminal (City / Country) *
                    </label>
                    <input 
                      {...register('destination')} 
                      defaultValue="Lilongwe, Malawi" 
                      className="w-full rounded-none border-0 border-b border-editorial-dark py-3 px-0 text-editorial-dark bg-transparent focus:ring-0 focus:border-editorial-accent transition-colors" 
                    />
                    {errors.destination && <p className="text-editorial-accent text-xs mt-2">{errors.destination.message}</p>}
                  </div>
                </div>

                {/* Main Cargo Category Dropdown */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-2">
                    Primary Cargo Classification (Simple Dropdown) *
                  </label>
                  <select 
                    {...register('cargoCategory')} 
                    className="w-full bg-editorial-bg border border-editorial-dark py-3 px-4 text-sm font-semibold text-editorial-dark focus:ring-0 focus:border-editorial-accent"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.label}>
                        {cat.label} ({cat.shortDesc})
                      </option>
                    ))}
                    <option value="Other / Specialized Cargo">Other / Specialized Cargo</option>
                  </select>
                  {errors.cargoCategory && <p className="text-editorial-accent text-xs mt-2">{errors.cargoCategory.message}</p>}
                </div>

                {/* Sub-Item Specification Dropdown */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-2">
                    Specific Item Type (Categorized Model / Size) *
                  </label>
                  <select 
                    {...register('cargoSubOption')} 
                    className="w-full bg-editorial-bg border border-editorial-dark py-3 px-4 text-sm font-semibold text-editorial-dark focus:ring-0 focus:border-editorial-accent"
                  >
                    {(activeMainCat?.options || []).map(opt => (
                      <option key={opt.id} value={opt.name}>
                        {opt.name} (Base rate: €{opt.rateEur})
                      </option>
                    ))}
                    <option value="Custom Specification">Custom Size / Not Listed Above</option>
                  </select>
                  {errors.cargoSubOption && <p className="text-editorial-accent text-xs mt-2">{errors.cargoSubOption.message}</p>}
                </div>

                {/* Quantity and Weight Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-2">
                      Quantity / Count (e.g. 5 boxes, 1 car, 2 drums) *
                    </label>
                    <input 
                      {...register('quantity')} 
                      placeholder="e.g. 2 barrels, 1 SUV, 50 kg" 
                      className="w-full rounded-none border-0 border-b border-editorial-dark py-3 px-0 text-editorial-dark bg-transparent focus:ring-0 focus:border-editorial-accent transition-colors font-serif" 
                    />
                    {errors.quantity && <p className="text-editorial-accent text-xs mt-2">{errors.quantity.message}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-2">
                      Estimated Weight in KG (Optional / If applicable)
                    </label>
                    <input 
                      {...register('weightKg')} 
                      placeholder="e.g. 60 kg" 
                      className="w-full rounded-none border-0 border-b border-editorial-dark py-3 px-0 text-editorial-dark bg-transparent focus:ring-0 focus:border-editorial-accent transition-colors font-mono" 
                    />
                  </div>
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-2">
                    Detailed Cargo Description & Special Handling *
                  </label>
                  <textarea 
                    {...register('cargoDescription')} 
                    rows={3} 
                    placeholder="Describe the items you are shipping (e.g. 2 x 200L plastic drums with clothes and canned foods, or 2018 Toyota RAV4 Automatic)."
                    className="w-full rounded-none border border-editorial-dark py-3 px-4 text-editorial-dark bg-editorial-bg/30 focus:ring-0 focus:border-editorial-accent transition-colors resize-none font-serif text-sm"
                  ></textarea>
                  {errors.cargoDescription && <p className="text-editorial-accent text-xs mt-2">{errors.cargoDescription.message}</p>}
                </div>
              </div>
            </div>

            {/* SECTION 03: LOGISTICS ADD-ONS & SCHEDULE */}
            {activeAddonList.length > 0 && (
              <div className="p-8 md:p-12 border-b border-editorial-dark bg-editorial-bg/60">
                <h3 className="text-xl font-serif font-bold mb-6 flex items-center gap-4 text-editorial-dark">
                  <span className="text-[10px] uppercase tracking-widest bg-editorial-dark text-white px-2.5 py-1 font-mono">03</span>
                  Logistics & Service Add-Ons
                </h3>

                <div className="space-y-6">
                  {activeAddonList.map(([addonKey, addon]) => {
                    const isInsurance = addon.calculationType === 'percentage' || addonKey === 'marineInsurance';
                    const isSelected = selectedAddons[addonKey];
                    return (
                      <div key={addonKey} className="flex flex-col gap-3">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center h-6 mt-1">
                            <input 
                              type="checkbox" 
                              id={`addon-${addonKey}`} 
                              {...register(`selectedAddons.${addonKey}`)} 
                              className="w-5 h-5 rounded-none border-editorial-dark text-editorial-dark focus:ring-0 cursor-pointer" 
                            />
                          </div>
                          <div className="flex-1">
                            <label htmlFor={`addon-${addonKey}`} className="font-bold text-editorial-dark block cursor-pointer text-sm">
                              {addon.name} 
                              <span className="text-editorial-accent ml-2">
                                {isInsurance 
                                  ? `(From €${addon.minRateEur || 40})` 
                                  : `(+€${addon.rateEur || 0})`}
                              </span>
                            </label>
                            <p className="text-xs text-editorial-text mt-1 font-serif">
                              {addon.description}
                            </p>
                          </div>
                        </div>

                        {/* Special Value Input for Percentage-based Insurance */}
                        {isInsurance && isSelected && (
                          <div className="ml-9 p-3 bg-white border border-editorial-dark/20">
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-1">
                              Estimated Declared Goods Value (€ EUR):
                            </label>
                            <div className="flex items-center max-w-xs border border-editorial-dark bg-white">
                              <span className="px-3 py-1.5 text-xs font-mono font-bold bg-editorial-bg border-r border-editorial-dark">€</span>
                              <input
                                type="number"
                                {...register('goodsValueEur', { valueAsNumber: true })}
                                className="w-full py-1.5 px-3 font-mono text-xs border-0 focus:ring-0"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Always show preferred date if dublinCollection or vehicleTowing is selected */}
                {(selectedAddons['dublinCollection'] || selectedAddons['vehicleTowing']) && (
                  <div className="mt-8 pt-6 border-t border-editorial-dark/10">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-2">
                      Preferred Collection/Pickup Date (Optional)
                    </label>
                    <input 
                      type="date" 
                      {...register('preferredDate')} 
                      className="w-full sm:w-auto rounded-none border border-editorial-dark py-2.5 px-3 text-editorial-dark bg-white focus:ring-0 focus:border-editorial-accent text-xs font-mono" 
                    />
                  </div>
                )}
              </div>
            )}

            {/* SECTION 04: SPECIAL INSTRUCTIONS & SUBMISSION */}
            <div className="p-8 md:p-12 border-b border-editorial-dark">
              <label className="block text-[10px] uppercase tracking-widest font-bold text-editorial-dark mb-2">
                Any Additional Questions or Special Instructions? (Optional)
              </label>
              <textarea 
                {...register('message')} 
                rows={2} 
                placeholder="e.g. Need assistance with loading heavy crate, or prefer Lilongwe depot collection."
                className="w-full rounded-none border border-editorial-dark py-3 px-4 text-editorial-dark bg-transparent focus:ring-0 focus:border-editorial-accent transition-colors resize-none text-sm font-serif"
              ></textarea>
              
              <div className="mt-6 p-4 bg-editorial-bg border border-editorial-dark/10 text-xs font-serif text-editorial-text leading-relaxed">
                By submitting this quotation request, you acknowledge our{' '}
                <a href="/legal/shipping-terms" target="_blank" rel="noopener noreferrer" className="text-editorial-dark font-bold underline hover:text-editorial-accent">
                  Terms of Carriage
                </a>{' '}
                and confirm compliance with{' '}
                <a href="/legal/customs-prohibited" target="_blank" rel="noopener noreferrer" className="text-editorial-dark font-bold underline hover:text-editorial-accent">
                  MRA Customs & Prohibited Goods Policies
                </a>.
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="p-8 bg-editorial-dark text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-editorial-accent font-bold block mb-1">
                  Ready to Submit
                </span>
                <p className="text-xs text-zinc-300 font-serif">
                  We will draft your binding rate quote and send tracking credentials.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-4 bg-editorial-accent text-editorial-dark text-xs uppercase tracking-widest font-black hover:bg-white disabled:opacity-50 transition-colors flex items-center justify-center gap-3 shrink-0"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Quote Request'}
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
