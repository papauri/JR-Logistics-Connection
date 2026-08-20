import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SiteSettings } from '../types';
import { motion } from 'motion/react';
import { PackageSearch, Mail, Anchor, Truck, Plane } from 'lucide-react';

export default function UnderConstruction() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'site');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as SiteSettings);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const titleText = settings?.maintenanceTitle || "We're Upgrading Our Logistics Experience";
  const message = settings?.maintenanceMessage || "JR Logistics Connection is building a seamless, next-generation tracking and booking platform for your Ireland-to-Africa shipments. We will be back online shortly.";

  // Smart split to keep the italic styling dynamic: takes the last two words and styles them
  const words = titleText.split(' ');
  const lastTwo = words.length > 2 ? words.splice(-2).join(' ') : '';
  const firstPart = words.join(' ');

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10">
        <motion.div 
          animate={{ x: ["0%", "100%", "0%"], y: ["0%", "50%", "0%"] }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent"
        />
      </div>

      <div className="z-10 text-center max-w-2xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <PackageSearch className="w-20 h-20 text-blue-500" strokeWidth={1.5} />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute inset-0 border-2 border-dashed border-blue-500/30 rounded-full scale-[1.5]"
            />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-4xl md:text-6xl font-serif text-white mb-4 tracking-tight"
        >
          {lastTwo ? (
            <>
              {firstPart} <br />
              <span className="text-blue-500 italic">{lastTwo}</span>
            </>
          ) : (
            titleText
          )}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="text-zinc-400 text-lg md:text-xl mb-12 font-light leading-relaxed whitespace-pre-wrap"
        >
          {message}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 text-zinc-300"
        >
          <div className="flex items-center gap-3 bg-zinc-900/50 px-6 py-3 rounded-full border border-zinc-800 backdrop-blur-sm">
            <Mail className="w-5 h-5 text-blue-400" />
            <span className="text-sm tracking-wide">{settings?.email || 'info@jrlogisticsconnection.com'}</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="mt-16 flex justify-center gap-8 text-zinc-700"
        >
          <Anchor className="w-6 h-6" />
          <Truck className="w-6 h-6" />
          <Plane className="w-6 h-6" />
        </motion.div>
      </div>
    </div>
  );
}
