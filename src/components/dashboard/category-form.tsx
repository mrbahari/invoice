
'use client';

import { useState, ChangeEvent, useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import type { Category, Product } from '@/lib/definitions';
import { initialData } from '@/lib/data';
import { Upload, Trash2, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
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

type CategoryFormProps = {
  category?: Category;
  onBack: () => void;
  onDataChange: () => void;
};

export function CategoryForm({ category, onBack, onDataChange }: CategoryFormProps) {
  const { toast } = useToast();
  const isEditMode = !!category;

  const [categories, setCategories] = useLocalStorage<Category[]>('categories', initialData.categories);
  const [products] = useLocalStorage<Product[]>('products', initialData.products);

  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  
  const [storeName, setStoreName] = useState(category?.storeName || '');
  const [storeAddress, setStoreAddress] = useState(category?.storeAddress || '');
  const [storePhone, setStorePhone] = useState(category?.storePhone || '');
  const [logo, setLogo] = useState<string | null>(category?.logoUrl || null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name || !storeName) {
      toast({
        variant: 'destructive',
        title: 'فیلدهای الزامی خالی است',
        description: 'لطفاً نام دسته‌بندی و نام فروشگاه را وارد کنید.',
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const newOrUpdatedCategory: Category = {
          id: isEditMode ? category.id : `cat-${Math.random().toString(36).substr(2, 9)}`,
          name,
          description,
          storeName: storeName,
          storeAddress: storeAddress,
          storePhone: storePhone,
          logoUrl: logo || `https://picsum.photos/seed/${Math.random()}/110/110`,
      };

      if (isEditMode && category) {
        setCategories(prev => prev.map(c => 
            c.id === category.id 
            ? newOrUpdatedCategory
            : c
        ));
        toast({
          title: 'دسته‌بندی با موفقیت ویرایش شد',
          description: `تغییرات برای دسته‌بندی "${name}" ذخیره شد.`,
        });
      } else {
        setCategories(prev => [newOrUpdatedCategory, ...prev]);
        toast({
          title: 'دسته‌بندی جدید ایجاد شد',
          description: `دسته‌بندی "${name}" با موفقیت ایجاد شد.`,
        });
      }

      onDataChange();
      setIsProcessing(false);
      onBack();
    }, 1000);
  };

  const handleDelete = () => {
    if (!category) return;
    
     const productCount = products.filter(p => p.categoryId === category.id).length;
    if (productCount > 0) {
        toast({
            variant: 'destructive',
            title: 'خطا در حذف',
            description: `این دسته‌بندی به ${productCount} محصول اختصاص داده شده و قابل حذف نیست.`,
        });
        return;
    }


    setIsProcessing(true);
    setTimeout(() => {
      setCategories(prev => prev.filter(c => c.id !== category.id));
      toast({
        title: 'دسته‌بندی حذف شد',
        description: `دسته‌بندی "${category.name}" با موفقیت حذف شد.`,
      });

      onDataChange();
      setIsProcessing(false);
      onBack();
    }, 1000);
  };


  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-2xl mx-auto animate-fade-in-up">
        <CardHeader>
            <div className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>
                        {isEditMode ? `ویرایش دسته‌بندی: ${category?.name}` : 'افزودن دسته‌بندی جدید'}
                    </CardTitle>
                    <CardDescription>
                        اطلاعات دسته‌بندی و فروشگاه مربوطه را وارد کنید.
                    </CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={onBack}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    بازگشت به لیست
                </Button>
            </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-6">
            <div>
              <h3 className='text-lg font-semibold'>اطلاعات فروشگاه</h3>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="store-name">نام فروشگاه</Label>
              <Input
                id="store-name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="مثال: فروشگاه سپهر"
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="store-address">آدرس فروشگاه</Label>
              <Input
                id="store-address"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="مثال: میدان ولیعصر، برج فناوری، طبقه ۵"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="store-phone">تلفن فروشگاه</Label>
              <Input
                id="store-phone"
                type="tel"
                value={storePhone}
                onChange={(e) => setStorePhone(e.target.value)}
                placeholder="مثال: ۰۲۱-۸۸۸۸۴۴۴۴"
              />
            </div>
            
            <div className="grid gap-4">
                <Label>لوگوی فروشگاه</Label>
                <div className='flex items-start gap-6'>
                  {logo ? (
                    <div className="relative w-24 h-24">
                      <Image
                        src={logo}
                        alt="پیش‌نمایش لوگو"
                        layout="fill"
                        objectFit="contain"
                        className="rounded-md border p-2"
                        key={logo} 
                        unoptimized
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full"
                        onClick={() => setLogo(null)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                          <span className="text-xs text-muted-foreground">پیش‌نمایش</span>
                      </div>}

                  <div className='flex-1 grid gap-4'>
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground"><span className="font-semibold">آپلود لوگوی سفارشی</span></p>
                            </div>
                            <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                        </label>
                      </div> 
                  </div>
                </div>
            </div>
          </div>
          
          <Separator />

           <div className="grid gap-6">
            <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-3">
                <Label htmlFor="category-name">نام دسته‌بندی</Label>
                <Input
                    id="category-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: موبایل و تبلت"
                    required
                />
                </div>
            </div>
            <div className="grid gap-3">
                <Label htmlFor="description">توضیحات</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="توضیحات مختصری در مورد دسته‌بندی بنویسید..."
                />
            </div>
          </div>

        </CardContent>
        <CardFooter className="flex justify-between">
           <div>
            {isEditMode && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isProcessing}>
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف دسته‌بندی
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        این عمل غیرقابل بازگشت است و دسته‌بندی «{category.name}» را برای همیشه حذف می‌کند.
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
          <Button type="submit" disabled={isProcessing}>
            {isProcessing
              ? isEditMode
                ? 'در حال ذخیره...'
                : 'در حال ایجاد...'
              : isEditMode
              ? 'ذخیره تغییرات'
              : 'ایجاد دسته‌بندی'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
