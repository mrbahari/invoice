
'use client';

import { useState, ChangeEvent, useEffect, useMemo } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

type CategoryFormProps = {
  category?: Category;
  onSave: () => void;
  onCancel: () => void;
};

export function CategoryForm({ category, onSave, onCancel }: CategoryFormProps) {
  const { toast } = useToast();
  const isEditMode = !!category;

  const [categories, setCategories] = useLocalStorage<Category[]>('categories', initialData.categories);
  const [products] = useLocalStorage<Product[]>('products', initialData.products);
  
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [parentId, setParentId] = useState<string | undefined>(category?.parentId);

  const isSubCategory = !!parentId;

  // Store Info
  const [storeName, setStoreName] = useState(category?.storeName || '');
  const [storeAddress, setStoreAddress] = useState(category?.storeAddress || '');
  const [storePhone, setStorePhone] = useState(category?.storePhone || '');
  const [logo, setLogo] = useState<string | null>(category?.logoUrl || null);
  
  // Bank Info
  const [bankAccountHolder, setBankAccountHolder] = useState(category?.bankAccountHolder || '');
  const [bankName, setBankName] = useState(category?.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(category?.bankAccountNumber || '');
  const [bankIban, setBankIban] = useState(category?.bankIban || '');
  const [bankCardNumber, setBankCardNumber] = useState(category?.bankCardNumber || '');


  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (parentId) {
      const parent = categories.find(c => c.id === parentId);
      if (parent) {
        setStoreName(parent.storeName || '');
        setStoreAddress(parent.storeAddress || '');
        setStorePhone(parent.storePhone || '');
        setLogo(parent.logoUrl || null);
        setBankAccountHolder(parent.bankAccountHolder || '');
        setBankName(parent.bankName || '');
        setBankAccountNumber(parent.bankAccountNumber || '');
        setBankIban(parent.bankIban || '');
        setBankCardNumber(parent.bankCardNumber || '');
      }
    }
  }, [parentId, categories]);

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
    const requiredField = isSubCategory ? 'نام زیردسته' : 'نام فروشگاه (دسته‌بندی اصلی)';
    if (!name) {
      toast({
        variant: 'destructive',
        title: 'فیلدهای الزامی خالی است',
        description: `لطفاً ${requiredField} را وارد کنید.`,
      });
      return;
    }

    setIsProcessing(true);

    const newOrUpdatedCategory: Category = {
        id: isEditMode ? category.id : `cat-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        parentId,
        storeName: isSubCategory ? undefined : storeName,
        storeAddress: isSubCategory ? undefined : storeAddress,
        storePhone: isSubCategory ? undefined : storePhone,
        logoUrl: isSubCategory ? undefined : (logo || `https://picsum.photos/seed/${Math.random()}/110/110`),
        bankAccountHolder: isSubCategory ? undefined : bankAccountHolder,
        bankName: isSubCategory ? undefined : bankName,
        bankAccountNumber: isSubCategory ? undefined : bankAccountNumber,
        bankIban: isSubCategory ? undefined : bankIban,
        bankCardNumber: isSubCategory ? undefined : bankCardNumber,
    };

    if (isEditMode && category) {
      setCategories(prev => prev.map(c => 
          c.id === category.id 
          ? newOrUpdatedCategory
          : c
      ));
      toast({
        title: 'فروشگاه با موفقیت ویرایش شد',
      });
    } else {
      setCategories(prev => [newOrUpdatedCategory, ...prev]);
      toast({
        title: 'فروشگاه جدید ایجاد شد',
      });
    }

    setIsProcessing(false);
    onSave();
  };

  const handleDelete = () => {
    if (!category) return;
    
    const childCategories = categories.filter(c => c.parentId === category.id);
    if(childCategories.length > 0){
       toast({
            variant: 'destructive',
            title: 'خطا در حذف',
            description: `این دسته‌بندی دارای ${childCategories.length} زیردسته است و قابل حذف نیست.`,
        });
        return;
    }

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
    
    setCategories(prev => prev.filter(c => c.id !== category.id));
    toast({
      title: 'فروشگاه حذف شد',
      description: `فروشگاه "${category.name}" با موفقیت حذف شد.`,
    });

    setIsProcessing(false);
    onSave();
  };

  const parentCategories = useMemo(() => categories.filter(c => !c.parentId), [categories]);

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-3xl mx-auto animate-fade-in-up">
        <CardHeader>
            <div className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>
                        {isEditMode ? `ویرایش فروشگاه: ${category?.name}` : 'افزودن فروشگاه یا زیردسته جدید'}
                    </CardTitle>
                    <CardDescription>
                        اطلاعات فروشگاه یا زیردسته جدید را وارد کنید.
                    </CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={onCancel}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    بازگشت به لیست
                </Button>
            </div>
        </CardHeader>
        <CardContent className="grid gap-8">
            <div className="grid gap-3">
              <Label htmlFor="parent-category">این یک زیرمجموعه از کدام فروشگاه است؟</Label>
              <Select
                value={parentId || 'none'}
                onValueChange={(value) => setParentId(value === 'none' ? undefined : value)}
              >
                <SelectTrigger id="parent-category">
                  <SelectValue placeholder="یک فروشگاه انتخاب کنید..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">هیچکدام (این یک فروشگاه اصلی است)</SelectItem>
                  {parentCategories.map(parent => (
                    <SelectItem key={parent.id} value={parent.id} disabled={isEditMode && category.id === parent.id}>{parent.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        
            <div className="grid gap-6">
                <div className="grid gap-3">
                <Label htmlFor="category-name">{isSubCategory ? 'نام زیردسته' : 'نام شاخه اصلی (مثلا کناف)'}</Label>
                <Input
                    id="category-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isSubCategory ? "مثال: پروفیل گالوانیزه" : "مثال: کناف ایران"}
                    required
                />
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="description">توضیحات</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="توضیحات مختصری در مورد این آیتم بنویسید..."
                    />
                </div>
           </div>
          
          <Separator />
          
          <div className={cn("grid gap-6 transition-opacity", isSubCategory && 'opacity-50 pointer-events-none')}>
            <div>
              <h3 className='text-lg font-semibold'>اطلاعات فروشگاه</h3>
              <p className="text-sm text-muted-foreground">این اطلاعات فقط برای دسته‌بندی‌های اصلی (فروشگاه) اعمال می‌شود.</p>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="store-name">نام نمایشی فروشگاه (مثلا دکوربند)</Label>
              <Input
                id="store-name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="مثال: فروشگاه کناف ایران"
                disabled={isSubCategory}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="store-address">آدرس</Label>
                <Input
                  id="store-address"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  placeholder="مثال: میدان ولیعصر، برج فناوری"
                  disabled={isSubCategory}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="store-phone">تلفن</Label>
                <Input
                  id="store-phone"
                  type="tel"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="مثال: ۰۲۱-۸۸۸۸۴۴۴۴"
                  disabled={isSubCategory}
                />
              </div>
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
                    </div>
                  ) : <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                          <span className="text-xs text-muted-foreground">پیش‌نمایش</span>
                      </div>}

                  <div className='flex-1 grid gap-4'>
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className={cn("flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg bg-muted", !isSubCategory && "cursor-pointer hover:bg-muted/80")}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground"><span className="font-semibold">آپلود لوگوی سفارشی</span></p>
                            </div>
                            <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/*" disabled={isSubCategory} />
                        </label>
                      </div> 
                  </div>
                </div>
            </div>
          </div>
          
          <Separator />
          
          <div className={cn("grid gap-6 transition-opacity", isSubCategory && 'opacity-50 pointer-events-none')}>
            <div>
              <h3 className='text-lg font-semibold'>اطلاعات حساب بانکی</h3>
              <p className="text-sm text-muted-foreground">این اطلاعات به صورت خودکار در فاکتورها نمایش داده می‌شود.</p>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="bank-account-holder">نام صاحب حساب</Label>
                <Input
                  id="bank-account-holder"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  placeholder="مثال: اسماعیل بهاری"
                  disabled={isSubCategory}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="bank-name">نام بانک</Label>
                <Input
                  id="bank-name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="مثال: بانک سامان"
                  disabled={isSubCategory}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="bank-account-number">شماره حساب</Label>
                <Input
                  id="bank-account-number"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="اختیاری"
                  disabled={isSubCategory}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="bank-card-number">شماره کارت</Label>
                <Input
                  id="bank-card-number"
                  value={bankCardNumber}
                  onChange={(e) => setBankCardNumber(e.target.value)}
                  placeholder="اختیاری"
                  disabled={isSubCategory}
                />
              </div>
            </div>
             <div className="grid gap-3">
                <Label htmlFor="bank-iban">شماره شبا (IBAN)</Label>
                <Input
                  id="bank-iban"
                  value={bankIban}
                  onChange={(e) => setBankIban(e.target.value)}
                  placeholder="مثال: IR..."
                  dir="ltr"
                  className="text-left"
                  disabled={isSubCategory}
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
                    حذف
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        این عمل غیرقابل بازگشت است و آیتم «{category.name}» را برای همیشه حذف می‌کند.
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
              : 'ایجاد'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
