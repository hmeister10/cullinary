import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query, 
  where,
  updateDoc,
  type Firestore,
  type DocumentReference,
  type CollectionReference,
  type DocumentData,
} from 'firebase/firestore';
import { db, isFirebaseAvailable } from '../firebase';

export abstract class BaseRepository {
  protected readonly collectionName: string;
  protected readonly db: Firestore;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.db = this.getFirestore();
  }

  protected getFirestore(): Firestore {
    if (!db || !isFirebaseAvailable()) {
      throw new Error('Firestore is not available');
    }
    return db;
  }

  protected getDocRef(id: string): DocumentReference {
    return doc(this.db, this.collectionName, id);
  }

  protected getCollectionRef(): CollectionReference {
    return collection(this.db, this.collectionName);
  }

  protected async getDoc(id: string) {
    return getDoc(this.getDocRef(id));
  }

  protected async getDocsByField(field: string, value: unknown) {
    const q = query(
      this.getCollectionRef(),
      where(field, '==', value)
    );
    return getDocs(q);
  }

  protected async updateDoc(docId: string, data: Partial<DocumentData>) {
    const docRef = this.getDocRef(docId);
    await updateDoc(docRef, data);
  }
} 