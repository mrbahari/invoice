'use client';

import { initialData } from '@/lib/data';
import type { Category, Customer, Invoice, Product, Store, UnitOfMeasurement } from '@/lib/definitions';
import { useState, useEffect, useCallback } from 'react';
import { useData } from '@/context/data-context';

type CollectionName = 'products' | 'categories' | 'customers' | 'invoices' | 'units' | 'stores';

type Document = Product | Category | Customer | Invoice | UnitOfMeasurement | Store;

// This hook now uses the central DataContext to interact with application data.
export function useCollection<T extends Document>(collectionName: CollectionName) {
  const { data: allData, setData, isInitialized } = useData();
  const data = (allData as any)[collectionName] || [];

  const [loading, setLoading] = useState(!isInitialized);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(!isInitialized);
  }, [isInitialized]);
  
  const add = useCallback(async (newItem: Omit<T, 'id'>): Promise<(T & { id: string }) | null> => {
    try {
      const newId = `${collectionName.slice(0, 4)}-${Math.random().toString(36).substr(2, 9)}`;
      const itemWithId = { ...newItem, id: newId } as T;
      
      setData(prevAllData => ({
        ...prevAllData,
        [collectionName]: [itemWithId, ...(prevAllData as any)[collectionName]]
      }));
      
      return itemWithId as (T & { id: string });
    } catch(e) {
      console.error("Failed to add document", e);
      setError(e instanceof Error ? e : new Error('Failed to add document'));
      return null;
    }
  }, [setData, collectionName]);

  const update = useCallback(async (id: string, updatedItem: Partial<T>): Promise<void> => {
     try {
        setData(prevAllData => {
            const collection = (prevAllData as any)[collectionName] as T[];
            const updatedCollection = collection.map(item =>
                (item as any).id === id ? { ...item, ...updatedItem } : item
            );
            return {
                ...prevAllData,
                [collectionName]: updatedCollection
            };
        });
    } catch(e) {
      console.error("Failed to update document", e);
      setError(e instanceof Error ? e : new Error('Failed to update document'));
    }
  }, [setData, collectionName]);

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
        setData(prevAllData => {
             const collection = (prevAllData as any)[collectionName] as T[];
             const updatedCollection = collection.filter(item => (item as any).id !== id);
             return {
                ...prevAllData,
                [collectionName]: updatedCollection
             }
        });
    } catch (e) {
      console.error("Failed to remove document", e);
      setError(e instanceof Error ? e : new Error('Failed to remove document'));
    }
  }, [setData, collectionName]);

  const reload = () => {
    // Reload is now managed by DataProvider, this can be a no-op or trigger a re-fetch if needed
  };

  return { data, loading, error, add, update, remove, reload };
}
