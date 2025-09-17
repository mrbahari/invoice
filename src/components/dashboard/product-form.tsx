
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
  const [price, setPrice] = useState<number | string>(product?.price ?? ''); // Main unit price
  const [subUnitPrice, setSubUnitPrice] = useState<number | string>(''); // Sub unit price
  const [categoryId, setCategoryId] = useState(product?.categoryId || '');
  const [unit, setUnit] = useState<string>(product?.unit || (unitsOfMeasurement[0]?.name || ''));
  const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl || null);
  
  const [subUnit, setSubUnit] = useState<string | undefined>(product?.subUnit);
  const [subUnitQuantity, setSubUnitQuantity] = useState<number | string>(product?.subUnitQuantity ?? '');

  const [isProcessing, setIsProcessing] = useState(false);
  const [aiLoading, setAiLoading] = useState<Record<AIFeature, boolean>>({
    description: false,
    price: false,
    image: false,
  });
  
  useEffect(() => {
    // Recalculate sub-unit price when main price or quantity changes.
    const mainPriceNum = typeof price === 'string' ? parseFloat(price) : price;
    const subUnitQtyNum = typeof subUnitQuantity === 'string' ? parseFloat(subUnitQuantity) : subUnitQuantity;

    if (mainPriceNum > 0 && subUnitQtyNum > 0) {
      const calculatedSubPrice = mainPriceNum / subUnitQtyNum;
      setSubUnitPrice(Math.round(calculatedSubPrice));
    } else if (isEditMode && product) {
        // Initial calculation for edit mode
        const pPrice = product.price;
        const pSubQty = product.subUnitQuantity;
        if (pPrice && pSubQty && pSubQty > 0) {
            setSubUnitPrice(Math.round(pPrice / pSubQty));
        }
    } else {
      setSubUnitPrice('');
    }
  }, [price, subUnitQuantity, isEditMode, product]);

  const handleSubUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSubUnitPrice = e.target.value;
    setSubUnitPrice(newSubUnitPrice);

    const subUnitPriceNum = parseFloat(newSubUnitPrice);
    const subUnitQtyNum = typeof subUnitQuantity === 'string' ? parseFloat(subUnitQuantity) : subUnitQuantity;

    if (subUnitPriceNum >= 0 && subUnitQtyNum > 0) {
        const calculatedMainPrice = subUnitPriceNum * subUnitQtyNum;
        setPrice(Math.round(calculatedMainPrice));
    }
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
        setPrice(result.price);
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
  
  const handlePriceFocus = (setter: React.Dispatch<React.SetStateAction<string | number>>, value: string | number) => {
    if (value === 0) {
      setter('');
    }
  };

  const handlePriceBlur = (setter: React.Dispatch<React.SetStateAction<string | number>>, value: string | number) => {
    if (value === '') {
      setter(0);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    const numericSubUnitQuantity = typeof subUnitQuantity === 'string' && subUnitQuantity !== '' ? parseFloat(subUnitQuantity) : undefined;


    if (!name || numericPrice === undefined || numericPrice < 0 || !categoryId) {
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
      if (isEditMode && product) {
        const updatedProduct: Product = {
            ...product,
            name,
            description,
            price: numericPrice,
            categoryId,
            unit,
            subUnit: subUnit || undefined,
            subUnitQuantity: numericSubUnitQuantity,
            imageUrl: finalImage
        };
        
        setProducts(prev => [
            updatedProduct,
            ...prev.filter(p => p.id !== product.id)
        ]);

        toast({
          title: 'محصول با موفقیت ویرایش شد',
          description: `تغییرات برای محصول "${name}" ذخیره و به بالای لیست منتقل شد.`,
        });
      } else {
        const newProduct: Product = {
          id: `prod-${Math.random().toString(36).substr(2, 9)}`,
          name,
          description,
          price: numericPrice,
          categoryId,
          unit,
          subUnit: subUnit || undefined,
          subUnitQuantity: numericSubUnitQuantity,
          imageUrl: finalImage,
        };
        setProducts(prev => [newProduct, ...prev]);
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
        <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{isEditMode ? `ویرایش محصول` : 'افزودن محصول جدید'}</CardTitle>
                        <CardDescription>{isEditMode ? `ویرایش جزئیات محصول "${product?.name}"` : 'اطلاعات محصول را وارد کنید.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <Select value={subUnit || 'none'} onValueChange={(value: string) => { if (value === 'none') { setSubUnit(undefined); setSubUnitQuantity(''); setSubUnitPrice(''); } else { setSubUnit(value); } }}>
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
                                <Input id="sub-unit-quantity" type="number" value={subUnitQuantity} onChange={(e) => setSubUnitQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder={`تعداد در ${unit}`} step="0.01" disabled={!showSubUnitFields} />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="price">قیمت اصلی (ریال)</Label>
                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAiGeneration('price')} disabled={aiLoading.price}>
                                        {aiLoading.price ? <LoaderCircle className="animate-spin" /> : <WandSparkles />}
                                    </Button>
                                </div>
                                <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : parseInt(e.target.value, 10))} onFocus={(e) => handlePriceFocus(setPrice, e.target.value)} onBlur={(e) => handlePriceBlur(setPrice, e.target.value)} required />
                            </div>
                            
                            <div className="grid gap-3">
                                <Label htmlFor="sub-unit-price">قیمت فرعی (ریال)</Label>
                                <Input id="sub-unit-price" type="number" value={subUnitPrice} onChange={handleSubUnitPriceChange} onFocus={(e) => handlePriceFocus(setSubUnitPrice, e.target.value)} onBlur={(e) => handlePriceBlur(setSubUnitPrice, e.target.value)} disabled={!showSubUnitFields} />
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
                            <Image src={imageUrl} alt="پیش‌نمایش تصویر" fill={true} style={{objectFit: 'contain'}} className="rounded-md border p-2 bg-muted/30" onError={() => { toast({ variant: 'destructive', title: 'خطا در بارگذاری تصویر', description: 'آدرس تصویر معتبر نیست یا دسترسی به آن ممکن نیست.'}); setImageUrl(null); }} unoptimized />
                            ) : (
                            <div className="w-full h-full border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                                <span className="text-xs text-muted-foreground">پیش‌نمایش تصویر</span>
                            </div>
                            )}
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="image-url">URL تصویر</Label>
                            <Input id="image-url" value={imageUrl || ''} onChange={(e) => setImageUrl(e.target.value)} placeholder="URL تصویر یا تولید با AI..." />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => handleAiGeneration('image')} disabled={aiLoading.image}>
                                {aiLoading.image ? <LoaderCircle className="animate-spin" /> : <WandSparkles />}
                                <span className="hidden sm:inline">AI</span>
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleImageSearch}>
                                <Search />
                                <span className="hidden sm:inline">وب</span>
                            </Button>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl(null)} disabled={!imageUrl}>
                                <Trash2 />
                                <span className="hidden sm:inline">حذف</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-3 flex justify-end">
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
