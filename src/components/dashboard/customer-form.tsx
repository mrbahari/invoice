
'use client';

import { useState, useEffect } from 'react';
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
import type { Customer } from '@/lib/definitions';
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
import { Trash2, ArrowRight, Copy } from 'lucide-react';
import { useData } from '@/context/data-context';


type CustomerFormProps = {
  customer?: Customer;
  onSave: () => void;
  onCancel: () => void;
};

export function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const { toast } = useToast();
  const isEditMode = !!customer;
  const { data, setData } = useData();


  const [name, setName] = useState(
    isEditMode && customer?.name === 'مشتری بدون نام' ? '' : customer?.name || ''
  );
  const [email, setEmail] = useState(
    isEditMode && customer?.email === 'ایمیل ثبت نشده' ? '' : customer?.email || ''
  );
  const [phone, setPhone] = useState(
    isEditMode && customer?.phone === 'شماره ثبت نشده' ? '' : customer?.phone || ''
  );
  const [address, setAddress] = useState(
    isEditMode && customer?.address === 'آدرس ثبت نشده' ? '' : customer?.address || ''
  );

  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const validateForm = () => {
    if (!phone) {
      toast({
        variant: 'destructive',
        title: 'فیلد الزامی خالی است',
        description: 'لطفاً شماره تماس مشتری را وارد کنید.',
      });
      return false;
    }
    return true;
  }
  
  const buildCustomerData = (): Omit<Customer, 'id'> => ({
    name: name || 'مشتری بدون نام',
    email: email || 'ایمیل ثبت نشده',
    phone: phone || 'شماره ثبت نشده',
    address: address || 'آدرس ثبت نشده',
    purchaseHistory: customer?.purchaseHistory || 'مشتری جدید',
  });


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);

    if (isEditMode && customer) {
      const updatedData = buildCustomerData();
       setData({ ...data, customers: data.customers.map(c => c.id === customer.id ? { ...c, ...updatedData } : c) });
      toast({
        variant: 'success',
        title: 'مشتری با موفقیت ویرایش شد',
        description: `تغییرات برای مشتری "${updatedData.name}" ذخیره شد.`,
      });
    } else {
      const newId = `cust-${Math.random().toString(36).substr(2, 9)}`;
      const newData = { ...buildCustomerData(), id: newId };
      setData({ ...data, customers: [newData, ...data.customers] });
      toast({
        variant: 'success',
        title: 'مشتری جدید ایجاد شد',
        description: `مشتری "${newData.name}" با موفقیت ایجاد شد.`,
      });
    }
    
    setIsProcessing(false);
    onSave();
  };
  
  const handleSaveAsCopy = async () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);
    const newId = `cust-${Math.random().toString(36).substr(2, 9)}`;
    const newData = { ...buildCustomerData(), id: newId };
    setData({ ...data, customers: [newData, ...data.customers] });
    toast({
      variant: 'success',
      title: 'مشتری جدید از روی کپی ایجاد شد',
      description: `مشتری جدید "${newData.name}" با موفقیت ایجاد شد.`,
    });
    
    setIsProcessing(false);
    onSave();
  }
  
  const handleDelete = async () => {
    if (!customer) return;

    setIsProcessing(true);
    setData({ ...data, customers: data.customers.filter(c => c.id !== customer.id) });
    toast({
      title: 'مشتری حذف شد',
      description: `مشتری "${customer.name}" با موفقیت حذف شد.`,
    });

    setIsProcessing(false);
    onSave();
  };
  
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.select();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-2xl mx-auto animate-fade-in-up">
        <CardHeader>
            <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle>
                        {isEditMode ? `ویرایش مشتری: ${customer?.name}` : 'افزودن مشتری جدید'}
                    </CardTitle>
                    <CardDescription>
                        اطلاعات مشتری را وارد کنید.
                    </CardDescription>
                </div>
                 <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    className="dark:bg-white dark:text-black dark:animate-pulse-slow"
                  >
                    <ArrowRight className="ml-2 h-4 w-4" />
                    بازگشت به لیست
                </Button>
            </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="customer-name">نام</Label>
            <Input
              id="customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={handleFocus}
              placeholder="مثال: شرکت نوآوران"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="grid gap-3">
                <Label htmlFor="customer-email">ایمیل (اختیاری)</Label>
                <Input
                id="customer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={handleFocus}
                placeholder="مثال: contact@innovate.com"
                />
            </div>
             <div className="grid gap-3">
                <Label htmlFor="customer-phone">تلفن</Label>
                <Input
                id="customer-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={handleFocus}
                placeholder="مثال: ۰۲۱-۵۵۵۰۱۰۱"
                required
                />
            </div>
          </div>
          <div className="grid gap-3">
            <Label htmlFor="customer-address">آدرس</Label>
            <Textarea
              id="customer-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={handleFocus}
              placeholder="آدرس کامل مشتری را وارد کنید..."
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col-reverse sm:flex-row justify-between gap-2">
          <div>
            {isEditMode && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" disabled={isProcessing}>
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف مشتری
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                    <AlertDialogDescription>
                        این عمل غیرقابل بازگشت است و مشتری «{customer.name}» را برای همیشه حذف می‌کند.
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
           <div className='flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto'>
              {isEditMode && (
                  <Button type="button" variant="outline" onClick={handleSaveAsCopy} disabled={isProcessing} className="w-full">
                     <Copy className="ml-2 h-4 w-4" />
                      ذخیره با عنوان جدید
                  </Button>
              )}
              <Button type="submit" disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-700">
                {isProcessing
                  ? isEditMode
                    ? 'در حال ذخیره...'
                    : 'در حال ایجاد...'
                  : isEditMode
                  ? 'ذخیره تغییرات'
                  : 'ایجاد مشتری'}
              </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
