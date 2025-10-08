
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
import type { UnitOfMeasurement, AppData } from '@/lib/definitions';
import { Download, Upload, Trash2, PlusCircle, X, RefreshCw, Monitor, Moon, Sun, Loader2, Store } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useData } from '@/context/data-context';
import { cn } from '@/lib/utils';
import { useSearch } from './search-provider';
import { useToast } from '@/hooks/use-toast';
import defaultDb from '@/database/defaultdb.json';
import { useUser } from '@/firebase';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { AnimatePresence, motion } from 'framer-motion';


const colorThemes = [
    { name: 'Blue', value: '248 82% 50%'},
    { name: 'Rose', value: '340 82% 50%'},
    { name: 'Green', value: '142 64% 42%'},
    { name: 'Orange', value: '25 95% 53%'},
    { name: 'Purple', value: '262 84% 58%'},
];

type DataSection = keyof AppData;

const sectionLabels: Record<DataSection, string> = {
    stores: 'فروشگاه‌ها',
    categories: 'دسته‌بندی‌ها',
    products: 'محصولات',
    customers: 'مشتریان',
    invoices: 'فاکتورها',
    units: 'واحدها',
    toolbarPositions: 'تنظیمات نوار ابزار',
    userProfiles: 'پروفایل کاربران',
};

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();
  const { data, setData, clearCollections, loadDataBatch } = useData();
  const { user } = useUser();
  const { setSearchVisible } = useSearch();
  const { toast } = useToast();

  const [activeColor, setActiveColor] = useState(colorThemes[0].value);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataToRestore, setDataToRestore] = useState<AppData | null>(null);
  const [selectedSections, setSelectedSections] = useState<Record<DataSection, boolean>>({
    stores: false,
    categories: false,
    products: false,
    customers: false,
    invoices: false,
    units: false,
    toolbarPositions: false,
    userProfiles: false,
  });

  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [targetStoreId, setTargetStoreId] = useState('');

  useEffect(() => {
    setSearchVisible(false);
    return () => setSearchVisible(true);
  }, [setSearchVisible]);

  useEffect(() => {
      const needsSelection = (selectedSections.products || selectedSections.categories || selectedSections.units) && !selectedSections.stores;
      setShowStoreSelector(needsSelection);
      if (!needsSelection) {
        setTargetStoreId(''); // Reset if condition is no longer met
      }
  }, [selectedSections]);


  const handleThemeColorChange = (colorValue: string) => {
    setActiveColor(colorValue);
    const [h, s, l] = colorValue.split(' ').map(val => parseFloat(val.replace('%', '')));
    
    // Set Primary and Ring color
    document.documentElement.style.setProperty('--primary-hsl', colorValue);
    document.documentElement.style.setProperty('--ring-hsl', colorValue);
    
    // Set Background color
    if (theme === 'dark') {
        const backgroundLightness = 8;
        document.documentElement.style.setProperty('--background-hsl', `${h} ${s}% ${backgroundLightness}%`);
    } else {
        // Keep background white in light mode
        document.documentElement.style.setProperty('--background-hsl', '0 0% 100%');
    }

    // Set Foreground color for readability
    const foregroundLightness = theme === 'dark' ? 98 : 8;
     document.documentElement.style.setProperty('--foreground-hsl', `${h} 10% ${foregroundLightness}%`);

  };
  
  // Apply theme when component mounts or theme/activeColor changes
  useEffect(() => {
    handleThemeColorChange(activeColor);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, activeColor]);


  const handleClearData = async () => {
    if(!user) {
        toast({ variant: 'destructive', title: 'خطا', description: 'برای پاک کردن اطلاعات باید وارد شوید.' });
        return;
    }
    setIsProcessing(true);
    try {
      const allCollections = Object.keys(sectionLabels) as DataSection[];
      await clearCollections(allCollections);
      toast({ variant: 'success', title: 'اطلاعات پاک شد', description: 'تمام داده‌های شما با موفقیت حذف شد.' });
    } catch (error) {
       toast({ variant: 'destructive', title: 'خطا', description: 'مشکلی در پاک کردن اطلاعات رخ داد.' });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleLoadDefaults = async () => {
    if(!user) {
        toast({ variant: 'destructive', title: 'خطا', description: 'برای بارگذاری اطلاعات باید وارد شوید.' });
        return;
    }
    setIsProcessing(true);
    try {
      await loadDataBatch(defaultDb as AppData, false);
      toast({ variant: 'success', title: 'بارگذاری موفق', description: 'داده‌های پیش‌فرض با موفقیت بارگذاری شد.' });
    } catch (error) {
       toast({ variant: 'destructive', title: 'خطا', description: 'مشکلی در بارگذاری داده‌های پیش‌فرض رخ داد.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackupData = () => {
    const backupData = {
      ...data, // get all data from the context
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
    
  };

  const processFile = (file: File) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'خطا', description: 'برای بازیابی اطلاعات باید وارد شوید.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("فایل پشتیبان معتبر نیست.");
        }
        const restoredData = JSON.parse(text) as AppData;
        setDataToRestore(restoredData);
        setSelectedSections({
          stores: false, categories: false, products: false,
          customers: false, invoices: false, units: false, toolbarPositions: false, userProfiles: false
        });
        setShowStoreSelector(false);
        setTargetStoreId('');
      } catch (error: any) {
        console.error("Error parsing backup file:", error);
        toast({ variant: 'destructive', title: 'خطا در خواندن فایل', description: error.message || 'فایل پشتیبان نامعتبر است.' });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Use a timeout to ensure the file dialog is closed before processing
      setTimeout(() => processFile(file), 100);
    }
  };

  const handleConfirmRestore = async () => {
    if (!dataToRestore || !user) return;

    const sectionsToRestore = (Object.keys(selectedSections) as DataSection[]).filter(
        key => selectedSections[key]
    );

    if (sectionsToRestore.length === 0) {
        toast({ variant: 'default', title: 'بخشی انتخاب نشده است', description: 'لطفاً حداقل یک بخش را برای بازیابی انتخاب کنید.'});
        return;
    }
    
    if (showStoreSelector && !targetStoreId) {
        if (data.stores.length === 0) {
            toast({ variant: 'destructive', title: 'فروشگاه مقصد وجود ندارد', description: 'لطفاً ابتدا یک فروشگاه ایجاد کنید یا از فایل پشتیبان فروشگاه‌ها را نیز وارد کنید.' });
        } else {
             toast({ variant: 'destructive', title: 'فروشگاه مقصد انتخاب نشده', description: 'لطفاً یک فروشگاه را برای وارد کردن اطلاعات انتخاب کنید.' });
        }
        return;
    }

    setIsProcessing(true);
    
    try {
        const dataToLoad: Partial<AppData> = {};
        for (const section of sectionsToRestore) {
            if (dataToRestore[section]) {
                (dataToLoad as any)[section] = dataToRestore[section];
            }
        }
        
        await loadDataBatch(dataToLoad, true, showStoreSelector ? targetStoreId : undefined);

        toast({ variant: 'success', title: 'بازیابی موفق', description: 'اطلاعات انتخاب شده با موفقیت به داده‌های فعلی اضافه شد.' });
        setDataToRestore(null);

    } catch (error) {
        toast({ variant: 'destructive', title: 'خطا در بازیابی', description: 'مشکلی در فرآیند بازیابی اطلاعات رخ داد.'});
    } finally {
        setIsProcessing(false);
        setShowStoreSelector(false);
        setTargetStoreId('');
    }
  };


  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const isRestoreConfirmDisabled = Object.values(selectedSections).every(v => !v) || (showStoreSelector && !targetStoreId);
  
  const handleCloseDialog = () => {
    setDataToRestore(null);
    setShowStoreSelector(false);
    setTargetStoreId('');
  }

  return (
    <>
      <AlertDialog open={!!dataToRestore} onOpenChange={(open) => !open && handleCloseDialog()}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>بازیابی اطلاعات از فایل</AlertDialogTitle>
             <AlertDialogDescription>
              بخش‌هایی را که می‌خواهید بازیابی شوند، انتخاب کنید. داده‌های جدید به داده‌های فعلی اضافه شده و از موارد تکراری جلوگیری می‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[60vh] overflow-y-auto p-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                {(Object.keys(sectionLabels) as DataSection[]).map((key) => {
                    const items = dataToRestore ? (dataToRestore[key] as any[]) : [];
                    const count = Array.isArray(items) ? items.length : (items ? 1 : 0);
                    if (count === 0) return null; // Don't show empty sections
                    
                    return (
                        <div key={key} className="flex items-center space-x-2 space-x-reverse rounded-md border p-3 hover:bg-accent has-[:checked]:bg-accent/50 has-[:checked]:border-primary/50">
                            <Checkbox
                                id={`check-${key}`}
                                checked={selectedSections[key]}
                                onCheckedChange={(checked) => {
                                    setSelectedSections(prev => ({...prev, [key]: !!checked}))
                                }}
                            />
                            <Label htmlFor={`check-${key}`} className="flex-1 cursor-pointer">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">{sectionLabels[key]}</span>
                                    <Badge variant="secondary">{count.toLocaleString('fa-IR')} مورد</Badge>
                                </div>
                            </Label>
                        </div>
                    );
                })}
            </div>

            <AnimatePresence>
              {showStoreSelector && (
                 <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                 >
                    <div className="grid gap-4 py-4 border-t">
                        <div className="flex items-center gap-3 p-3 border rounded-lg bg-amber-500/10 text-amber-800 dark:text-amber-300">
                            <Store className="h-5 w-5"/>
                            <p className="font-semibold text-sm">
                                لطفاً فروشگاه مقصد را برای وارد کردن محصولات/دسته‌بندی‌ها انتخاب کنید.
                            </p>
                        </div>
                        <Select value={targetStoreId} onValueChange={setTargetStoreId}>
                            <SelectTrigger>
                                <SelectValue placeholder="یک فروشگاه را برای وارد کردن اطلاعات انتخاب کنید..." />
                            </SelectTrigger>
                            <SelectContent>
                                {data.stores.map(store => (
                                    <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                  </motion.div>
              )}
            </AnimatePresence>

          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDialog} variant="destructive">انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestore} disabled={isProcessing || isRestoreConfirmDisabled} className="bg-green-600 hover:bg-green-700">
              {isProcessing ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              تایید و بازیابی
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-6" data-main-page="true">
        <Card>
          <CardHeader>
            <CardTitle>تنظیمات</CardTitle>
            <CardDescription>
              تنظیمات کلی برنامه را مدیریت کنید.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
              <CardHeader>
              <CardTitle>ظاهر برنامه</CardTitle>
              <CardDescription>
                  حالت نمایش روشن, تاریک یا هماهنگ با سیستم را انتخاب کنید.
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
          
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>پشتیبان‌گیری و بازیابی</CardTitle>
            <CardDescription>
              از داده‌های برنامه خود نسخه پشتیبان تهیه کرده یا آن‌ها را بازیابی کنید.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
              <Button onClick={handleBackupData} variant="outline" disabled={isProcessing}>
                  <Download className="ml-2 h-4 w-4" />
                  دانلود فایل پشتیبان (Backup)
              </Button>
              <div>
                <Button onClick={handleRestoreClick} variant="outline" className="w-full" disabled={isProcessing}>
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
          <CardContent className="grid gap-4">
            {isProcessing ? (
               <div className="flex items-center justify-center p-4 min-h-[160px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="mr-4 text-muted-foreground">در حال پردازش...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div>
                    <h3 className="font-semibold text-destructive">پاک کردن تمام اطلاعات</h3>
                    <p className="text-sm text-muted-foreground">
                      تمام داده‌های برنامه (مشتریان، محصولات، فاکتورها، و غیره) برای همیشه حذف شده و برنامه به حالت اولیه باز می‌گردد.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={isProcessing}>
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
                      <AlertDialogFooter className="grid grid-cols-2 gap-2">
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
                      اطلاعات فعلی با داده‌های اولیه برنامه جایگزین می‌شود. این عمل داده‌های فعلی را بازنویسی می‌کند.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" disabled={isProcessing}>
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
                      <AlertDialogFooter className="grid grid-cols-2 gap-2">
                        <AlertDialogCancel>انصراف</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLoadDefaults} className="bg-green-600 hover:bg-green-700">بله، بارگذاری کن</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
