import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Truck, Package, MessageSquare, Star, Loader2, FileText, ChevronDown } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { SiteSettings } from '../types';
import regeneratedImage1 from '../assets/images/regenerated_image_1787151742954.jpg';

const defaultSettings: SiteSettings = {
  companyName: 'JR Logistics Connection',
  tradingName: 'JR Logistics Connection',
  registrationNumber: '',
  address: 'Dublin, Ireland',
  phone: '+353 00 000 0000',
  email: 'info@jrlogistics.example.com',
  whatsappNumber: '353000000000',
  collectionStartingPrice: 50,
  currency: '€',
  heroTitle: 'Shipping from Ireland, made simple.',
  heroSubtitle: 'We collect your goods in Dublin, prepare them for shipment and help get your cargo to destinations across Africa, including Malawi.',
  aboutText: '',
  galleryImages: [
    regeneratedImage1,
    'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800'
  ],
  reviews: [
    { text: "JR Logistics made moving my car to Malawi completely painless. They handled all the paperwork and kept me updated at every stage.", author: "Michael T.", location: "Dublin to Lilongwe" },
    { text: "I've been sending barrels to my family for years, but this is the most reliable service I've found. Fast, secure, and great communication.", author: "Sarah M.", location: "Cork to Blantyre" },
    { text: "Excellent service for our commercial equipment. The collection from our warehouse was seamless, and the tracking system is top-notch.", author: "David K.", location: "Galway to Mzuzu" },
    { text: "Highly recommend! The team is professional, friendly, and they genuinely care about making sure your cargo arrives safely.", author: "Grace L.", location: "Dublin to Zomba" }
  ],
  faqs: [
    { id: '1', question: 'How long does shipping to Malawi usually take?', answer: 'Shipping typically takes 6 to 8 weeks depending on vessel schedules and port clearance at destination.', published: true },
    { id: '2', question: 'Do you offer door-to-door collection?', answer: 'Yes, we offer collection from any location in Dublin and most areas in Ireland for an additional fee.', published: true },
    { id: '3', question: 'Are customs duties included in the quote?', answer: 'The quotes provided cover freight charges. Destination customs duties and taxes are payable by the receiver unless stated otherwise.', published: true },
    { id: '4', question: 'Can I track my cargo?', answer: 'Yes, once your cargo is loaded and departs, we provide a tracking number you can use on our website.', published: true }
  ],
  bankDetails: {
    bankName: 'Bank of Ireland',
    accountName: 'JR Logistics Connection Ltd',
    iban: 'IE00 BOFI 0000 0000 0000 00',
    bic: 'BOFIIE2D'
  },
  vatEnabled: true,
  vatRate: 23,
  updatedAt: Date.now()
};

import customsImage from '../assets/images/regenerated_image_1787154413181.jpg';

const faqs = [
  {
    question: "How does the MRA calculate vehicle import duty?",
    answer: "The Malawi Revenue Authority (MRA) bases vehicle import duty on several factors: the engine capacity (CC), the vehicle's year of manufacture, and the CIF value (Cost, Insurance, and Freight). Generally, newer vehicles and those with smaller engine capacities attract lower excise duties. Standard calculations typically include Import Duty (around 25%), Excise Duty (ranging from 0% to 110% depending on engine size and age), and VAT (16.5%). We provide a preliminary estimate based on your vehicle's specific details before shipping."
  },
  {
    question: "What documents are required for clearing at Songwe or Mchinji?",
    answer: "To ensure smooth clearance, you must provide the original vehicle registration documents (V5C for UK cars), a commercial invoice or bill of sale, the Bill of Lading (if shipped by sea first), and your identification (passport or national ID). Our agents will help prepare the customs declaration forms accurately."
  },
  {
    question: "Are there age restrictions on vehicles imported to Malawi?",
    answer: "Unlike some neighboring countries, Malawi does not currently have a strict age limit banning older vehicles. However, the MRA applies a penalty or higher excise duty on older vehicles to discourage their importation. Vehicles over 8-12 years old typically face significantly higher tax brackets."
  },
  {
    question: "Do you deliver directly to Lilongwe or Blantyre after clearance?",
    answer: "Yes. Once the customs clearance process is fully completed at the border (Songwe or Mchinji), our logistics team can securely drive or transport the vehicle to your specified destination in Lilongwe or Blantyre, saving you the trip."
  }
];

