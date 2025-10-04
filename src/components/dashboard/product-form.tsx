
'use client';

import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
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
import { Upload, Trash2, ArrowRight, PlusCircle, Pencil, Save, GripVertical, X, Search } from 'lucide-react';
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
import { WandSparkles, LoaderCircle, Copy } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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


type ProductFormProps = {
  product?: Product;
  onSave: () => void;
  onCancel: () => void;
};

type AIFeature = 'description' | 'price' | 'image';


export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const isEditMode = !!product;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, setData } = useData();
  const { products, stores, categories, units: unitsOfMeasurement } = data;

  const [name, setName] = useState(product?.name || '');
  const [code, setCode] = useState(product?.code || '');
  const [description, setDescription] = useState(product?.description || '');
  
  const [price, setPrice] = useState<number | ''>(product?.price ?? '');
  const [subUnitPrice, setSubUnitPrice] = useState<number | ''>(product?.subUnitPrice ?? '');

  const [displayPrice, setDisplayPrice] = useState(product?.price ? formatNumber(product.price) : '');
  const [displaySubUnitPrice, setDisplaySubUnitPrice] = useState(product?.subUnitPrice ? formatNumber(product.subUnitPrice) : '');
  
  const [storeId, setStoreId] = useState(product?.storeId || '');
  const [subCategoryId, setSubCategoryId] = useState(product?.subCategoryId || '');
  const [unit, setUnit] = useState<string>(product?.unit || (unitsOfMeasurement[0]?.name || ''));
  const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl || null);
  
  const [subUnit, setSubUnit] = useState<string | undefined>(product?.subUnit);
  const [subUnitQuantity, setSubUnitQuantity] = useState<number | ''>(product?.subUnitQuantity ?? '');
  const [displaySubUnitQuantity, setDisplaySubUnitQuantity] = useState(product?.subUnitQuantity ? formatNumber(product.subUnitQuantity) : '');

  const [isProcessing, setIsProcessing] = useState(false);
  const [aiLoading, setAiLoading] = useState({
    description: false,
    price: false,
    image: false,
  });
  
  const availableSubCategories = categories ? categories.filter(c => c.storeId === storeId && c.parentId) : [];
  
  const [newUnitName, setNewUnitName] = useState('');
  const isDuplicate = newUnitName.trim() !== '' && unitsOfMeasurement.some(u => u.name === newUnitName.trim());
  
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
    setDisplayPrice(value === '' ? '' : formatNumber(numericValue));
  };

  const handleSubUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseFormattedNumber(value);
    setSubUnitPrice(numericValue);
    setDisplaySubUnitPrice(value === '' ? '' : formatNumber(numericValue));

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
      setDisplaySubUnitQuantity(value === '' ? '' : formatNumber(numericValue));
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

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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

  const buildProductData = (id: string): Product => {
    const numericPrice = Number(price);
    const numericSubUnitPrice = Number(subUnitPrice);
    const numericSubUnitQuantity = Number(subUnitQuantity);
    const finalImage = imageUrl || `https://picsum.photos/seed/${name}${subCategoryId}/400/300`;

    return {
      id,
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);
    
    if (isEditMode && product) {
      const updatedProduct = buildProductData(product.id);
      setData(prev => ({...prev, products: prev.products.map(p => p.id === product.id ? updatedProduct : p)}));
    } else {
      const newProduct = buildProductData(`prod-${Math.random().toString(36).substr(2, 9)}`);
      setData(prev => ({...prev, products: [newProduct, ...prev.products]}));
    }

    setIsProcessing(false);
    onSave();
  };
  
  const handleSaveAsCopy = () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);

    const newProduct = buildProductData(`prod-${Math.random().toString(36).substr(2, 9)}`);
    setData(prev => ({...prev, products: [newProduct, ...prev.products]}));
    
    setIsProcessing(false);
    onSave();
  }
  
  const handleDelete = () => {
    if (!product) return;
    
    setIsProcessing(true);
    setData(prev => ({...prev, products: prev.products.filter(p => p.id !== product.id)}));

    setIsProcessing(false);
    onSave();
  };

  const handleAddUnit = () => {
    const name = newUnitName.trim();
    if (name === '' || isDuplicate) {
        return;
    }
    setData({...data, units: [...unitsOfMeasurement, { name, defaultQuantity: 1 }]});
    setNewUnitName('');
  };

  const handleUnitKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddUnit();
    }
  };

  const handleDeleteUnit = (unitNameToDelete: string) => {
    setData({...data, units: unitsOfMeasurement.filter(u => u.name !== unitNameToDelete)});
  };

  const showSubUnitFields = !!subUnit && subUnit !== 'none';

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
                        <AlertDialogHeader><AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle><AlertDialogDescription>این عمل غیرقابل بازگشت است و محصول «{product.name}» را برای همیشه حذف می‌کند.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter className="grid grid-cols-2 gap-2">
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
                        disabled={isProcessing}
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
                                                {availableSubCategories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
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
                                                {unitsOfMeasurement.map((u) => (<SelectItem key={u.name} value={u.name}>{u.name}</SelectItem>))}
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
                                                {unitsOfMeasurement.map((u) => (<SelectItem key={u.name} value={u.name}>{u.name}</SelectItem>))}
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
                                    {imageUrl ? (
                                        <Image src={imageUrl} alt={name || "Product Image"} fill className="object-cover" key={imageUrl} />
                                    ) : (
                                        <span className="text-sm text-muted-foreground">پیش‌نمایش تصویر</span>
                                    )}
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="image-url">آدرس تصویر</Label>
                                    <Input id="image-url" value={imageUrl || ''} onFocus={handleImageFocus} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
                                     <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2">
                                    <Button type="button" variant="outline" className="w-full" onClick={() => handleAiGeneration('image')} disabled={aiLoading.image}>
                                        {aiLoading.image ? <LoaderCircle className="animate-spin" /> : <WandSparkles className="ml-2 h-4 w-4" />}
                                        تولید با AI
                                    </Button>
                                    <Button type="button" variant="outline" className="w-full" onClick={handleUploadClick}>
                                        <Upload className="ml-2 h-4 w-4" />
                                        آپلود
                                    </Button>
                                    
                                </div>
                                 <Button type="button" variant="outline" className="w-full" onClick={handleImageSearch}>
                                        <Search className="ml-2 h-4 w-4" />
                                        جستجو در گوگل
                                    </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>مدیریت واحدها</CardTitle>
                            <CardDescription>
                                واحدهای اندازه‌گیری جدید اضافه کنید.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-1.5 mb-4">
                              <Label htmlFor="new-unit-name">نام واحد جدید</Label>
                              <div className="flex items-center gap-2">
                                   <Input
                                      id="new-unit-name"
                                      placeholder="مثال: کارتن"
                                      value={newUnitName}
                                      onChange={(e) => setNewUnitName(e.target.value)}
                                      onKeyDown={handleUnitKeyDown}
                                  />
                                  <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={handleAddUnit}
                                      disabled={newUnitName.trim() === '' || isDuplicate}
                                  >
                                      <PlusCircle className="h-4 w-4" />
                                  </Button>
                              </div>
                               {isDuplicate && <p className="text-xs text-destructive">این واحد قبلاً اضافه شده است.</p>}
                          </div>
                        <div className="flex flex-wrap gap-2 rounded-lg border p-4 min-h-[6rem]">
                            {unitsOfMeasurement.length > 0 ? unitsOfMeasurement.map(unit => (
                                <Badge key={unit.name} variant="secondary" className="text-base font-normal pl-2 pr-3 py-1">
                                    <span>{unit.name}</span>
                                    <button onClick={() => handleDeleteUnit(unit.name)} className="mr-2 rounded-full p-0.5 hover:bg-destructive/20 text-destructive">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )) : <p className="text-sm text-muted-foreground">هیچ واحدی تعریف نشده است.</p>}
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
