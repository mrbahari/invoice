
'use client';

import Image from 'next/image';
import { PlusCircle, File, Search } from 'lucide-react';
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
import { initialProducts, initialCategories } from '@/lib/data';
import { formatCurrency, downloadCSV } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Product, Category } from '@/lib/definitions';
import { useState, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';

export default function ProductsPage() {
  const [products] = useLocalStorage<Product[]>('products', initialProducts);
  const [categories] = useLocalStorage<Category[]>('categories', initialCategories);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

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
    
    const selectedCategory = categoriesById.get(activeTab);
    // If it's a parent category (or has children), show its products and all descendants' products.
    if (selectedCategory && !selectedCategory.parentId) {
      const descendantIds = getDescendantIds(activeTab);
      return products
        .filter(p => descendantIds.includes(p.categoryId))
        .filter(productFilter);
    }

    // If it's a sub-category (or has no children), show only its products.
    return products
      .filter(product => product.categoryId === activeTab)
      .filter(productFilter);

  }, [products, activeTab, searchTerm, categoriesById, getDescendantIds]);

  const handleRowClick = (productId: string) => {
    router.push(`/dashboard/products/${productId}/edit`);
  };

  const getCategoryName = (categoryId: string) => {
    return categoriesById.get(categoryId)?.name || 'بدون دسته‌بندی';
  };

  const handleExport = () => {
    const dataToExport = filteredProducts;

    const headers = {
      name: 'نام محصول',
      description: 'توضیحات',
      price: 'قیمت',
      categoryId: 'شناسه دسته‌بندی',
    };
    
    downloadCSV(dataToExport, `products-${activeTab}.csv`, headers);
  };
  
  const sortedCategories = useMemo(() => {
      const topLevel = categories.filter(c => !c.parentId || !categoriesById.has(c.parentId));
      const sorted: Category[] = [];

      topLevel.sort((a,b) => a.name.localeCompare(b.name)).forEach(parent => {
          sorted.push(parent);
          const children = categories.filter(c => c.parentId === parent.id);
          children.sort((a,b) => a.name.localeCompare(b.name)).forEach(child => sorted.push(child));
      });
      return sorted;
  }, [categories, categoriesById]);


  const renderProductTable = (productList: typeof products) => (
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
            {productList.map((product) => (
              <TableRow key={product.id} onClick={() => handleRowClick(product.id)} className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-1">
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
          نمایش <strong>{productList.length}</strong> از <strong>{products.length}</strong> محصول
        </div>
      </CardFooter>
    </Card>
  );


  return (
    <Tabs defaultValue="all" dir="rtl" onValueChange={setActiveTab}>
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">همه</TabsTrigger>
          {sortedCategories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.parentId ? <span className='ml-2'>–</span> : ''}
              {cat.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
           <div className="relative ml-auto flex-1 md:grow-0">
                <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="جستجوی محصول..."
                    className="w-full rounded-lg bg-background pr-8 md:w-[200px] lg:w-[336px]"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              خروجی
            </span>
          </Button>
          <Link href="/dashboard/products/new">
            <Button size="sm" className="h-8 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                افزودن محصول
              </span>
            </Button>
          </Link>
        </div>
      </div>
       {renderProductTable(filteredProducts)}
    </Tabs>
  );
}
