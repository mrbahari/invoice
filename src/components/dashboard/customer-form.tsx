'use client';

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
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
} from '@/components/ui/alert-dialog';
import { Trash2, ArrowRight, Copy, Save, GripVertical, Upload, Loader2 } from 'lucide-react';
import { useData } from '@/context/data-context';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '../ui/separator';
import { FloatingToolbar } from './floating-toolbar';
import Image from 'next/image';
import { useUpload } from '@/hooks/use-upload';
import { Progress } from '../ui/progress';


type CustomerFormProps = {
  customer?: Customer;
  onSave: () => void;
  onCancel: () => void;
};

export function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const isEditMode = !!customer;
  const { addDocument, updateDocument, deleteDocument } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(customer?.avatarUrl || null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  const { uploadFile, progress, isUploading, error: uploadError } = useUpload();
  
  const validateForm = () => {
    if (!phone) {
      // Form is not valid
      return false;
    }
    return true;
  }
  
  const buildCustomerData = (): Partial<Customer> => ({
    name: name || 'مشتری بدون نام',
    email: email || 'ایمیل ثبت نشده',
    phone: phone || 'شماره ثبت نشده',
    address: address || 'آدرس ثبت نشده',
    purchaseHistory: customer?.purchaseHistory || 'مشتری جدید',
    createdAt: customer?.createdAt || new Date().toISOString(),
    avatarUrl: avatarUrl || `https://picsum.photos/seed/${phone || name}/200`,
  });


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);
    const customerData = buildCustomerData();

    if (isEditMode && customer) {
       await updateDocument('customers', customer.id, customerData);
    } else {
      await addDocument('customers', customerData as Omit<Customer, 'id'>);
    }
    
    setIsProcessing(false);
    onSave();
  };
  
  const handleSaveAsCopy = async () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);
    const newData = buildCustomerData();
    await addDocument('customers', newData as Omit<Customer, 'id'>);
    
    setIsProcessing(false);
    onSave();
  }
  
  const handleDelete = async () => {
    if (!customer) return;

    setIsProcessing(true);
    await deleteDocument('customers', customer.id);

    setIsProcessing(false);
    onSave();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const downloadedUrl = await uploadFile(file);
      if (downloadedUrl) {
          setAvatarUrl(downloadedUrl);
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.target.select();
  }

  return (
    <TooltipProvider>
    <form onSubmit={handleSubmit}>
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle><AlertDialogDescription>این عمل غیرقابل بازگشت است و مشتری «{customer?.name}» را برای همیشه حذف می‌کند.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter className="grid grid-cols-2 gap-2">
                <AlertDialogCancel>انصراف</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className='bg-destructive hover:bg-destructive/90'>حذف</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <FloatingToolbar pageKey="customer-form">
        <div className="flex flex-col items-center gap-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={onCancel}
                    className="text-muted-foreground w-8 h-8"
                    >
                    <ArrowRight className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>بازگشت به لیست</p></TooltipContent>
            </Tooltip>
            {isEditMode && (
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        disabled={isProcessing} 
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive w-8 h-8"
                        onClick={() => setIsDeleteAlertOpen(true)}
                      >
                          <Trash2 className="h-4 w-4" />
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left"><p>حذف مشتری</p></TooltipContent>
              </Tooltip>
            )}
            {isEditMode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" onClick={handleSaveAsCopy} disabled={isProcessing} className="w-8 h-8">
                      <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>ذخیره با عنوان جدید</p></TooltipContent>
              </Tooltip>
            )}
        </div>
        <Separator orientation="horizontal" className="w-6" />
        <div className="flex flex-col items-center gap-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button 
                      type="submit" 
                      disabled={isProcessing}
                      variant="ghost" 
                      size="icon"
                      className="w-10 h-10 bg-green-600 text-white hover:bg-green-700"
                    >
                        <Save className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>{isEditMode ? 'ذخیره تغییرات' : 'ایجاد مشتری'}</p></TooltipContent>
            </Tooltip>
        </div>
      </FloatingToolbar>
      <Card className="max-w-3xl mx-auto">
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
        <CardContent>
            <div className="grid md:grid-cols-[1fr_200px] gap-8">
                <div className="grid gap-6">
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
                </div>
                <div className="grid gap-4 auto-rows-min">
                    <Label>تصویر پروفایل</Label>
                    <div className="relative aspect-square w-full rounded-md border-2 border-dashed bg-muted flex items-center justify-center overflow-hidden">
                         {isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-white" />
                                <Progress value={progress} className="w-3/4 h-2" />
                            </div>
                        )}
                        {avatarUrl ? (
                            <Image src={avatarUrl} alt="آواتار مشتری" fill className="object-cover" key={avatarUrl} unoptimized/>
                        ) : (
                            !isUploading && <span className="text-sm text-muted-foreground">پیش‌نمایش</span>
                        )}
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="avatar-url" className="text-xs">آدرس تصویر</Label>
                        <Input id="avatar-url" value={avatarUrl || ''} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://example.com/img.png" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" className="w-full" onClick={handleUploadClick} disabled={isUploading}>
                            <Upload className="ml-2 h-4 w-4" />
                            آپلود
                        </Button>
                         <Button type="button" variant="destructive" className="w-full" onClick={() => setAvatarUrl(null)} disabled={isUploading || !avatarUrl}>
                            <Trash2 className="ml-2 h-4 w-4" />
                            حذف
                        </Button>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
                </div>
            </div>
        </CardContent>
      </Card>
    </form>
    </TooltipProvider>
  );
}
