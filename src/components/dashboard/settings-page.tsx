
'use client';

import { useRef, ChangeEvent, useState, useEffect } from 'react';
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
import type { Category, Customer, Invoice, Product, UnitOfMeasurement, Store } from '@/lib/definitions';
import { Download, Upload, Trash2, PlusCircle, X, RefreshCw, Monitor, Moon, Sun } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/components/auth/auth-provider';
import { useCollection } from '@/hooks/use-collection';
import { seedInitialData, deleteAllUserData, restoreDataFromBackup, getCollection } from '@/lib/firestore-service';

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  const { data: units, add: addUnit, remove: removeUnit } = useCollection<UnitOfMeasurement>('units');
  
  const [newUnitName, setNewUnitName] = useState('');

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
    toast({
      title: 'اطلاعات پاک شد',
      description: 'تمام داده‌های برنامه با موفقیت حذف شدند.',
    });
    // Consider forcing a reload of collections or the page
    window.location.reload();
  };
  
  const handleLoadDefaults = async () => {
    if (!user) return;
    await seedInitialData(user.uid);
    toast({
      title: 'داده‌های پیش‌فرض بارگذاری شد',
      description: 'تمام اطلاعات برنامه به حالت اولیه بازگردانده شد.',
    });
    window.location.reload();
  };


  const handleBackupData = async () => {
    if (!user) return;

    const backupData: any = {};
    const collections: (keyof ReturnType<typeof getDefaultData>)[] = ['stores', 'categories', 'products', 'customers', 'invoices', 'units'];
    
    for (const collectionName of collections) {
      backupData[collectionName] = await getCollection(user.uid, collectionName);
    }
    
    backupData.backupDate = new Date().toISOString();
    
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
    if (!user) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File is not valid text.");
        }
        const data = JSON.parse(text);
        
        await restoreDataFromBackup(user.uid, data);
        
        toast({
          title: 'بازیابی موفق',
          description: 'اطلاعات با موفقیت از فایل پشتیبان بازیابی شد.',
        });

        // Reload to reflect changes everywhere
        setTimeout(() => window.location.reload(), 1000);

      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'خطا در بازیابی',
          description: (error instanceof Error) ? error.message : 'فایل انتخاب شده معتبر نیست.',
        });
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) fileInputRef.current.value = '';
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
               {/* Color theme selection UI removed for simplicity as it requires CSS variable management not suitable for this interaction */}
               <p className="text-sm text-muted-foreground">قابلیت تغییر تم رنگی در این نسخه غیرفعال است.</p>
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
                    <Badge key={unit.id} variant="secondary" className="text-base font-normal pl-2 pr-3 py-1">
                        <span>{unit.name}</span>
                        <button onClick={() => handleDeleteUnit(unit.id!)} className="mr-2 rounded-full p-0.5 hover:bg-destructive/20 text-destructive">
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
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
            <div>
              <h3 className="font-semibold">بارگذاری داده‌های پیش‌فرض</h3>
              <p className="text-sm text-muted-foreground">
                تمام اطلاعات فعلی حذف شده و داده‌های اولیه برنامه جایگزین آن‌ها می‌شود.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                    <RefreshCw className='ml-2 h-4 w-4' />
                    بارگذاری پیش‌فرض
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>بارگذاری داده‌های پیش‌فرض؟</AlertDialogTitle>
                  <AlertDialogDescription>
                    این عمل تمام اطلاعات فعلی شما را پاک کرده و داده‌های اولیه برنامه را بارگذاری می‌کند. آیا مطمئن هستید؟
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLoadDefaults}>بله، بارگذاری کن</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
