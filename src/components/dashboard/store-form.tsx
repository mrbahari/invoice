
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import type { Store, Category, Product } from '@/lib/definitions';
import { initialData } from '@/lib/data';
import { Upload, Trash2, ArrowRight, PlusCircle, Pencil, Save } from 'lucide-react';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/use-local-storage';
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

type StoreFormProps = {
  store?: Store;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (storeId: string) => void;
};

export function StoreForm({ store, onSave, onCancel, onDelete }: StoreFormProps) {
  const { toast } = useToast();
  const isEditMode = !!store;

  const [stores, setStores] = useLocalStorage<Store[]>('stores', initialData.stores);
  const [categories, setCategories] = useLocalStorage<Category[]>('categories', initialData.categories);
  const [products] = useLocalStorage<Product[]>('products', initialData.products);
  
  const [name, setName] = useState(store?.name || '');
  const [address, setAddress] = useState(store?.address || '');
  const [phone, setPhone] = useState(store?.phone || '');
  const [logoUrl, setLogoUrl] = useState<string | null>(store?.logoUrl || null);
  
  const [bankAccountHolder, setBankAccountHolder] = useState(store?.bankAccountHolder || '');
  const [bankName, setBankName] = useState(store?.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(store?.bankAccountNumber || '');
  const [bankIban, setBankIban] = useState(store?.bankIban || '');
  const [bankCardNumber, setBankCardNumber] = useState(store?.bankCardNumber || '');

  // Category Management State
  const [storeCategories, setStoreCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubCategoryNames, setNewSubCategoryNames] = useState<Record<string, string>>({}); // { parentId: 'new name' }
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');


  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (store) {
      setStoreCategories(categories.filter(c => c.storeId === store.id));
    }
  }, [store, categories]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = () => {
    if (!name) {
      toast({ variant: 'destructive', title: 'نام فروشگاه الزامی است.' });
      return;
    }
    
    setIsProcessing(true);

    const storeId = store?.id || `store-${Math.random().toString(36).substr(2, 9)}`;

    const newOrUpdatedStore: Store = {
      id: storeId,
      name,
      address,
      phone,
      logoUrl: logoUrl || `https://picsum.photos/seed/${Math.random()}/110/110`,
      bankAccountHolder,
      bankName,
      bankAccountNumber,
      bankIban,
      bankCardNumber,
    };
    
    // Update store
    if (isEditMode) {
      setStores(prev => prev.map(s => s.id === storeId ? newOrUpdatedStore : s));
    } else {
      setStores(prev => [newOrUpdatedStore, ...prev]);
    }

    // Update categories (delete removed, update existing, add new)
    const existingStoreCategoryIds = categories.filter(c => c.storeId === storeId).map(c => c.id);
    const currentCategoryIds = storeCategories.map(c => c.id);
    const deletedCategoryIds = existingStoreCategoryIds.filter(id => !currentCategoryIds.includes(id));
    
    const otherStoresCategories = categories.filter(c => c.storeId !== storeId);
    const finalCategories = [...otherStoresCategories, ...storeCategories.map(c => ({...c, storeId}))];
    
    setCategories(finalCategories);

    toast({ title: isEditMode ? 'فروشگاه با موفقیت ویرایش شد' : 'فروشگاه با موفقیت ایجاد شد' });
    setIsProcessing(false);
    onSave();
  };

  const handleDelete = () => {
    if (!store) return;
    // Add checks for related products/invoices if needed
    onDelete(store.id);
    toast({ title: 'فروشگاه حذف شد' });
  };
  
  // Category Handlers
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat: Category = {
      id: `cat-${Math.random().toString(36).substr(2, 9)}`,
      name: newCategoryName.trim(),
      storeId: store?.id || 'temp', // temp id until store is saved
    };
    setStoreCategories(prev => [...prev, newCat]);
    setNewCategoryName('');
  };

  const handleAddSubCategory = (parentId: string) => {
    const name = newSubCategoryNames[parentId]?.trim();
    if (!name) return;
    const newSubCat: Category = {
      id: `cat-${Math.random().toString(36).substr(2, 9)}`,
      name,
      storeId: store?.id || 'temp',
      parentId,
    };
    setStoreCategories(prev => [...prev, newSubCat]);
    setNewSubCategoryNames(prev => ({ ...prev, [parentId]: '' }));
  };

  const handleDeleteCategory = (categoryId: string) => {
     // Check if category has subcategories
    if (storeCategories.some(c => c.parentId === categoryId)) {
        toast({ variant: 'destructive', title: 'خطا', description: 'ابتدا زیردسته‌های این دسته را حذف کنید.' });
        return;
    }
    // Check if category is used by products
    if (products.some(p => p.subCategoryId === categoryId)) {
        toast({ variant: 'destructive', title: 'خطا', description: 'این دسته به یک یا چند محصول اختصاص داده شده است.' });
        return;
    }
    setStoreCategories(prev => prev.filter(c => c.id !== categoryId && c.parentId !== categoryId));
  };
  
  const handleStartEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  };
  
  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  };

  const handleSaveCategoryEdit = (categoryId: string) => {
    if (!editingCategoryName.trim()) return;
    setStoreCategories(prev => prev.map(c => 
      c.id === categoryId ? { ...c, name: editingCategoryName.trim() } : c
    ));
    handleCancelEditCategory();
  };


  const parentCategories = useMemo(() => storeCategories.filter(c => !c.parentId), [storeCategories]);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up grid gap-6">
        <Card>
            <CardHeader>
                <div className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>
                            {isEditMode ? `ویرایش فروشگاه: ${store?.name}` : 'افزودن فروشگاه جدید'}
                        </CardTitle>
                        <CardDescription>
                           اطلاعات اصلی، حساب بانکی و دسته‌بندی‌های فروشگاه را مدیریت کنید.
                        </CardDescription>
                    </div>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        <ArrowRight className="ml-2 h-4 w-4" />
                        بازگشت به لیست
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="grid gap-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="store-name">نام فروشگاه</Label>
                        <Input id="store-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: دکوربند" required />
                    </div>
                     <div className="grid gap-3">
                        <Label htmlFor="store-phone">تلفن</Label>
                        <Input id="store-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="مثال: ۰۲۱-۸۸۸۸۴۴۴۴" />
                    </div>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="store-address">آدرس</Label>
                    <Input id="store-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="مثال: میدان ولیعصر، برج فناوری" />
                </div>
                <div className="grid gap-4">
                    <Label>لوگوی فروشگاه</Label>
                    <div className='flex items-start gap-6'>
                      {logoUrl ? (
                        <div className="relative w-24 h-24">
                          <Image src={logoUrl} alt="پیش‌نمایش لوگو" layout="fill" objectFit="contain" className="rounded-md border p-2" key={logoUrl} unoptimized />
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
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>اطلاعات حساب بانکی</CardTitle>
                <CardDescription>این اطلاعات به صورت خودکار در فاکتورهای این فروشگاه نمایش داده می‌شود.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="bank-account-holder">نام صاحب حساب</Label>
                        <Input id="bank-account-holder" value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} placeholder="مثال: اسماعیل بهاری" />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="bank-name">نام بانک</Label>
                        <Input id="bank-name" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="مثال: بانک سامان" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="bank-account-number">شماره حساب</Label>
                        <Input id="bank-account-number" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="اختیاری" />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="bank-card-number">شماره کارت</Label>
                        <Input id="bank-card-number" value={bankCardNumber} onChange={(e) => setBankCardNumber(e.target.value)} placeholder="اختیاری" />
                    </div>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="bank-iban">شماره شبا (IBAN)</Label>
                    <Input id="bank-iban" value={bankIban} onChange={(e) => setBankIban(e.target.value)} placeholder="مثال: IR..." dir="ltr" className="text-left" />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>مدیریت دسته‌بندی‌ها</CardTitle>
                <CardDescription>دسته‌ها و زیردسته‌های محصولات این فروشگاه را تعریف کنید.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="flex gap-2">
                    <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="نام دسته اصلی جدید..." />
                    <Button onClick={handleAddCategory}><PlusCircle className="ml-2 h-4 w-4" /> افزودن دسته</Button>
                </div>
                <Separator />
                <div className="grid gap-4">
                    {parentCategories.map(cat => (
                        <div key={cat.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                {editingCategoryId === cat.id ? (
                                    <div className="flex-grow flex gap-2 items-center">
                                        <Input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} />
                                        <Button size="icon" variant="ghost" onClick={() => handleSaveCategoryEdit(cat.id)}><Save className="w-4 h-4" /></Button>
                                        <Button size="icon" variant="ghost" onClick={handleCancelEditCategory}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                    </div>
                                ) : (
                                    <h4 className="font-semibold">{cat.name}</h4>
                                )}
                                {!editingCategoryId && (
                                    <div className="flex gap-2">
                                        <Button size="icon" variant="ghost" onClick={() => handleStartEditCategory(cat)}><Pencil className="w-4 h-4" /></Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><Button size="icon" variant="ghost"><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>حذف دسته</AlertDialogTitle><AlertDialogDescription>آیا از حذف دسته «{cat.name}» و تمام زیردسته‌های آن مطمئن هستید؟</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCategory(cat.id)}>حذف</AlertDialogAction></AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )}
                            </div>
                            <div className="pl-4 mt-4 space-y-2">
                                {storeCategories.filter(sc => sc.parentId === cat.id).map(subCat => (
                                    <div key={subCat.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50">
                                         {editingCategoryId === subCat.id ? (
                                            <div className="flex-grow flex gap-2 items-center">
                                                <Input value={editingCategoryName} onChange={(e) => setEditingCategoryName(e.target.value)} />
                                                <Button size="icon" variant="ghost" onClick={() => handleSaveCategoryEdit(subCat.id)}><Save className="w-4 h-4" /></Button>
                                                <Button size="icon" variant="ghost" onClick={handleCancelEditCategory}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                            </div>
                                        ) : (
                                            <p className="text-sm">{subCat.name}</p>
                                        )}
                                        {!editingCategoryId && (
                                            <div className="flex gap-1">
                                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleStartEditCategory(subCat)}><Pencil className="w-4 h-4" /></Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7"><Trash2 className="w-4 h-4 text-destructive" /></Button></AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>حذف زیردسته</AlertDialogTitle><AlertDialogDescription>آیا از حذف زیردسته «{subCat.name}» مطمئن هستید؟</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>انصراف</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCategory(subCat.id)}>حذف</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div className="flex gap-2 pt-2">
                                    <Input value={newSubCategoryNames[cat.id] || ''} onChange={(e) => setNewSubCategoryNames(prev => ({ ...prev, [cat.id]: e.target.value }))} placeholder="نام زیردسته جدید..." />
                                    <Button variant="outline" size="sm" onClick={() => handleAddSubCategory(cat.id)}><PlusCircle className="ml-2 h-4 w-4" /> افزودن</Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {parentCategories.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">هنوز دسته‌ای برای این فروشگاه تعریف نشده است.</p>}
                </div>
            </CardContent>
        </Card>

        <CardFooter className="flex flex-col-reverse sm:flex-row justify-between gap-2">
            <div>
            {isEditMode && (
                <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" disabled={isProcessing}>
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف فروشگاه
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        این عمل غیرقابل بازگشت است و فروشگاه «{store.name}» و تمام دسته‌بندی‌های آن را برای همیشه حذف می‌کند.
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
            <Button type="button" onClick={handleSaveAll} disabled={isProcessing} size="lg" className="w-full sm:w-auto">
            {isProcessing ? 'در حال ذخیره...' : 'ذخیره کل تغییرات'}
            </Button>
        </CardFooter>
    </div>
  );
}
