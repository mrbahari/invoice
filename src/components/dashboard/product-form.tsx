
'use client';

import React, { useState, useEffect, ChangeEvent, useRef, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Product, Store, Category, UnitOfMeasurement } from '@/lib/definitions';
import { Upload, Trash2, ArrowRight, PlusCircle, Pencil, Save, GripVertical, X, Search, WandSparkles, LoaderCircle, Copy, ChevronsUpDown, Package, Check } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '../ui/separator';
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
import { useData } from '@/context/data-context';
import { generateProductDetails, type GenerateProductDetailsInput } from '@/ai/flows/generate-product-details';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { FloatingToolbar } from './floating-toolbar';
import { Badge } from '../ui/badge';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import { useUpload } from '@/hooks/use-upload';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';

type ProductFormProps = {
  product?: Product;
  onSave: () => void;
  onCancel: () => void;
};

type AIFeature = 'description' | 'price' | 'image';


export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const isEditMode = !!product;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, addDocument, updateDocument, deleteDocument } = useData();
  const { stores, categories, units: unitsOfMeasurement } = data;

  const [name, setName] = useState(product?.name || '');
  const [code, setCode] = useState(product?.code || '');
  const [description, setDescription] = useState(product?.description || '');
  
  const [price, setPrice] = useState<number | ''>(product?.price ?? '');
  const [subUnitPrice, setSubUnitPrice] = useState<number | ''>(product?.subUnitPrice ?? '');

  const [displayPrice, setDisplayPrice] = useState(formatNumber(product?.price));
  const [displaySubUnitPrice, setDisplaySubUnitPrice] = useState(formatNumber(product?.subUnitPrice));
  
  const [storeId, setStoreId] = useState(product?.storeId || '');
  const [subCategoryId, setSubCategoryId] = useState(product?.subCategoryId || '');
  const [unit, setUnit] = useState<string>(product?.unit || (unitsOfMeasurement[0]?.name || ''));
  const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl || null);
  
  const [subUnit, setSubUnit] = useState<string | undefined>(product?.subUnit);
  const [subUnitQuantity, setSubUnitQuantity] = useState<number | ''>(product?.subUnitQuantity ?? '');
  const [displaySubUnitQuantity, setDisplaySubUnitQuantity] = useState(formatNumber(product?.subUnitQuantity));

  const [isProcessing, setIsProcessing] = useState(false);
  const [aiLoading, setAiLoading] = useState({
    description: false,
    price: false,
    image: false,
  });
  
  const { uploadFile, progress, isUploading, error: uploadError } = useUpload();
  
  // Create a memoized category tree
  const categoryTree = useMemo(() => {
    if (!storeId || !categories) return [];
    
    const storeCategories = categories.filter(c => c.storeId === storeId);
    const categoryMap = new Map(storeCategories.map(c => [c.id, { ...c, children: [] as Category[] }]));
    const tree: (Category & { children: Category[] })[] = [];

    storeCategories.forEach(cat => {
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)?.children.push(categoryMap.get(cat.id)!);
      } else if (!cat.parentId) {
        tree.push(categoryMap.get(cat.id)!);
      }
    });

    return tree;
  }, [categories, storeId]);

  
  // Calculate sub-unit price from main price
  useEffect(() => {
    const mainPriceNum = Number(price);
    const subUnitQtyNum = Number(subUnitQuantity);

    if (mainPriceNum > 0 && subUnitQtyNum > 0 && subUnit) {
      const calculatedSubPrice = Math.round(mainPriceNum / subUnitQtyNum);
      setSubUnitPrice(calculatedSubPrice);
      setDisplaySubUnitPrice(formatNumber(calculatedSubPrice));
    } else if (!subUnit) {
       setSubUnitPrice('');
       setDisplaySubUnitPrice('');
    }
  }, [price, subUnitQuantity, subUnit]);

  // Calculate main price from sub-unit price
  useEffect(() => {
    // This effect should only run if the user changes the sub-unit price directly.
    /*
    const subPriceNum = Number(subUnitPrice);
    const subUnitQtyNum = Number(subUnitQuantity);

    if (subPriceNum > 0 && subUnitQtyNum > 0 && subUnit) {
        const calculatedMainPrice = Math.round(subPriceNum * subUnitQtyNum);
        if (calculatedMainPrice !== price) {
            setPrice(calculatedMainPrice);
            setDisplayPrice(formatNumber(calculatedMainPrice));
        }
    }
    */
  }, [subUnitPrice, subUnitQuantity, subUnit]);


  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseFormattedNumber(value);
    setPrice(numericValue);
    setDisplayPrice(formatNumber(numericValue));
  };

  const handleSubUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseFormattedNumber(value);
    setSubUnitPrice(numericValue);
    setDisplaySubUnitPrice(formatNumber(numericValue));

    // Also update main price when sub unit price changes
    const subUnitQtyNum = Number(subUnitQuantity);
    if (numericValue !== '' && subUnitQtyNum > 0 && subUnit) {
        const calculatedMainPrice = Math.round(numericValue * subUnitQtyNum);
        setPrice(calculatedMainPrice);
        setDisplayPrice(formatNumber(calculatedMainPrice));
    }
  };
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const numericValue = parseFormattedNumber(value);
      setSubUnitQuantity(numericValue);
      setDisplaySubUnitQuantity(formatNumber(numericValue));
  };
  
  const handleImageFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleAiGeneration = async (feature: AIFeature) => {
    if (!name) {
      // no toast
      return;
    }
     if (!storeId || !subCategoryId) {
      // no toast
      return;
    }

    setAiLoading(prev => ({ ...prev, [feature]: true }));
    
    const categoryName = categories.find(c => c.id === subCategoryId)?.name || '';

    try {
      const input = { productName: name, categoryName, feature } as GenerateProductDetailsInput;
      const result = await generateProductDetails(input);

      if (feature === 'description' && result.description) {
        setDescription(result.description);
      } else if (feature === 'price' && result.price !== undefined) {
        const roundedPrice = Math.round(result.price);
        setPrice(roundedPrice);
        setDisplayPrice(formatNumber(roundedPrice));
      } else if (feature === 'image' && result.imageUrl) {
        setImageUrl(result.imageUrl);
      }
      

    } catch (error) {
      console.error(`Error generating ${feature}:`, error);

    } finally {
      setAiLoading(prev => ({ ...prev, [feature]: false }));
    }
  };

  const handleImageSearch = () => {
    if (!name) {
      return;
    }
    const categoryName = categories.find(c => c.id === subCategoryId)?.name || '';
    const query = encodeURIComponent(`${name} ${categoryName}`);
    const url = `https://www.google.com/search?q=${query}&tbm=isch`;
    window.open(url, '_blank');
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const path = `images/product/${Date.now()}-${file.name}`;
      const downloadedUrl = await uploadFile(file, path);
      if (downloadedUrl) {
          setImageUrl(downloadedUrl);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };


  const validateForm = () => {
    const numericPrice = Number(price);

    if (!name || isNaN(numericPrice) || numericPrice <= 0 || !storeId || !subCategoryId) {
      return false;
    }
    return true;
  }

  const buildProductData = (): Omit<Product, 'id'> => {
    const numericPrice = Number(price);
    const numericSubUnitPrice = Number(subUnitPrice);
    const numericSubUnitQuantity = Number(subUnitQuantity);
    const finalImage = imageUrl || `https://picsum.photos/seed/${name}${subCategoryId}/400/300`;

    return {
      name,
      code,
      description,
      price: numericPrice,
      storeId,
      subCategoryId,
      unit,
      subUnit: subUnit || undefined,
      subUnitQuantity: isNaN(numericSubUnitQuantity) ? undefined : numericSubUnitQuantity,
      subUnitPrice: isNaN(numericSubUnitPrice) ? undefined : numericSubUnitPrice,
      imageUrl: finalImage,
    };
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);
    const productData = buildProductData();
    
    if (isEditMode && product) {
      await updateDocument('products', product.id, productData);
    } else {
      await addDocument('products', productData);
    }

    setIsProcessing(false);
    onSave();
  };
  
  const handleSaveAsCopy = async () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);
    const productData = buildProductData();
    await addDocument('products', productData);
    
    setIsProcessing(false);
    onSave();
  }
  
  const handleDelete = async () => {
    if (!product) return;
    
    setIsProcessing(true);
    await deleteDocument('products', product.id);

    setIsProcessing(false);
    onSave();
  };


  const showSubUnitFields = !!subUnit && subUnit !== 'none';
  
  const renderCategoryOptions = (nodes: (Category & { children: Category[] })[]) => {
    return nodes.map(node => (
      <SelectGroup key={node.id}>
        <SelectLabel className="font-bold text-foreground">{node.name}</SelectLabel>
        {node.children.map(child => (
          <SelectItem key={child.id} value={child.id} className="pr-6">
            {child.name}
          </SelectItem>
        ))}
      </SelectGroup>
    ));
  };

  return (
    <TooltipProvider>
    <form onSubmit={handleSubmit}>
       <FloatingToolbar pageKey="product-form">
          <div className="flex flex-col items-center gap-1">
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={onCancel}
                        className="text-muted-foreground w-8 h-8"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left"><p>بازگشت به لیست</p></TooltipContent>
              </Tooltip>
              {isEditMode && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  disabled={isProcessing} 
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive w-8 h-8"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left"><p>حذف محصول</p></TooltipContent>
                        </Tooltip>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle><AlertDialogDescription>این عمل غیرقابل بازگشت است و محصول «{product?.name}» را برای همیشه حذف می‌کند.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className='bg-destructive hover:bg-destructive/90'>حذف</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              )}
              {isEditMode && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={handleSaveAsCopy} disabled={isProcessing} className="w-8 h-8">
                        <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left"><p>ذخیره با عنوان جدید</p></TooltipContent>
                </Tooltip>
              )}
          </div>
          <Separator orientation="horizontal" className="w-6" />
          <div className="flex flex-col items-center gap-1">
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button 
                        type="submit" 
                        disabled={isProcessing || isUploading}
                        variant="ghost" 
                        size="icon"
                        className="w-10 h-10 bg-green-600 text-white hover:bg-green-700"
                      >
                          <Save className="h-5 w-5" />
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left"><p>{isEditMode ? 'ذخیره تغییرات' : 'ایجاد محصول'}</p></TooltipContent>
              </Tooltip>
          </div>
      </FloatingToolbar>
        <div className="mx-auto grid max-w-6xl flex-1 auto-rows-max gap-4 pb-28">
             <div className="flex items-center gap-4">
                <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                    {isEditMode ? `ویرایش محصول: ${product?.name}` : 'افزودن محصول جدید'}
                </h1>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
                <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>جزئیات محصول</CardTitle>
                            <CardDescription>اطلاعات اصلی محصول، دسته‌بندی و توضیحات.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6">
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="product-name" className="text-right">نام محصول</Label>
                                    <Input id="product-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: لپتاپ پرو" required className="col-span-2" />
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="product-code" className="text-right">کد کالا</Label>
                                    <Input id="product-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="اختیاری" className="col-span-2" />
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                     <Label htmlFor="store" className="text-right">فروشگاه</Label>
                                     <div className="col-span-2">
                                        <Select value={storeId} onValueChange={(val) => { setStoreId(val); setSubCategoryId(''); }} required>
                                            <SelectTrigger id="store"><SelectValue placeholder="انتخاب فروشگاه" /></SelectTrigger>
                                            <SelectContent>
                                                {stores?.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                     </div>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="sub-category" className="text-right">زیردسته</Label>
                                    <div className="col-span-2">
                                        <Select value={subCategoryId} onValueChange={setSubCategoryId} required disabled={!storeId}>
                                            <SelectTrigger id="sub-category"><SelectValue placeholder={storeId ? "انتخاب زیردسته" : "ابتدا فروشگاه را انتخاب کنید"} /></SelectTrigger>
                                            <SelectContent>
                                                {categoryTree.length > 0 ? (
                                                renderCategoryOptions(categoryTree)
                                                ) : (
                                                <div className="p-4 text-center text-sm text-muted-foreground">هیچ دسته‌بندی برای این فروشگاه یافت نشد.</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    <div className="flex items-center justify-between">
                                      <Label htmlFor="description">توضیحات</Label>
                                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAiGeneration('description')} disabled={aiLoading.description}>
                                          {aiLoading.description ? <LoaderCircle className="animate-spin" /> : <WandSparkles />}
                                      </Button>
                                    </div>
                                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="توضیحات محصول را اینجا بنویسید یا با هوش مصنوعی تولید کنید..." className="min-h-32" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>واحدها و قیمت‌گذاری</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6">
                               <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="unit" className="text-right">واحد اصلی</Label>
                                    <div className="col-span-2">
                                        <Select value={unit} onValueChange={(value: string) => setUnit(value)} required>
                                            <SelectTrigger id="unit"><SelectValue placeholder="واحد" /></SelectTrigger>
                                            <SelectContent>
                                                {unitsOfMeasurement.map((u) => (<SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                               <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="sub-unit" className="text-right">واحد فرعی</Label>
                                    <div className="col-span-2">
                                        <Select value={subUnit || 'none'} onValueChange={(value: string) => { if (value === 'none') { setSubUnit(undefined); setSubUnitQuantity(''); } else { setSubUnit(value); } }}>
                                            <SelectTrigger id="sub-unit"><SelectValue placeholder="اختیاری" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem key="none" value="none">هیچکدام</SelectItem>
                                                {unitsOfMeasurement.map((u) => (<SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="sub-unit-quantity" className="text-right">مقدار تبدیل</Label>
                                    <Input id="sub-unit-quantity" type="text" value={displaySubUnitQuantity} onChange={handleQuantityChange} placeholder="تعداد" disabled={!showSubUnitFields} className="col-span-2 font-mono" />
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="price" className="text-right">
                                        قیمت اصلی (ریال)
                                    </Label>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <Input id="price" value={displayPrice} onChange={handlePriceChange} required className="flex-1 font-mono" />
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAiGeneration('price')} disabled={aiLoading.price}>
                                            {aiLoading.price ? <LoaderCircle className="animate-spin" /> : <WandSparkles />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="sub-unit-price" className="text-right">قیمت فرعی (ریال)</Label>
                                    <Input id="sub-unit-price" value={displaySubUnitPrice} onChange={handleSubUnitPriceChange} placeholder={showSubUnitFields ? 'محاسبه خودکار' : 'ابتدا واحد فرعی را انتخاب کنید'} disabled={!showSubUnitFields} className="col-span-2 font-mono" />
                                </div>
                            </div>
                            {showSubUnitFields && subUnitQuantity && price && (
                                <p className="text-xs text-muted-foreground mt-4">
                                    هر {formatNumber(subUnitQuantity)} {subUnit} معادل یک {unit} با قیمت {displayPrice} ریال است. قیمت هر {subUnit} تقریباً {displaySubUnitPrice} ریال محاسبه می‌شود.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>تصویر محصول</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-2">
                                <div className="relative aspect-video w-full rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                                    {isUploading && <Progress value={progress} className="absolute top-0 left-0 w-full h-1" />}
                                    {imageUrl ? (
                                        <Image src={imageUrl} alt={name || "Product Image"} fill className="object-cover" key={imageUrl} />
                                    ) : (
                                        <span className="text-sm text-muted-foreground">پیش‌نمایش تصویر</span>
                                    )}
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="image-url">آدرس تصویر</Label>
                                    <Input id="image-url" value={imageUrl || ''} onFocus={handleImageFocus} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button type="button" variant="outline" className="w-full" onClick={handleUploadClick} disabled={isUploading}>
                                        <Upload className="ml-2 h-4 w-4" />
                                        آپلود
                                    </Button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                    <Button type="button" variant="outline" className="w-full" onClick={() => handleAiGeneration('image')} disabled={aiLoading.image}>
                                        {aiLoading.image ? <LoaderCircle className="animate-spin" /> : <WandSparkles className="ml-2 h-4 w-4" />}
                                        تولید
                                    </Button>
                                    <Button type="button" variant="outline" className="w-full" onClick={handleImageSearch}>
                                        <Search className="ml-2 h-4 w-4" />
                                        جستجو
                                    </Button>
                                </div>
                                {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </form>
    </TooltipProvider>
  );
}

    