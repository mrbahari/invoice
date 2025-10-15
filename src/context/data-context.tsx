
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { Product, Category, Customer, Invoice, UnitOfMeasurement, Store, ToolbarPosition, AppData, UserProfile } from '@/lib/definitions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useUser } from '@/firebase'; // Changed from user-context
import { useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getFirestore, CollectionReference, addDoc, updateDoc, deleteDoc, getDocs, query, DocumentReference, setDoc, where, deleteField } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


type DocumentWithoutId = Omit<Product, 'id'> | Omit<Category, 'id'> | Omit<Customer, 'id'> | Omit<Invoice, 'id'> | Omit<UnitOfMeasurement, 'id'> | Omit<Store, 'id'>;
type Document = Product | Category | Customer | Invoice | UnitOfMeasurement | Store;
type CollectionName = 'products' | 'categories' | 'customers' | 'invoices' | 'units' | 'stores' | 'userProfiles';

export type RepairReport = {
    [key in keyof Omit<AppData, 'toolbarPositions' | 'userProfiles'>]: {
        label: string;
        total: number;
        repaired: number;
    }
};


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
  repairDatabase: () => Promise<RepairReport>;
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
  userProfiles: [],
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
  const userProfilesRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'userProfiles') : null, [firestore, user]);
  const invoicesRef = useMemoFirebase(() => user && firestore ? collection(firestore, 'users', user.uid, 'invoices') : null, [firestore, user]);
  const toolbarPosRef = useMemoFirebase(() => user && firestore ? doc(firestore, 'users', user.uid, 'settings', 'toolbarPositions') : null, [firestore, user]);

  const collectionRefs = useMemo(() => ({
    products: productsRef,
    categories: categoriesRef,
    stores: storesRef,
    units: unitsRef,
    customers: userProfilesRef, // Use userProfiles for customers
    userProfiles: userProfilesRef,
    invoices: invoicesRef,
    toolbarPositions: toolbarPosRef,
  }), [productsRef, categoriesRef, storesRef, unitsRef, userProfilesRef, invoicesRef, toolbarPosRef]);

  // Fetch collections from Firestore
  const { data: productsData, isLoading: productsLoading } = useCollection<Product>(productsRef);
  const { data: categoriesData, isLoading: categoriesLoading } = useCollection<Category>(categoriesRef);
  const { data: storesData, isLoading: storesLoading } = useCollection<Store>(storesRef);
  const { data: unitsData, isLoading: unitsLoading } = useCollection<UnitOfMeasurement>(unitsRef);
  const { data: userProfilesData, isLoading: userProfilesLoading } = useCollection<Customer>(userProfilesRef); // Read as Customer
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
    const isDataLoading = productsLoading || categoriesLoading || storesLoading || unitsLoading || userProfilesLoading || invoicesLoading || toolbarLoading;
    
    if (!isDataLoading && (user || !isUserLoading)) {
      setData({
        products: productsData?.sort((a,b) => (b.id > a.id) ? 1 : ((a.id > b.id) ? -1 : 0)) || [],
        categories: categoriesData || [],
        stores: storesData || [],
        units: unitsData || [],
        customers: userProfilesData || [], // Assign userProfiles to customers
        userProfiles: userProfilesData || [],
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
    productsData, categoriesData, storesData, unitsData, userProfilesData, invoicesData, toolbarData,
    productsLoading, categoriesLoading, storesLoading, unitsLoading, userProfilesLoading, invoicesLoading, toolbarLoading
  ]);

  const getCollectionRef = useCallback((collectionName: keyof AppData) => {
    const refs = {
      products: productsRef,
      categories: categoriesRef,
      stores: storesRef,
      units: unitsRef,
      customers: userProfilesRef,
      userProfiles: userProfilesRef,
      invoices: invoicesRef,
      toolbarPositions: null, // Not a collection
    };
    return refs[collectionName];
  }, [productsRef, categoriesRef, storesRef, unitsRef, userProfilesRef, invoicesRef]);


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
    
    const validDocIds = docIds.filter(id => id && !id.startsWith('temp-'));
    if (validDocIds.length === 0) return;

    const originalItems = data[collectionName].filter(item => validDocIds.includes(item.id));
    if (originalItems.length === 0) return;

    // Optimistic update
    setData(prev => ({
        ...prev,
        [collectionName]: prev[collectionName].filter(item => !validDocIds.includes(item.id)),
    }));
    
    const batch = writeBatch(firestore);
    validDocIds.forEach(id => {
        const docRef = doc(collectionRef, id);
        batch.delete(docRef);
    });

    try {
        await batch.commit();
        // The optimistic update should suffice for a responsive UI.
        // onSnapshot will eventually confirm the state, but we don't need to do anything specific here.
    } catch (error: any) {
        console.error(`Batch delete error in ${collectionName}:`, error);
        // Revert the optimistic update on failure
        setData(prev => ({ ...prev, [collectionName]: [...prev[collectionName], ...originalItems] }));
        
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path, // This is a simplification for the batch error
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        throw error; // Re-throw so the caller knows the operation failed.
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

  const repairDatabase = useCallback(async (): Promise<RepairReport> => {
    if (!firestore || !user || !isSynced) {
        throw new Error("User not authenticated, Firestore not available, or data not synced.");
    }

    const { stores, categories, products, invoices, units, customers } = data;
    const batch = writeBatch(firestore);
    const report: RepairReport = {
        stores: { label: "فروشگاه‌ها", total: stores.length, repaired: 0 },
        categories: { label: "دسته‌بندی‌ها", total: categories.length, repaired: 0 },
        products: { label: "محصولات", total: products.length, repaired: 0 },
        invoices: { label: "فاکتورها", total: invoices.length, repaired: 0 },
        units: { label: "واحدها", total: units.length, repaired: 0 },
        customers: { label: "مشتریان", total: customers.length, repaired: 0 },
    };

    const storeIds = new Set(stores.map(s => s.id));
    const categoryIds = new Set(categories.map(c => c.id));
    const customerIds = new Set(customers.map(c => c.id));
    const firstStoreId = stores[0]?.id;

    // Repair Categories
    for (const category of categories) {
        if (!storesRef) continue;
        let changed = false;
        const updateData: Partial<Category> = {};
        if (!storeIds.has(category.storeId)) {
            if (!firstStoreId) continue;
            updateData.storeId = firstStoreId;
            changed = true;
        }
        if (category.parentId && !categoryIds.has(category.parentId)) {
            updateData.parentId = undefined;
            changed = true;
        }
        if (changed) {
            const docRef = doc(categoriesRef, category.id);
            batch.update(docRef, updateData);
            report.categories.repaired++;
        }
    }

    // Repair Products
    for (const product of products) {
        if (!productsRef) continue;
        let changed = false;
        const updateData: Partial<Product> = {};

        // Check storeId
        if (!storeIds.has(product.storeId)) {
            if (firstStoreId) {
                updateData.storeId = firstStoreId;
                changed = true;
            } else continue;
        }
        const effectiveStoreId = updateData.storeId || product.storeId;
        const storeCategoryIds = new Set(categories.filter(c => c.storeId === effectiveStoreId).map(c => c.id));

        // Check subCategoryId
        if (!product.subCategoryId || !storeCategoryIds.has(product.subCategoryId)) {
            const firstCatIdForStore = categories.find(c => c.storeId === effectiveStoreId)?.id;
            if (firstCatIdForStore) {
                updateData.subCategoryId = firstCatIdForStore;
                changed = true;
            }
        }
        
        // Check subUnit fields
        if (!product.subUnit || product.subUnit === 'none') {
            const fieldsToDelete: any = {};
            if (product.hasOwnProperty('subUnit')) fieldsToDelete.subUnit = deleteField();
            if (product.hasOwnProperty('subUnitQuantity')) fieldsToDelete.subUnitQuantity = deleteField();
            if (product.hasOwnProperty('subUnitPrice')) fieldsToDelete.subUnitPrice = deleteField();
            if (Object.keys(fieldsToDelete).length > 0) {
              const docRef = doc(productsRef, product.id);
              batch.update(docRef, fieldsToDelete);
              changed = true; // Still counts as a repair
            }
        }


        if (changed) {
            const docRef = doc(productsRef, product.id);
            batch.update(docRef, updateData);
            report.products.repaired++;
        }
    }
    
    // Repair Units
    for (const unit of units) {
        if (!unitsRef) continue;
        if (!storeIds.has(unit.storeId)) {
            if (!firstStoreId) continue;
            const docRef = doc(unitsRef, unit.id);
            batch.update(docRef, { storeId: firstStoreId });
            report.units.repaired++;
        }
    }

    // Identify Invoices with missing customers (read-only check for now)
     for (const invoice of invoices) {
        if (!customerIds.has(invoice.customerId)) {
            report.invoices.repaired++; // Using 'repaired' to mean 'found issue'
        }
    }

    await batch.commit();
    return report;

  }, [data, firestore, user, isSynced, categoriesRef, productsRef, unitsRef]);


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
    repairDatabase,
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

  
