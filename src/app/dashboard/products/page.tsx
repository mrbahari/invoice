
'use client';

import Image from 'next/image';
import { PlusCircle, File } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { initialData } from '@/lib/data';
import { formatCurrency, downloadCSV } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Product, Category } from '@/lib/definitions';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useSearch } from '@/components/dashboard/search-provider';

export default function ProductsPage() {
  const [products, setProducts, reloadProducts] = useLocalStorage<Product[]>('products', initialData.products);
  const [categories, , reloadCategories] = useLocalStorage<Category[]>('categories', initialData.categories);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const router = useRouter();
  const { searchTerm } = useSearch();

  useEffect(() => {
    reloadProducts();
    reloadCategories();
  }, []);

  const categoriesById = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const getDescendantIds = useCallback((categoryId: string): string[] => {
    const descendants = new Set<string>();
    const queue = [categoryId];
    descendants.add(categoryId);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = categories.filter(c => c.parentId === currentId);
      for (const child of children) {
        if (!descendants.has(child.id)) {
          descendants.add(child.id);
          queue.push(child.id);
        }
      }
    }
    return Array.from(descendants);
  }, [categories]);

  const filteredProducts = useMemo(() => {
    const productFilter = (product: Product) => product.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'all') {
      return products.filter(productFilter);
    }
    
    const descendantIds = getDescendantIds(activeTab);
    return products
        .filter(p => descendantIds.includes(p.categoryId))
        .filter(productFilter);

  }, [products, activeTab, searchTerm, getDescendantIds]);


  const getCategoryName = (categoryId: string) => {
    return categoriesById.get(categoryId)?.name || 'بدون دسته‌بندی';
  };

  const handleExport = () => {
    const dataToExport = filteredProducts.map(p => ({
        ...p,
        categoryName: getCategoryName(p.categoryId),
    }));

    const headers = {
      name: 'نام محصول',
      description: 'توضیحات',
      price: 'قیمت',
      categoryName: 'دسته‌بندی',
    };
    
    downloadCSV(dataToExport, `products-${activeTab}.csv`, headers);
  };
  
  const sortedCategoriesForTabs = useMemo(() => {
    const categoryMap: Map<string, Category & { children: Category[] }> = new Map(
      categories.map(c => [c.id, { ...c, children: [] }])
    );
    const topLevel: Category[] = [];

    categories.forEach(cat => {
        if (cat.parentId && categoryMap.has(cat.parentId)) {
            categoryMap.get(cat.parentId)!.children.push(cat);
        } else if (!cat.parentId) {
            topLevel.push(cat);
        }
    });

    const sorted: { id: string; name: string }[] = [];
    const addCategoryToTabs = (category: Category, depth: number) => {
        sorted.push({
            id: category.id,
            name: `${'– '.repeat(depth)}${category.name}`
        });
        const children = categoryMap.get(category.id)?.children || [];
        children
            .sort((a,b) => a.name.localeCompare(b.name))
            .forEach(child => addCategoryToTabs(child, depth + 1));
    };

    topLevel
        .sort((a,b) => a.name.localeCompare(b.name))
        .forEach(parent => addCategoryToTabs(parent, 0));

    return sorted;
  }, [categories]);

  return (
    <Tabs defaultValue="all" dir="rtl" onValueChange={setActiveTab}>
      <div className="flex items-center justify-between">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="all">همه</TabsTrigger>
          {sortedCategoriesForTabs.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id} className="whitespace-nowrap">
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              خروجی
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1" asChild>
            <Link href="/dashboard/products/new">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                افزودن محصول
                </span>
            </Link>
          </Button>
        </div>
      </div>
       <Card className="animate-fade-in-up">
        <CardHeader>
            <CardTitle>محصولات</CardTitle>
            <CardDescription>
            محصولات خود را مدیریت کرده و عملکرد فروش آنها را مشاهده کنید.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">تصویر</span>
                </TableHead>
                <TableHead>نام</TableHead>
                <TableHead>دسته‌بندی</TableHead>
                <TableHead className="hidden md:table-cell">
                    توضیحات
                </TableHead>
                <TableHead className="text-left">قیمت</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredProducts.map((product) => (
                <TableRow key={product.id} onClick={() => router.push(`/dashboard/products/${product.id}/edit`)} className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-1">
                    <TableCell className="hidden sm:table-cell">
                    <Image
                        alt={product.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={product.imageUrl}
                        width="64"
                        data-ai-hint="product image"
                    />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                    <Badge variant="outline">{getCategoryName(product.categoryId)}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">
                    {product.description}
                    </TableCell>
                    <TableCell className="text-left">
                    {formatCurrency(product.price)}
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
            نمایش <strong>{filteredProducts.length}</strong> از <strong>{products.length}</strong> محصول
            </div>
        </CardFooter>
        </Card>
    </Tabs>
  );
}
