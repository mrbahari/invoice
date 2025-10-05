
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { Product, Category, Customer, Invoice, UnitOfMeasurement, Store, ToolbarPosition } from '@/lib/definitions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useUser } from '@/context/user-context';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getFirestore, DocumentReference, addDoc, updateDoc, deleteDoc, getDocs, query } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import defaultDb from '@/database/defaultdb.json';

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

  const collectionRefs = useMemo(() => ({
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
    
    if (!isDataLoading && user) {
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
    if (!ref) {
      toast({ variant: 'destructive', title: 'خطا', description: 'برای ذخیره اطلاعات باید وارد شوید.'});
      return;
    }
    
    try {
      const docRef = await addDoc(ref, data);
      setLocalData(prev => ({
        ...prev,
        [collectionName]: [...prev[collectionName], { id: docRef.id, ...data }],
      }));
      return docRef.id;
    } catch (error) {
      console.error(`Failed to add document to ${collectionName}:`, error);
      toast({ variant: 'destructive', title: 'خطا در ذخیره‌سازی' });
    }
  }, [collectionRefs, toast]);

  const updateDocument = useCallback(async (collectionName: CollectionName, docId: string, data: Partial<Document>) => {
    const ref = collectionRefs[collectionName];
     if (!ref) {
      toast({ variant: 'destructive', title: 'خطا', description: 'برای ذخیره اطلاعات باید وارد شوید.'});
      return;
    }
    
    const docRef = doc(ref, docId);
    
    // Optimistic update
    const oldData = { ...localData };
    setLocalData(prev => ({
      ...prev,
      [collectionName]: prev[collectionName].map(item =>
        item.id === docId ? { ...item, ...data } : item
      ),
    }));

    try {
      await updateDoc(docRef, data);
    } catch (error) {
      console.error(`Failed to update document in ${collectionName}:`, error);
      toast({ variant: 'destructive', title: 'خطا در به‌روزرسانی' });
      setLocalData(oldData); // Revert on failure
    }
  }, [collectionRefs, toast, localData]);

  const deleteDocument = useCallback(async (collectionName: CollectionName, docId: string) => {
    const ref = collectionRefs[collectionName];
    if (!ref) {
      toast({ variant: 'destructive', title: 'خطا', description: 'برای ذخیره اطلاعات باید وارد شوید.'});
      return;
    }
    const docRef = doc(ref, docId);

    // Optimistic update
    const oldData = { ...localData };
    setLocalData(prev => ({
      ...prev,
      [collectionName]: prev[collectionName].filter(item => item.id !== docId),
    }));

    try {
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Failed to delete document from ${collectionName}:`, error);
      toast({ variant: 'destructive', title: 'خطا در حذف' });
      setLocalData(oldData); // Revert on failure
    }
  }, [collectionRefs, toast, localData]);
  
  const setToolbarPosition = useCallback(async (pageKey: string, position: ToolbarPosition) => {
    // This is a local-only operation for now to improve performance.
    // A full implementation would debounce writes to Firestore.
    setLocalData(prev => ({
      ...prev,
      toolbarPositions: {
        ...prev.toolbarPositions,
        [pageKey]: position,
      },
    }));
  }, []);

  const clearAllUserData = useCallback(async () => {
    if (!user) return;
    const batch = writeBatch(firestore);
    const collectionsToDelete: (CollectionReference | null)[] = [storesRef, unitsRef, customersRef, invoicesRef];

    for (const ref of collectionsToDelete) {
        if (ref) {
            const q = query(ref);
            const snapshot = await getDocs(q);
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
        }
    }
    await batch.commit();
  }, [user, firestore, storesRef, unitsRef, customersRef, invoicesRef]);

  const loadDataBatch = useCallback(async (dataToLoad: AppData) => {
    if (!user) return;
    const batch = writeBatch(firestore);
    
    const collectionsToLoad: {name: CollectionName, ref: CollectionReference | null, data: any[]}[] = [
        {name: 'stores', ref: storesRef, data: dataToLoad.stores},
        {name: 'units', ref: unitsRef, data: dataToLoad.units},
        {name: 'customers', ref: customersRef, data: dataToLoad.customers},
        {name: 'invoices', ref: invoicesRef, data: dataToLoad.invoices},
        // Global collections - Note: This might be restricted by security rules
        // {name: 'products', ref: productsRef, data: dataToLoad.products},
        // {name: 'categories', ref: categoriesRef, data: dataToLoad.categories},
    ];

    for (const { ref, data } of collectionsToLoad) {
        if (ref && data) {
            data.forEach((item: Document) => {
                const docRef = doc(ref, item.id);
                batch.set(docRef, item);
            });
        }
    }
    await batch.commit();
  }, [user, firestore, storesRef, unitsRef, customersRef, invoicesRef]);

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
  
  if (!isInitialized && isUserLoading) {
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
