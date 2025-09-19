
'use client';

import { useRef, ChangeEvent, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
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
import { useCollection } from '@/hooks/use-collection';
import type { Category, Customer, Invoice, Product, UnitOfMeasurement, Store } from '@/lib/definitions';
import { Download, Upload, Trash2, PlusCircle, X, RefreshCw, Monitor, Moon, Sun, Palette } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '../auth/auth-provider';
import { deleteAllUserData, batchAdd, checkUserHasData } from '@/lib/firestore-service';
import { getDefaultData } from '@/lib/default-data';

const colorThemes = [
    { name: 'Blue', value: '248 82% 50%', ring: '248 82% 50%' },
    { name: 'Rose', value: '340 82% 50%', ring: '340 82% 50%' },
    { name: 'Green', value: '142 64% 42%', ring: '142 64% 42%' },
    { name: 'Orange', value: '25 95% 53%', ring: '25 95% 53%' },
    { name: 'Purple', value: '262 84% 58%', ring: '262 84% 58%' },
];


export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  const { data: units, add: addUnit, remove: removeUnit, reload: reloadUnits } = useCollection<UnitOfMeasurement>('units');
  const [activeColor, setActiveColor] = useState(colorThemes[0].value);
  
  const [newUnitName, setNewUnitName] = useState('');

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-hsl', activeColor);
    document.documentElement.style.setProperty('--ring-hsl', activeColor);
  }, [activeColor]);

  const handleThemeColorChange = (colorValue: string) => {
    setActiveColor(colorValue);
  };

  const handleAddUnit = async () => {
    const name = newUnitName.trim();

    if (name === '') {
        toast({ variant: 'destructive', title: 'نام واحد نمی‌تواند خالی باشد.' });
        return;
    }
    if (units.some(u => u.name === name)) {
        toast({ variant: 'destructive', title: 'این واحد قبلاً اضافه شده است.' });
        return;
    }
    
    await addUnit({ name, defaultQuantity: 1 });
    setNewUnitName('');
    toast({ title: 'واحد جدید با موفقیت اضافه شد.' });
  };

  const handleDeleteUnit = async (unitId: string) => {
    await removeUnit(unitId);
    toast({ title: 'واحد با موفقیت حذف شد.' });
  };

  const handleClearData = async () => {
    if (!user) return;
    await deleteAllUserData(user.uid);
    // After deleting, re-seed with default data
    const defaultData = getDefaultData();
    await batchAdd(user.uid, 'stores', defaultData.stores);
    await batchAdd(user.uid, 'categories', defaultData.categories);
    await batchAdd(user.uid, 'products', defaultData.products);
    await batchAdd(user.uid, 'customers', defaultData.customers);
    await batchAdd(user.uid, 'units', defaultData.units);
    await batchAdd(user.uid, 'invoices', defaultData.invoices);
    
    toast({
      title: 'اطلاعات پاک و بازنشانی شد',
      description: 'تمام داده‌های شما حذف و با اطلاعات پیش‌فرض جایگزین شد.',
    });
     // Force reload of all data in the app
    window.location.reload();
  };
  
  const handleLoadDefaults = async () => {
     if (!user) return;
    await handleClearData();
  };

  // Backup and Restore need significant changes to work with Firestore per user.
  // The logic is simplified here to backup/restore for the CURRENT user.
  const handleBackupData = async () => {
    if (!user) return;
    const collections: CollectionName[] = ['stores', 'categories', 'products', 'customers', 'invoices', 'units'];
    const backupData: Record<string, any> = { backupDate: new Date().toISOString() };

    for (const name of collections) {
      const { data } = useCollection(name as any);
      backupData[name] = data;
    }
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `hesabgar-backup-${user.uid}-${date}.json`;
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
    if (!file || !user) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File is not valid text.");
        }
        const data = JSON.parse(text);
        
        // Basic validation
        const requiredCollections = ['stores', 'categories', 'products', 'customers', 'units'];
        if (!requiredCollections.every(col => col in data)) {
             throw new Error("فایل پشتیبان معتبر نیست یا ناقص است.");
        }
        
        // Clear existing data before restoring
        await deleteAllUserData(user.uid);
        
        // Restore from backup
        for (const colName of requiredCollections) {
            if (data[colName] && Array.isArray(data[colName])) {
                // remove 'id' from each item before batch adding
                const itemsWithoutId = data[colName].map((item: any) => {
                    const { id, ...rest } = item;
                    return rest;
                });
                 await batchAdd(user.uid, colName as CollectionName, itemsWithoutId);
            }
        }
        // Invoices might not exist in older backups
        if (data.invoices && Array.isArray(data.invoices)) {
            const itemsWithoutId = data.invoices.map((item: any) => {
                const { id, ...rest } = item;
                return rest;
            });
            await batchAdd(user.uid, 'invoices', itemsWithoutId);
        }

        toast({
          title: 'بازیابی موفق',
          description: 'اطلاعات با موفقیت از فایل پشتیبان بازیابی شد. صفحه در حال بارگذاری مجدد است.',
        });

        // Reload to reflect changes everywhere
        setTimeout(() => window.location.reload(), 1500);

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'خطا در بازیابی',
          description: (error instanceof Error) ? error.message : 'فایل انتخاب شده معتبر نیست.',
        });
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="grid gap-6">
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle>تنظیمات</CardTitle>
          <CardDescription>
            تنظیمات کلی برنامه را مدیریت کنید.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
            <CardTitle>ظاهر برنامه</CardTitle>
            <CardDescription>
                حالت نمایش روشن، تاریک یا هماهنگ با سیستم را انتخاب کنید.
            </CardDescription>
            </CardHeader>
            <CardContent>
                <RadioGroup value={theme} onValueChange={setTheme}>
                    <div className="grid grid-cols-3 gap-4">
                        <Label htmlFor="theme-light" className="flex flex-col items-center justify-center gap-2 rounded-lg border p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                            <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                            <Sun className="h-6 w-6" />
                            <span>روشن</span>
                        </Label>
                         <Label htmlFor="theme-dark" className="flex flex-col items-center justify-center gap-2 rounded-lg border p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                            <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                            <Moon className="h-6 w-6" />
                            <span>تاریک</span>
                        </Label>
                         <Label htmlFor="theme-system" className="flex flex-col items-center justify-center gap-2 rounded-lg border p-4 cursor-pointer hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                            <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                            <Monitor className="h-6 w-6" />
                            <span>سیستم</span>
                        </Label>
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>
        
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
                <CardTitle>تم رنگی</CardTitle>
                <CardDescription>
                    رنگ اصلی برنامه را انتخاب کنید.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-5 gap-2">
                    {colorThemes.map(color => (
                        <Button 
                            key={color.name}
                            variant={activeColor === color.value ? 'default' : 'outline'}
                            size="icon" 
                            className="h-12 w-12 rounded-lg"
                            onClick={() => handleThemeColorChange(color.value)}
                        >
                            <span className="h-6 w-6 rounded-full" style={{ backgroundColor: `hsl(${color.value})` }}></span>
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>

        <Card className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
            <CardTitle>مدیریت واحدها</CardTitle>
            <CardDescription>
                واحدهای اندازه‌گیری قابل استفاده در فاکتورها را مدیریت کنید.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="grid gap-1.5 flex-grow">
                    <Label htmlFor="new-unit-name">نام واحد جدید</Label>
                    <Input
                        id="new-unit-name"
                        placeholder="مثال: کارتن"
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                    />
                </div>
                <Button onClick={handleAddUnit} className="self-end">
                    <PlusCircle className="ml-2 h-4 w-4" />
                    افزودن
                </Button>
            </div>
            <div className="flex flex-wrap gap-2 rounded-lg border p-4 min-h-[6rem]">
                {units.length > 0 ? units.map(unit => (
                    <Badge key={(unit as any).id} variant="secondary" className="text-base font-normal pl-2 pr-3 py-1">
                        <span>{unit.name}</span>
                        <button onClick={() => handleDeleteUnit((unit as any).id)} className="mr-2 rounded-full p-0.5 hover:bg-destructive/20 text-destructive">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )) : <p className="text-sm text-muted-foreground">هیچ واحدی تعریف نشده است.</p>}
            </div>
            </CardContent>
        </Card>
      </div>
      
      <Card className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <CardHeader>
          <CardTitle>پشتیبان‌گیری و بازیابی</CardTitle>
          <CardDescription>
            از داده‌های برنامه خود نسخه پشتیبان تهیه کرده یا آن‌ها را بازیابی کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
            <Button onClick={handleBackupData} variant="outline" disabled>
                <Download className="ml-2 h-4 w-4" />
                دانلود فایل پشتیبان (به زودی)
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

      <Card className="border-destructive animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        <CardHeader>
          <CardTitle className="text-destructive">منطقه خطر</CardTitle>
          <CardDescription>
            این عملیات غیرقابل بازگشت هستند. لطفا با احتیاط عمل کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
            <div>
              <h3 className="font-semibold text-destructive">پاک کردن تمام اطلاعات</h3>
              <p className="text-sm text-muted-foreground">
                تمام داده‌های برنامه (مشتریان، محصولات، فاکتورها، و غیره) برای همیشه حذف خواهند شد.
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
      
      <div className="fixed bottom-4 left-4 text-xs text-muted-foreground/50 z-10">
        <p>v1.0.0</p>
        <p>Created by Esmaeil Bahari</p>
      </div>
    </div>
  );
}
