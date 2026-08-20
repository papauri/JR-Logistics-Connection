import { create } from 'zustand';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { SiteSettings } from '../types';

interface SettingsState {
  settings: Partial<SiteSettings>;
  loading: boolean;
  initialize: () => void;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
}

const defaultSettings: Partial<SiteSettings> = {
  isUnderConstruction: false,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  loading: true,
  initialize: () => {
    const settingsRef = doc(db, 'settings', 'global');
    
    // Listen to changes in real-time
    onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        set({ settings: { ...defaultSettings, ...docSnap.data() as Partial<SiteSettings> }, loading: false });
      } else {
        // Don't auto-create with only partial settings to avoid overwriting a real default initialization elsewhere, but initialize state
        set({ settings: defaultSettings, loading: false });
      }
    }, (error) => {
      console.error("Error fetching site settings:", error);
      set({ loading: false });
    });
  },
  updateSettings: async (newSettings: Partial<SiteSettings>) => {
    const settingsRef = doc(db, 'settings', 'global');
    await setDoc(settingsRef, newSettings, { merge: true });
    // State will be updated by the onSnapshot listener
  }
}));
