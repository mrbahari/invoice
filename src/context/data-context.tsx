
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

// Create the provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  // State is now directly initialized with the data from the JSON file.
  const [data, setData] = useState<AppData>({ products: [], categories: [], customers: [], invoices: [], units: [], stores: [] });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Load initial data from the public folder
  useEffect(() => {
    async function loadInitialData() {
      try {
        const response = await fetch('/db/defaultdb.json');
        if (!response.ok) {
          throw new Error('Failed to fetch default database.');
        }
        const initialData = await response.json();
        setData(initialData);
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


  // This function resets the application state to the initial data from the JSON file.
  const resetData = async (): Promise<void> => {
    return new Promise((resolve) => {
      setIsResetting(true);
      try {
         // This assumes there's a mechanism in place to clear user-specific data
         // if it's stored on a server. For this file-based approach,
         // we just reload the initial data.
        async function loadDefaultData() {
            const response = await fetch('/db/defaultdb.json');
            const initialData = await response.json();
            setData(initialData);
             toast({
                variant: 'success',
                title: 'موفقیت‌آمیز',
                description: 'اطلاعات با موفقیت به حالت پیش‌فرض بازنشانی شد.',
            });
        }
        loadDefaultData();
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
  };
  
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
