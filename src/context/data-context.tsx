'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Product, Category, Customer, Invoice, UnitOfMeasurement, Store, ToolbarPosition } from '@/lib/definitions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Defaultdb from '@/database/defaultdb.json';
import { useToast } from '@/hooks/use-toast';

// Define the shape of our data
interface AppData {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  invoices: Invoice[];
  units: UnitOfMeasurement[];
  stores: Store[];
  toolbarPosition: ToolbarPosition;
}

// Define the context type
interface DataContextType {
  data: AppData;
  setData: (data: AppData) => void; // Simplified signature
  resetData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  isInitialized: boolean;
  isResetting: boolean;
}

// Create the context
const DataContext = createContext<DataContextType | undefined>(undefined);

const defaultData = {
    ...Defaultdb,
    toolbarPosition: { x: 50, y: 16 } // Default top-center position
} as AppData;

// Create the provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setInternalData] = useState<AppData>(defaultData);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();
  
  // Throttle/debounce mechanism
  const debounceTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Load initial data from server
  useEffect(() => {
    async function loadInitialData() {
      try {
        const response = await fetch('/api/data');
        if (!response.ok) {
            throw new Error(`Failed to fetch initial data: ${response.statusText}`);
        }
        const serverData = await response.json();
        
        // Ensure toolbarPosition exists, if not, use default
        if (!serverData.toolbarPosition) {
            serverData.toolbarPosition = defaultData.toolbarPosition;
        }
        setInternalData(serverData);
      } catch (error) {
        console.error("Could not load initial data from server, falling back to default:", error);
        setInternalData(defaultData);
      } finally {
        setIsInitialized(true);
      }
    }
    loadInitialData();
  }, []);

  const setData = useCallback((newDataOrFn: AppData | ((prevData: AppData) => AppData)) => {
    const newData = typeof newDataOrFn === 'function' ? newDataOrFn(data) : newDataOrFn;
    setInternalData(newData); // Update local state immediately for UI responsiveness

    // Debounce the server update
    if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
        try {
            const response = await fetch('/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newData),
            });
            if (!response.ok) {
                 toast({
                    variant: 'destructive',
                    title: 'خطا در ذخیره‌سازی',
                    description: 'تغییرات شما در سرور ذخیره نشد. لطفاً اتصال خود را بررسی کنید.',
                });
            }
        } catch (error) {
            console.error("Failed to save data to server:", error);
             toast({
                variant: 'destructive',
                title: 'خطای شبکه',
                description: 'ارتباط با سرور برای ذخیره اطلاعات برقرار نشد.',
            });
        }
    }, 1000); // Wait 1 second after the last change to save
  }, [data, toast]);
  

  const resetData = useCallback(async (): Promise<void> => {
    setIsResetting(true);
    try {
      setData(defaultData); // This will trigger the debounced save to server
    } catch(error) {
        console.error("Failed to reset data:", error);
    } finally {
        setTimeout(() => {
          setIsResetting(false);
        }, 500);
    }
  }, [setData]);
  
  const clearAllData = useCallback(async (): Promise<void> => {
    setIsResetting(true);
    try {
        const clearedData = { ...defaultData, customers: [], products: [], invoices: [], stores: [], categories: [], units: [] };
        setData(clearedData); // This will trigger debounced save
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } catch (error) {
        console.error("Failed to clear data", error);
        setIsResetting(false);
    }
  }, [setData]);


  const value: DataContextType = {
    data,
    setData,
    resetData,
    clearAllData,
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
