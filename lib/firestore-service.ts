import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  query,
  where,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp, // Add Timestamp for type checking
  FieldValue, // Add FieldValue for type checking
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // Correct the import path for db
import type { Menu, MenuMatches } from "@/lib/types/menu-types";
import type { User, DietaryPreferences } from "@/lib/types/user-types";
import type { Dish, MealCategory } from "@/lib/types/dish-types";
// No longer need swipe types here
// import type { UserSwipes, SwipeStatus, FirestoreUserMenuSwipeDoc } from "@/lib/types/swipe-types"; 

// --- Constants ---
const MENUS_COLLECTION = "menus";
const USERS_COLLECTION = "users";
const USER_MENU_SWIPES_COLLECTION = "userMenuSwipes";
// No longer need DISHES_COLLECTION
// const DISHES_COLLECTION = "dishes"; 

// --- Type Definitions (Removed - Moved to specific services) ---
// type FirestoreMenu = ...; // Moved to menu-service.ts
// type FirestoreUser = ...; // Moved to user-service.ts
// type FirestoreUserMenuSwipeDoc = ...; // Moved to swipe-service.ts

// --- Helper Functions (Keep for now, could move to utils) ---
const getCollectionRef = (collectionName: string) => {
  if (!db) throw new Error("Firestore DB is not initialized");
  return collection(db, collectionName);
};
const getDocRef = (collectionName: string, docId: string) => {
  if (!db) throw new Error("Firestore DB is not initialized");
  return doc(db, collectionName, docId);
};

// --- Firestore Service Object (Now potentially empty or just helpers) ---
export const firestoreService = {

  // --- Helper to check DB initialization ---
  _getFirestoreInstance: () => {
    if (!db) {
      console.error("Firestore DB is not initialized!");
      throw new Error("Firestore DB not initialized");
    }
    return db;
  },

  // Include helpers if keeping them here
  getCollectionRef: getCollectionRef,
  getDocRef: getDocRef,

  // =============================================
  // Dish Functions (Removed)
  // =============================================

  // =============================================
  // Placeholder if needed, or remove if service is empty
  // =============================================
  _placeholder: () => {}

}; // End of firestoreService

// Optional: Export helpers directly if firestoreService object becomes redundant
// export { getCollectionRef, getDocRef }; 