export interface FreightSubOption {
  id: string;
  name: string;
  description: string;
  defaultUnit: string;
  rateEur: number;
  rateUsd: number;
  rateMwk: number;
  pricingType: 'per_item' | 'per_kg' | 'per_cbm' | 'flat_rate';
  suggestedWeightKg?: number;
}

export interface FreightMainCategory {
  id: string;
  label: string;
  iconName: 'Package' | 'Car' | 'Scale' | 'Layers' | 'Container';
  shortDesc: string;
  applicableAddons?: string[];
  options: FreightSubOption[];
}

export const FREIGHT_MAIN_CATEGORIES: FreightMainCategory[] = [
  {
    id: 'boxes_drums',
    label: 'Boxes, Drums & Barrels',
    iconName: 'Package',
    shortDesc: 'Standard cartons, luggage bags, and 200L shipping barrels',
    applicableAddons: ['dublinCollection', 'marineInsurance', 'customsDocumentation'],
    options: [
      {
        id: 'box_std_20kg',
        name: 'Standard Box (Up to 20 kg)',
        description: 'Standard medium moving carton (approx 45x45x50 cm)',
        defaultUnit: 'box(es)',
        rateEur: 65,
        rateUsd: 72,
        rateMwk: 120000,
        pricingType: 'per_item',
        suggestedWeightKg: 20
      },
      {
        id: 'box_large_35kg',
        name: 'Large Box / Heavy Carton (Up to 35 kg)',
        description: 'Large heavy-duty double-wall box (approx 55x55x60 cm)',
        defaultUnit: 'box(es)',
        rateEur: 95,
        rateUsd: 105,
        rateMwk: 175000,
        pricingType: 'per_item',
        suggestedWeightKg: 35
      },
      {
        id: 'box_jumbo_50kg',
        name: 'Jumbo Tea Chest / Extra Large (Up to 50 kg)',
        description: 'Extra-large reinforced tea chest box for bulky personal effects',
        defaultUnit: 'box(es)',
        rateEur: 130,
        rateUsd: 145,
        rateMwk: 240000,
        pricingType: 'per_item',
        suggestedWeightKg: 50
      },
      {
        id: 'drum_barrel_200l',
        name: '200L Shipping Barrel / Metal-Plastic Drum',
        description: 'Standard 200 Litre (55 Gallon) heavy shipping drum with seal band',
        defaultUnit: 'barrel(s)',
        rateEur: 160,
        rateUsd: 175,
        rateMwk: 295000,
        pricingType: 'per_item',
        suggestedWeightKg: 80
      },
      {
        id: 'luggage_suitcase',
        name: 'Suitcase / Large Luggage Bag (Up to 30 kg)',
        description: 'Hard-shell or soft travel suitcase / zipped cargo bag',
        defaultUnit: 'bag(s)',
        rateEur: 80,
        rateUsd: 88,
        rateMwk: 148000,
        pricingType: 'per_item',
        suggestedWeightKg: 30
      }
    ]
  },
  {
    id: 'air_freight',
    label: 'Express Air Freight (Direct)',
    iconName: 'Plane',
    shortDesc: 'Fast direct air freight into Lilongwe (LLW) or Blantyre (BLZ)',
    applicableAddons: ['dublinCollection', 'marineInsurance', 'customsDocumentation'],
    options: [
      {
        id: 'air_general_cargo',
        name: 'General Air Cargo (Per KG)',
        description: 'Standard air freight rates for general goods direct to Lilongwe or Blantyre',
        defaultUnit: 'kg',
        rateEur: 12.50,
        rateUsd: 13.80,
        rateMwk: 23000,
        pricingType: 'per_kg'
      },
      {
        id: 'air_electronics',
        name: 'Electronics & High-Value (Per KG)',
        description: 'Secure air freight for laptops, phones, and sensitive equipment',
        defaultUnit: 'kg',
        rateEur: 15.00,
        rateUsd: 16.50,
        rateMwk: 27500,
        pricingType: 'per_kg'
      },
      {
        id: 'air_documents',
        name: 'Document Courier (Envelope)',
        description: 'Urgent document and passport delivery service to Malawi',
        defaultUnit: 'envelope',
        rateEur: 65,
        rateUsd: 70,
        rateMwk: 120000,
        pricingType: 'per_item'
      }
    ]
  },
  {
    id: 'cars_vehicles',
    label: 'Cars & Motor Vehicles',
    iconName: 'Car',
    shortDesc: 'Saloon cars, SUVs, 4x4s, pickups, commercial vans & bikes',
    applicableAddons: ['marineInsurance', 'customsDocumentation', 'vehicleTowing'],
    options: [
      {
        id: 'veh_saloon_sedan',
        name: 'Saloon / Sedan / Hatchback Car',
        description: 'Standard passenger vehicle (e.g. Toyota Corolla, Prius, VW Golf, Audi A4)',
        defaultUnit: 'vehicle',
        rateEur: 1450,
        rateUsd: 1590,
        rateMwk: 2680000,
        pricingType: 'per_item'
      },
      {
        id: 'veh_suv_crossover',
        name: 'SUV / Compact 4x4 / Crossover',
        description: 'Mid-size SUV (e.g. Toyota RAV4, Honda CR-V, Nissan X-Trail, Mazda CX-5)',
        defaultUnit: 'vehicle',
        rateEur: 1750,
        rateUsd: 1920,
        rateMwk: 3230000,
        pricingType: 'per_item'
      },
      {
        id: 'veh_large_4x4',
        name: 'Full-Size 4x4 / Luxury SUV',
        description: 'Large 4WD / Off-road (e.g. Toyota Land Cruiser, Prado, Mitsubishi Pajero, BMW X5)',
        defaultUnit: 'vehicle',
        rateEur: 2100,
        rateUsd: 2310,
        rateMwk: 3880000,
        pricingType: 'per_item'
      },
      {
        id: 'veh_pickup_truck',
        name: 'Pickup Truck / Double Cab',
        description: 'Utility double-cab / single-cab (e.g. Toyota Hilux, Ford Ranger, Isuzu D-Max)',
        defaultUnit: 'vehicle',
        rateEur: 2350,
        rateUsd: 2580,
        rateMwk: 4340000,
        pricingType: 'per_item'
      },
      {
        id: 'veh_commercial_van',
        name: 'Commercial Van / Minibus',
        description: 'High-roof or panel van / 15-seater minibus (e.g. Toyota HiAce, Ford Transit)',
        defaultUnit: 'vehicle',
        rateEur: 2650,
        rateUsd: 2900,
        rateMwk: 4900000,
        pricingType: 'per_item'
      },
      {
        id: 'veh_motorcycle',
        name: 'Motorcycle / Scooter / Quad',
        description: 'Crated or secure roll-on motorcycle / ATV',
        defaultUnit: 'unit',
        rateEur: 650,
        rateUsd: 715,
        rateMwk: 1200000,
        pricingType: 'per_item'
      }
    ]
  },
  {
    id: 'by_weight_kg',
    label: 'By Weight (Per KG Rate)',
    iconName: 'Scale',
    shortDesc: 'Loose cartons, clothes, dry goods, electronics & commercial cargo',
    applicableAddons: ['dublinCollection', 'marineInsurance', 'customsDocumentation'],
    options: [
      {
        id: 'kg_personal_clothes',
        name: 'Clothes & Personal Goods (Per KG)',
        description: 'General apparel, beddings, household goods and personal effects',
        defaultUnit: 'kg',
        rateEur: 5.50,
        rateUsd: 6.00,
        rateMwk: 10200,
        pricingType: 'per_kg'
      },
      {
        id: 'kg_dry_goods_food',
        name: 'Commercial Dry Goods & Groceries (Per KG)',
        description: 'Non-perishable food items, packaged retail merchandise, hygiene items',
        defaultUnit: 'kg',
        rateEur: 6.00,
        rateUsd: 6.60,
        rateMwk: 11100,
        pricingType: 'per_kg'
      },
      {
        id: 'kg_electronics_solar',
        name: 'Electronics, Solar & Appliances (Per KG)',
        description: 'Laptops, screens, solar inverters, batteries, domestic appliances',
        defaultUnit: 'kg',
        rateEur: 8.00,
        rateUsd: 8.80,
        rateMwk: 14800,
        pricingType: 'per_kg'
      },
      {
        id: 'kg_machinery_tools',
        name: 'Machinery Spare Parts & Tools (Per KG)',
        description: 'Automotive spares, generator components, power tools and hardware',
        defaultUnit: 'kg',
        rateEur: 7.50,
        rateUsd: 8.25,
        rateMwk: 13900,
        pricingType: 'per_kg'
      }
    ]
  },
  {
    id: 'pallets_crates',
    label: 'Pallets & Wooden Crates',
    iconName: 'Layers',
    shortDesc: 'Commercial skid loads, shrink-wrapped freight & timber crates',
    applicableAddons: ['dublinCollection', 'marineInsurance', 'customsDocumentation'],
    options: [
      {
        id: 'pallet_euro',
        name: 'Standard Euro Pallet (120 x 80 cm)',
        description: 'Shrink-wrapped Euro pallet up to 1.6m high and 500kg',
        defaultUnit: 'pallet(s)',
        rateEur: 480,
        rateUsd: 530,
        rateMwk: 890000,
        pricingType: 'per_item'
      },
      {
        id: 'pallet_industrial',
        name: 'Industrial Standard Pallet (120 x 100 cm)',
        description: 'Heavy industrial pallet up to 1.8m high and 800kg',
        defaultUnit: 'pallet(s)',
        rateEur: 650,
        rateUsd: 715,
        rateMwk: 1200000,
        pricingType: 'per_item'
      },
      {
        id: 'custom_crate',
        name: 'Custom Wooden Crate (Up to 1.5 CBM)',
        description: 'Enclosed wooden fumigated crate for delicate or high-value cargo',
        defaultUnit: 'crate(s)',
        rateEur: 780,
        rateUsd: 860,
        rateMwk: 1440000,
        pricingType: 'per_item'
      }
    ]
  },
  {
    id: 'container_freight',
    label: 'Full & Shared Container (FCL / LCL)',
    iconName: 'Container',
    shortDesc: '20ft / 40ft dedicated ocean shipping containers or shared CBM space',
    applicableAddons: ['marineInsurance', 'customsDocumentation', 'containerHaulage'],
    options: [
      {
        id: 'fcl_20ft',
        name: '20ft Full Container Load (FCL)',
        description: 'Dedicated 20ft ocean container (approx 33 CBM / 21,000 kg capacity)',
        defaultUnit: 'container',
        rateEur: 3850,
        rateUsd: 4200,
        rateMwk: 7120000,
        pricingType: 'per_item'
      },
      {
        id: 'fcl_40ft_hc',
        name: '40ft High Cube Container (FCL)',
        description: 'Dedicated 40ft High Cube container (approx 76 CBM / 26,000 kg capacity)',
        defaultUnit: 'container',
        rateEur: 6400,
        rateUsd: 7000,
        rateMwk: 11840000,
        pricingType: 'per_item'
      },
      {
        id: 'lcl_per_cbm',
        name: 'LCL Shared Container (Per CBM / m³)',
        description: 'Groupage container space calculated per cubic meter (m³)',
        defaultUnit: 'CBM (m³)',
        rateEur: 220,
        rateUsd: 240,
        rateMwk: 407000,
        pricingType: 'per_cbm'
      }
    ]
  }
];

