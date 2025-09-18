
'use client';

import { PlusCircle } from 'lucide-react';
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
import type { Category, Product } from '@/lib/definitions';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearch } from '@/components/dashboard/search-provider';
import Link from 'next/link';

export default function CategoriesPage() {
  const [categoryList, , reloadCategories] = useLocalStorage<Category[]>('categories', initialData.categories);
  const [products, , reloadProducts] = useLocalStorage<Product[]>('products', initialData.products);
  const { searchTerm } = useSearch();

  useEffect(() => {
    reloadCategories();
    reloadProducts();
  }, []);

  const sortedAndFilteredCategories = useMemo(() => {
    const parentCategories = categoryList.filter(c => !c.parentId);

    const filtered = parentCategories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      categoryList.some(child => child.parentId === category.id && child.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [categoryList, searchTerm]);

  const getChildCategories = useCallback((parentId: string) => {
    return categoryList.filter(c => c.parentId === parentId).sort((a,b)=>a.name.localeCompare(b.name));
  }, [categoryList]);
  
  const getProductCount = useCallback((categoryId: string) => {
    const childIds = categoryList.filter(c => c.parentId === categoryId).map(c => c.id);
    const allIds = [categoryId, ...childIds];
    return products.filter(p => allIds.includes(p.categoryId)).length;
  }, [products, categoryList]);


  return (
    <div className='grid gap-8'>
        <Card className="animate-fade-in-up">
            <CardHeader>
                <div className='flex justify-between items-center gap-4'>
                    <div>
                        <CardTitle>فروشگاه‌ها</CardTitle>
                        <CardDescription>
                        فروشگاه‌ها و دسته‌بندی محصولات خود را مدیریت کنید.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                    <Button size="sm" className="h-8 gap-1" asChild>
                        <Link href="/dashboard/categories/new">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            افزودن فروشگاه
                            </span>
                        </Link>
                    </Button>
                    </div>
                </div>
            </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            {sortedAndFilteredCategories.map(category => (
                <Link key={category.id} href={`/dashboard/categories/${category.id}/edit`}>
                    <Card 
                        className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer h-full"
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{category.name}</span>
                            </CardTitle>
                            <CardDescription>{category.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm font-semibold text-muted-foreground mb-2">زیردسته‌ها:</p>
                            <div className="space-y-1 text-sm">
                                {getChildCategories(category.id).length > 0 ? (
                                    getChildCategories(category.id).map(child => (
                                        <div key={child.id} className="p-2 rounded-md bg-muted/50">{child.name}</div>
                                    ))
                                ) : (
                                    <p className="text-xs text-muted-foreground p-2 text-center">هیچ زیردسته‌ای تعریف نشده است.</p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="text-xs text-muted-foreground justify-between">
                            <span>{category.storeName}</span>
                            <span>{getProductCount(category.id)} محصول</span>
                        </CardFooter>
                    </Card>
                </Link>
            ))}
        </div>
        {sortedAndFilteredCategories.length === 0 && (
             <Card className="animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                <CardContent className="py-16 text-center">
                    <p className="text-muted-foreground">هیچ فروشگاهی با عبارت «{searchTerm}» یافت نشد.</p>
                    <Button variant="link" asChild>
                        <Link href="/dashboard/categories/new">یک فروشگاه جدید اضافه کنید.</Link>
                    </Button>
                </CardContent>
             </Card>
        )}
    </div>
  );
}

