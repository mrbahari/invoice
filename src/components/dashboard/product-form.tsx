
'use client';

import { useState } from 'react';
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
import { Separator } from '../ui/separator';

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
  const [price, setPrice] = useState<number | string>(product?.price ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || '');
  const [unit, setUnit] = useState<UnitOfMeasurement>(product?.unit || (unitsOfMeasurement[0] || ''));
  const [imageUrl, setImageUrl] = useState<string | null>(product?.imageUrl || null);
  
  const [subUnit, setSubUnit] = useState<UnitOfMeasurement | undefined>(product?.subUnit);
  const [subUnitQuantity, setSubUnitQuantity] = useState<number | string>(product?.subUnitQuantity ?? '');

  const [isProcessing, setIsProcessing] = useState(false);
  const [aiLoading, setAiLoading] = useState<Record<AIFeature, boolean>>({
    description: false,
    price: false,
    image: false,
  });

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
  
  const handlePriceFocus = () => {
    if (price === 0) {
      setPrice('');
    }
  };

  const handlePriceBlur = () => {
    if (price === '') {
      setPrice(0);
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
        setProducts(prev => prev.map(p => 
            p.id === product.id 
            ? { ...p, name, description, price: numericPrice, categoryId, unit, subUnit: subUnit || undefined, subUnitQuantity: numericSubUnitQuantity, imageUrl: finalImage }
            : p
        ));
        toast({
          title: 'محصول با موفقیت ویرایش شد',
          description: `تغییرات برای محصول "${name}" ذخیره شد.`,
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

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {isEditMode ? `ویرایش محصول: ${product?.name}` : 'افزودن محصول جدید'}
          </CardTitle>
          <CardDescription>
            اطلاعات محصول را وارد کنید یا از هوش مصنوعی برای تکمیل خودکار استفاده کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
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
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="price">
                    {subUnit ? `قیمت واحد فرعی (${subUnit})` : 'قیمت'} (ریال)
                  </Label>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleAiGeneration('price')} disabled={aiLoading.price}>
                     {aiLoading.price ? <LoaderCircle className="animate-spin" /> : <WandSparkles />}
                  </Button>
                </div>
                <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    onFocus={handlePriceFocus}
                    onBlur={handlePriceBlur}
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
          
           <div className="grid grid-cols-1 gap-4 items-end md:grid-cols-3">
                <div className="grid gap-3">
                    <Label htmlFor="unit">واحد اصلی</Label>
                    <Select value={unit} onValueChange={(value: UnitOfMeasurement) => setUnit(value)} required>
                        <SelectTrigger id="unit">
                        <SelectValue placeholder="انتخاب واحد" />
                        </SelectTrigger>
                        <SelectContent>
                        {unitsOfMeasurement.map((u) => (
                            <SelectItem key={u} value={u}>
                            {u}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="sub-unit">واحد فرعی (اختیاری)</Label>
                    <Select 
                    value={subUnit || 'none'} 
                    onValueChange={(value: UnitOfMeasurement) => {
                        if (value === 'none') {
                        setSubUnit(undefined);
                        setSubUnitQuantity('');
                        } else {
                        setSubUnit(value);
                        }
                    }}>
                        <SelectTrigger id="sub-unit">
                        <SelectValue placeholder="انتخاب واحد" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem key="none" value="none">هیچکدام</SelectItem>
                        {unitsOfMeasurement.map((u) => (
                            <SelectItem key={u} value={u}>
                            {u}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="sub-unit-quantity">مقدار واحد فرعی</Label>
                    <Input
                        id="sub-unit-quantity"
                        type="number"
                        value={subUnitQuantity}
                        onChange={(e) => setSubUnitQuantity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                        placeholder={`مثال: ۱۲ (عدد در بسته)`}
                        disabled={!subUnit}
                    />
                </div>
            </div>

          <div className="grid gap-6">
              <div className="grid gap-3">
                  <Label htmlFor="image-url">تصویر محصول</Label>
                  <div className="flex items-center gap-2">
                    <Input
                        id="image-url"
                        value={imageUrl || ''}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="URL تصویر یا تولید با AI..."
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleAiGeneration('image')} disabled={aiLoading.image}>
                        {aiLoading.image ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
                        <span className="sr-only">تولید با هوش مصنوعی</span>
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={handleImageSearch}>
                        <Search className="h-4 w-4" />
                        <span className="sr-only">جستجو در وب</span>
                    </Button>
                    {imageUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setImageUrl(null)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">حذف تصویر</span>
                      </Button>
                    )}
                  </div>
              </div>

              <div className="relative w-full h-48">
                  {imageUrl ? (
                  <>
                      <Image
                      src={imageUrl}
                      alt="پیش‌نمایش تصویر"
                      fill={true}
                      style={{objectFit: 'contain'}}
                      className="rounded-md border p-2"
                      onError={() => {
                          toast({ variant: 'destructive', title: 'خطا در بارگذاری تصویر', description: 'آدرس تصویر معتبر نیست یا دسترسی به آن ممکن نیست.'});
                          setImageUrl(null);
                      }}
                      unoptimized
                      />
                  </>
                  ) : (
                  <div className="w-full h-full border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                      <span className="text-xs text-muted-foreground">پیش‌نمایش تصویر</span>
                  </div>
                  )}
              </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" disabled={isProcessing}>
            {isProcessing
              ? isEditMode
                ? 'در حال ذخیره...'
                : 'در حال ایجاد...'
              : isEditMode
              ? 'ذخیره تغییرات'
              : 'ایجاد محصول'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
