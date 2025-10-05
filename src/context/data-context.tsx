
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { Product, Category, Customer, Invoice, UnitOfMeasurement, Store, ToolbarPosition } from '@/lib/definitions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useUser } from '@/context/user-context';
import { useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getFirestore, CollectionReference, addDoc, updateDoc, deleteDoc, getDocs, query, DocumentReference, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


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
  setToolbarPosition: (pageKey: string, position: ToolbarPosition) => Promise<void>;
  loadDataBatch: (dataToLoad: Partial<AppData>) => Promise<void>;
  clearAllUserData: () => Promise<void>;
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
  const [localData, setLocalData] = useState<AppData>(emptyData);
  const [isSynced, setIsSynced] = useState(false);
  const { firestore } = useMemo(() => initializeFirebase(), []);


  // Define collection references, memoized to prevent re-renders
  const productsRef = useMemoFirebase(() => firestore ? collection(firestore, 'products') : null, [firestore]);
  const categoriesRef = useMemoFirebase(() => firestore ? collection(firestore, 'categories') : null, [firestore]);
  const storesRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'stores') : null, [firestore, user]);
  const unitsRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'units') : null, [firestore, user]);
  const customersRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'clients') : null, [firestore, user]);
  const invoicesRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'invoices') : null, [firestore, user]);
  const toolbarPosRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'settings', 'toolbarPositions') : null, [firestore, user]);

  const collectionRefs: Record<CollectionName, CollectionReference<any> | null> = useMemo(() => ({
    products: productsRef,
    categories: categoriesRef,
    stores: storesRef,
    units: unitsRef,
    customers: customersRef,
    invoices: invoicesRef,
  }), [productsRef, categoriesRef, storesRef, unitsRef, customersRef, invoicesRef]);

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
      setLocalData(emptyData);
      setIsSynced(false);
    }
  }, [user, isUserLoading]);
  
  // Combine all data sources into a single AppData object
  useEffect(() => {
    const isDataLoading = productsLoading || categoriesLoading || storesLoading || unitsLoading || customersLoading || invoicesLoading || toolbarLoading;
    
    if (!isDataLoading && (user || !isUserLoading)) {
      setLocalData({
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
      setLocalData(emptyData);
      setIsSynced(true);
    }
  }, [
    user, isUserLoading,
    productsData, categoriesData, storesData, unitsData, customersData, invoicesData, toolbarData,
    productsLoading, categoriesLoading, storesLoading, unitsLoading, customersLoading, invoicesLoading, toolbarLoading
  ]);

  const addDocument = useCallback(async <T extends Document>(collectionName: CollectionName, data: Omit<T, 'id'>) => {
    if (!firestore) return;
    const ref = collectionRefs[collectionName];
    if (!ref) {
      console.error('Invalid collection reference or user not logged in.');
      return;
    }
    
    const tempId = `temp-${Date.now()}`;
    // Optimistic update
    setLocalData(prev => ({
      ...prev,
      [collectionName]: [...prev[collectionName], { id: tempId, ...data } as Document],
    }));

    try {
      const docRef = await addDoc(ref, data);
      // Replace tempId with real ID from Firestore
      setLocalData(prev => ({
        ...prev,
        [collectionName]: prev[collectionName].map(item =>
          item.id === tempId ? { ...item, id: docRef.id } : item
        ),
      }));
      return docRef.id;
    } catch (error: any) {
        // Revert optimistic update on failure
        setLocalData(prev => ({
            ...prev,
            [collectionName]: prev[collectionName].filter(item => item.id !== tempId)
        }));
        const permissionError = new FirestorePermissionError({
          path: ref.path,
          operation: 'create',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [collectionRefs, firestore]);

  const updateDocument = useCallback(async (collectionName: CollectionName, docId: string, data: Partial<Document>) => {
    if (!firestore) return;
    const ref = collectionRefs[collectionName];
     if (!ref) {
      console.error('Invalid collection reference or user not logged in.');
      return;
    }
    if (!docId || docId.startsWith('temp-')) return; 

    const docRef = doc(ref, docId);
    
    const originalState = localData[collectionName];
    const originalItem = originalState.find(item => item.id === docId);

    // Optimistic update
    setLocalData(prev => ({
      ...prev,
      [collectionName]: prev[collectionName].map(item =>
        item.id === docId ? { ...item, ...data } : item
      ),
    }));

    try {
      await updateDoc(docRef, data);
    } catch (error: any) {
        // Revert optimistic update
        if (originalItem) {
          setLocalData(prev => ({
              ...prev,
              [collectionName]: prev[collectionName].map(item =>
                  item.id === docId ? originalItem : item
              )
          }));
        }
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [collectionRefs, localData, firestore]);

  const deleteDocument = useCallback(async (collectionName: CollectionName, docId: string) => {
    if (!firestore) return;
    const ref = collectionRefs[collectionName];
    if (!ref) {
      console.error('Invalid collection reference or user not logged in.');
      return;
    }
    if (!docId || docId.startsWith('temp-')) return; 
    
    const docRef = doc(ref, docId);

    const originalItem = localData[collectionName].find(item => item.id === docId);
    if (!originalItem) return;

    // Optimistic update
    setLocalData(prev => ({
      ...prev,
      [collectionName]: prev[collectionName].filter(item => item.id !== docId),
    }));

    try {
      await deleteDoc(docRef);
    } catch (error: any) {
        // Revert optimistic update
        setLocalData(prev => ({...prev, [collectionName]: [...prev[collectionName], originalItem]}));
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [collectionRefs, localData, firestore]);
  
  const setToolbarPosition = useCallback(async (pageKey: string, position: ToolbarPosition) => {
    // Optimistic update for local state
    setLocalData(prev => ({
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

  const clearAllUserData = useCallback(async () => {
    if (!user || !firestore) return;
    const batch = writeBatch(firestore);

    // This function will only clear USER-SPECIFIC data.
    const userCollectionsRefs: (CollectionReference | null)[] = [
        storesRef,
        unitsRef,
        customersRef,
        invoicesRef,
    ];

    for (const ref of userCollectionsRefs) {
        if (ref) {
            const q = query(ref);
            const snapshot = await getDocs(q);
            snapshot.docs.forEach(doc => {
              if (doc.id) batch.delete(doc.ref);
            });
        }
    }
    if (toolbarPosRef) {
      batch.delete(toolbarPosRef);
    }

    try {
        await batch.commit();
    } catch(error: any) {
        const permissionError = new FirestorePermissionError({
            path: 'multiple user-specific paths',
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [user, firestore, storesRef, unitsRef, customersRef, invoicesRef, toolbarPosRef]);


  const loadDataBatch = useCallback(async (dataToLoad: Partial<AppData>) => {
    if (!user || !firestore) return;
    const batch = writeBatch(firestore);
    
    // This function only restores USER-SPECIFIC collections.
    const userCollectionsToLoad: { ref: CollectionReference | null, data: any[] | undefined }[] = [
        { ref: storesRef, data: dataToLoad.stores },
        { ref: unitsRef, data: dataToLoad.units },
        { ref: customersRef, data: dataToLoad.customers },
        { ref: invoicesRef, data: dataToLoad.invoices },
    ];

    for (const { ref, data } of userCollectionsToLoad) {
        if (ref && data) {
            data.forEach((item: Document) => {
                if (item.id && typeof item.id === 'string') {
                    const docRef = doc(ref, item.id);
                    batch.set(docRef, item);
                }
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
  }, [user, firestore, storesRef, unitsRef, customersRef, invoicesRef, toolbarPosRef]);


  const isInitialized = !isUserLoading && isSynced;

  const value: DataContextType = {
    data: localData,
    isInitialized,
    addDocument,
    updateDocument,
    deleteDocument,
    setToolbarPosition,
    loadDataBatch,
    clearAllUserData,
  };
  
  if (!isInitialized && (isUserLoading || !isSynced)) {
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
