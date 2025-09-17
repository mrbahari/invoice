
'use client';

import { useState, ChangeEvent } from 'react';
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
import type { Product, Category } from '@/lib/definitions';
import { initialProducts } from '@/lib/data';
import { Upload, Trash2, WandSparkles, LoaderCircle } from 'lucide-react';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { generateProductDetails, GenerateProductDetailsInput } from '@/ai/flows/generate-product-details';

type ProductFormProps = {
  product?: Product;
  categories: Category[];
};

type AIFeature = 'description' | 'image' | 'price';

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditMode = !!product;

  const [products, setProducts] = useLocalStorage<Product[]>('products', initialProducts);
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState<number | string>(product?.price ?? '');
  const [categoryId, setCategoryId] = useState(product?.categoryId || '');
  const [image, setImage] = useState<string | null>(product?.imageUrl || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiLoading, setAiLoading] = useState<Record<AIFeature, boolean>>({
    description: false,
    image: false,
    price: false,
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

    setAiLoading(prev => ({ ...prev, [feature]: true }));

    try {
      const input: GenerateProductDetailsInput = { productName: name, feature };
      const result = await generateProductDetails(input);

      if (feature === 'description' && result.description) {
        setDescription(result.description);
      } else if (feature === 'image' && result.imageUrl) {
        setImage(result.imageUrl);
      } else if (feature === 'price' && result.price !== undefined) {
        setPrice(result.price);
      }
      
      toast({
        title: 'هوش مصنوعی انجام شد',
        description: `فیلد ${feature === 'description' ? 'توضیحات' : feature === 'image' ? 'تصویر' : 'قیمت'} با موفقیت تولید شد.`
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


  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type, 0.8); // Compress image
          setImage(dataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
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

    if (!name || numericPrice === undefined || numericPrice < 0 || !categoryId) {
      toast({
        variant: 'destructive',
        title: 'فیلدهای الزامی خالی یا نامعتبر است',
        description: 'لطفاً نام، قیمت معتبر و دسته‌بندی محصول را وارد کنید.',
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      if (isEditMode && product) {
        setProducts(prev => prev.map(p => 
            p.id === product.id 
            ? { ...p, name, description, price: numericPrice, categoryId, imageUrl: image || p.imageUrl }
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
          imageUrl: image || PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)].imageUrl,
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
                  <Label htmlFor="price">قیمت (ریال)</Label>
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
          <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label>تصویر محصول</Label>
                 <Button type="button" variant="ghost" size="sm" onClick={() => handleAiGeneration('image')} disabled={aiLoading.image}>
                    {aiLoading.image ? <LoaderCircle className="animate-spin ml-2" /> : <WandSparkles className="ml-2" />}
                    تولید با هوش مصنوعی
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                          <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">برای آپلود کلیک کنید</span></p>
                          <p className="text-xs text-muted-foreground">یا فایل را بکشید و رها کنید</p>
                      </div>
                      <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
                <div className="relative w-40 h-40">
                  {aiLoading.image ? (
                    <div className="w-full h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-muted">
                        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground mt-2">در حال تولید...</span>
                    </div>
                  ) : image ? (
                      <>
                        <Image
                          src={image}
                          alt="پیش‌نمایش تصویر"
                          layout="fill"
                          objectFit="cover"
                          className="rounded-md border p-2"
                          unoptimized={image.startsWith('data:image/')}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                          onClick={() => setImage(null)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                  ) : (
                    <div className="w-full h-full border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                        <span className="text-xs text-muted-foreground">پیش‌نمایش</span>
                    </div>
                  )}
                </div>
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
