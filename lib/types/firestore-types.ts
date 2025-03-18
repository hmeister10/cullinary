import type { Timestamp, FieldValue } from 'firebase/firestore';
import type { DietaryPreferences } from './user-types';

export interface FirestoreUser {
  user_id: string;
  name: string | null;
  dietary_preferences: DietaryPreferences | null;
  favorites: string[];
  created_at: Timestamp | FieldValue;
  menu_ids?: string[];
}

export interface FirestoreMenu {
  menu_id: string;
  start_date: string;
  end_date: string;
  participants: string[];
  status: 'pending' | 'active' | 'completed';
  created_at: Timestamp | FieldValue;
  matches: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snack: string[];
  };
}

export interface FirestoreSwipe {
  user_id: string;
  dish_id: string;
  menu_id: string;
  is_liked: boolean;
  created_at: Timestamp | FieldValue;
} 