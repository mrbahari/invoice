
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

const emptyData: AppData = {
  products: [],
  categories: [],
  customers: [],
  invoices: [],
  units: [],
  stores: [],
};


// This handles the case where the JSON is nested under a `default` property during import
const initialData: AppData = (defaultRawData as any).default || defaultRawData;

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
    return initialData.products ? initialData : emptyData;
  }
  try {
    const storedData = localStorage.getItem('appData');
    if (storedData) {
      return JSON.parse(storedData);
    }
    // If no data in local storage, save the initial data there first.
    const dataToStore = initialData.products ? initialData : emptyData;
    localStorage.setItem('appData', JSON.stringify(dataToStore));
    return dataToStore;
  } catch (error) {
    console.error("Failed to load or parse data from localStorage, falling back to empty data.", error);
    return emptyData;
  }
};


// Create the provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [data, setData] = useState<AppData>(emptyData); // Start with empty, load from storage in effect
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect to load data from localStorage on mount
  useEffect(() => {
    setData(loadData());
    setIsInitialized(true);
  }, []);

  // Persist data to localStorage whenever it changes
  useEffect(() => {
    // Only save to localStorage after the initial load is complete
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

  // Function to completely reset data to defaults
  const resetData = () => {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem('appData', JSON.stringify(emptyData)); // Clear storage by saving empty data
            setData(emptyData); // Reset state to empty data
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
