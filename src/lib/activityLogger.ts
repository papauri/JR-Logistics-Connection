import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuthStore } from '../store/authStore';
import type { ActivityLog } from '../types';

export const logActivity = async (
  actionType: ActivityLog['actionType'],
  entityId: string,
  entityType: ActivityLog['entityType'],
  description: string
) => {
  try {
    const user = useAuthStore.getState().user;
    if (!user) return; // Only log authenticated actions

    const logEntry: Omit<ActivityLog, 'id'> = {
      actionType,
      entityId,
      entityType,
      description,
      userId: user.uid,
      userName: user.email || 'Unknown Admin',
      timestamp: Date.now()
    };

    await addDoc(collection(db, 'activity_logs'), logEntry);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};
