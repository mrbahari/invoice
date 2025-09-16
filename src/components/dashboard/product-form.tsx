
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
import { Upload, Trash2 } from 'lucide-react';
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

type ProductFormProps = {
  product?: Product;
  categories: Category[];
};

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditMode = !!product;

  const [products, setProducts] = useLocalStorage<Product[]>('products', initialProducts);
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price || 0);
  const [categoryId, setCategoryId] = useState(product?.categoryId || '');
  const [image, setImage] = useState<string | null>(product?.imageUrl || null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name || !price || !categoryId) {
      toast({
        variant: 'destructive',
        title: 'فیلدهای الزامی خالی است',
        description: 'لطفاً نام، قیمت و دسته‌بندی محصول را وارد کنید.',
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      if (isEditMode && product) {
        setProducts(prev => prev.map(p => 
            p.id === product.id 
            ? { ...p, name, description, price, categoryId, imageUrl: image || p.imageUrl }
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
          price,
          categoryId,
          imageUrl: image || PlaceHolderImages.find(p => p.id === 'prod-1')!.imageUrl,
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
            اطلاعات محصول را وارد کنید.
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
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="توضیحات محصول را اینجا بنویسید..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-3">
                <Label htmlFor="price">قیمت (تومان)</Label>
                <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
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
              <Label htmlFor="logo">تصویر محصول</Label>
              {image ? (
                <div className="relative w-40 h-40">
                  <Image
                    src={image}
                    alt="پیش‌نمایش تصویر"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md border p-2"
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
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">برای آپلود کلیک کنید</span> یا فایل را بکشید و رها کنید</p>
                          <p className="text-xs text-muted-foreground">SVG, PNG, JPG</p>
                      </div>
                      <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
              )}
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
