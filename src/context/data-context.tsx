
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

// Create the provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  // We use a state that can be null initially to represent the "not yet loaded" state.
  const [data, setData] = useState<AppData | null>(null);

  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('appData');
      if (storedData) {
        setData(JSON.parse(storedData));
      } else {
        // If nothing is in localStorage, use initialData
        setData(initialData);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setData(initialData); // Fallback to initial data on error
    }
  }, []);

  // Persist data to localStorage whenever it changes
  useEffect(() => {
    if (data !== null) { // Only save if data has been initialized
      try {
        localStorage.setItem('appData', JSON.stringify(data));
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
      }
    }
  }, [data]);

  // Function to reset data to the initial state from JSON files
  const resetData = () => {
    try {
        // First, set the state to the initial data
        setData(initialData);
        // Then, remove the data from localStorage to ensure a clean state on next load
        localStorage.removeItem('appData');
        // Optional: Reload the page to ensure all components re-initialize with default data
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    } catch (error) {
        console.error("Failed to reset data", error);
        toast({
            variant: 'destructive',
            title: 'خطا در بازنشانی',
            description: 'مشکلی در هنگام پاک کردن اطلاعات رخ داد.',
        });
    }
  };
  
  // The context is initialized once data is not null.
  const isInitialized = data !== null;

  const value = {
    data: data || initialData, // Provide initialData as a fallback if data is null
    setData: setData as React.Dispatch<React.SetStateAction<AppData>>, // Cast to non-null version
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
