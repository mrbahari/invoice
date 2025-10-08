
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { Product, Category, Customer, Invoice, UnitOfMeasurement, Store, ToolbarPosition, AppData } from '@/lib/definitions';
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

interface DataContextType {
  data: AppData;
  isInitialized: boolean;
  addDocument: <T extends Document>(collectionName: CollectionName, data: Omit<T, 'id'>) => Promise<string | undefined>;
  addDocuments: <T extends Document>(collectionName: CollectionName, data: Omit<T, 'id'>[]) => Promise<void>;
  updateDocument: (collectionName: CollectionName, docId: string, data: Partial<Document>) => Promise<void>;
  updateDocuments: (collectionName: CollectionName, docIds: string[], data: Partial<Document>) => Promise<void>;
  deleteDocument: (collectionName: CollectionName, docId: string) => Promise<void>;
  deleteDocuments: (collectionName: CollectionName, docIds: string[]) => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<AppData>>; // Expose setData
  setToolbarPosition: (pageKey: string, position: ToolbarPosition) => Promise<void>;
  loadDataBatch: (dataToLoad: Partial<AppData>, merge: boolean, targetStoreId?: string) => Promise<void>;
  clearCollections: (collectionNames: (keyof AppData)[]) => Promise<void>;
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

  const collectionRefs = useMemo(() => ({
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
        products: productsData?.sort((a,b) => (b.id > a.id) ? 1 : ((a.id > b.id) ? -1 : 0)) || [],
        categories: categoriesData || [],
        stores: storesData || [],
        units: unitsData || [],
        customers: customersData || [],
        invoices: invoicesData?.sort((a,b) => (new Date(b.date) as any) - (new Date(a.date) as any)) || [],
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

  const getCollectionRef = useCallback((collectionName: keyof AppData) => {
    const refs = {
      products: productsRef,
      categories: categoriesRef,
      stores: storesRef,
      units: unitsRef,
      customers: customersRef,
      invoices: invoicesRef,
      toolbarPositions: null, // Not a collection
    };
    return refs[collectionName];
  }, [productsRef, categoriesRef, storesRef, unitsRef, customersRef, invoicesRef]);


  const addDocument = useCallback(async (collectionName: CollectionName, docData: DocumentWithoutId) => {
    if (!firestore || !user) return;
    const collectionRef = getCollectionRef(collectionName);

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
  }, [firestore, user, getCollectionRef]);

  const addDocuments = useCallback(async (collectionName: CollectionName, docsData: DocumentWithoutId[]) => {
    if (!firestore || !user || docsData.length === 0) return;
    const collectionRef = getCollectionRef(collectionName);
    if (!collectionRef) return;
    
    const batch = writeBatch(firestore);
    docsData.forEach(docData => {
        const newDocRef = doc(collectionRef);
        batch.set(newDocRef, docData);
    });

    try {
        await batch.commit();
        // Here we rely on onSnapshot to update the local state.
        // For a more immediate optimistic update, we could generate temp IDs and update locally.
    } catch (error) {
        console.error('Batch add error:', error);
         const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [firestore, user, getCollectionRef]);

  const updateDocument = useCallback(async (collectionName: CollectionName, docId: string, docData: Partial<Document>) => {
    if (!firestore || !user) return;
    const collectionRef = getCollectionRef(collectionName);
    
    if (!collectionRef) {
      console.error('Invalid collection reference or user not logged in.');
      return;
    }
    if (!docId || docId.startsWith('temp-')) return; 

    const docRef = doc(collectionRef, docId);
    
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
  }, [firestore, user, getCollectionRef, data]);

  const updateDocuments = useCallback(async (collectionName: CollectionName, docIds: string[], updateData: Partial<Document>) => {
    if (!firestore || !user || docIds.length === 0) return;
    const collectionRef = getCollectionRef(collectionName);
    if (!collectionRef) return;
    
    const batch = writeBatch(firestore);
    docIds.forEach(id => {
      const docRef = doc(collectionRef, id);
      batch.update(docRef, updateData);
    });

    try {
      await batch.commit();
      // Rely on onSnapshot to update UI
    } catch (error) {
      console.error('Batch update error:', error);
      const permissionError = new FirestorePermissionError({
        path: collectionRef.path, // Simplified for batch
        operation: 'update',
        requestResourceData: updateData,
      });
      errorEmitter.emit('permission-error', permissionError);
    }
  }, [firestore, user, getCollectionRef]);

  const deleteDocument = useCallback(async (collectionName: CollectionName, docId: string) => {
    if (!firestore || !user) return;
    const collectionRef = getCollectionRef(collectionName);
    
    if (!collectionRef) {
      console.error('Invalid collection reference or user not logged in.');
      return;
    }
    if (!docId || docId.startsWith('temp-')) return; 
    
    const docRef = doc(collectionRef, docId);

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
  }, [firestore, user, getCollectionRef, data]);

  const deleteDocuments = useCallback(async (collectionName: CollectionName, docIds: string[]) => {
    if (!firestore || !user || docIds.length === 0) return;
    const collectionRef = getCollectionRef(collectionName);
    
    if (!collectionRef) {
      console.error('Invalid collection reference or user not logged in.');
      return;
    }
    
    const originalItems = data[collectionName].filter(item => docIds.includes(item.id));
    if (originalItems.length === 0) return;

    // Optimistic update
    setData(prev => ({
      ...prev,
      [collectionName]: prev[collectionName].filter(item => !docIds.includes(item.id)),
    }));
    
    const batch = writeBatch(firestore);
    docIds.forEach(id => {
      if (id && !id.startsWith('temp-')) {
        batch.delete(doc(collectionRef, id));
      }
    });

    try {
      await batch.commit();
    } catch (error: any) {
        // Revert optimistic update
        setData(prev => ({...prev, [collectionName]: [...prev[collectionName], ...originalItems]}));
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'delete', // This is a simplification for the error
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [firestore, user, getCollectionRef, data]);
  
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

  const clearCollections = useCallback(async (collectionNames: (keyof AppData)[]) => {
    if (!firestore || !user) return;
    const batch = writeBatch(firestore);

    for (const name of collectionNames) {
      const ref = getCollectionRef(name);
      if (ref) {
        const snapshot = await getDocs(query(ref));
        snapshot.docs.forEach(doc => {
          if (doc.id) batch.delete(doc.ref);
        });
      } else if (name === 'toolbarPositions' && toolbarPosRef) {
        batch.set(toolbarPosRef, {});
      }
    }

    try {
      await batch.commit();
      setData(prev => {
        const newData = { ...prev };
        collectionNames.forEach(name => {
          (newData as any)[name] = Array.isArray(prev[name]) ? [] : {};
        });
        return newData;
      });
    } catch (error: any) {
      const permissionError = new FirestorePermissionError({
        path: 'multiple paths',
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
      throw error; // Re-throw so caller knows it failed
    }
  }, [user, firestore, getCollectionRef, toolbarPosRef]);


  const loadDataBatch = useCallback(async (dataToLoad: Partial<AppData>, merge: boolean = false, targetStoreId?: string) => {
    if (!firestore || !user) return;

    if (!merge) {
        const collectionsToClear = Object.keys(dataToLoad) as (keyof AppData)[];
        await clearCollections(collectionsToClear);
    }
    
    const batch = writeBatch(firestore);
    const localDataUpdates: Partial<AppData> = {};

    for (const key of Object.keys(dataToLoad) as (keyof AppData)[]) {
        const collectionData = dataToLoad[key];
        const collectionRef = getCollectionRef(key);
        
        if (collectionRef && Array.isArray(collectionData)) {
            const existingItems = data[key] as any[];
            const itemsToAdd: Document[] = [];

            for (const item of collectionData) {
                const { id, ...itemData } = item;

                let isDuplicate = false;
                if (merge) {
                    if (key === 'units' || key === 'stores' || key === 'categories' || key === 'products') {
                         isDuplicate = existingItems.some(existing => 
                            existing.name === item.name && 
                            (!targetStoreId || existing.storeId === targetStoreId)
                        );
                    } else if (id) {
                        isDuplicate = existingItems.some(existing => existing.id === id);
                    }
                }

                if (isDuplicate) {
                    continue; // Skip if merging and item is a duplicate
                }

                let finalItemData: any = itemData;
                if (targetStoreId && (key === 'products' || key === 'categories' || key === 'units')) {
                  finalItemData = { ...itemData, storeId: targetStoreId };
                }
                
                const docRef = id && !id.startsWith('temp-') ? doc(collectionRef, id) : doc(collectionRef);
                batch.set(docRef, finalItemData);
                itemsToAdd.push({ id: docRef.id, ...finalItemData } as Document);
            }

            if (itemsToAdd.length > 0) {
                 localDataUpdates[key] = merge ? [...data[key], ...itemsToAdd] as any : itemsToAdd as any;
            }
        } else if (key === 'toolbarPositions' && toolbarPosRef && collectionData) {
            batch.set(toolbarPosRef, collectionData, { merge });
            localDataUpdates.toolbarPositions = { ...(merge ? data.toolbarPositions : {}), ...collectionData };
        }
    }
    
    try {
        await batch.commit();
        setData(prev => ({...prev, ...localDataUpdates}));
    } catch(error: any) {
        const permissionError = new FirestorePermissionError({
            path: 'multiple paths',
            operation: 'create',
            requestResourceData: dataToLoad,
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [firestore, user, getCollectionRef, toolbarPosRef, clearCollections, data]);


  const isInitialized = !isUserLoading && isSynced;

  const value: DataContextType = {
    data,
    isInitialized,
    addDocument,
    addDocuments,
    updateDocument,
    updateDocuments,
    deleteDocument,
    deleteDocuments,
    setData,
    setToolbarPosition,
    loadDataBatch,
    clearCollections,
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
