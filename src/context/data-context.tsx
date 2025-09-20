
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Product, Category, Customer, Invoice, UnitOfMeasurement, Store } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import initialDataFromFile from '@/database/mb.json';


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
  LOCAL_STORAGE_KEY: string;
}

// Create the context
const DataContext = createContext<DataContextType | undefined>(undefined);

export const LOCAL_STORAGE_KEY = 'hesabgar-app-data';

const defaultData = initialDataFromFile as AppData;


// Create the provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [data, setData] = useState<AppData>(defaultData);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Load initial data from localStorage or the default JSON file
  useEffect(() => {
    function loadInitialData() {
      try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
          setData(JSON.parse(storedData));
        } else {
          // If no data in local storage, use the imported default data
          setData(defaultData);
        }
      } catch (error) {
        console.error("Could not load initial data:", error);
        toast({
          variant: 'destructive',
          title: 'خطا در بارگذاری داده‌ها',
          description: 'مشکلی در بارگذاری اطلاعات اولیه برنامه رخ داد.',
        });
        // Fallback to imported default data on error
        setData(defaultData);
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


  // This function resets the application state to the initial data from the imported JSON file.
  const resetData = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
      setIsResetting(true);
      try {
          const defaultDataFromMb = initialDataFromFile as AppData;
          setData(defaultDataFromMb);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultDataFromMb));
          toast({
            variant: 'success',
            title: 'اطلاعات پیش‌فرض بارگذاری شد',
            description: 'داده‌های اولیه برنامه با موفقیت جایگزین شدند.',
          });
      } catch (error) {
           console.error("Failed to reset data", error);
           toast({
             variant: 'destructive',
             title: 'خطا در بازنشانی',
             description: 'مشکلی در هنگام بازنشانی اطلاعات رخ داد.',
           });
      } finally {
        // Use a timeout to give a visual feedback of the loading state
        setTimeout(() => {
            setIsResetting(false);
            resolve();
        }, 500);
      }
    });
  }, [toast]);
  
  const value = {
    data,
    setData,
    resetData,
    isInitialized,
    isResetting,
    LOCAL_STORAGE_KEY,
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
