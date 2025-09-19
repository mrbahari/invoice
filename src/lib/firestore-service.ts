import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
} from 'firebase/firestore';
import { db } from './firebase';

type CollectionName = 'products' | 'categories' | 'customers' | 'invoices' | 'units' | 'stores';

// Generic function to get a collection for a user
export const getCollection = async <T>(userId: string, collectionName: CollectionName): Promise<T[]> => {
  const q = query(collection(db, `users/${userId}/${collectionName}`));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

// Generic function to get a single document
export const getDocument = async <T>(userId: string, collectionName: CollectionName, docId: string): Promise<T | null> => {
    const docRef = doc(db, `users/${userId}/${collectionName}`, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
};


// Generic function to add a document to a user's collection
export const addDocument = async <T>(userId: string, collectionName: CollectionName, data: Omit<T, 'id'>): Promise<T & { id: string }> => {
  const collectionRef = collection(db, `users/${userId}/${collectionName}`);
  const docRef = await addDoc(collectionRef, data);
  return { id: docRef.id, ...data } as T & { id: string };
};

// Generic function to update a document in a user's collection
export const updateDocument = async <T>(userId: string, collectionName: CollectionName, docId: string, data: Partial<T>): Promise<void> => {
  const docRef = doc(db, `users/${userId}/${collectionName}`, docId);
  await updateDoc(docRef, data);
};

// Generic function to delete a document from a user's collection
export const deleteDocument = async (userId: string, collectionName: CollectionName, docId: string): Promise<void> => {
  const docRef = doc(db, `users/${userId}/${collectionName}`, docId);
  await deleteDoc(docRef);
};

// Batch write function to add multiple documents at once (e.g., initial data)
export const batchAdd = async <T>(userId: string, collectionName: CollectionName, data: Omit<T, 'id'>[]): Promise<void> => {
  const batch = writeBatch(db);
  const collectionRef = collection(db, `users/${userId}/${collectionName}`);
  
  data.forEach(item => {
    const docRef = doc(collectionRef); // Automatically generate new ID
    batch.set(docRef, item);
  });
  
  await batch.commit();
};

// Function to delete all documents in all collections for a user
export const deleteAllUserData = async (userId: string): Promise<void> => {
    const collections: CollectionName[] = ['stores', 'categories', 'products', 'customers', 'invoices', 'units'];
    const batch = writeBatch(db);

    for (const collectionName of collections) {
        const collectionRef = collection(db, `users/${userId}/${collectionName}`);
        const q = query(collectionRef);
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
    }

    await batch.commit();
};

// Check if a user has any data
export const checkUserHasData = async (userId: string): Promise<boolean> => {
    const storesRef = collection(db, `users/${userId}/stores`);
    const q = query(storesRef);
    const snapshot = await getDocs(q);
    return !snapshot.empty;
};