export const SERVICE_ADDONS = {
  dublinCollection: {
    name: 'Dublin Door-to-Door Collection Service',
    rateEur: 50,
    rateUsd: 55,
    rateMwk: 92500,
    description: 'Driver collection directly from your Dublin residential or commercial address'
  },
  marineInsurance: {
    name: 'Comprehensive Marine Transit Insurance',
    percentage: 0.035, // 3.5% of estimated goods value or minimum €40
    minRateEur: 40,
    minRateUsd: 45,
    minRateMwk: 74000,
    description: 'All-risk cargo coverage against loss, damage, or maritime general average'
  },
  customsDocumentation: {
    name: 'Export Clearance & Malawi Bill of Lading Docs',
    rateEur: 45,
    rateUsd: 50,
    rateMwk: 83000,
    description: 'Export customs filing, manifest registration, and official consignee release paperwork'
  },
  vehicleTowing: {
    name: 'Vehicle Pick up / Towing',
    rateEur: 150,
    rateUsd: 165,
    rateMwk: 277500,
    description: 'Specialized vehicle recovery or pick-up service directly from your driveway'
  },
  containerHaulage: {
    name: 'Container Terminal Haulage',
    rateEur: 350,
    rateUsd: 385,
    rateMwk: 647500,
    description: 'Haulage of container from loading site to departure terminal'
  }
};
