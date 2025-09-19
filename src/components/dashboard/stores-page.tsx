
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
import { initialData } from '@/lib/data';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Store, Category, Product } from '@/lib/definitions';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearch } from '@/components/dashboard/search-provider';
import { StoreForm } from './store-form';

export default function StoresPage() {
  const [stores, setStores, reloadStores] = useLocalStorage<Store[]>('stores', initialData.stores);
  const [categories, , reloadCategories] = useLocalStorage<Category[]>('categories', initialData.categories);
  const [products, , reloadProducts] = useLocalStorage<Product[]>('products', initialData.products);
  const { searchTerm } = useSearch();

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingStore, setEditingStore] = useState<Store | undefined>(undefined);


  useEffect(() => {
    reloadStores();
    reloadCategories();
    reloadProducts();
  }, []);

  const handleAddClick = () => {
    setEditingStore(undefined);
    setView('form');
  }

  const handleEditClick = (store: Store) => {
    setEditingStore(store);
    setView('form');
  }

  const handleFormSuccess = () => {
    setView('list');
    setEditingStore(undefined);
    reloadStores();
  }
  
  const handleFormCancel = () => {
    setView('list');
    setEditingStore(undefined);
  }
  
  const handleDeleteStore = (storeId: string) => {
    setStores(prev => prev.filter(s => s.id !== storeId));
    // Also delete associated categories and products if needed
    handleFormSuccess();
  }

  const sortedAndFilteredStores = useMemo(() => {
    return stores
      .filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stores, searchTerm]);
  
  const getCategoryCount = useCallback((storeId: string) => {
    return categories.filter(c => c.storeId === storeId && !c.parentId).length;
  }, [categories]);
  
  const getProductCount = useCallback((storeId: string) => {
    return products.filter(p => p.storeId === storeId).length;
  }, [products]);

  if (view === 'form') {
    return <StoreForm store={editingStore} onSave={handleFormSuccess} onCancel={handleFormCancel} onDelete={handleDeleteStore} />;
  }

  return (
    <div className='grid gap-8'>
        <Card className="animate-fade-in-up">
            <CardHeader>
                <div className='flex justify-between items-center gap-4'>
                    <div>
                        <CardTitle>فروشگاه‌ها</CardTitle>
                        <CardDescription>
                        فروشگاه‌های خود را مدیریت کرده و برای هرکدام دسته‌بندی محصولات تعریف کنید.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                    <Button size="sm" className="h-8 gap-1" onClick={handleAddClick}>
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        افزودن فروشگاه
                        </span>
                    </Button>
                    </div>
                </div>
            </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            {sortedAndFilteredStores.map(store => (
                <Card 
                    key={store.id}
                    onClick={() => handleEditClick(store)}
                    className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer h-full"
                >
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                             {store.logoUrl ? <Image src={store.logoUrl} alt={store.name} width={48} height={48} className="object-contain rounded-md" unoptimized/> : <StoreIcon className='w-6 h-6 text-muted-foreground' />}
                           </div>
                           <span>{store.name}</span>
                        </CardTitle>
                        <CardDescription>{store.address}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground justify-between">
                        <span>{getCategoryCount(store.id)} دسته‌بندی</span>
                        <span>{getProductCount(store.id)} محصول</span>
                    </CardFooter>
                </Card>
            ))}
        </div>
        {sortedAndFilteredStores.length === 0 && (
             <Card className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <CardContent className="py-16 text-center">
                    <p className="text-muted-foreground">هیچ فروشگاهی با عبارت «{searchTerm}» یافت نشد.</p>
                    <Button variant="link" onClick={handleAddClick}>یک فروشگاه جدید اضافه کنید.</Button>
                </CardContent>
             </Card>
        )}
    </div>
  );
}
