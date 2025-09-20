
'use client';

import { useState, useEffect, ChangeEvent } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import type { Product, Store, Category, UnitOfMeasurement } from '@/lib/definitions';
import { Search, WandSparkles, LoaderCircle, Trash2, Copy, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateProductDetails } from '@/ai/flows/generate-product-details';
import type { GenerateProductDetailsInput } from '@/ai/flows/generate-product-details';
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


type ProductFormProps = {
  product?: Product;
  onSave: () => void;
  onCancel: () => void;
};

type AIFeature = 'description' | 'price' | 'image';

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const { toast } = useToast();
  const isEditMode = !!product;

  const { data, setData } = useData();
  const { products, stores, categories, units: unitsOfMeasurement } = data;

  const [name, setName] = useState(product?.name || '');
  const [code, setCode] = useState(product?.code || '');
  const [description, setDescription] = useState(product?.description || '');
  
  const [price, setPrice] = useState<number | ''>(product?.price ?? '');
  const [subUnitPrice, setSubUnitPrice] = useState<number | ''>(product?.subUnitPrice ?? '');

  const [displayPrice, setDisplayPrice] = useState(product?.price ? new Intl.NumberFormat('fa-IR').format(product.price) : '');
  const [displaySubUnitPrice, setDisplaySubUnitPrice] = useState(product?.subUnitPrice ? new Intl.NumberFormat('fa-IR').format(product.subUnitPrice) : '');
  
  const [storeId, setStoreId] = useState(product?.storeId || '');
  const [subCategoryId, setSubCategoryId] = useState(product?.subCategoryId || '');
  const [unit, setUnit] = useState<string>(product?.unit || (unitsOfMeasurement[0]?.name || ''));
  const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl || null);
  
  const [subUnit, setSubUnit] = useState<string | undefined>(product?.subUnit);
  const [subUnitQuantity, setSubUnitQuantity] = useState<number | ''>(product?.subUnitQuantity ?? '');

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [aiLoading, setAiLoading] = useState<Record<AIFeature, boolean>>({
    description: false,
    price: false,
    image: false,
  });
  
  
    useEffect(() => {
        if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, []);

    // Effect to track form changes
  useEffect(() => {
    if (!isEditMode) {
        // For new products, any input makes it dirty
        if (name || code || description || price || storeId || subCategoryId || imageUrl) {
            setIsDirty(true);
        }
        return;
    }
    if (!product) return;

    const priceNum = Number(price);
    const subUnitPriceNum = Number(subUnitPrice);
    const subUnitQuantityNum = Number(subUnitQuantity);
    
    // Compare current state with initial product state
    const fieldsChanged =
      name !== product.name ||
      code !== product.code ||
      description !== product.description ||
      priceNum !== product.price ||
      storeId !== product.storeId ||
      subCategoryId !== product.subCategoryId ||
      unit !== product.unit ||
      subUnit !== (product.subUnit || undefined) ||
      subUnitQuantityNum !== (product.subUnitQuantity || '') ||
      subUnitPriceNum !== (product.subUnitPrice || '') ||
      imageUrl !== product.imageUrl;

    setIsDirty(fieldsChanged);
  }, [name, code, description, price, storeId, subCategoryId, unit, subUnit, subUnitQuantity, subUnitPrice, imageUrl, product, isEditMode]);


  const availableSubCategories = categories.filter(c => c.storeId === storeId && c.parentId);
  
  const formatNumber = (num: number | ''): string => {
    if (num === '' || num === null || isNaN(Number(num))) return '';
    return new Intl.NumberFormat('fa-IR').format(Number(num));
  };
  
  const parseFormattedNumber = (str: string): number | '' => {
    if (!str) return '';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const englishDigits = '0123456789';
    let numericString = str;
    for (let i = 0; i < 10; i++) {
        numericString = numericString.replace(new RegExp(persianDigits[i], 'g'), englishDigits[i]);
    }
    numericString = numericString.replace(/[^0-9]/g, '');
    const number = parseInt(numericString, 10);
    return isNaN(number) ? '' : number;
  };
  
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
    // It is commented out to prevent loops but can be re-enabled with guards.
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
      const num = parseFloat(value);
      setSubUnitQuantity(isNaN(num) ? '' : num);
  };
  
  const handleImageFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleAiGeneration = async (feature: AIFeature) => {
    if (!name) {
      toast({
        variant: 'destructive',
        title: 'نام محصول خالی است',
        description: 'برای استفاده از هوش مصنوعی، ابتدا نام محصول را وارد کنید.',
      });
      return;
    }
     if (!storeId || !subCategoryId) {
      toast({
        variant: 'destructive',
        title: 'فروشگاه یا زیردسته انتخاب نشده',
        description: 'برای دریافت نتیجه بهتر، ابتدا فروشگاه و زیردسته محصول را انتخاب کنید.',
      });
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
      
      toast({
        variant: 'success',
        title: 'هوش مصنوعی انجام شد',
        description: `فیلد ${feature === 'description' ? 'توضیحات' : feature === 'price' ? 'قیمت' : 'تصویر'} با موفقیت تولید شد.`
      })

    } catch (error) {
      console.error(`Error generating ${feature}:`, error);
      toast({
        variant: 'destructive',
        title: 'خطا در تولید با هوش مصنوعی',
        description: 'متاسفانه در ارتباط با سرویس هوش مصنوعی مشکلی پیش آمد.',
      });
    } finally {
      setAiLoading(prev => ({ ...prev, [feature]: false }));
    }
  };

  const handleImageSearch = () => {
    if (!name) {
      toast({
        variant: 'destructive',
        title: 'نام محصول خالی است',
        description: 'برای جستجوی تصویر، ابتدا نام محصول را وارد کنید.',
      });
      return;
    }
    const categoryName = categories.find(c => c.id === subCategoryId)?.name || '';
    const query = encodeURIComponent(`${name} ${categoryName}`);
    const url = `https://www.google.com/search?q=${query}&tbm=isch`;
    window.open(url, '_blank');
  };

  const validateForm = () => {
    const numericPrice = Number(price);

    if (!name || isNaN(numericPrice) || numericPrice <= 0 || !storeId || !subCategoryId) {
      toast({
        variant: 'destructive',
        title: 'فیلدهای الزامی خالی یا نامعتبر است',
        description: 'لطفاً نام، قیمت معتبر، فروشگاه و زیردسته محصول را وارد کنید.',
      });
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
      toast({
        variant: 'success',
        title: 'محصول با موفقیت ویرایش شد',
        description: `تغییرات برای محصول "${name}" ذخیره شد.`,
      });
    } else {
      const newProduct = buildProductData(`prod-${Math.random().toString(36).substr(2, 9)}`);
      setData(prev => ({...prev, products: [newProduct, ...prev.products]}));
      toast({
        variant: 'success',
        title: 'محصول جدید ایجاد شد',
        description: `محصول "${name}" با موفقیت ایجاد شد.`,
      });
    }

    setIsProcessing(false);
    onSave();
  };
  
  const handleSaveAsCopy = () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);

    const newProduct = buildProductData(`prod-${Math.random().toString(36).substr(2, 9)}`);
    setData(prev => ({...prev, products: [newProduct, ...prev.products]}));
    toast({
      variant: 'success',
      title: 'محصول جدید از روی کپی ایجاد شد',
      description: `محصول جدید "${name}" با موفقیت ایجاد شد.`,
    });
    
    setIsProcessing(false);
    onSave();
  }
  
  const handleDelete = () => {
    if (!product) return;
    
    setIsProcessing(true);
    setData(prev => ({...prev, products: prev.products.filter(p => p.id !== product.id)}));
    toast({
        title: 'محصول حذف شد',
        description: `محصول "${product.name}" با موفقیت حذف شد.`,
    });

    setIsProcessing(false);
    onSave();
  };


  const showSubUnitFields = !!subUnit && subUnit !== 'none';

  return (
    <form onSubmit={handleSubmit}>
        <div className="mx-auto grid max-w-5xl animate-fade-in-up grid-cols-1 gap-6 lg:grid-cols-3">
            
            <div className="grid gap-6 lg:col-span-2 auto-rows-min">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{isEditMode ? `ویرایش محصول` : 'افزودن محصول جدید'}</CardTitle>
                            <CardDescription>{isEditMode ? `ویرایش جزئیات محصول "${product?.name}"` : 'اطلاعات محصول را وارد کنید.'}</CardDescription>
                        </div>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={onCancel}
                          className="dark:bg-white dark:text-black dark:animate-pulse-slow"
                        >
                            <ArrowRight className="ml-2 h-4 w-4" />
                            بازگشت به لیست
                        </Button>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="grid gap-3 md:col-span-2">
                                <Label htmlFor="product-name">نام محصول</Label>
                                <Input
                                    id="product-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="مثال: لپتاپ پرو"
                                    required
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="product-code">کد کالا</Label>
                                <Input
                                    id="product-code"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="اختیاری"
                                />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="grid gap-3">
                                <Label htmlFor="store">فروشگاه</Label>
                                <Select value={storeId} onValueChange={(val) => { setStoreId(val); setSubCategoryId(''); }} required>
                                    <SelectTrigger id="store">
                                        <SelectValue placeholder="انتخاب فروشگاه" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {stores.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid gap-3">
                                <Label htmlFor="sub-category">زیردسته</Label>
                                <Select value={subCategoryId} onValueChange={setSubCategoryId} required disabled={!storeId}>
                                    <SelectTrigger id="sub-category">
                                        <SelectValue placeholder={storeId ? "انتخاب زیردسته" : "ابتدا فروشگاه را انتخاب کنید"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSubCategories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
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
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="توضیحات محصول را اینجا بنویسید یا با هوش مصنوعی تولید کنید..."
                                className="min-h-32"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>واحدها و قیمت‌گذاری</CardTitle>
                    </CardHeader>
                     <CardContent className="grid gap-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="grid gap-3">
                                <Label htmlFor="unit">واحد اصلی</Label>
                                <Select value={unit} onValueChange={(value: string) => setUnit(value)} required>
                                    <SelectTrigger id="unit">
                                        <SelectValue placeholder="واحد" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {unitsOfMeasurement.map((u) => (
                                        <SelectItem key={u.name} value={u.name}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="sub-unit">واحد فرعی</Label>
                                <Select value={subUnit || 'none'} onValueChange={(value: string) => { if (value === 'none') { setSubUnit(undefined); setSubUnitQuantity(''); } else { setSubUnit(value); } }}>
                                    <SelectTrigger id="sub-unit">
                                        <SelectValue placeholder="اختیاری" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem key="none" value="none">هیچکدام</SelectItem>
                                        {unitsOfMeasurement.map((u) => (
                                        <SelectItem key={u.name} value={u.name}>{u.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="sub-unit-quantity">مقدار تبدیل</Label>
                                <Input id="sub-unit-quantity" type="number" value={subUnitQuantity} onChange={handleQuantityChange} placeholder="تعداد" disabled={!showSubUnitFields} step="0.01" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                           <div className="grid gap-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="price">قیمت واحد اصلی (ریال)</Label>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAiGeneration('price')} disabled={aiLoading.price}>
                                        {aiLoading.price ? <LoaderCircle className="animate-spin" /> : <WandSparkles />}
                                    </Button>
                                </div>
                                <Input 
                                  id="price" 
                                  value={displayPrice} 
                                  onChange={handlePriceChange} 
                                  required 
                                />
                            </div>
                            
                            <div className="grid gap-3">
                                <Label htmlFor="sub-unit-price">قیمت واحد فرعی (ریال)</Label>
                                <Input 
                                  id="sub-unit-price" 
                                  value={displaySubUnitPrice} 
                                  onChange={handleSubUnitPriceChange}
                                  disabled={!showSubUnitFields} 
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-6 auto-rows-min">
                <Card>
                    <CardHeader>
                        <CardTitle>تصویر محصول</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="relative w-full aspect-video">
                            {imageUrl ? (
                            <Image src={imageUrl} alt="پیش‌نمایش تصویر" fill={true} style={{objectFit: 'contain'}} className="rounded-md border bg-muted/30 p-2" onError={() => { toast({ variant: 'destructive', title: 'خطا در بارگذاری تصویر', description: 'آدرس تصویر معتبر نیست یا دسترسی به آن ممکن نیست.'}); setImageUrl(null); }} unoptimized />
                            ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed bg-muted">
                                <span className="text-xs text-muted-foreground">پیش‌نمایش تصویر</span>
                            </div>
                            )}
                        </div>
                        <div className="relative grid gap-3">
                            <Label htmlFor="image-url">URL تصویر</Label>
                            <Input id="image-url" value={imageUrl || ''} onChange={(e) => setImageUrl(e.target.value)} onFocus={handleImageFocus} placeholder="URL تصویر یا تولید با AI..." />
                             {imageUrl && (
                               <Button
                                 type="button"
                                 variant="ghost"
                                 size="icon"
                                 className="absolute bottom-1 left-1 h-7 w-7 text-muted-foreground"
                                 onClick={() => setImageUrl(null)}
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => handleAiGeneration('image')} disabled={aiLoading.image}>
                                {aiLoading.image ? <LoaderCircle className="animate-spin h-4 w-4" /> : <WandSparkles className="h-4 w-4" />}
                                <span className="mr-2">تولید با AI</span>
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleImageSearch}>
                                <Search className="h-4 w-4" />
                                <span className="mr-2">جستجو در وب</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {isDirty && (
                <div className="sticky bottom-0 z-10 p-4 bg-background/80 backdrop-blur-sm border-t lg:col-span-3">
                    <div className="max-w-5xl mx-auto flex flex-col-reverse sm:flex-row justify-between items-center gap-2">
                        <div>
                             {isEditMode && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" variant="destructive" disabled={isProcessing}>
                                            <Trash2 className="ml-2 h-4 w-4" />
                                            حذف محصول
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            این عمل غیرقابل بازگشت است و محصول «{product?.name}» را برای همیشه حذف می‌کند.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className='bg-destructive hover:bg-destructive/90'>حذف</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                        <div className='flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto'>
                            {isEditMode && (
                                <Button type="button" variant="outline" size="lg" onClick={handleSaveAsCopy} disabled={isProcessing}>
                                   <Copy className="ml-2 h-4 w-4" />
                                    ذخیره با عنوان محصول جدید
                                </Button>
                            )}
                            <Button type="submit" disabled={isProcessing} size="lg" className="w-full">
                                {isProcessing
                                ? isEditMode ? 'در حال ذخیره...' : 'در حال ایجاد...'
                                : isEditMode ? 'ذخیره تغییرات محصول' : 'ایجاد محصول جدید'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </form>
  );
}
