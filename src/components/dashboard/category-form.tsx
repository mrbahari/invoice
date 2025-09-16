
'use client';

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import ReactDOMServer from 'react-dom/server';
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
import type { Category } from '@/lib/definitions';
import { initialCategories } from '@/lib/data';
import { Upload, Trash2, Building, ShoppingCart, Laptop, Shirt, Gamepad, Utensils, Car, HeartPulse } from 'lucide-react';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

type CategoryFormProps = {
  category?: Category;
};

const iconList = [
    { name: 'Store', component: Building },
    { name: 'Cart', component: ShoppingCart },
    { name: 'Laptop', component: Laptop },
    { name: 'Shirt', component: Shirt },
    { name: 'Gamepad', component: Gamepad },
    { name: 'Food', component: Utensils },
    { name: 'Car', component: Car },
    { name: 'Health', component: HeartPulse },
];

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditMode = !!category;

  const [categories, setCategories] = useLocalStorage<Category[]>('categories', initialCategories);
  const [name, setName] = useState(category?.name || '');
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
  
  const handleIconSelect = (IconComponent: React.ElementType) => {
    const svgString = ReactDOMServer.renderToString(
      <IconComponent color="hsl(var(--primary))" size={48} />
    );
    const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
    setLogo(dataUrl);
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
      const finalLogoUrl = logo || `https://picsum.photos/seed/${Math.random()}/48/48`;
      
      if (isEditMode && category) {
        setCategories(prev => prev.map(c => 
            c.id === category.id 
            ? { ...c, name, storeName, storeAddress, storePhone, logoUrl: finalLogoUrl } 
            : c
        ));
        toast({
          title: 'دسته‌بندی با موفقیت ویرایش شد',
          description: `تغییرات برای دسته‌بندی "${name}" ذخیره شد.`,
        });
      } else {
        const newCategory: Category = {
          id: `cat-${Math.random().toString(36).substr(2, 9)}`,
          name,
          storeName,
          storeAddress,
          storePhone,
          logoUrl: finalLogoUrl
        };
        setCategories(prev => [newCategory, ...prev]);
        toast({
          title: 'دسته‌بندی جدید ایجاد شد',
          description: `دسته‌بندی "${name}" با موفقیت ایجاد شد.`,
        });
      }

      setIsProcessing(false);
      router.push('/dashboard/categories');
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {isEditMode ? `ویرایش دسته‌بندی: ${category?.name}` : 'افزودن دسته‌بندی جدید'}
          </CardTitle>
          <CardDescription>
            اطلاعات دسته‌بندی و فروشگاه مربوطه را وارد کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="category-name">نام دسته‌بندی</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: الکترونیک"
              required
            />
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
              
              <div className="relative">
                <Separator className="my-2" />
                <span className="absolute top-1/2 right-1/2 -translate-y-1/2 -translate-x-1/2 bg-card px-2 text-xs text-muted-foreground">یا</span>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-3">یک آیکون انتخاب کنید:</p>
                <div className="grid grid-cols-8 gap-2">
                    {iconList.map((icon, index) => (
                      <button
                        type="button"
                        key={index}
                        onClick={() => handleIconSelect(icon.component)}
                        className={cn(
                          'flex items-center justify-center p-2 border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors',
                          logo?.includes(btoa(ReactDOMServer.renderToString(<icon.component color="hsl(var(--primary))" size={48} />))) && 'bg-accent text-accent-foreground ring-2 ring-primary'
                        )}
                        title={icon.name}
                      >
                        <icon.component className="h-6 w-6" />
                      </button>
                    ))}
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
              : 'ایجاد دسته‌بندی'}
          </Button>
        </CardFooter>
      </Card>
    </form>

    