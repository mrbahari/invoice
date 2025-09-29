
'use client';

import Image from 'next/image';
import { PlusCircle, Store as StoreIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Store } from '@/lib/definitions';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearch } from '@/components/dashboard/search-provider';
import { StoreForm } from './store-form';
import { useData } from '@/context/data-context'; // Import useData

export default function StoresPage() {
  const { data, setData } = useData(); // Use the central data context
  const { stores, categories, products } = data;
  const { searchTerm, setSearchVisible } = useSearch();

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingStore, setEditingStore] = useState<Store | undefined>(undefined);

  useEffect(() => {
    // Control search bar visibility based on view
    if (view === 'list') {
      setSearchVisible(true);
    } else {
      setSearchVisible(false);
    }
  }, [view, setSearchVisible]);

  const handleAddClick = () => {
    setEditingStore(undefined);
    setView('form');
  };

  const handleEditClick = (store: Store) => {
    setEditingStore(store);
    setView('form');
  };

  const handleFormSuccess = () => {
    setView('list');
    setEditingStore(undefined);
    // Data is already updated in the context by the form
  };

  const handleFormCancel = () => {
    setView('list');
    setEditingStore(undefined);
  };

  const handleDeleteStore = (storeId: string) => {
    setData((prev) => ({
      ...prev,
      stores: prev.stores.filter((s) => s.id !== storeId),
      // Optional: also delete associated categories and products
      categories: prev.categories.filter((c) => c.storeId !== storeId),
      products: prev.products.filter((p) => p.storeId !== storeId),
    }));
    handleFormSuccess();
  };

  const sortedAndFilteredStores = useMemo(() => {
    if (!stores) return [];
    return stores
      .filter((store) =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stores, searchTerm]);

  const getCategoryCount = useCallback(
    (storeId: string) => {
      if (!categories) return 0;
      return categories.filter((c) => c.storeId === storeId && !c.parentId)
        .length;
    },
    [categories]
  );

  const getProductCount = useCallback(
    (storeId: string) => {
      if (!products) return 0;
      return products.filter((p) => p.storeId === storeId).length;
    },
    [products]
  );

  if (view === 'form') {
    return (
      <StoreForm
        store={editingStore}
        onSave={handleFormSuccess}
        onCancel={handleFormCancel}
        onDelete={handleDeleteStore}
      />
    );
  }

  return (
    <div className="grid gap-8" data-main-page="true">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center gap-4">
            <div>
              <CardTitle>فروشگاه‌ها</CardTitle>
              <CardDescription>
                فروشگاه‌های خود را مدیریت کرده و برای هرکدام دسته‌بندی محصولات
                تعریف کنید.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white dark:bg-white dark:text-black"
                onClick={handleAddClick}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  افزودن فروشگاه
                </span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {sortedAndFilteredStores.length > 0 ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sortedAndFilteredStores.map((store) => (
            <Card
              key={store.id}
              onClick={() => handleEditClick(store)}
              className="flex flex-col cursor-pointer h-full"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    {store.logoUrl ? (
                      <Image
                        src={store.logoUrl}
                        alt={store.name}
                        width={48}
                        height={48}
                        className="object-contain rounded-md"
                        unoptimized
                      />
                    ) : (
                      <StoreIcon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <span>{store.name}</span>
                </CardTitle>
                <CardDescription>{store.address}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow"></CardContent>
              <CardFooter className="text-xs text-muted-foreground justify-between">
                <span>{getCategoryCount(store.id)} دسته‌بندی</span>
                <span>{getProductCount(store.id)} محصول</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">
              {searchTerm ? `هیچ فروشگاهی با عبارت «${searchTerm}» یافت نشد.` : 'هیچ فروشگاهی تعریف نشده است.'}
            </p>
            <Button variant="link" onClick={handleAddClick}>
              یک فروشگاه جدید اضافه کنید.
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
