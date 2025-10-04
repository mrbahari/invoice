'use client';

import Image from 'next/image';
import { PlusCircle, File, Store, WandSparkles, SortAsc, Loader2 } from 'lucide-react';
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
import type { Product, Category } from '@/lib/definitions';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearch } from '@/components/dashboard/search-provider';
import { ProductForm } from './product-form';
import { useData } from '@/context/data-context';
import { cn } from '@/lib/utils';
import { useDraggableScroll } from '@/hooks/use-draggable-scroll';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { generateProductFromIdea, type GenerateProductFromIdeaOutput } from '@/ai/flows/generate-product-from-idea';

type SortOption = 'newest' | 'name' | 'price';

function AiProductDialog({ onProductGenerated }: { onProductGenerated: (product: GenerateProductFromIdeaOutput) => void }) {
  const { data } = useData();
  const { stores, categories } = data;
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [idea, setIdea] = useState('');
  const [storeId, setStoreId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');

  const availableSubCategories = useMemo(() => {
    if (!storeId) return [];
    return categories.filter(c => c.storeId === storeId && c.parentId);
  }, [categories, storeId]);

  const canGenerate = idea && storeId && subCategoryId;

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsLoading(true);
    try {
      const categoryName = categories.find(c => c.id === subCategoryId)?.name || '';
      const result = await generateProductFromIdea({
        productIdea: idea,
        storeId,
        subCategoryId,
        categoryName
      });
      if (result) {
        onProductGenerated(result);
        setIsOpen(false);
        // Reset form
        setIdea('');
        setStoreId('');
        setSubCategoryId('');
      }
    } catch (error) {
      console.error("Failed to generate product with AI", error);
      // You can add a toast message here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <WandSparkles className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            افزودن با AI
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تولید محصول با هوش مصنوعی</DialogTitle>
          <DialogDescription>
            ایده خود را توصیف کنید. هوش مصنوعی نام، قیمت، توضیحات و تصویر محصول را برای شما تولید می‌کند.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="idea" className="text-right">ایده محصول</Label>
            <Input id="idea" value={idea} onChange={e => setIdea(e.target.value)} className="col-span-3" placeholder="مثلا: پیچ گوشتی شارژی باکیفیت" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="store" className="text-right">فروشگاه</Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger id="store" className="col-span-3"><SelectValue placeholder="انتخاب فروشگاه" /></SelectTrigger>
              <SelectContent>
                {stores?.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">دسته</Label>
            <Select value={subCategoryId} onValueChange={setSubCategoryId} disabled={!storeId}>
              <SelectTrigger id="category" className="col-span-3"><SelectValue placeholder="انتخاب زیردسته" /></SelectTrigger>
              <SelectContent>
                {availableSubCategories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleGenerate} disabled={!canGenerate || isLoading}>
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            تولید محصول
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function ProductsPage() {
  const { data } = useData();
  const { products, stores, categories } = data;
  const [activeTab, setActiveTab] = useState('all');
  const { searchTerm, setSearchVisible } = useSearch();

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const scrollPositionRef = useRef(0);
  const storesScrollRef = useRef<HTMLDivElement>(null);
  useDraggableScroll(storesScrollRef, { direction: 'horizontal' });
  const [sortOption, setSortOption] = useState<SortOption>('newest');


  useEffect(() => {
    if (view === 'list') {
      setSearchVisible(true);
    } else {
      setSearchVisible(false);
    }
  }, [view, setSearchVisible]);

  useEffect(() => {
    if (view === 'list' && scrollPositionRef.current > 0) {
      setTimeout(() => {
        window.scrollTo({ top: scrollPositionRef.current, behavior: 'auto' });
        scrollPositionRef.current = 0;
      }, 0);
    }
  }, [view]);

  const handleAddClick = () => {
    setEditingProduct(undefined);
    setSelectedProductId(null);
    setView('form');
  };

  const handleAiProductGenerated = useCallback((aiProduct: GenerateProductFromIdeaOutput) => {
    // Create a product object that matches the form's expectations
    const newProduct: Product = {
      id: '', // ID will be generated on save
      name: aiProduct.name,
      description: aiProduct.description,
      price: aiProduct.price,
      imageUrl: aiProduct.imageUrl,
      storeId: aiProduct.storeId,
      subCategoryId: aiProduct.subCategoryId,
      unit: 'عدد', // Default unit, can be changed in the form
    };
    setEditingProduct(newProduct);
    setView('form');
  }, []);

  const handleEditClick = (product: Product) => {
    scrollPositionRef.current = window.scrollY;
    setEditingProduct(product);
    setSelectedProductId(product.id);
    setView('form');
  };

  const handleFormSuccess = () => {
    setView('list');
    setEditingProduct(undefined);
    setSelectedProductId(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFormCancel = () => {
    setView('list');
    setEditingProduct(undefined);
    setSelectedProductId(null);
  };

  const sortedAndFilteredProducts = useMemo(() => {
    if (!products) return [];
    let filtered = products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeTab !== 'all') {
      filtered = filtered.filter((p) => p.storeId === activeTab);
    }
    
    switch (sortOption) {
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
      case 'price':
        return filtered.sort((a, b) => b.price - a.price);
      case 'newest':
      default:
        // 'newest' is default as new products are prepended
        return filtered;
    }
  }, [products, activeTab, searchTerm, sortOption]);

  const getCategoryName = (categoryId: string) => {
    if (!categories) return 'بدون زیردسته';
    return categories.find((c) => c.id === categoryId)?.name || 'بدون زیردسته';
  };

  const handleExport = () => {
    const dataToExport = sortedAndFilteredProducts.map((p) => ({
      ...p,
      categoryName: getCategoryName(p.subCategoryId),
      storeName: stores?.find((s) => s.id === p.storeId)?.name || 'فروشگاه حذف شده',
    }));

    const headers = { name: 'نام محصول', description: 'توضیحات', price: 'قیمت', storeName: 'فروشگاه', categoryName: 'زیردسته' };
    downloadCSV(dataToExport, `products-${activeTab}.csv`, headers);
  };

  if (view === 'form') {
    return (
      <ProductForm
        product={editingProduct}
        onSave={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="grid gap-6" data-main-page="true">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>محصولات</CardTitle>
            <div className="flex shrink-0 items-center gap-2">
              <AiProductDialog onProductGenerated={handleAiProductGenerated} />
              <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">خروجی</span>
              </Button>
              <Button size="sm" className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white dark:bg-white dark:text-black" onClick={handleAddClick}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">افزودن محصول</span>
              </Button>
            </div>
          </div>
          <CardDescription>
            محصولات خود را مدیریت کرده و عملکرد فروش آنها را مشاهده کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={storesScrollRef}
            className="flex space-x-reverse space-x-2 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing"
          >
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              className="flex-shrink-0"
              onClick={() => setActiveTab('all')}
            >
              <Store className="ml-2 h-4 w-4" />
              همه محصولات
            </Button>
            {stores?.map((store) => (
              <Button
                key={store.id}
                variant={activeTab === store.id ? 'default' : 'outline'}
                className="flex-shrink-0"
                onClick={() => setActiveTab(store.id)}
              >
                {store.name}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-end py-4">
              <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="مرتب‌سازی بر اساس..." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">جدیدترین</SelectItem>
                  <SelectItem value="name">نام محصول</SelectItem>
                  <SelectItem value="price">گران‌ترین</SelectItem>
                </SelectContent>
              </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام</TableHead>
                <TableHead>زیردسته</TableHead>
                <TableHead className="hidden md:table-cell">توضیحات</TableHead>
                <TableHead className="text-left">قیمت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredProducts.length > 0 ? (
                sortedAndFilteredProducts.map((product) => (
                  <TableRow
                    key={product.id}
                    onClick={() => handleEditClick(product)}
                    className={cn(
                      'cursor-pointer',
                      selectedProductId === product.id ? 'bg-muted' : 'hover:bg-muted/50'
                    )}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Image
                          alt={product.name}
                          className="aspect-square rounded-md object-cover"
                          height="40"
                          src={product.imageUrl}
                          width="40"
                          data-ai-hint="product image"
                        />
                        <span>{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryName(product.subCategoryId)}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate">{product.description}</TableCell>
                    <TableCell className="text-left">{formatCurrency(product.price)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">هیچ محصولی یافت نشد.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            نمایش <strong>{sortedAndFilteredProducts.length}</strong> از{' '}
            <strong>{products?.length || 0}</strong> محصول
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