export default function PublicHome() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'global');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as SiteSettings;
          if (data.galleryImages && data.galleryImages[0] === 'https://images.unsplash.com/photo-1586528116311-ad8ed7450951?auto=format&fit=crop&q=80&w=800') {
             data.galleryImages[0] = regeneratedImage1;
          }
          setSettings({ ...defaultSettings, ...data } as SiteSettings);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-editorial-bg">
        <Loader2 className="w-8 h-8 animate-spin text-editorial-accent" />
      </div>
    );
  }

  return (
    <div className="bg-editorial-bg text-editorial-dark">
      {/* Hero Section */}
      <section className="border-b border-editorial-dark flex flex-col md:flex-row min-h-[70vh]">
        <div className="flex-1 p-8 md:p-16 border-r border-editorial-dark flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-editorial-accent">
              <div className="w-3 h-3 rounded-full bg-editorial-accent"></div>
              <span className="text-xs uppercase tracking-widest font-bold">International Logistics</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-sans leading-tight tracking-tight font-extrabold text-zinc-900 whitespace-pre-line">
              {settings.heroTitle}
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-zinc-600 font-sans mt-6">
              {settings.heroSubtitle}
            </p>
          </div>
          <div className="mt-12 flex flex-col sm:flex-row gap-6">
            <Link
              to="/quote"
              className="px-8 py-4 bg-editorial-dark text-white text-xs uppercase tracking-widest font-semibold hover:bg-editorial-accent transition-colors flex items-center justify-center gap-2"
            >
              Get a Quote
            </Link>
            <a
              href="https://wa.me/353000000000"
              target="_blank"
              rel="noreferrer"
              className="px-8 py-4 bg-transparent border border-editorial-dark text-editorial-dark text-xs uppercase tracking-widest font-semibold hover:bg-white transition-colors flex items-center justify-center gap-2"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
        <div className="w-full md:w-1/3 flex flex-col">
          <div className="p-12 border-b border-editorial-dark bg-editorial-dark text-white flex-1 flex flex-col justify-center">
            <span className="text-[10px] uppercase tracking-[0.3em] text-editorial-muted block mb-8">Our Service Guarantee</span>
            <div className="space-y-10">
              <div className="relative pl-6 border-l border-editorial-accent">
                <span className="text-[10px] uppercase tracking-widest block text-editorial-accent mb-1">Route</span>
                <h3 className="text-lg font-sans">Ireland → Africa</h3>
                <p className="text-xs text-editorial-muted mt-1">Direct shipping lines.</p>
              </div>
              <div className="relative pl-6 border-l border-[#444]">
                <span className="text-[10px] uppercase tracking-widest block mb-1 text-white">Coverage</span>
                <h3 className="text-lg font-sans">Dublin Collection</h3>
                <p className="text-xs text-editorial-muted mt-1">Starting from {settings.currency}{settings.collectionStartingPrice}.</p>
              </div>
              <div className="relative pl-6 border-l border-[#444]">
                <span className="text-[10px] uppercase tracking-widest block mb-1 text-white">Security</span>
                <h3 className="text-lg font-sans">Real-time Tracking</h3>
                <p className="text-xs text-editorial-muted mt-1">Know where your cargo is.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Ship */}
      <section className="border-b border-editorial-dark flex flex-col md:flex-row">
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-editorial-dark p-12 flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-editorial-accent mb-4 block font-bold">Standard Cargo Categories</span>
            <h2 className="text-4xl md:text-5xl font-sans font-bold tracking-tight">What We<br/>Ship</h2>
            <p className="mt-6 text-editorial-text font-sans leading-relaxed">From personal boxes and 200L drums to cars, container freight, and rapid air cargo, we handle all freight with professional care.</p>
          </div>
          <div className="mt-8 pt-6 border-t border-editorial-dark/20">
            <Link
              to="/calculator"
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-black text-editorial-dark hover:text-editorial-accent transition-colors"
            >
              Open Instant Shipping Calculator <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        <div className="flex-1 grid sm:grid-cols-2">
          {[
            { title: 'Boxes & 200L Barrels', desc: 'Standard 20kg cartons, 35kg heavy boxes, and 200L shipping drums with door collection.', link: '/calculator' },
            { title: 'Cars & Motor Vehicles', desc: 'Secure Roll-on/Roll-off & container transport for Saloons, SUVs, 4x4s, and Pickups.', link: '/calculator' },
            { title: 'By Weight (Per KG)', desc: 'Flexible per-kg rates (€5.50/kg) for personal effects, dry foods, and commercial goods.', link: '/calculator' },
            { title: 'Pallets & Containers', desc: 'Euro pallets, commercial machinery crates, and dedicated 20ft / 40ft FCL shipping.', link: '/calculator' },
            { title: 'Express Air Freight', desc: 'Fast, direct air cargo straight into Kamuzu (LLW) or Chileka (Blantyre) airports.', link: '/calculator' },
            { title: 'Documents & Electronics', desc: 'Secure, priority air courier for urgent passports, documents, and high-value laptops.', link: '/calculator' }
          ].map((item, idx) => (
            <Link key={item.title} to={item.link} className={`p-10 border-editorial-dark block group hover:bg-white transition-colors ${idx % 2 !== 0 ? 'sm:border-l' : ''} ${idx > 1 ? 'border-t' : 'border-t sm:border-t-0'}`}>
              <div className="w-12 h-12 border border-editorial-dark flex items-center justify-center mb-6 rounded-full relative group-hover:bg-editorial-dark transition-colors"> 
                 <div className="absolute inset-1 border border-dashed border-editorial-dark rounded-full"></div>
                 <Package className="w-4 h-4 text-editorial-dark group-hover:text-editorial-accent transition-colors" />
              </div>
              <h3 className="text-xl font-sans font-bold mb-3 group-hover:text-editorial-accent transition-colors flex items-center justify-between">
                {item.title}
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-editorial-text text-sm leading-relaxed">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Collection Service */}
      <section className="flex flex-col lg:flex-row">
        <div className="flex-1 p-12 lg:p-16 border-b lg:border-b-0 lg:border-r border-editorial-dark flex flex-col justify-center">
          <span className="text-[10px] uppercase tracking-widest text-editorial-accent mb-4 block">Door-to-Door Convenience</span>
          <h2 className="text-5xl font-sans font-bold tracking-tight mb-8">
            Need us to collect it? We can.
          </h2>
          <p className="text-lg text-editorial-text font-sans mb-12 max-w-xl leading-relaxed">
            Save time and hassle. Our Dublin-based collection team can come directly to your home or business, load your goods securely, and bring them to our warehouse for onward shipping.
          </p>
          <div className="flex items-end gap-12">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.3em] opacity-50 mb-2">Starting From</span>
              <span className="text-6xl font-sans font-bold">{settings.currency}{settings.collectionStartingPrice}</span>
            </div>
            <div className="flex-1 h-[1px] bg-editorial-dark mb-4 relative">
              <div className="absolute top-[-4px] left-[15%] w-2 h-2 bg-editorial-accent rounded-full shadow-[0_0_10px_#E03E2D]"></div>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-1/3 p-12 flex flex-col bg-white justify-center">
          <h3 className="text-xl font-sans font-bold mb-8">How It Works</h3>
          <ul className="space-y-8">
            {[
              'Tell us what you are shipping and where you are.',
              'We provide a combined collection and shipping quote.',
              'Our team arrives at the scheduled time to collect.',
              'Track your cargo all the way to its destination.'
            ].map((step, i) => (
              <li key={i} className="flex gap-6 items-start relative pl-8">
                <div className="absolute left-0 top-1 w-4 h-4 border border-editorial-dark flex items-center justify-center text-[8px] font-bold">
                  {i + 1}
                </div>
                <span className="text-editorial-dark text-sm font-medium leading-relaxed">{step}</span>
              </li>
            ))}
          </ul>
          <div className="mt-12 pt-8 border-t border-editorial-dark">
            <Link to="/quote" className="text-[10px] uppercase tracking-widest font-bold text-editorial-accent hover:text-editorial-dark transition-colors flex items-center gap-2">
              Request a collection <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* Destination Services & Customs */}
      <section className="flex flex-col md:flex-row border-b border-editorial-dark bg-white">
        <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-editorial-dark relative min-h-[400px]">
          <img 
            src={customsImage} 
            alt="Mchinji and Songwe Border Customs Clearing" 
            className="absolute inset-0 w-full h-full object-cover grayscale opacity-90"
          />
          <div className="absolute inset-0 bg-editorial-dark/30 mix-blend-multiply"></div>
          <div className="absolute bottom-6 left-6 bg-editorial-dark text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5">
            Operations: Songwe / Mchinji / LLW / BLZ
          </div>
        </div>
        <div className="w-full md:w-1/2 p-12 lg:p-16 flex flex-col justify-center">
          <span className="text-[10px] uppercase tracking-widest text-editorial-accent mb-4 block font-bold">Destination Support</span>
          <h2 className="text-4xl md:text-5xl font-sans font-bold tracking-tight mb-8">
            Customs Clearance & Delivery.
          </h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-sans font-bold mb-3 flex items-center gap-2 text-editorial-dark">
                <FileText className="w-5 h-5 text-editorial-accent" />
                Comprehensive Customs Assistance
              </h3>
              <p className="text-editorial-text text-sm leading-relaxed">
                Navigating border regulations can be complex. We offer complete customs clearing assistance where required. While official customs duties and destination fees vary based on your specific cargo and regulations, our dedicated agents will help you handle the paperwork, navigate inspections, and resolve anything customs-related at borders like Mchinji or Songwe to ensure your freight is released smoothly.
              </p>
            </div>
            
            <div className="pt-8 border-t border-editorial-dark/10">
              <h3 className="text-xl font-sans font-bold mb-3 flex items-center gap-2 text-editorial-dark">
                <MapPin className="w-5 h-5 text-editorial-accent" />
                Air Freight & Vehicle Deliveries
              </h3>
              <p className="text-editorial-text text-sm leading-relaxed">
                Whether you're clearing air freight at <strong className="text-editorial-dark">Kamuzu International (LLW)</strong> or <strong className="text-editorial-dark">Chileka International (Blantyre)</strong>, or receiving a vehicle from the border, we ensure it reaches you. We handle both airport cargo clearance and direct-to-door delivery within the major cities. Skip the hassle of customs terminals—we bring the cargo straight to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customs & Clearance FAQ */}
      <section className="bg-zinc-50 border-b border-editorial-dark py-20 px-6 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[10px] uppercase tracking-widest text-editorial-accent mb-4 block font-bold">Expert Knowledge</span>
            <h2 className="text-3xl md:text-4xl font-sans font-bold tracking-tight text-editorial-dark">
              Malawi Customs & Clearance FAQ
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-white border border-editorial-dark transition-all duration-300"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-sans font-bold text-editorial-dark pr-8">{faq.question}</span>
                  <ChevronDown 
                    className={`w-5 h-5 text-editorial-accent shrink-0 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} 
                  />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="px-6 pb-6 text-sm text-editorial-text leading-relaxed border-t border-editorial-dark/10 pt-4">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shipping Gallery */}
      <section className="border-b border-editorial-dark">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {settings.galleryImages.slice(0, 4).map((img, idx) => (
            <div key={idx} className="aspect-square border-r border-editorial-dark relative overflow-hidden group">
              <img src={img} alt={`Gallery Image ${idx + 1}`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
              <div className="absolute inset-0 bg-editorial-dark/10 group-hover:bg-transparent transition-colors"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="flex flex-col md:flex-row border-b border-editorial-dark">
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-editorial-dark p-12 lg:p-16 flex flex-col justify-center bg-editorial-dark text-white">
          <span className="text-[10px] uppercase tracking-widest text-editorial-muted mb-4 block">Client Reviews</span>
          <h2 className="text-5xl font-sans font-bold tracking-tight leading-tight">Trusted by<br/>Families &<br/>Businesses.</h2>
        </div>
        <div className="flex-1 p-6 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settings.reviews.filter(r => r.published !== false).slice(0, 4).map((review, idx) => (
              <div 
                key={idx} 
                className={`border border-editorial-dark bg-white overflow-hidden flex flex-col ${
                  // Make the first item span 2 columns if there's an image, or just vary the span for a bento feel
                  idx === 0 && review.imageUrl ? 'md:col-span-2 md:flex-row' : ''
                }`}
              >
                {review.imageUrl && (
                  <div className={`border-b border-editorial-dark ${idx === 0 && review.imageUrl ? 'md:border-b-0 md:border-r md:w-1/2' : ''}`}>
                    <img 
                      src={review.imageUrl} 
                      alt={`Review by ${review.author}`} 
                      className="w-full h-48 md:h-full object-cover grayscale opacity-90"
                    />
                  </div>
                )}
                <div className={`p-8 md:p-10 flex flex-col justify-center ${idx === 0 && review.imageUrl ? 'md:w-1/2' : 'flex-1'}`}>
                  <div className="flex gap-1 text-editorial-accent mb-6">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-editorial-dark text-lg font-sans mb-8 leading-relaxed">"{review.text}"</p>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-editorial-dark mb-1">{review.author}</p>
                    <p className="text-[10px] uppercase tracking-widest text-editorial-muted">{review.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      {settings.faqs && settings.faqs.filter(f => f.published !== false).length > 0 && (
        <section className="border-b border-editorial-dark flex flex-col md:flex-row">
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-editorial-dark p-12 lg:p-16 flex flex-col justify-center">
            <span className="text-[10px] uppercase tracking-widest text-editorial-accent mb-4 block font-bold">Information</span>
            <h2 className="text-4xl md:text-5xl font-sans font-bold tracking-tight">Common<br/>Questions</h2>
            <p className="mt-6 text-editorial-text font-sans leading-relaxed">Everything you need to know about our shipping and logistics services.</p>
          </div>
          <div className="flex-1 grid sm:grid-cols-2">
            {settings.faqs.filter(f => f.published !== false).map((faq, idx) => (
              <div key={faq.id || idx} className={`p-10 lg:p-12 border-editorial-dark hover:bg-white transition-colors ${idx % 2 !== 0 ? 'sm:border-l' : ''} ${idx > 1 ? 'border-t' : 'border-t sm:border-t-0'}`}>
                <h3 className="text-lg font-sans font-bold mb-4 text-editorial-dark">
                  {faq.question}
                </h3>
                <p className="text-editorial-text text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contact CTA Section */}
      <section className="py-24 px-6 text-center bg-editorial-bg">
        <div className="max-w-3xl mx-auto">
          <span className="text-[10px] uppercase tracking-widest text-editorial-accent mb-6 block font-bold">Need assistance?</span>
          <h2 className="text-4xl md:text-5xl font-sans font-bold tracking-tight mb-8">
            Let's talk logistics.
          </h2>
          <p className="text-lg text-editorial-text font-sans leading-relaxed mb-10 max-w-2xl mx-auto">
            Our dispatch team is ready to answer your questions, assist with active shipments, and provide customized freight solutions for your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contact" className="px-8 py-4 bg-editorial-dark text-white text-xs uppercase tracking-widest font-bold hover:bg-editorial-accent transition-colors w-full sm:w-auto">
              Contact Us Online
            </Link>
            {settings.phone && (
              <a href={`tel:${settings.phone}`} className="px-8 py-4 bg-white border border-editorial-dark text-editorial-dark text-xs uppercase tracking-widest font-bold hover:bg-zinc-50 transition-colors w-full sm:w-auto">
                Call {settings.phone}
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
