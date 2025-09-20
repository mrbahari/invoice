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
import { formatCurrency, downloadCSV } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Product, Store, Category } from '@/lib/definitions';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearch } from '@/components/dashboard/search-provider';
import { ProductForm } from './product-form';
import { useData } from '@/context/data-context'; // Import useData
import { cn } from '@/lib/utils';


export default function ProductsPage() {
  const { data } = useData(); // Use the central data context
  const { products, stores, categories } = data;
  const [activeTab, setActiveTab] = useState('all');
  const { searchTerm } = useSearch();

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    if (view === 'list' && scrollPositionRef.current > 0) {
      setTimeout(() => {
        window.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' });
        scrollPositionRef.current = 0; // Reset after restoring
      }, 0);
    }
  }, [view]);

  const handleAddClick = () => {
    setEditingProduct(undefined);
    setSelectedProductId(null);
    setView('form');
  }

  const handleEditClick = (product: Product) => {
    scrollPositionRef.current = window.scrollY;
    setEditingProduct(product);
    setSelectedProductId(product.id);
    setView('form');
  }

  const handleFormSuccess = () => {
    setView('list');
    setEditingProduct(undefined);
    setSelectedProductId(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const handleFormCancel = () => {
    setView('list');
    setEditingProduct(undefined);
    setSelectedProductId(null);
  }

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const productFilter = (product: Product) => product.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'all') {
      return products.filter(productFilter);
    }
    
    return products
        .filter(p => p.storeId === activeTab)
        .filter(productFilter);

  }, [products, activeTab, searchTerm]);


  const getCategoryName = (categoryId: string) => {
    if (!categories) return 'بدون زیردسته';
    return categories.find(c => c.id === categoryId)?.name || 'بدون زیردسته';
  };

  const handleExport = () => {
    const dataToExport = filteredProducts.map(p => ({
        ...p,
        categoryName: getCategoryName(p.subCategoryId),
        storeName: stores?.find(s => s.id === p.storeId)?.name || 'فروشگاه حذف شده',
    }));

    const headers = {
      name: 'نام محصول',
      description: 'توضیحات',
      price: 'قیمت',
      storeName: 'فروشگاه',
      categoryName: 'زیردسته',
    };
    
    downloadCSV(dataToExport, `products-${activeTab}.csv`, headers);
  };

  if (view === 'form') {
      return <ProductForm product={editingProduct} onSave={handleFormSuccess} onCancel={handleFormCancel} />;
  }

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>محصولات</CardTitle>
            <CardDescription>
              محصولات خود را مدیریت کرده و عملکرد فروش آنها را مشاهده کنید.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              onClick={handleExport}
            >
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                خروجی
              </span>
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1"
              onClick={handleAddClick}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                افزودن محصول
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" dir="rtl" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-4">
            <TabsTrigger value="all">همه</TabsTrigger>
            {stores?.map((store) => (
              <TabsTrigger
                key={store.id}
                value={store.id}
                className="whitespace-nowrap"
              >
                {store.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">تصویر</span>
                </TableHead>
                <TableHead>نام</TableHead>
                <TableHead>زیردسته</TableHead>
                <TableHead className="hidden md:table-cell">
                  توضیحات
                </TableHead>
                <TableHead className="text-left">قیمت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow
                  key={product.id}
                  onClick={() => handleEditClick(product)}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedProductId === product.id ? 'bg-muted' : 'hover:bg-muted/50'
                  )}
                >
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
                    <Badge variant="outline">
                      {getCategoryName(product.subCategoryId)}
                    </Badge>
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
        </Tabs>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          نمایش <strong>{filteredProducts.length}</strong> از{' '}
          <strong>{products?.length || 0}</strong> محصول
        </div>
      </CardFooter>
    </Card>
  );
}
