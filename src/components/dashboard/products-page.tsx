'use client';

import Image from 'next/image';
import { PlusCircle, File, Store, WandSparkles, SortAsc, Loader2, Trash2, Move } from 'lucide-react';
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
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { generateProductFromIdea, type GenerateProductFromIdeaOutput } from '@/ai/flows/generate-product-from-idea';
import { generateFiveProducts } from '@/ai/flows/generate-five-products';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVirtualScroll } from '@/hooks/use-virtual-scroll';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


type SortOption = 'newest' | 'name' | 'price';
type BulkAction = 'move' | 'copy';

function AiMultipleProductsDialog({ onProductsGenerated }: { onProductsGenerated: () => void }) {
  const { data } = useData();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { stores, categories, products } = data;
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [storeId, setStoreId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');

  const availableSubCategories = useMemo(() => {
    if (!storeId) return [];
    const mainCategories = categories.filter(c => c.storeId === storeId && !c.parentId);
    return mainCategories.flatMap(mainCat => 
        categories.filter(subCat => subCat.parentId === mainCat.id)
    );
  }, [categories, storeId]);

  const canGenerate = storeId && subCategoryId;

  const handleGenerate = async () => {
    if (!canGenerate || !user) return;

    setIsLoading(true);
    
    try {
      const store = stores.find(s => s.id === storeId);
      const category = categories.find(c => c.id === subCategoryId);

      if (!store || !category) {
        throw new Error("Store or category not found.");
      }

      const existingProductNames = products
        .filter(p => p.subCategoryId === subCategoryId)
        .map(p => p.name);

      const result = await generateFiveProducts({
        storeName: store.name,
        storeDescription: store.description || '',
        categoryName: category.name,
        existingProductNames,
      });

      if (result && result.products) {
        const batch = writeBatch(firestore);
        
        for (const aiProduct of result.products) {
            const productRef = doc(collection(firestore, 'users', user.uid, 'products'));
            const newProductData: Omit<Product, 'id'> = {
                name: aiProduct.name,
                description: aiProduct.description,
                price: aiProduct.price,
                storeId: storeId,
                subCategoryId: subCategoryId,
                unit: 'عدد',
                imageUrl: `https://picsum.photos/seed/${encodeURIComponent(aiProduct.name)}/400/300`,
            };
            batch.set(productRef, newProductData);
        }
        
        await batch.commit();

        toast({
          variant: 'success',
          title: 'محصولات جدید ایجاد شدند',
          description: `${result.products.length} محصول جدید با موفقیت به فروشگاه شما اضافه شد.`
        });
        onProductsGenerated();
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Failed to generate multiple products with AI", error);
      toast({
        variant: 'destructive',
        title: 'خطا در تولید محصول',
        description: 'مشکلی در ارتباط با هوش مصنوعی پیش آمد.'
      });
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
            تولید 5 محصول با AI
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>تولید 5 محصول با هوش مصنوعی</DialogTitle>
          <DialogDescription>
            فروشگاه و دسته‌بندی مورد نظر را انتخاب کنید تا هوش مصنوعی 5 محصول مرتبط را برای شما ایجاد کند.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
            تولید 5 محصول
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function ProductsPage() {
  const { data, setData, deleteDocuments, updateDocuments, addDocuments } = useData();
  const { products, stores, categories } = data;
  const { user } = useUser();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('all');
  const { searchTerm, setSearchVisible } = useSearch();

  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const scrollPositionRef = useRef(0);
  const storesScrollRef = useRef<HTMLDivElement>(null);
  useDraggableScroll(storesScrollRef, { direction: 'horizontal' });
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  // State for bulk operations
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkAction>('move');
  const [bulkTargetStore, setBulkTargetStore] = useState<string>('');
  const [bulkTargetCategory, setBulkTargetCategory] = useState<string>('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);


  const { itemsToShow, sentinelRef } = useVirtualScroll(30);


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

  useEffect(() => {
    // Clear selection when filters change
    setSelectedProducts([]);
  }, [searchTerm, activeTab, categoryFilter, sortOption]);

  const handleAddClick = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'ورود لازم است',
        description: 'برای افزودن محصول، لطفاً ابتدا وارد حساب خود شوید.',
      });
      return;
    }
    setEditingProduct(undefined);
    setSelectedProductId(null);
    setView('form');
  };

  const handleAiProductGenerated = useCallback((aiProduct: GenerateProductFromIdeaOutput) => {
    const newProduct: Product = {
      id: '',
      name: aiProduct.name,
      description: aiProduct.description,
      price: aiProduct.price,
      imageUrl: aiProduct.imageUrl,
      storeId: aiProduct.storeId,
      subCategoryId: aiProduct.subCategoryId,
      unit: 'عدد',
    };
    const newId = `prod-${Math.random().toString(36).substr(2, 9)}`;
    const newProductWithId = { ...newProduct, id: newId };

    setData(prev => ({...prev, products: [newProductWithId, ...prev.products]}));
    
    setEditingProduct(newProductWithId);
    setView('form');
  }, [setData]);

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
    
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => p.subCategoryId === categoryFilter);
    }
    
    switch (sortOption) {
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name, 'fa'));
      case 'price':
        return filtered.sort((a, b) => b.price - a.price);
      case 'newest':
      default:
        // Already sorted by newest in DataContext
        return filtered;
    }
  }, [products, activeTab, searchTerm, sortOption, categoryFilter]);

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
  
  const handleProductsGenerated = () => {
    toast({
        title: "در حال همگام‌سازی...",
        description: "محصولات جدید در حال اضافه شدن به لیست شما هستند."
    })
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(sortedAndFilteredProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts(prev => 
      checked ? [...prev, productId] : prev.filter(id => id !== productId)
    );
  };
  
  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) return;
    setIsProcessingBulk(true);
    try {
      await deleteDocuments('products', selectedProducts);
      toast({ variant: 'success', title: 'محصولات با موفقیت حذف شدند.' });
      setSelectedProducts([]);
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطا در حذف محصولات' });
    } finally {
      setIsProcessingBulk(false);
    }
  };
  
  const handleBulkAction = async () => {
      if (selectedProducts.length === 0 || !bulkTargetCategory || !bulkTargetStore) {
        toast({variant: 'destructive', title: 'اطلاعات ناقص', description: 'لطفا فروشگاه و دسته بندی مقصد را انتخاب کنید.'});
        return;
      }

      setIsProcessingBulk(true);

      const dataToUpdate = {
          storeId: bulkTargetStore,
          subCategoryId: bulkTargetCategory
      };

      try {
        if (bulkAction === 'move') {
            await updateDocuments('products', selectedProducts, dataToUpdate);
            toast({variant: 'success', title: 'انتقال موفق', description: `${selectedProducts.length} محصول با موفقیت منتقل شدند.`});
        } else { // copy
            const productsToCopy = products.filter(p => selectedProducts.includes(p.id));
            const newDocs = productsToCopy.map(({ id, ...prodData }) => ({
                ...prodData,
                ...dataToUpdate
            }));
            await addDocuments('products', newDocs);
            toast({variant: 'success', title: 'کپی موفق', description: `${selectedProducts.length} محصول با موفقیت کپی شدند.`});
        }
        setSelectedProducts([]);
        setIsBulkActionModalOpen(false);
      } catch (error) {
          toast({variant: 'destructive', title: 'خطا در عملیات', description: `مشکلی در حین ${bulkAction === 'move' ? 'انتقال' : 'کپی'} محصولات رخ داد.`});
      } finally {
          setIsProcessingBulk(false);
      }
  };
  
  useEffect(() => {
    // Reset category when store changes in bulk action modal
    setBulkTargetCategory('');
  }, [bulkTargetStore]);


  if (view === 'form') {
    return (
      <ProductForm
        product={editingProduct}
        onSave={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  const productsToShow = sortedAndFilteredProducts.slice(0, itemsToShow);

  const categoryTree = useMemo(() => {
    const relevantCategories = categories.filter(c => activeTab === 'all' || c.storeId === activeTab);
    const categoryMap = new Map(relevantCategories.map(c => [c.id, { ...c, children: [] as Category[] }]));
    const tree: (Category & { children: Category[] })[] = [];

    relevantCategories.forEach(cat => {
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)?.children.push(categoryMap.get(cat.id)!);
      } else if (!cat.parentId) {
        tree.push(categoryMap.get(cat.id)!);
      }
    });
    return tree;
  }, [categories, activeTab]);

  const renderCategoryOptions = (nodes: (Category & { children: Category[] })[]) => {
    return nodes.map(node => (
        <SelectGroup key={node.id}>
            <SelectLabel className="font-bold text-foreground text-right">{node.name}</SelectLabel>
            {node.children.map(child => (
                <SelectItem key={child.id} value={child.id} className="pr-6 text-right">
                    {child.name}
                </SelectItem>
            ))}
        </SelectGroup>
    ));
  };
  
  const bulkActionCategoryTree = useMemo(() => {
    const relevantCategories = categories.filter(c => c.storeId === bulkTargetStore);
    const categoryMap = new Map(relevantCategories.map(c => [c.id, { ...c, children: [] as Category[] }]));
    const tree: (Category & { children: Category[] })[] = [];

    relevantCategories.forEach(cat => {
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)?.children.push(categoryMap.get(cat.id)!);
      } else if (!cat.parentId) {
        tree.push(categoryMap.get(cat.id)!);
      }
    });
    return tree;
  }, [categories, bulkTargetStore]);

  return (
    <div className="grid gap-6" data-main-page="true">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>محصولات</CardTitle>
            <CardDescription>
              محصولات خود را مدیریت کرده و عملکرد فروش آنها را مشاهده کنید.
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AiMultipleProductsDialog onProductsGenerated={handleProductsGenerated} />
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">خروجی</span>
            </Button>
            <Button size="sm" className="h-8 gap-1 bg-green-600 hover:bg-green-700 text-white dark:bg-white dark:text-black" onClick={handleAddClick}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">افزودن محصول</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={(v) => {setActiveTab(v); setCategoryFilter('all')}} className="w-full" dir="rtl">
            <TabsList className="h-auto bg-transparent p-0">
              <TabsTrigger value="all" asChild>
                <div className="relative group overflow-hidden rounded-lg cursor-pointer h-20 w-24 border-2 border-dashed data-[state=active]:border-solid data-[state=active]:border-primary data-[state=active]:ring-2 data-[state=active]:ring-primary">
                  <div className="flex flex-col gap-1 items-center justify-center h-full w-full bg-muted/50">
                    <Store className="h-6 w-6" />
                    <span className="text-xs">همه محصولات</span>
                  </div>
                </div>
              </TabsTrigger>
              {stores?.map((store) => (
                <TabsTrigger key={store.id} value={store.id} className="relative p-0 h-20 w-24 rounded-lg overflow-hidden border-2 border-transparent data-[state=active]:border-primary data-[state=active]:ring-2 data-[state=active]:ring-primary transition-all">
                  <Image
                    alt={store.name}
                    className="object-cover"
                    fill
                    src={store.logoUrl || '/placeholder.svg'}
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center p-2">
                    <span className="text-xs font-semibold text-white truncate w-full text-center">{store.name}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[240px]">
                <SelectValue placeholder="فیلتر بر اساس دسته‌بندی..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all" className="text-right">همه دسته‌بندی‌ها</SelectItem>
                 {categoryTree.length > 0 ? (
                    renderCategoryOptions(categoryTree)
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">هیچ دسته‌بندی برای این فروشگاه یافت نشد.</div>
                )}
            </SelectContent>
        </Select>
        <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-auto sm:min-w-[180px]">
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="مرتب‌سازی بر اساس..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest" className="text-right">جدیدترین</SelectItem>
            <SelectItem value="name" className="text-right">نام محصول</SelectItem>
            <SelectItem value="price" className="text-right">گران‌ترین</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        {selectedProducts.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedProducts.length.toLocaleString('fa-IR')} مورد انتخاب شده
            </span>
             <Dialog open={isBulkActionModalOpen} onOpenChange={setIsBulkActionModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Move className="ml-2 h-4 w-4" />
                        انتقال / کپی
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>انتقال یا کپی گروهی محصولات</DialogTitle>
                        <DialogDescription>
                            عملیات و مقصد مورد نظر را برای {selectedProducts.length.toLocaleString('fa-IR')} محصول انتخاب شده مشخص کنید.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <RadioGroup defaultValue="move" value={bulkAction} onValueChange={(v) => setBulkAction(v as BulkAction)}>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <RadioGroupItem value="move" id="r1" />
                                <Label htmlFor="r1">انتقال (Move)</Label>
                            </div>
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <RadioGroupItem value="copy" id="r2" />
                                <Label htmlFor="r2">کپی (Copy)</Label>
                            </div>
                        </RadioGroup>
                        <Separator />
                        <Select value={bulkTargetStore} onValueChange={setBulkTargetStore}>
                             <SelectTrigger><SelectValue placeholder="فروشگاه مقصد..." /></SelectTrigger>
                             <SelectContent>
                                {stores.map(store => <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>)}
                             </SelectContent>
                        </Select>
                        <Select value={bulkTargetCategory} onValueChange={setBulkTargetCategory} disabled={!bulkTargetStore}>
                             <SelectTrigger><SelectValue placeholder="دسته‌بندی مقصد..." /></SelectTrigger>
                             <SelectContent>
                                {bulkActionCategoryTree.length > 0 ? renderCategoryOptions(bulkActionCategoryTree) : <div className="p-4 text-center text-sm text-muted-foreground">دسته‌بندی‌ای یافت نشد.</div>}
                             </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkActionModalOpen(false)}>انصراف</Button>
                        <Button onClick={handleBulkAction} disabled={isProcessingBulk || !bulkTargetCategory || !bulkTargetStore}>
                            {isProcessingBulk && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            تایید
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isProcessingBulk}>
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    این عمل غیرقابل بازگشت است و {selectedProducts.length.toLocaleString('fa-IR')} محصول انتخاب شده را برای همیشه حذف می‌کند.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive hover:bg-destructive/90" disabled={isProcessingBulk}>
                    {isProcessingBulk && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    حذف
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={
                      selectedProducts.length > 0 &&
                      selectedProducts.length === sortedAndFilteredProducts.length
                    }
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    aria-label="انتخاب همه"
                  />
                </TableHead>
                <TableHead>نام</TableHead>
                <TableHead>زیردسته</TableHead>
                <TableHead className="hidden md:table-cell">توضیحات</TableHead>
                <TableHead className="text-left">قیمت</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsToShow.length > 0 ? (
                productsToShow.map((product) => (
                  <TableRow
                    key={product.id}
                    data-state={selectedProducts.includes(product.id) ? "selected" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                        aria-label="انتخاب محصول"
                      />
                    </TableCell>
                    <TableCell className="font-medium" onClick={() => handleEditClick(product)} style={{ cursor: 'pointer' }}>
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
                    <TableCell onClick={() => handleEditClick(product)} style={{ cursor: 'pointer' }}>
                      <Badge variant="outline">{getCategoryName(product.subCategoryId)}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-xs truncate" onClick={() => handleEditClick(product)} style={{ cursor: 'pointer' }}>{product.description}</TableCell>
                    <TableCell className="text-left" onClick={() => handleEditClick(product)} style={{ cursor: 'pointer' }}>{formatCurrency(product.price)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">هیچ محصولی یافت نشد.</TableCell>
                </TableRow>
              )}
              {productsToShow.length < sortedAndFilteredProducts.length && (
                <TableRow ref={sentinelRef}>
                  <TableCell colSpan={5} className="p-4 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            نمایش <strong>{productsToShow.length.toLocaleString('fa-IR')}</strong> از{' '}
            <strong>{sortedAndFilteredProducts.length.toLocaleString('fa-IR')}</strong> محصول
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
