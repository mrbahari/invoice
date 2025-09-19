
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import type { Category, Customer, Invoice, Product, Store, UnitOfMeasurement } from '@/lib/definitions';
import { 
    getCollection, 
    addDocToCollection, 
    updateDocInCollection,
    deleteDocFromCollection 
} from '@/lib/firestore-service';

type CollectionName = 'products' | 'categories' | 'customers' | 'invoices' | 'units' | 'stores';

type Document = Product | Category | Customer | Invoice | UnitOfMeasurement | Store;


export function useCollection<T extends Document>(collectionName: CollectionName) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const collectionData = await getCollection<T>(user.uid, collectionName);
      setData(collectionData);
      setError(null);
    } catch (e) {
      console.error(`Failed to fetch ${collectionName}`, e);
      setError(e instanceof Error ? e : new Error(`Failed to load ${collectionName}`));
    } finally {
      setLoading(false);
    }
  }, [user, collectionName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const add = useCallback(async (newItem: Omit<T, 'id'>): Promise<(T & { id: string }) | null> => {
    if (!user) {
      setError(new Error('User not authenticated.'));
      return null;
    }
    try {
      const addedDoc = await addDocToCollection(user.uid, collectionName, newItem);
      setData(prevData => [addedDoc as T, ...prevData]);
      return addedDoc as (T & { id: string });
    } catch(e) {
      console.error("Failed to add document", e);
      setError(e instanceof Error ? e : new Error('Failed to add document'));
      return null;
    }
  }, [user, collectionName, setData]);

  const update = useCallback(async (id: string, updatedItem: Partial<T>): Promise<void> => {
    if (!user) {
        setError(new Error('User not authenticated.'));
        return;
    }
    try {
        await updateDocInCollection(user.uid, collectionName, id, updatedItem);
        setData(prevData =>
            prevData.map(item =>
                (item as any).id === id ? { ...item, ...updatedItem } : item
            )
        );
    } catch(e) {
      console.error("Failed to update document", e);
      setError(e instanceof Error ? e : new Error('Failed to update document'));
    }
  }, [user, collectionName, setData]);

  const remove = useCallback(async (id: string): Promise<void> => {
    if (!user) {
        setError(new Error('User not authenticated.'));
        return;
    }
    try {
        await deleteDocFromCollection(user.uid, collectionName, id);
        setData(prevData => prevData.filter(item => (item as any).id !== id));
    } catch (e) {
      console.error("Failed to remove document", e);
      setError(e instanceof Error ? e : new Error('Failed to remove document'));
    }
  }, [user, collectionName, setData]);

  return { data, loading, error, add, update, remove, reload: fetchData };
}
