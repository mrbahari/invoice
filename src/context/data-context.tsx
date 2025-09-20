
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
  clearAllData: () => Promise<void>;
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
  
  // This function completely clears all application data.
  const clearAllData = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
        setIsResetting(true);
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            // Setting to an empty object structure to avoid errors on reload before useEffect runs
            setData({ customers: [], products: [], invoices: [], stores: [], categories: [], units: [] });
            toast({
                variant: 'success',
                title: 'اطلاعات پاک شد',
                description: 'تمام داده‌های برنامه با موفقیت حذف شدند.',
            });
            // Reload the page to ensure the app state is fully reset
            setTimeout(() => {
                window.location.reload();
            }, 1000); 
        } catch (error) {
            console.error("Failed to clear data", error);
            toast({
                variant: 'destructive',
                title: 'خطا در پاک کردن اطلاعات',
                description: 'مشکلی در هنگام حذف اطلاعات رخ داد.',
            });
        } finally {
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
    clearAllData,
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
