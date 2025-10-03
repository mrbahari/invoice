'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Product, Category, Customer, Invoice, UnitOfMeasurement, Store, ToolbarPosition } from '@/lib/definitions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';


// Define the shape of our data
interface AppData {
  products: Product[];
  categories: Category[];
  customers: Customer[];
  invoices: Invoice[];
  units: UnitOfMeasurement[];
  stores: Store[];
  toolbarPositions: { [key: string]: ToolbarPosition };
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

// Create an empty default structure. We will load the actual default from a fetch.
const emptyData: AppData = {
  products: [],
  categories: [],
  customers: [],
  invoices: [],
  units: [],
  stores: [],
  toolbarPositions: {},
};


// Create the provider component
export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Load initial data from localStorage or the default JSON file
  useEffect(() => {
    async function loadInitialData() {
      try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (typeof parsedData.toolbarPositions !== 'object' || parsedData.toolbarPositions === null) {
            parsedData.toolbarPositions = {};
          }
          setData(parsedData);
        } else {
          // If no data in local storage, fetch the default backup
          const response = await fetch('/db/backup.json');
          const defaultData = await response.json();
          setData(defaultData);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultData));
        }
      } catch (error) {
        console.error("Could not load initial data, trying to fetch default:", error);
        try {
            const response = await fetch('/db/backup.json');
            const defaultData = await response.json();
            setData(defaultData);
        } catch (fetchError) {
            console.error("Failed to fetch default backup data:", fetchError);
            setData(emptyData); // Fallback to empty data structure
        }
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


  // This function resets the application state by fetching the default backup file.
  const resetData = useCallback(async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      setIsResetting(true);
      fetch('/db/backup.json')
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(defaultData => {
          setData(defaultData);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultData));
          resolve();
        })
        .catch(error => {
          console.error("Failed to fetch and reset data:", error);
          reject(error);
        })
        .finally(() => {
          setTimeout(() => {
            setIsResetting(false);
          }, 500);
        });
    });
  }, []);
  
  // This function completely clears all application data.
  const clearAllData = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
        setIsResetting(true);
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            // Setting to an empty object structure to avoid errors on reload before useEffect runs
            setData(emptyData);
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
