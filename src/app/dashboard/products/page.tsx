
'use client';

import Image from 'next/image';
import { MoreHorizontal, PlusCircle, File } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Product, Category } from '@/lib/definitions';
import { useState } from 'react';

export default function ProductsPage() {
  const [products] = useLocalStorage<Product[]>('products', initialProducts);
  const [categories] = useLocalStorage<Category[]>('categories', initialCategories);
  const [activeTab, setActiveTab] = useState('all');

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'بدون دسته‌بندی';
  };

  const handleExport = () => {
    const dataToExport = activeTab === 'all'
      ? products
      : products.filter(p => p.categoryId === activeTab);

    const headers = {
      name: 'نام محصول',
      description: 'توضیحات',
      price: 'قیمت',
      categoryId: 'شناسه دسته‌بندی',
    };
    
    downloadCSV(dataToExport, `products-${activeTab}.csv`, headers);
  };

  const renderProductTable = (productList: typeof products) => (
    <Card>
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
              <TableHead>
                <span className="sr-only">اقدامات</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productList.map((product) => (
              <TableRow key={product.id}>
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
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">باز کردن منو</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>اقدامات</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/products/${product.id}/edit`}>ویرایش</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>حذف</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          نمایش <strong>1-{productList.length}</strong> از <strong>{productList.length}</strong> محصول
        </div>
      </CardFooter>
    </Card>
  );


  return (
    <Tabs defaultValue="all" dir="rtl" onValueChange={setActiveTab}>
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">همه</TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
          ))}
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
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
      <TabsContent value="all">
        {renderProductTable(products)}
      </TabsContent>
      {categories.map(cat => (
        <TabsContent key={cat.id} value={cat.id}>
            {renderProductTable(products.filter(p => p.categoryId === cat.id))}
        </TabsContent>
      ))}
    </Tabs>
  );
}
