
'use client';

import { useRef, ChangeEvent, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category, Customer, Invoice, Product, UnitOfMeasurement } from '@/lib/definitions';
import { Download, Upload, Trash2, PlusCircle, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { initialUnitsOfMeasurement } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useLocalStorage<Category[]>('categories', []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);
  const [products, setProducts] = useLocalStorage<Product[]>('products', []);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('invoices', []);
  const [units, setUnits] = useLocalStorage<UnitOfMeasurement[]>('units', initialUnitsOfMeasurement);
  
  const [newUnit, setNewUnit] = useState('');

  const handleAddUnit = () => {
    if (newUnit.trim() === '') {
        toast({ variant: 'destructive', title: 'نام واحد نمی‌تواند خالی باشد.' });
        return;
    }
    if (units.includes(newUnit.trim())) {
        toast({ variant: 'destructive', title: 'این واحد قبلاً اضافه شده است.' });
        return;
    }
    setUnits(prev => [...prev, newUnit.trim()]);
    setNewUnit('');
    toast({ title: 'واحد جدید با موفقیت اضافه شد.' });
  };

  const handleDeleteUnit = (unitToDelete: string) => {
    setUnits(prev => prev.filter(u => u !== unitToDelete));
    toast({ title: 'واحد با موفقیت حذف شد.' });
  };

  const handleClearData = () => {
    setCategories([]);
    setCustomers([]);
    setProducts([]);
    setInvoices([]);
    setUnits(initialUnitsOfMeasurement);

    toast({
      title: 'اطلاعات پاک شد',
      description: 'تمام داده‌های برنامه با موفقیت حذف شدند.',
    });
  };

  const handleBackupData = () => {
    const backupData = {
      categories,
      customers,
      products,
      invoices,
      units,
      backupDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `hesabgar-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'پشتیبان‌گیری با موفقیت انجام شد',
      description: 'فایل پشتیبان شما در حال دانلود است.',
    });
  };

  const handleRestoreChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File is not valid text.");
        }
        const data = JSON.parse(text);
        
        if (data.categories && data.customers && data.products && data.invoices) {
          setCategories(data.categories);
          setCustomers(data.customers);
          setProducts(data.products);
          setInvoices(data.invoices);
          if (data.units) {
            setUnits(data.units);
          }
          
          toast({
            title: 'بازیابی موفق',
            description: 'اطلاعات با موفقیت از فایل پشتیبان بازیابی شد.',
          });

          // Reload to reflect changes everywhere
          setTimeout(() => window.location.reload(), 1000);

        } else {
          throw new Error("فایل پشتیبان معتبر نیست.");
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'خطا در بازیابی',
          description: (error instanceof Error) ? error.message : 'فایل انتخاب شده معتبر نیست.',
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>تنظیمات</CardTitle>
          <CardDescription>
            تنظیمات کلی برنامه را مدیریت کنید.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>مدیریت واحدها</CardTitle>
          <CardDescription>
            واحدهای اندازه‌گیری مورد استفاده در محصولات را اضافه یا حذف کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
              <Input
                  placeholder="نام واحد جدید..."
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
              />
              <Button onClick={handleAddUnit}>
                  <PlusCircle className="ml-2 h-4 w-4" />
                  افزودن
              </Button>
          </div>
          <div className="flex flex-wrap gap-2 rounded-lg border p-4 min-h-[6rem]">
            {units.length > 0 ? units.map(unit => (
                <Badge key={unit} variant="secondary" className="text-base font-normal">
                    {unit}
                    <button onClick={() => handleDeleteUnit(unit)} className="mr-2 rounded-full p-0.5 hover:bg-destructive/20 text-destructive">
                        <X className="h-3 w-3" />
                    </button>
                </Badge>
            )) : <p className="text-sm text-muted-foreground">هیچ واحدی تعریف نشده است.</p>}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>پشتیبان‌گیری و بازیابی</CardTitle>
          <CardDescription>
            از داده‌های برنامه خود نسخه پشتیبان تهیه کرده یا آن‌ها را بازیابی کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
            <Button onClick={handleBackupData} variant="outline">
                <Download className="ml-2 h-4 w-4" />
                دانلود فایل پشتیبان (Backup)
            </Button>
            <div>
              <Button onClick={handleRestoreClick} className="w-full">
                <Upload className="ml-2 h-4 w-4" />
                بازیابی از فایل (Restore)
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleRestoreChange}
                accept=".json"
                className="hidden"
              />
            </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">منطقه خطر</CardTitle>
          <CardDescription>
            این عملیات غیرقابل بازگشت هستند. لطفا با احتیاط عمل کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div>
              <h3 className="font-semibold text-destructive">پاک کردن تمام اطلاعات</h3>
              <p className="text-sm text-muted-foreground">
                تمام داده‌های برنامه (مشتریان، محصولات، فاکتورها، دسته‌بندی‌ها و واحدها) برای همیشه حذف خواهند شد.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className='ml-2 h-4 w-4' />
                    پاک کردن اطلاعات
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>آیا کاملاً مطمئن هستید؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    این عمل غیرقابل بازگشت است و تمام داده‌های شما را برای همیشه حذف خواهد کرد.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData} className='bg-destructive hover:bg-destructive/90'>بله، همه چیز را پاک کن</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
