
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import type { Category, Customer, Invoice, Product, Store, UnitOfMeasurement } from '@/lib/definitions';
import {
  getCollection,
  addDocument,
  updateDocument,
  deleteDocument,
} from '@/lib/firestore-service';

type CollectionName = 'products' | 'categories' | 'customers' | 'invoices' | 'units' | 'stores';
type Document = Product | Category | Customer | Invoice | UnitOfMeasurement | Store;

export function useCollection<T extends Document>(collectionName: CollectionName) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
        setData([]);
        setLoading(false);
        return;
    };

    setLoading(true);
    try {
      const collectionData = await getCollection<T>(user.uid, collectionName);
      setData(collectionData);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(`Failed to load ${collectionName}`));
      console.error(`Failed to load ${collectionName}`, e);
    } finally {
      setLoading(false);
    }
  }, [user, collectionName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const add = useCallback(async (newItem: Omit<T, 'id'>): Promise<(T & { id: string }) | null> => {
    if (!user) {
        setError(new Error('User not authenticated for add operation.'));
        return null;
    }
    try {
      const newDoc = await addDocument(user.uid, collectionName, newItem);
      setData(prevData => [newDoc as T, ...prevData]);
      return newDoc as (T & { id: string });
    } catch (e) {
      setError(e instanceof Error ? e : new Error(`Failed to add document to ${collectionName}`));
      console.error(`Failed to add document to ${collectionName}`, e);
      return null;
    }
  }, [user, collectionName]);

  const update = useCallback(async (id: string, updatedData: Partial<T>): Promise<void> => {
    if (!user) {
        setError(new Error('User not authenticated for update operation.'));
        return;
    }
    try {
      await updateDocument(user.uid, collectionName, id, updatedData);
      setData(prevData =>
        prevData.map(item => ((item as any).id === id ? { ...item, ...updatedData } : item))
      );
    } catch (e) {
      setError(e instanceof Error ? e : new Error(`Failed to update document in ${collectionName}`));
      console.error(`Failed to update document in ${collectionName}`, e);
    }
  }, [user, collectionName]);

  const remove = useCallback(async (id: string): Promise<void> => {
    if (!user) {
        setError(new Error('User not authenticated for remove operation.'));
        return;
    }
    try {
      await deleteDocument(user.uid, collectionName, id);
      setData(prevData => prevData.filter(item => (item as any).id !== id));
    } catch (e) {
      setError(e instanceof Error ? e : new Error(`Failed to remove document from ${collectionName}`));
      console.error(`Failed to remove document from ${collectionName}`, e);
    }
  }, [user, collectionName]);

  return { data, loading, error, add, update, remove, reload: loadData };
}
