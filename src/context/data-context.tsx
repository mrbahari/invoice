
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import defaultRawData from '@/database/defaultdb.json';
import type { Product, Category, Customer, Invoice, UnitOfMeasurement, Store } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';

// Define the shape of our data
interface AppData {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  invoices: Invoice[];
  units: UnitOfMeasurement[];
  stores: Store[];
}

// This handles the case where the JSON is nested under a `default` property during import
const initialData: AppData = (defaultRawData as any).default || defaultRawData;

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
  const [data, setData] = useState<AppData>(initialData);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Effect to mark data as initialized on mount.
  // No need to load from localStorage anymore.
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // This function resets the application state to the initial data from the JSON file.
  const resetData = async (): Promise<void> => {
    return new Promise((resolve) => {
      setIsResetting(true);
      try {
        // Directly set the state back to the initial data.
        setData(initialData);
        toast({
          variant: 'success',
          title: 'موفقیت‌آمیز',
          description: 'اطلاعات با موفقیت به حالت پیش‌فرض بازنشانی شد.',
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
  };
  
  const value = {
    data,
    setData,
    resetData,
    isInitialized,
    isResetting,
  };

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
