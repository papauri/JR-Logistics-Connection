import { create } from 'zustand';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AuthState {
  user: FirebaseUser | null;
  isAdmin: boolean;
  loading: boolean;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: true,
  initialize: () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Here we could check an 'admins' collection if we wanted strict RBAC.
        // For AI Studio isolated preview, any logged-in user is treated as admin.
        set({ user, isAdmin: true, loading: false });
      } else {
        set({ user: null, isAdmin: false, loading: false });
      }
    });
  },
}));
