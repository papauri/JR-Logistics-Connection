import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "promanaged-it",
  appId: "1:10840607522:web:932d2088526bde4daf337b",
  apiKey: "AIzaSyBfPK7JJJ2AoXe56931WbkO-SlZTxy9MhQ",
  authDomain: "promanaged-it.firebaseapp.com",
  storageBucket: "promanaged-it.firebasestorage.app",
  messagingSenderId: "10840607522",
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app, 'ai-studio-f2d2848a-d2a0-42b2-9b69-b7a0fde2ed3a');
export const storage = getStorage(app);
