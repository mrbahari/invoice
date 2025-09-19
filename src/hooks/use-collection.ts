
'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { initialData } from '@/lib/data';
import type { Category, Customer, Invoice, Product, Store, UnitOfMeasurement } from '@/lib/definitions';
import { useState, useEffect, useCallback } from 'react';

type CollectionName = 'products' | 'categories' | 'customers' | 'invoices' | 'units' | 'stores';

type Document = Product | Category | Customer | Invoice | UnitOfMeasurement | Store;

// This is a simplified mock of a collection hook that uses localStorage.
// In a real-world scenario, this would interact with a database like Firestore.
export function useCollection<T extends Document>(collectionName: CollectionName) {
  const [data, setData, reloadData] = useLocalStorage<T[]>(collectionName, (initialData as any)[collectionName] || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      setLoading(true);
      reloadData();
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load data'));
    } finally {
      setLoading(false);
    }
  }, [collectionName, reloadData]);
  
  const add = useCallback(async (newItem: Omit<T, 'id'>): Promise<(T & { id: string }) | null> => {
    try {
      const newId = `${collectionName.slice(0, 4)}-${Math.random().toString(36).substr(2, 9)}`;
      const itemWithId = { ...newItem, id: newId } as T;
      setData(prevData => [itemWithId, ...prevData]);
      return itemWithId as (T & { id: string });
    } catch(e) {
      console.error("Failed to add document", e);
      setError(e instanceof Error ? e : new Error('Failed to add document'));
      return null;
    }
  }, [setData, collectionName]);

  const update = useCallback(async (id: string, updatedItem: Partial<T>): Promise<void> => {
     try {
        setData(prevData =>
            prevData.map(item =>
                (item as any).id === id ? { ...item, ...updatedItem } : item
            )
        );
    } catch(e) {
      console.error("Failed to update document", e);
      setError(e instanceof Error ? e : new Error('Failed to update document'));
    }
  }, [setData]);

  const remove = useCallback(async (id: string): Promise<void> => {
    try {
        setData(prevData => prevData.filter(item => (item as any).id !== id));
    } catch (e) {
      console.error("Failed to remove document", e);
      setError(e instanceof Error ? e : new Error('Failed to remove document'));
    }
  }, [setData]);

  return { data, loading, error, add, update, remove, reload: reloadData };
}
