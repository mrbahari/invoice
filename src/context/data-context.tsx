'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { Product, Category, Customer, Invoice, UnitOfMeasurement, Store, ToolbarPosition } from '@/lib/definitions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useUser } from '@/context/user-context';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

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
  setData: (newData: AppData) => Promise<void>;
  isInitialized: boolean;
  isResetting: boolean; // Retained for API compatibility if needed
  LOCAL_STORAGE_KEY: string; // Retained for API compatibility
  resetData: () => Promise<void>; // To be implemented with Firestore
  clearAllData: () => Promise<void>; // To be implemented with Firestore
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const LOCAL_STORAGE_KEY = 'hesabgar-app-data-firestore'; // Can be used for local settings if needed

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
  const storesRef = useMemoFirebase(() => user ? collection(firestore, 'stores') : null, [firestore, user]);
  const unitsRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'units') : null, [firestore, user]);
  const customersRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'clients') : null, [firestore, user]);
  const invoicesRef = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'invoices') : null, [firestore, user]);
  const toolbarPosRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid, 'settings', 'toolbarPositions') : null, [firestore, user]);


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
    
    if (!isDataLoading) {
      // Set local data from a combination of global and user-specific collections
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
    }
  }, [
    productsData, categoriesData, storesData, unitsData, customersData, invoicesData,
    productsLoading, categoriesLoading, storesLoading, unitsLoading, customersLoading, invoicesLoading,
    localData.toolbarPositions // Keep this dependency
  ]);

  const setData = async (newData: AppData) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'خطا', description: 'برای ذخیره اطلاعات باید وارد شوید.'});
      return;
    }
    
    setLocalData(newData); // Optimistic update

    try {
      const batch = writeBatch(firestore);

      // We assume that global collections (products, categories, stores) are not modified by the client.
      // This is a common pattern where admin roles handle this data.
      // If clients need to modify them, we'd need to handle that here.

      // Handle user-specific collections
      const collectionsToUpdate: { name: keyof AppData; ref: any }[] = [
          { name: 'customers', ref: customersRef },
          { name: 'invoices', ref: invoicesRef },
          { name: 'units', ref: unitsRef },
      ];

      for (const { name, ref } of collectionsToUpdate) {
        if (!ref) continue;
        const localItems = (newData as any)[name] as { id: string }[];
        const firestoreItems = (localData as any)[name] as { id: string }[];

        // Items to add/update
        localItems.forEach(item => {
          batch.set(doc(ref, item.id), item);
        });

        // Items to delete
        const localIds = new Set(localItems.map(item => item.id));
        firestoreItems.forEach(item => {
          if (!localIds.has(item.id)) {
            batch.delete(doc(ref, item.id));
          }
        });
      }
      
      await batch.commit();

    } catch (error) {
      console.error("Failed to save data to Firestore:", error);
      toast({ variant: 'destructive', title: 'خطا در ذخیره‌سازی', description: 'اطلاعات در سرور ذخیره نشد.'});
      // Optionally revert the optimistic update
      // setLocalData(oldData);
    }
  };

  const isInitialized = !isUserLoading && isSynced;

  const value = {
    data: localData,
    setData,
    isInitialized,
    isResetting: false, // Placeholder
    LOCAL_STORAGE_KEY: 'unused', // Placeholder
    resetData: async () => {}, // Placeholder
    clearAllData: async () => {}, // Placeholder
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
