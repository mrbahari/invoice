
'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Trash2, ArrowRight, Copy, Save, GripVertical } from 'lucide-react';
import { useData } from '@/context/data-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '../ui/separator';
import { FloatingToolbar } from './floating-toolbar';


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
    <TooltipProvider>
    <form onSubmit={handleSubmit}>
      <FloatingToolbar toolbarId="customer-form">
        <div className="flex items-center gap-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={onCancel}
                    className="text-muted-foreground w-12 h-12"
                    >
                    <ArrowRight className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>بازگشت به لیست</p></TooltipContent>
            </Tooltip>
            {isEditMode && (
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                disabled={isProcessing} 
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive w-12 h-12"
                              >
                                  <Trash2 className="h-5 w-5" />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>حذف مشتری</p></TooltipContent>
                      </Tooltip>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle><AlertDialogDescription>این عمل غیرقابل بازگشت است و مشتری «{customer.name}» را برای همیشه حذف می‌کند.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter className="grid grid-cols-2 gap-2">
                          <AlertDialogCancel>انصراف</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDelete} className='bg-destructive hover:bg-destructive/90'>حذف</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
            )}
            {isEditMode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" onClick={handleSaveAsCopy} disabled={isProcessing} className="w-12 h-12">
                      <Copy className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>ذخیره با عنوان جدید</p></TooltipContent>
              </Tooltip>
            )}
        </div>
        <Separator orientation="vertical" className="h-8" />
        <div className="flex items-center gap-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                      type="submit" 
                      disabled={isProcessing}
                      variant="ghost" 
                      size="icon"
                      className="w-14 h-14 bg-green-600 text-white hover:bg-green-700"
                    >
                        <Save className="h-6 w-6" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent><p>{isEditMode ? 'ذخیره تغییرات' : 'ایجاد مشتری'}</p></TooltipContent>
            </Tooltip>
        </div>
      </FloatingToolbar>
      <Card className="max-w-2xl mx-auto">
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
      </Card>
    </form>
    </TooltipProvider>
  );
}
