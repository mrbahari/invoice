
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initialData } from '@/lib/data';
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

// Define the context type
interface DataContextType {
  data: AppData;
  setData: (data: AppData) => void;
  resetData: () => void;
  isInitialized: boolean;
}

// Create the context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Create the provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [data, setData] = useState<AppData>(initialData);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('appData');
      if (storedData) {
        setData(JSON.parse(storedData));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      setData(initialData); // Fallback to initial data
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Persist data to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('appData', JSON.stringify(data));
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
      }
    }
  }, [data, isInitialized]);

  // Function to reset data to the initial state from JSON files
  const resetData = () => {
    if (window.confirm('آیا مطمئن هستید؟ تمام تغییرات فعلی از بین خواهند رفت و اطلاعات به حالت پیش‌فرض کارخانه بازنشانی می‌شود.')) {
      setData(initialData);
      toast({
        title: 'موفقیت‌آمیز',
        description: 'اطلاعات با موفقیت به حالت پیش‌فرض بازنشانی شد.',
      });
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
