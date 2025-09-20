
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
import { Upload, Trash2, ArrowRight, PlusCircle, Pencil, Save } from 'lucide-react';
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
import { Search } from 'lucide-react';
import { generateProductDetails, type GenerateProductDetailsInput } from '@/ai/flows/generate-product-details';


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
  const [aiLoading, setAiLoading] = useState({
    description: false,
    price: false,
    image: false,
  });
  
    useEffect(() => {
        if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, []);

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
        <div className="flex items-center gap-4 sticky top-16 md:top-20 bg-background/80 backdrop-blur-sm z-10 py-4 mb-6 -mx-4 px-4 md:-mx-6 md:px-6 border-b">
            <div className="flex-1">
                <h1 className="text-xl font-semibold tracking-tight">
                    {isEditMode ? `ویرایش محصول: ${product?.name}` : 'افزودن محصول جدید'}
                </h1>
            </div>
            <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    بازگشت به لیست
                </Button>
                <Button type="submit" disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                    <Save className="ml-2 h-4 w-4" />
                    {isProcessing ? 'در حال ذخیره...' : isEditMode ? 'ذخیره تغییرات' : 'ایجاد محصول'}
                </Button>
            </div>
        </div>
        <div className="mx-auto grid max-w-6xl flex-1 auto-rows-max gap-4 animate-fade-in-up">
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
                                    <Input id="sub-unit-quantity" type="number" value={subUnitQuantity} onChange={handleQuantityChange} placeholder="تعداد" disabled={!showSubUnitFields} step="0.01" className="col-span-2" />
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="price" className="text-right">
                                        قیمت اصلی (ریال)
                                    </Label>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <Input id="price" value={displayPrice} onChange={handlePriceChange} required className="flex-1" />
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleAiGeneration('price')} disabled={aiLoading.price}>
                                            {aiLoading.price ? <LoaderCircle className="animate-spin" /> : <WandSparkles />}
                                        </Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor="sub-unit-price" className="text-right">قیمت فرعی (ریال)</Label>
                                    <Input id="sub-unit-price" value={displaySubUnitPrice} onChange={handleSubUnitPriceChange} placeholder={showSubUnitFields ? 'محاسبه خودکار' : 'ابتدا واحد فرعی را انتخاب کنید'} disabled={!showSubUnitFields} className="col-span-2" />
                                </div>
                            </div>
                            {showSubUnitFields && subUnitQuantity && price && (
                                <p className="text-xs text-muted-foreground mt-4">
                                    هر {subUnitQuantity} {subUnit} معادل یک {unit} با قیمت {displayPrice} ریال است. قیمت هر {subUnit} تقریباً {displaySubUnitPrice} ریال محاسبه می‌شود.
                                </p>
                            )}
                        </CardContent>
                        <CardFooter className="border-t pt-6 flex flex-col sm:flex-row-reverse justify-between gap-4">
                            <div className="w-full sm:w-auto flex-1 sm:flex-initial">
                                {isEditMode && (
                                    <Button type="button" variant="outline" onClick={handleSaveAsCopy} disabled={isProcessing} className="w-full">
                                        <Copy className="ml-2 h-4 w-4" />
                                        ذخیره با عنوان جدید
                                    </Button>
                                )}
                            </div>
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
                                                این عمل غیرقابل بازگشت است و محصول «{product.name}» را برای همیشه حذف می‌کند.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="grid grid-cols-2 gap-2">
                                            <AlertDialogCancel>انصراف</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} className='bg-destructive hover:bg-destructive/90'>حذف</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </CardFooter>
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
                                </div>
                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" className="w-full" onClick={() => handleAiGeneration('image')} disabled={aiLoading.image}>
                                        {aiLoading.image ? <LoaderCircle className="animate-spin" /> : <WandSparkles className="ml-2 h-4 w-4" />}
                                        تولید با AI
                                    </Button>
                                    <Button type="button" variant="outline" className="w-full" onClick={handleImageSearch}>
                                        <Search className="ml-2 h-4 w-4" />
                                        جستجو در گوگل
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </form>
  );
}
