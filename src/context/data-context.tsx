
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { Product, Category, Customer, Invoice, UnitOfMeasurement, Store, ToolbarPosition } from '@/lib/definitions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useUser } from '@/context/user-context';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getFirestore, CollectionReference, addDoc, updateDoc, deleteDoc, getDocs, query, DocumentReference, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import defaultDb from '@/database/defaultdb.json';
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
  resetData: (dataToLoad?: any) => Promise<void>;
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
  const { toast } = useToast();
  const [localData, setLocalData] = useState<AppData>(emptyData);
  const [isSynced, setIsSynced] = useState(false);
  const { firestore } = useMemo(() => initializeFirebase(), []);


  // Define collection references, memoized to prevent re-renders
  const productsRef = useMemoFirebase(() => collection(firestore, 'products'), [firestore]);
  const categoriesRef = useMemoFirebase(() => collection(firestore, 'categories'), [firestore]);
  const storesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'stores') : null, [firestore, user]);
  const unitsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'units') : null, [firestore, user]);
  const customersRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'clients') : null, [firestore, user]);
  const invoicesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'invoices') : null, [firestore, user]);
  const toolbarPosRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'settings', 'toolbarPositions') : null, [firestore, user]);

  const collectionRefs: Record<CollectionName, CollectionReference<any> | DocumentReference<any> | null> = useMemo(() => ({
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
  
  useEffect(() => {
    // Check if user has logged out, then reset local state
    if (!user && !isUserLoading) {
      setLocalData(emptyData);
      setIsSynced(false);
    }
  }, [user, isUserLoading]);
  
  // Combine all data sources into a single AppData object
  useEffect(() => {
    const isDataLoading = productsLoading || categoriesLoading || storesLoading || unitsLoading || customersLoading || invoicesLoading;
    
    if (!isDataLoading && (user || !isUserLoading)) {
      setLocalData({
        products: productsData || [],
        categories: categoriesData || [],
        stores: storesData || [],
        units: unitsData || [],
        customers: customersData || [],
        invoices: invoicesData || [],
        toolbarPositions: localData.toolbarPositions, // Persist this locally for now
      });
      setIsSynced(true);
    } else if (!user && !isUserLoading) {
      // When user logs out, we should also be considered "synced" with an empty state
      setLocalData(emptyData);
      setIsSynced(true);
    }
  }, [
    user, isUserLoading,
    productsData, categoriesData, storesData, unitsData, customersData, invoicesData,
    productsLoading, categoriesLoading, storesLoading, unitsLoading, customersLoading, invoicesLoading,
    localData.toolbarPositions // Keep this dependency
  ]);

  const addDocument = useCallback(async <T extends Document>(collectionName: CollectionName, data: Omit<T, 'id'>) => {
    const ref = collectionRefs[collectionName];
    if (!ref || !(ref instanceof CollectionReference)) {
      toast({ variant: 'destructive', title: 'خطا', description: 'برای ذخیره اطلاعات باید وارد شوید یا مجموعه داده معتبر باشد.'});
      return;
    }
    
    const tempId = `temp-${Date.now()}`;
    const optimisticData = { ...localData };
    setLocalData(prev => ({
      ...prev,
      [collectionName]: [...prev[collectionName], { id: tempId, ...data }],
    }));

    try {
      const docRef = await addDoc(ref, data);
      setLocalData(prev => ({
        ...prev,
        [collectionName]: prev[collectionName].map(item =>
          item.id === tempId ? { ...item, id: docRef.id } : item
        ),
      }));
      return docRef.id;
    } catch (error: any) {
        setLocalData(optimisticData); // Revert
        const permissionError = new FirestorePermissionError({
          path: ref.path,
          operation: 'create',
          requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [collectionRefs, toast, localData]);

  const updateDocument = useCallback(async (collectionName: CollectionName, docId: string, data: Partial<Document>) => {
    const ref = collectionRefs[collectionName];
     if (!ref || !(ref instanceof CollectionReference)) {
      toast({ variant: 'destructive', title: 'خطا', description: 'برای ذخیره اطلاعات باید وارد شوید یا مجموعه داده معتبر باشد.'});
      return;
    }
    
    const docRef = doc(ref, docId);
    
    const optimisticData = { ...localData };
    setLocalData(prev => ({
      ...prev,
      [collectionName]: prev[collectionName].map(item =>
        item.id === docId ? { ...item, ...data } : item
      ),
    }));

    try {
      await updateDoc(docRef, data);
    } catch (error: any) {
        setLocalData(optimisticData); // Revert
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: data,
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [collectionRefs, toast, localData]);

  const deleteDocument = useCallback(async (collectionName: CollectionName, docId: string) => {
    const ref = collectionRefs[collectionName];
    if (!ref || !(ref instanceof CollectionReference)) {
      toast({ variant: 'destructive', title: 'خطا', description: 'برای ذخیره اطلاعات باید وارد شوید یا مجموعه داده معتبر باشد.'});
      return;
    }
    const docRef = doc(ref, docId);

    const optimisticData = { ...localData };
    setLocalData(prev => ({
      ...prev,
      [collectionName]: prev[collectionName].filter(item => item.id !== docId),
    }));

    try {
      await deleteDoc(docRef);
    } catch (error: any) {
        setLocalData(optimisticData); // Revert
        const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [collectionRefs, toast, localData]);
  
  const setToolbarPosition = useCallback(async (pageKey: string, position: ToolbarPosition) => {
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
    const collectionsToDelete: (CollectionReference | null)[] = [storesRef as CollectionReference, unitsRef as CollectionReference, customersRef as CollectionReference, invoicesRef as CollectionReference];

    for (const ref of collectionsToDelete) {
        if (ref) {
            const q = query(ref);
            const snapshot = await getDocs(q);
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
        }
    }
    try {
        await batch.commit();
    } catch(error: any) {
        const permissionError = new FirestorePermissionError({
            path: 'multiple paths',
            operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }, [user, firestore, storesRef, unitsRef, customersRef, invoicesRef]);

  const loadDataBatch = useCallback(async (dataToLoad: AppData) => {
    if (!firestore) return;
    const batch = writeBatch(firestore);
    
    const collectionsToLoad: {name: CollectionName, ref: CollectionReference | null, data: any[]}[] = [
        {name: 'stores', ref: storesRef as CollectionReference, data: dataToLoad.stores},
        {name: 'units', ref: unitsRef as CollectionReference, data: dataToLoad.units},
        {name: 'customers', ref: customersRef as CollectionReference, data: dataToLoad.customers},
        {name: 'invoices', ref: invoicesRef as CollectionReference, data: dataToLoad.invoices},
        {name: 'products', ref: productsRef, data: dataToLoad.products},
        {name: 'categories', ref: categoriesRef, data: dataToLoad.categories},
    ];

    for (const { ref, data } of collectionsToLoad) {
        if (ref && data) {
            data.forEach((item: Document) => {
                if (item.id) {
                    const docRef = doc(ref, item.id);
                    batch.set(docRef, item);
                }
            });
        }
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
  }, [firestore, storesRef, unitsRef, customersRef, invoicesRef, productsRef, categoriesRef]);

  const resetData = useCallback(async (dataToLoad: any = defaultDb) => {
    await clearAllUserData();
    await loadDataBatch(dataToLoad);
    toast({ variant: 'success', title: 'بازنشانی موفق', description: 'اطلاعات با موفقیت بازنشانی شد.' });
  }, [clearAllUserData, loadDataBatch, toast]);

  const clearAllData = useCallback(async () => {
    await clearAllUserData();
    toast({ variant: 'success', title: 'اطلاعات پاک شد', description: 'تمام داده‌های شما با موفقیت حذف شد.' });
  }, [clearAllUserData, toast]);


  const isInitialized = !isUserLoading && isSynced;

  const value = {
    data: localData,
    isInitialized,
    addDocument,
    updateDocument,
    deleteDocument,
    setToolbarPosition,
    resetData,
    clearAllData,
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
