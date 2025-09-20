
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Product, Category, Customer, Invoice, UnitOfMeasurement, Store } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';


// Define the shape of our data
interface AppData {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  invoices: Invoice[];
  units: UnitOfMeasurement[];
  stores: Store[];
}

// Define the context type
interface DataContextType {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  resetData: () => Promise<void>;
  isInitialized: boolean;
  isResetting: boolean;
}

// Create the context
const DataContext = createContext<DataContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'hesabgar-app-data';

// Create the provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [data, setData] = useState<AppData>({ products: [], categories: [], customers: [], invoices: [], units: [], stores: [] });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Load initial data from localStorage or the default JSON file
  useEffect(() => {
    async function loadInitialData() {
      try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
          setData(JSON.parse(storedData));
        } else {
          const response = await fetch('/db/defaultdb.json');
          if (!response.ok) {
            throw new Error('Failed to fetch default database.');
          }
          const initialData = await response.json();
          setData(initialData);
        }
      } catch (error) {
        console.error("Could not load initial data:", error);
        toast({
          variant: 'destructive',
          title: 'خطا در بارگذاری داده‌ها',
          description: 'مشکلی در بارگذاری اطلاعات اولیه برنامه رخ داد.',
        });
        // Set empty data to prevent app crash
        setData({ products: [], categories: [], customers: [], invoices: [], units: [], stores: [] });
      } finally {
        setIsInitialized(true);
      }
    }
    loadInitialData();
  }, [toast]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error("Failed to save data to localStorage:", error);
        toast({
            variant: 'destructive',
            title: 'خطا در ذخیره‌سازی',
            description: 'فضای کافی برای ذخیره اطلاعات در مرورگر وجود ندارد.',
        });
      }
    }
  }, [data, isInitialized, toast]);


  // This function resets the application state to the initial data from the JSON file.
  const resetData = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      setIsResetting(true);
      async function loadDefaultData() {
        try {
          const response = await fetch('/db/defaultdb.json');
          if (!response.ok) throw new Error('Failed to fetch default data.');
          const initialData = await response.json();
          setData(initialData);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialData));
          toast({
            variant: 'success',
            title: 'موفقیت‌آمیز',
            description: 'اطلاعات با موفقیت به حالت پیش‌فرض بازنشانی شد.',
          });
          resolve();
        } catch (error) {
           console.error("Failed to reset data", error);
           toast({
             variant: 'destructive',
             title: 'خطا در بازنشانی',
             description: 'مشکلی در هنگام بازنشانی اطلاعات رخ داد.',
           });
           reject(error);
        } finally {
            // Use a timeout to give a visual feedback of the loading state
            setTimeout(() => {
                setIsResetting(false);
            }, 500);
        }
      }
      loadDefaultData();
    });
  }, [toast]);
  
  const value = {
    data,
    setData,
    resetData,
    isInitialized,
    isResetting,
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

// Create a custom hook for easy access to the context
export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
