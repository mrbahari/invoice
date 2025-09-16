
'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/lib/definitions';
import { customers } from '@/lib/data';

type CustomerFormProps = {
  customer?: Customer;
};

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditMode = !!customer;

  const [name, setName] = useState(customer?.name || '');
  const [email, setEmail] = useState(customer?.email || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name) {
      toast({
        variant: 'destructive',
        title: 'فیلد الزامی خالی است',
        description: 'لطفاً نام مشتری را وارد کنید.',
      });
      return;
    }

    setIsProcessing(true);

    // Simulate API call
    setTimeout(() => {
      if (isEditMode && customer) {
        const customerIndex = customers.findIndex((c) => c.id === customer.id);
        if (customerIndex > -1) {
          customers[customerIndex] = {
            ...customers[customerIndex],
            name,
            email,
            phone,
            address,
          };
        }
        toast({
          title: 'مشتری با موفقیت ویرایش شد',
          description: `تغییرات برای مشتری "${name}" ذخیره شد.`,
        });
      } else {
        const newCustomer: Customer = {
          id: `cust-${Math.random().toString(36).substr(2, 9)}`,
          name,
          email: email || 'ایمیل ثبت نشده',
          phone: phone || 'تلفن ثبت نشده',
          address: address || 'آدرس ثبت نشده',
          purchaseHistory: 'مشتری جدید',
        };
        customers.unshift(newCustomer);
        toast({
          title: 'مشتری جدید ایجاد شد',
          description: `مشتری "${name}" با موفقیت ایجاد شد.`,
        });
      }

      setIsProcessing(false);
      router.push('/dashboard/customers');
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>
            {isEditMode ? `ویرایش مشتری: ${customer?.name}` : 'افزودن مشتری جدید'}
          </CardTitle>
          <CardDescription>
            اطلاعات مشتری را وارد کنید.
          </CardDescription>
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
                <Label htmlFor="customer-email">ایمیل</Label>
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
        <CardFooter className="justify-end">
          <Button type="submit" disabled={isProcessing}>
            {isProcessing
              ? isEditMode
                ? 'در حال ذخیره...'
                : 'در حال ایجاد...'
              : isEditMode
              ? 'ذخیره تغییرات'
              : 'ایجاد مشتری'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
