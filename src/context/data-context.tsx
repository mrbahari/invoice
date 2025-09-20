
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import defaultRawData from '@/database/defaultdb.json';
import type { Product, Category, Customer, Invoice, UnitOfMeasurement, Store } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';

// This handles the case where the JSON is nested under a `default` property during import
const initialData = (defaultRawData as any).default || defaultRawData;

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
  resetData: () => void;
  isInitialized: boolean;
}

// Create the context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper function to load data from localStorage or fall back to initial data
const loadData = (): AppData => {
  if (typeof window === 'undefined') {
    return initialData;
  }
  try {
    const storedData = localStorage.getItem('appData');
    return storedData ? JSON.parse(storedData) : initialData;
  } catch (error) {
    console.error("Failed to load or parse data from localStorage, falling back to initial data.", error);
    return initialData;
  }
};


// Create the provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [data, setData] = useState<AppData>(loadData());
  const [isInitialized, setIsInitialized] = useState(false);

  // Mark as initialized once the component has mounted and data is set
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Persist data to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
        try {
            localStorage.setItem('appData', JSON.stringify(data));
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
             toast({
                variant: 'destructive',
                title: 'خطا در ذخیره‌سازی',
                description: 'امکان ذخیره تغییرات در حافظه مرورگر وجود ندارد.',
            });
        }
    }
  }, [data, isInitialized, toast]);

  // Function to completely reset data
  const resetData = () => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem('appData');
            setData(initialData); // Reset state to initial data without reloading the page
        } catch (error) {
             console.error("Failed to reset data", error);
            toast({
                variant: 'destructive',
                title: 'خطا در بازنشانی',
                description: 'مشکلی در هنگام پاک کردن اطلاعات رخ داد.',
            });
        }
    }
  };
  
  const value = {
    data,
    setData,
    resetData,
    isInitialized,
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
