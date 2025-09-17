
'use client';

import { useState } from 'react';
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
import { initialData } from '@/lib/data';
import { useLocalStorage } from '@/hooks/use-local-storage';
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

type CustomerFormProps = {
  customer?: Customer;
  onBack: () => void;
};

export function CustomerForm({ customer, onBack }: CustomerFormProps) {
  const { toast } = useToast();
  const isEditMode = !!customer;

  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', initialData.customers);
  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const validateForm = () => {
    if (!name || !phone) {
      toast({
        variant: 'destructive',
        title: 'فیلدهای الزامی خالی است',
        description: 'لطفاً نام و شماره تماس مشتری را وارد کنید.',
      });
      return false;
    }
    return true;
  }
  
  const buildCustomerData = (id: string): Customer => ({
    id,
    name,
    email: email || 'ایمیل ثبت نشده',
    phone,
    address: address || 'آدرس ثبت نشده',
    purchaseHistory: customer?.purchaseHistory || 'مشتری جدید',
  });


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);

    setTimeout(() => {
      if (isEditMode && customer) {
        const updatedCustomer = buildCustomerData(customer.id);
        setCustomers(prev => prev.map(c => 
            c.id === customer.id ? updatedCustomer : c
        ));
        toast({
          title: 'مشتری با موفقیت ویرایش شد',
          description: `تغییرات برای مشتری "${name}" ذخیره شد.`,
        });
      } else {
        const newCustomer = buildCustomerData(`cust-${Math.random().toString(36).substr(2, 9)}`);
        setCustomers(prev => [newCustomer, ...prev]);
        toast({
          title: 'مشتری جدید ایجاد شد',
          description: `مشتری "${name}" با موفقیت ایجاد شد.`,
        });
      }

      setIsProcessing(false);
      onBack();
    }, 1000);
  };
  
  const handleSaveAsCopy = () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);

    setTimeout(() => {
        const newCustomer = buildCustomerData(`cust-${Math.random().toString(36).substr(2, 9)}`);
        setCustomers(prev => [newCustomer, ...prev]);
        toast({
          title: 'مشتری جدید از روی کپی ایجاد شد',
          description: `مشتری جدید "${name}" با موفقیت ایجاد شد.`,
        });
        
        setIsProcessing(false);
        onBack();
    }, 1000);
  }
  
  const handleDelete = () => {
    if (!customer) return;

    setIsProcessing(true);
    setTimeout(() => {
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      toast({
        title: 'مشتری حذف شد',
        description: `مشتری "${customer.name}" با موفقیت حذف شد.`,
      });
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
                        {isEditMode ? `ویرایش مشتری: ${customer?.name}` : 'افزودن مشتری جدید'}
                    </CardTitle>
                    <CardDescription>
                        اطلاعات مشتری را وارد کنید.
                    </CardDescription>
                </div>
                 <Button type="button" variant="outline" onClick={onBack}>
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
              placeholder="مثال: شرکت نوآوران"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-3">
                <Label htmlFor="customer-email">ایمیل (اختیاری)</Label>
                <Input
                id="customer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              placeholder="آدرس کامل مشتری را وارد کنید..."
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
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
           <div className='flex gap-2'>
              {isEditMode && (
                  <Button type="button" variant="outline" onClick={handleSaveAsCopy} disabled={isProcessing}>
                     <Copy className="ml-2 h-4 w-4" />
                      ذخیره با عنوان جدید
                  </Button>
              )}
              <Button type="submit" disabled={isProcessing}>
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
