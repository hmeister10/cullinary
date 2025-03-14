import { initializeApp, getApps, FirebaseError } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Check if Firebase environment variables are set
const isFirebaseConfigured = 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'mock-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'mock-project-id.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mock-project-id',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mock-project-id.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only if not already initialized
let app;
let firestoreDb: Firestore | null = null;
let isMockDb = false;
let firebaseError: Error | null = null;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  firestoreDb = getFirestore(app);
  
  // Uncomment this to use the Firestore emulator for local development
  // if (process.env.NODE_ENV === 'development') {
  //   connectFirestoreEmulator(firestoreDb, 'localhost', 8080);
  // }
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  isMockDb = true;
  firebaseError = error instanceof Error ? error : new Error(String(error));
}

// Export a flag to check if Firebase is properly configured
export const isFirebaseAvailable = (): boolean => {
  return Boolean(isFirebaseConfigured && firestoreDb && !isMockDb);
};

// Get the Firebase error if any
export const getFirebaseError = (): Error | null => {
  return firebaseError;
};

// Export the Firestore database
export const db = firestoreDb;

// Helper function to check if an error is a Firebase permission error
export const isFirebasePermissionError = (error: unknown): boolean => {
  return (
    error instanceof FirebaseError && 
    (error.code === 'permission-denied' || error.message.includes('Missing or insufficient permissions'))
  );
}; 