
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { Product, Category, Customer, Invoice, UnitOfMeasurement, Store, ToolbarPosition } from '@/lib/definitions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useUser } from '@/firebase'; // Changed from user-context
import { useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getFirestore, CollectionReference, addDoc, updateDoc, deleteDoc, getDocs, query, DocumentReference, setDoc, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


type DocumentWithoutId = Omit<Product, 'id'> | Omit<Category, 'id'> | Omit<Customer, 'id'> | Omit<Invoice, 'id'> | Omit<UnitOfMeasurement, 'id'> | Omit<Store, 'id'>;
type Document = Product | Category | Customer | Invoice | UnitOfMeasurement | Store;
type CollectionName = 'products' | 'categories' | 'customers' | 'invoices' | 'units' | 'stores';

interface AppData {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  invoices: Invoice[];
  units: UnitOfMeasurement[];
  stores: Store[];
  toolbarPositions: { [key: string]: ToolbarPosition };
}

interface DataContextType {
  data: AppData;
  isInitialized: boolean;
  addDocument: <T extends Document>(collectionName: CollectionName, data: Omit<T, 'id'>) => Promise<string | undefined>;
  updateDocument: (collectionName: CollectionName, docId: string, data: Partial<Document>) => Promise<void>;
  deleteDocument: (collectionName: CollectionName, docId: string) => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<AppData>>; // Expose setData
  setToolbarPosition: (pageKey: string, position: ToolbarPosition) => Promise<void>;
  loadDataBatch: (dataToLoad: Partial<AppData>) => Promise<void>;
  clearAllData: () => Promise<void>;
}


const DataContext = createContext<DataContextType | undefined>(undefined);

const emptyData: AppData = {
  products: [],
  categories: [],
  customers: [],
  invoices: [],
  units: [],
  stores: [],
  toolbarPositions: {},
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading } = useUser();
  const [data, setData] = useState<AppData>(emptyData);
  const [isSynced, setIsSynced] = useState(false);
  const { firestore } = useMemo(() => initializeFirebase(), []);


  // Define collection references, memoized to prevent re-renders
  const productsRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'products') : null, [firestore, user]);
  const categoriesRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'categories') : null, [firestore, user]);
  const storesRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'stores') : null, [firestore, user]);
  const unitsRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'units') : null, [firestore, user]);
  const customersRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'clients') : null, [firestore, user]);
  const invoicesRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'invoices') : null, [firestore, user]);
  const toolbarPosRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'settings', 'toolbarPositions') : null, [firestore, user]);

  const collectionRefs: Record<string, CollectionReference<any> | DocumentReference<any> | null> = useMemo(() => ({
    products: productsRef,
    categories: categoriesRef,
    stores: storesRef,
    units: unitsRef,
    customers: customersRef,
    invoices: invoicesRef,
    toolbarPositions: toolbarPosRef,
  }), [productsRef, categoriesRef, storesRef, unitsRef, customersRef, invoicesRef, toolbarPosRef]);

  // Fetch collections from Firestore
  const { data: productsData, isLoading: productsLoading } = useCollection<Product>(productsRef);
  const { data: categoriesData, isLoading: categoriesLoading } = useCollection<Category>(categoriesRef);
  const { data: storesData, isLoading: storesLoading } = useCollection<Store>(storesRef);
  const { data: unitsData, isLoading: unitsLoading } = useCollection<UnitOfMeasurement>(unitsRef);
  const { data: customersData, isLoading: customersLoading } = useCollection<Customer>(customersRef);
  const { data: invoicesData, isLoading: invoicesLoading } = useCollection<Invoice>(invoicesRef);
  const { data: toolbarData, isLoading: toolbarLoading } = useDoc<any>(toolbarPosRef);
  
  useEffect(() => {
    // Check if user has logged out, then reset local state
    if (!user && !isUserLoading) {
      setData(emptyData);
      setIsSynced(false);
    }
  }, [user, isUserLoading]);
  
  // Combine all data sources into a single AppData object
  useEffect(() => {
    const isDataLoading = productsLoading || categoriesLoading || storesLoading || unitsLoading || customersLoading || invoicesLoading || toolbarLoading;
    
    if (!isDataLoading && (user || !isUserLoading)) {
      setData({
        products: productsData || [],
        categories: categoriesData || [],
        stores: storesData || [],
        units: unitsData || [],
        customers: customersData || [],
        invoices: invoicesData || [],
        toolbarPositions: toolbarData || {},
      });
      setIsSynced(true);
    } else if (!user && !isUserLoading) {
      // When user logs out, we should also be considered "synced" with an empty state
      setData(emptyData);
      setIsSynced(true);
    }
  }, [
    user, isUserLoading,
    productsData, categoriesData, storesData, unitsData, customersData, invoicesData, toolbarData,
    productsLoading, categoriesLoading, storesLoading, unitsLoading, customersLoading, invoicesLoading, toolbarLoading
  ]);

  const addDocument = useCallback(async (collectionName: CollectionName, docData: DocumentWithoutId) => {
    if (!firestore) return;
    const ref = collectionRefs[collectionName];

    let collectionRef: CollectionReference | null = null;
    if(ref instanceof CollectionReference) {
      collectionRef = ref;
    } else if (ref instanceof DocumentReference) {
      // This case is not for adding documents, but we handle it for type safety
      console.error('Cannot add a document to a DocumentReference');
      return;
    }

    if (!collectionRef) {
        console.error('Invalid collection reference or user not logged in for collection:', collectionName);
        return;
    }
    
    const tempId = `temp-${Date.now()}`;
    // Optimistic update
    setData(prev => ({
      ...prev,
      [collectionName]: [...prev[collectionName], { id: tempId, ...docData } as Document],
    }));

    try {
      const docRef = await addDoc(collectionRef, docData);
      // Replace tempId with real ID from Firestore
      setData(prev => ({
        ...prev,
        [collectionName]: prev[collectionName].map(item =>
          item.id === tempId ? { ...item, id: docRef.id } : item
        ),
      }));
      return docRef.id;
    } catch (error: any) {
        // Revert optimistic update on failure
        setData(prev => ({
            ...prev,
            [collectionName]: prev[collectionName].filter(item => item.id !== tempId)
        }));
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'create',
          requestResourceData: docData,
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [collectionRefs, firestore]);

  const updateDocument = useCallback(async (collectionName: CollectionName, docId: string, docData: Partial<Document>) => {
    if (!firestore) return;
    const ref = collectionRefs[collectionName];
    if (!ref || !(ref instanceof CollectionReference)) {
      console.error('Invalid collection reference or user not logged in.');
      return;
    }
    if (!docId || docId.startsWith('temp-')) return; 

    const docRef = doc(ref, docId);
    
    const originalState = data[collectionName];
    const originalItem = originalState.find(item => item.id === docId);

    // Optimistic update
    setData(prev => ({
      ...prev,
      [collectionName]: prev[collectionName].map(item =>
        item.id === docId ? { ...item, ...docData } : item
      ),
    }));

    try {
      await updateDoc(docRef, docData);
    } catch (error: any) {
        // Revert optimistic update
        if (originalItem) {
          setData(prev => ({
              ...prev,
              [collectionName]: prev[collectionName].map(item =>
                  item.id === docId ? originalItem : item
              )
          }));
        }
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: docData,
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [collectionRefs, data, firestore]);

  const deleteDocument = useCallback(async (collectionName: CollectionName, docId: string) => {
    if (!firestore) return;
    const ref = collectionRefs[collectionName];
    if (!ref || !(ref instanceof CollectionReference)) {
      console.error('Invalid collection reference or user not logged in.');
      return;
    }
    if (!docId || docId.startsWith('temp-')) return; 
    
    const docRef = doc(ref, docId);

    const originalItem = data[collectionName].find(item => item.id === docId);
    if (!originalItem) return;

    // Optimistic update
    setData(prev => ({
      ...prev,
      [collectionName]: prev[collectionName].filter(item => item.id !== docId),
    }));

    try {
      await deleteDoc(docRef);
    } catch (error: any) {
        // Revert optimistic update
        setData(prev => ({...prev, [collectionName]: [...prev[collectionName], originalItem]}));
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [collectionRefs, data, firestore]);
  
  const setToolbarPosition = useCallback(async (pageKey: string, position: ToolbarPosition) => {
    // Optimistic update for local state
    setData(prev => ({
      ...prev,
      toolbarPositions: {
        ...prev.toolbarPositions,
        [pageKey]: position,
      },
    }));

    if (toolbarPosRef) {
        try {
            await setDoc(toolbarPosRef, { [pageKey]: position }, { merge: true });
        } catch (error: any) {
            const permissionError = new FirestorePermissionError({
                path: toolbarPosRef.path,
                operation: 'update',
                requestResourceData: { [pageKey]: position },
            });
            errorEmitter.emit('permission-error', permissionError);
        }
    }
  }, [toolbarPosRef]);

  const clearAllData = useCallback(async () => {
    if (!firestore || !user) return;
    const batch = writeBatch(firestore);

    const collectionsToClear: (CollectionReference | null)[] = [
      productsRef, categoriesRef, storesRef, unitsRef, customersRef, invoicesRef
    ];
    
    for (const ref of collectionsToClear) {
      if (ref) {
        const snapshot = await getDocs(query(ref));
        snapshot.docs.forEach(doc => {
          if (doc.id) batch.delete(doc.ref);
        });
      }
    }

    if (toolbarPosRef) {
      batch.set(toolbarPosRef, {});
    }

    try {
      await batch.commit();
      setData(emptyData);
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: 'multiple paths',
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
      throw error; // Re-throw so caller knows it failed
    }
  }, [user, firestore, toolbarPosRef, productsRef, categoriesRef, storesRef, unitsRef, customersRef, invoicesRef]);


  const loadDataBatch = useCallback(async (dataToLoad: Partial<AppData>) => {
    if (!firestore || !user) return;
    const batch = writeBatch(firestore);
    
    const collectionsToLoad: { name: CollectionName, ref: CollectionReference | null, data: any[] | undefined }[] = [
        { name: 'products', ref: productsRef, data: dataToLoad.products },
        { name: 'categories', ref: categoriesRef, data: dataToLoad.categories },
        { name: 'stores', ref: storesRef, data: dataToLoad.stores },
        { name: 'units', ref: unitsRef, data: dataToLoad.units },
        { name: 'customers', ref: customersRef, data: dataToLoad.customers },
        { name: 'invoices', ref: invoicesRef, data: dataToLoad.invoices },
    ];

    for (const { name, ref, data } of collectionsToLoad) {
        if (ref && data) {
            data.forEach((item: Document) => {
                const docRef = item.id ? doc(ref, item.id) : doc(ref);
                const { id, ...itemData } = item;
                batch.set(docRef, itemData);
            });
        }
    }

    if (toolbarPosRef && dataToLoad.toolbarPositions) {
        batch.set(toolbarPosRef, dataToLoad.toolbarPositions);
    }

    try {
        await batch.commit();
    } catch(error: any) {
        const permissionError = new FirestorePermissionError({
            path: 'multiple paths',
            operation: 'create',
            requestResourceData: dataToLoad,
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [firestore, user, productsRef, categoriesRef, storesRef, unitsRef, customersRef, invoicesRef, toolbarPosRef]);


  const isInitialized = !isUserLoading && isSynced;

  const value: DataContextType = {
    data,
    isInitialized,
    addDocument,
    updateDocument,
    deleteDocument,
    setData,
    setToolbarPosition,
    loadDataBatch,
    clearAllData,
  };
  
  if (!isInitialized) {
      return (
            <div className="flex h-screen w-screen items-center justify-center bg-background/80 backdrop-blur-sm">
                <LoadingSpinner />
            </div>
      );
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
