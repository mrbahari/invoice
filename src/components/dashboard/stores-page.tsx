
'use client';

import Image from 'next/image';
import { PlusCircle, Store as StoreIcon, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Store } from '@/lib/definitions';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearch } from '@/components/dashboard/search-provider';
import { StoreForm } from './store-form';
import { useData } from '@/context/data-context';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';


export default function StoresPage() {
  const { data, deleteDocuments, deleteDocument } = useData();
  const { stores, categories, products } = data;
  const { user } = useUser();
  const { toast } = useToast();
  const { searchTerm, setSearchVisible } = useSearch();

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingStore, setEditingStore] = useState<Store | undefined>(undefined);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  useEffect(() => {
    // Control search bar visibility based on view
    if (view === 'list') {
      setSearchVisible(true);
    } else {
      setSearchVisible(false);
    }
  }, [view, setSearchVisible]);
  
  // Clear selection when search term changes
  useEffect(() => {
    setSelectedStores([]);
  }, [searchTerm]);

  const handleAddClick = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'ورود لازم است',
        description: 'برای افزودن فروشگاه، لطفاً ابتدا وارد حساب خود شوید.',
      });
      return;
    }
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
  
  const handleSelectStore = (storeId: string, checked: boolean) => {
    setSelectedStores(prev => 
      checked ? [...prev, storeId] : prev.filter(id => id !== storeId)
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedStores.length === 0) return;
    setIsProcessingBulk(true);
    try {
        const productsToDelete: string[] = [];
        const categoriesToDelete: string[] = [];
        const unitsToDelete: string[] = [];
        
        for (const storeId of selectedStores) {
            productsToDelete.push(...data.products.filter(p => p.storeId === storeId).map(p => p.id));
            categoriesToDelete.push(...data.categories.filter(c => c.storeId === storeId).map(c => c.id));
            unitsToDelete.push(...data.units.filter(u => u.storeId === storeId).map(u => u.id));
        }

        if (productsToDelete.length > 0) await deleteDocuments('products', productsToDelete);
        if (categoriesToDelete.length > 0) await deleteDocuments('categories', categoriesToDelete);
        if (unitsToDelete.length > 0) await deleteDocuments('units', unitsToDelete);
        
        // Finally delete the stores themselves
        await deleteDocuments('stores', selectedStores);
      
        toast({
            variant: 'success',
            title: 'حذف موفق',
            description: `${selectedStores.length} فروشگاه به همراه تمام داده‌هایشان حذف شدند.`,
        });
        setSelectedStores([]);
    } catch (error) {
        console.error("Error during bulk store deletion:", error);
        toast({ variant: 'destructive', title: 'خطا در حذف', description: 'مشکلی در حذف گروهی فروشگاه‌ها رخ داد.' });
    } finally {
        setIsProcessingBulk(false);
    }
  };


  if (view === 'form') {
    return (
      <StoreForm
        store={editingStore}
        onSave={handleFormSuccess}
        onCancel={handleFormCancel}
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
      
      {selectedStores.length > 0 && (
          <Card className="sticky top-[88px] z-10 animate-in fade-in-50">
              <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">
                          {selectedStores.length.toLocaleString('fa-IR')} مورد انتخاب شده
                      </span>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={isProcessingBulk}>
                                  <Trash2 className="ml-2 h-4 w-4" />
                                  حذف موارد انتخابی
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      این عمل غیرقابل بازگشت است و {selectedStores.length.toLocaleString('fa-IR')} فروشگاه را به همراه تمام محصولات و دسته‌بندی‌هایشان برای همیشه حذف می‌کند.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="grid grid-cols-2 gap-2">
                                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive hover:bg-destructive/90" disabled={isProcessingBulk}>
                                      {isProcessingBulk && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                      حذف
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                  </div>
              </CardContent>
          </Card>
      )}
      
      {sortedAndFilteredStores.length > 0 ? (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sortedAndFilteredStores.map((store) => (
            <Card
              key={store.id}
              onClick={() => handleEditClick(store)}
              className={cn(
                "flex flex-col cursor-pointer h-full transition-all",
                selectedStores.includes(store.id) && "ring-2 ring-primary border-primary"
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-3">
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
                      <span className="flex-1">{store.name}</span>
                    </CardTitle>
                    <Checkbox
                        checked={selectedStores.includes(store.id)}
                        onCheckedChange={(checked) => handleSelectStore(store.id, !!checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5"
                    />
                </div>
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
