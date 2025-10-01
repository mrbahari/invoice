
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Product, Category, Customer, Invoice, UnitOfMeasurement, Store, ToolbarPosition } from '@/lib/definitions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Defaultdb from '@/database/defaultdb.json';


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

const defaultData = {
    ...Defaultdb,
    toolbarPosition: { x: 20, y: 80 } // Default top-left position, with margin from header
} as AppData;


// Create the provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(defaultData);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Load initial data from localStorage or the default JSON file
  useEffect(() => {
    function loadInitialData() {
      try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
           // Ensure toolbarPosition exists
          if (!parsedData.toolbarPosition) {
            parsedData.toolbarPosition = defaultData.toolbarPosition;
          }
          setData(parsedData);
        } else {
          // If no data in local storage, use the imported default data
          setData(defaultData);
           localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultData));
        }
      } catch (error) {
        console.error("Could not load initial data:", error);
        // Fallback to imported default data on error
        setData(defaultData);
      } finally {
        setIsInitialized(true);
      }
    }
    loadInitialData();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error("Failed to save data to localStorage:", error);
        console.error("Failed to save data, not enough space.");
      }
    }
  }, [data, isInitialized]);


  // This function resets the application state to the initial data from the imported JSON file.
  const resetData = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
      setIsResetting(true);
      try {
        setData(defaultData);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultData));
      } catch(error) {
          console.error("Failed to reset data:", error);
      } finally {
          setTimeout(() => {
            setIsResetting(false);
            resolve();
          }, 500);
      }
    });
  }, []);
  
  // This function completely clears all application data.
  const clearAllData = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
        setIsResetting(true);
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            // Setting to an empty object structure to avoid errors on reload before useEffect runs
            setData({ ...defaultData, customers: [], products: [], invoices: [], stores: [], categories: [], units: [] });
            // Reload the page to ensure the app state is fully reset
            setTimeout(() => {
                window.location.reload();
            }, 1000); 
        } catch (error) {
            console.error("Failed to clear data", error);
        } finally {
             setTimeout(() => {
                setIsResetting(false);
                resolve();
            }, 500);
        }
    });
  }, []);


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
