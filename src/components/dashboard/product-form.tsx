
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import type { Product, Category, UnitOfMeasurement } from '@/lib/definitions';
import { initialProducts, initialUnitsOfMeasurement } from '@/lib/data';
import { Search, WandSparkles, LoaderCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateProductDetails } from '@/ai/flows/generate-product-details';
import type { GenerateProductDetailsInput } from '@/ai/flows/generate-product-details';

type ProductFormProps = {
  product?: Product;
  categories: Category[];
};

type AIFeature = 'description' | 'price' | 'image';

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditMode = !!product;

  const [products, setProducts] = useLocalStorage<Product[]>('products', initialProducts);
  const [unitsOfMeasurement] = useLocalStorage<UnitOfMeasurement[]>('units', initialUnitsOfMeasurement);

  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  
  const [price, setPrice] = useState<number | ''>(product?.price ?? '');
  const [subUnitPrice, setSubUnitPrice] = useState<number | ''>(product?.subUnitPrice ?? '');

  const [displayPrice, setDisplayPrice] = useState(product?.price ? new Intl.NumberFormat('fa-IR').format(product.price) : '');
  const [displaySubUnitPrice, setDisplaySubUnitPrice] = useState(product?.subUnitPrice ? new Intl.NumberFormat('fa-IR').format(product.subUnitPrice) : '');
  
  const [categoryId, setCategoryId] = useState(product?.categoryId || '');
  const [unit, setUnit] = useState<string>(product?.unit || (unitsOfMeasurement[0]?.name || ''));
  const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl || null);
  
  const [subUnit, setSubUnit] = useState<string | undefined>(product?.subUnit);
  const [subUnitQuantity, setSubUnitQuantity] = useState<number | ''>(product?.subUnitQuantity ?? '');

  const [isProcessing, setIsProcessing] = useState(false);
  const [aiLoading, setAiLoading] = useState<Record<AIFeature, boolean>>({
    description: false,
    price: false,
    image: false,
  });
  
  const formatNumber = (num: number | '' | undefined) => {
    if (num === '' || num === undefined || isNaN(Number(num))) return '';
    return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(Math.round(Number(num)));
  };

  const parseFormattedNumber = (str: string) => {
    if (!str) return '';
    const numericString = str.replace(/[^۰-۹0-9]/g, '').replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
    const number = parseInt(numericString, 10);
    return isNaN(number) ? '' : number;
  };
  
  // Recalculate sub-unit price when main price or quantity changes
  useEffect(() => {
    const mainPriceNum = Number(price);
    const subUnitQtyNum = Number(subUnitQuantity);

    if (mainPriceNum > 0 && subUnitQtyNum > 0) {
      const calculatedSubPrice = Math.round(mainPriceNum / subUnitQtyNum);
      setSubUnitPrice(calculatedSubPrice);
      setDisplaySubUnitPrice(formatNumber(calculatedSubPrice));
    } else {
       setSubUnitPrice('');
       setDisplaySubUnitPrice('');
    }
  }, [price, subUnitQuantity, unit]);


  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseFormattedNumber(rawValue);
    setPrice(numericValue);
    setDisplayPrice(rawValue);
  };
  
  const handlePriceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplayPrice(formatNumber(parseFormattedNumber(value)));
  };

  const handlePriceFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const rawValue = parseFormattedNumber(e.target.value);
    e.target.value = rawValue !== '' ? String(rawValue) : '';
  };
  
  const handleSubUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseFormattedNumber(rawValue);
    setSubUnitPrice(numericValue);
    setDisplaySubUnitPrice(rawValue);

    const subUnitQtyNum = Number(subUnitQuantity);
    if (numericValue !== '' && subUnitQtyNum > 0) {
      const calculatedMainPrice = Math.round(numericValue * subUnitQtyNum);
      setPrice(calculatedMainPrice);
      setDisplayPrice(formatNumber(calculatedMainPrice));
    }
  };

  const handleSubUnitPriceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDisplaySubUnitPrice(formatNumber(parseFormattedNumber(value)));
  };

  const handleSubUnitPriceFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const rawValue = parseFormattedNumber(e.target.value);
    e.target.value = rawValue !== '' ? String(rawValue) : '';
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
     if (!categoryId) {
      toast({
        variant: 'destructive',
        title: 'دسته‌بندی انتخاب نشده',
        description: 'برای دریافت نتیجه بهتر، ابتدا دسته‌بندی محصول را انتخاب کنید.',
      });
      return;
    }

    setAiLoading(prev => ({ ...prev, [feature]: true }));
    
    const categoryName = categories.find(c => c.id === categoryId)?.name || '';

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
    const categoryName = categories.find(c => c.id === categoryId)?.name || '';
    const query = encodeURIComponent(`${name} ${categoryName}`);
    const url = `https://www.google.com/search?q=${query}&tbm=isch`;
    window.open(url, '_blank');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const numericPrice = Number(price);
    const numericSubUnitPrice = Number(subUnitPrice);
    const numericSubUnitQuantity = Number(subUnitQuantity);

    if (!name || isNaN(numericPrice) || numericPrice <= 0 || !categoryId) {
      toast({
        variant: 'destructive',
        title: 'فیلدهای الزامی خالی یا نامعتبر است',
        description: 'لطفاً نام، قیمت معتبر و دسته‌بندی محصول را وارد کنید.',
      });
      return;
    }

    setIsProcessing(true);
    
    const finalImage = imageUrl || `https://picsum.photos/seed/${name}${categoryId}/400/300`;

    setTimeout(() => {
      const newOrUpdatedProduct: Product = {
        id: isEditMode && product ? product.id : `prod-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        price: numericPrice,
        categoryId,
        unit,
        subUnit: subUnit || undefined,
        subUnitQuantity: isNaN(numericSubUnitQuantity) ? undefined : numericSubUnitQuantity,
        subUnitPrice: isNaN(numericSubUnitPrice) ? undefined : numericSubUnitPrice,
        imageUrl: finalImage,
      };

      if (isEditMode && product) {
        setProducts(prev => [
            newOrUpdatedProduct,
            ...prev.filter(p => p.id !== product.id)
        ]);
        toast({
          title: 'محصول با موفقیت ویرایش شد',
          description: `تغییرات برای محصول "${name}" ذخیره و به بالای لیست منتقل شد.`,
        });
      } else {
        setProducts(prev => [newOrUpdatedProduct, ...prev]);
        toast({
          title: 'محصول جدید ایجاد شد',
          description: `محصول "${name}" با موفقیت ایجاد شد.`,
        });
      }

      setIsProcessing(false);
      router.push('/dashboard/products');
    }, 1000);
  };

  const showSubUnitFields = !!subUnit && subUnit !== 'none';

  return (
    <form onSubmit={handleSubmit}>
        <div className="mx-auto grid max-w-5xl animate-fade-in-up grid-cols-1 gap-6 lg:grid-cols-3">
            
            <div className="grid gap-6 lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{isEditMode ? `ویرایش محصول` : 'افزودن محصول جدید'}</CardTitle>
                        <CardDescription>{isEditMode ? `ویرایش جزئیات محصول "${product?.name}"` : 'اطلاعات محصول را وارد کنید.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="grid gap-3">
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
                                <Label htmlFor="category">دسته‌بندی</Label>
                                <Select value={categoryId} onValueChange={setCategoryId} required>
                                    <SelectTrigger id="category">
                                    <SelectValue placeholder="انتخاب دسته‌بندی" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                        </SelectItem>
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
                                <Input id="price" value={displayPrice} onChange={handlePriceChange} onBlur={handlePriceBlur} onFocus={handlePriceFocus} required />
                            </div>
                            
                            <div className="grid gap-3">
                                <Label htmlFor="sub-unit-price">قیمت واحد فرعی (ریال)</Label>
                                <Input id="sub-unit-price" value={displaySubUnitPrice} onChange={handleSubUnitPriceChange} onBlur={handleSubUnitPriceBlur} onFocus={handleSubUnitPriceFocus} disabled={!showSubUnitFields} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-6">
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

            <div className="flex justify-end lg:col-span-3">
                <Button type="submit" disabled={isProcessing} size="lg">
                    {isProcessing
                    ? isEditMode ? 'در حال ذخیره...' : 'در حال ایجاد...'
                    : isEditMode ? 'ذخیره تغییرات محصول' : 'ایجاد محصول جدید'}
                </Button>
            </div>
        </div>
    </form>
  );
}

    