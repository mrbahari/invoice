
'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { formatCurrency, toPersianDigits } from '@/lib/utils';
import { ArrowRight, Pencil, Camera, GripVertical, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import type { Store, Customer, Invoice } from '@/lib/definitions';
import { useEffect, useState, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FloatingToolbar } from './floating-toolbar';


function toWords(num: number): string {
  if (num === 0) return "صفر";
  const absNum = Math.abs(num);
  let words = "";

  const units = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
  const teens = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
  const tens = ["", "ده", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
  const hundreds = ["", "یکصد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
  const thousands = ["", " هزار", " میلیون", " میلیارد", " تریلیون"];

  function convertThreeDigits(n: number): string {
    let result = "";
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (h > 0) {
      result += hundreds[h];
      if (t > 0 || u > 0) result += " و ";
    }

    if (t > 1) {
      result += tens[t];
      if (u > 0) result += " و ";
    } else if (t === 1) {
      result += teens[u];
    } else if (u > 0) {
      result += units[u];
    }
    
    return result;
  }

  if (absNum === 0) {
    return "صفر";
  }

  let tempNum = absNum;
  let i = 0;
  let parts: string[] = [];

  while (tempNum > 0) {
    let chunk = tempNum % 1000;
    if (chunk > 0) {
      parts.push(convertThreeDigits(chunk) + thousands[i]);
    }
    tempNum = Math.floor(tempNum / 1000);
    i++;
  }

  words = parts.reverse().join(" و ");

  if (num < 0) {
      return "منفی " + words;
  }
  
  return words;
}


type InvoicePreviewPageProps = {
    invoiceId: string;
    onBack: () => void;
    onEdit: (invoiceId: string) => void;
}
export default function InvoicePreviewPage({ invoiceId, onBack, onEdit }: InvoicePreviewPageProps) {
  
  const { data } = useData();
  const { toast } = useToast();
  const { invoices, products, stores, customers } = data;

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  const invoice = useMemo(() => invoices.find((inv) => inv.id === invoiceId), [invoices, invoiceId]);
  
  const customer: Customer | undefined = useMemo(() => {
    if (!invoice) return undefined;
    const foundCustomer = customers.find((c) => c.id === invoice.customerId);
    if (foundCustomer) return foundCustomer;
    // Fallback to a temporary customer object if no customer is found by ID
    return {
      id: invoice.customerId,
      name: invoice.customerName,
      phone: (invoice as any).customerPhone || 'شماره ثبت نشده',
      address: (invoice as any).customerAddress || 'آدرس ثبت نشده',
      email: invoice.customerEmail || 'ایمیل ثبت نشده',
      purchaseHistory: 'مشتری جدید',
    };
  }, [customers, invoice]);
  
  const store = useMemo(() => {
    if (!invoice) return stores[0] || undefined;
    
    // Find store from the first product, if items exist
    if (invoice.items && invoice.items.length > 0) {
        const firstItem = invoice.items[0];
        const productInfo = products.find(p => p.id === firstItem?.productId);
        if (productInfo && productInfo.storeId) {
            const foundStore = stores.find(s => s.id === productInfo.storeId);
            if (foundStore) return foundStore;
        }
    }
    // Fallback to the first store if no items or store not found
    return stores[0] || undefined;
  }, [invoice, products, stores]);

  useEffect(() => {
    if (invoice && typeof window !== 'undefined') {
        const url = `${window.location.origin}/invoice-preview/${invoice.id}`;
        QRCode.toDataURL(url, { width: 96, margin: 1, errorCorrectionLevel: 'low' })
            .then(url => setQrCodeUrl(url))
            .catch(err => console.error('Failed to generate QR code:', err));
    }
  }, [invoice]);

  const handleDownloadImage = () => {
    const element = document.getElementById('invoice-card');
    if (!element) return;
  
    // Use the natural width of the element for a better capture
    const elementWidth = element.offsetWidth;
  
    html2canvas(element, {
      scale: 1.5, // Increase scale for better resolution
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: elementWidth,
      windowWidth: elementWidth,
      x: -window.scrollX,
      y: 0,
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = `invoice-${invoice?.invoiceNumber || 'preview'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  const handleCopyLink = () => {
    if (!invoiceId) return;
    const url = `${window.location.origin}/invoice-preview/${invoiceId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: 'لینک کپی شد',
        description: 'لینک پیش‌نمایش فاکتور در کلیپ‌بورد شما ذخیره شد.',
        variant: 'success',
      });
    }).catch(err => {
      console.error('Failed to copy link: ', err);
      toast({
        title: 'خطا در کپی کردن',
        description: 'امکان کپی کردن لینک وجود نداشت.',
        variant: 'destructive',
      });
    });
  };


  if (!invoice || !customer || !store) {
    return (
        <Card>
            <CardContent className="py-16 text-center">
                <p className="text-muted-foreground mb-4">فاکتور یافت نشد یا داده‌های آن ناقص است.</p>
                 <Button onClick={onBack}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    بازگشت
                </Button>
            </CardContent>
        </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="pb-24">
        {/* Floating Action Bar */}
         <FloatingToolbar pageKey="invoice-preview">
             <div className="flex flex-col items-center gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="w-8 h-8" onClick={onBack}>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>بازگشت</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => onEdit(invoiceId)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>ویرایش</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="w-8 h-8" onClick={handleCopyLink}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>کپی لینک</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="w-8 h-8" onClick={handleDownloadImage}>
                            <Camera className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>دانلود عکس</p></TooltipContent>
                </Tooltip>
            </div>
        </FloatingToolbar>

        <div className="max-w-4xl mx-auto bg-white p-4 sm:p-8 border text-black select-none" id="invoice-card">
          <header className="flex justify-between items-start gap-4 mb-4">
              <div className="flex items-center justify-center w-1/6">
                  {qrCodeUrl && <Image src={qrCodeUrl} alt="QR Code" width={96} height={96} />}
              </div>
              <div className="text-center w-2/3">
                  <h1 className="text-xl font-bold">پیش فاکتور فروش</h1>
                  <h2 className="text-lg font-semibold">{store?.name}</h2>
                  <div className="flex justify-center gap-8 mt-2 text-sm">
                    <span>شماره: <span className="font-mono">{toPersianDigits(invoice.invoiceNumber)}</span></span>
                    <span>تاریخ: <span className="font-mono">{new Date(invoice.date).toLocaleDateString('fa-IR')}</span></span>
                  </div>
              </div>
                <div className="w-1/6 flex justify-end">
                  {store.logoUrl && <Image src={store.logoUrl} alt="Store Logo" width={80} height={80} className="object-contain" unoptimized />}
                </div>
          </header>

          <section className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="border rounded-md p-2">
                <h3 className="font-bold border-b pb-1 mb-1">فروشنده</h3>
                <p><strong>فروشگاه:</strong> {store.name}</p>
                <p><strong>تلفن:</strong> {toPersianDigits(store.phone)}</p>
                <p><strong>آدرس:</strong> {store.address}</p>
              </div>
              <div className="border rounded-md p-2">
                <h3 className="font-bold border-b pb-1 mb-1">خریدار</h3>
                <p><strong>تلفن:</strong> {toPersianDigits(customer.phone)}</p>
                <p><strong>نام:</strong> {customer.name}</p>
                <p><strong>آدرس:</strong> {customer.address}</p>
              </div>
          </section>

          <section className="mt-4">
            <table className="w-full text-sm border-collapse border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-1 font-semibold">ردیف</th>
                  <th className="border p-1 font-semibold w-[48px]">تصویر</th>
                  <th className="border p-1 font-semibold w-2/5 text-right">شرح کالا / خدمات</th>
                  <th className="border p-1 font-semibold">مقدار</th>
                  <th className="border p-1 font-semibold">واحد</th>
                  <th className="border p-1 font-semibold">مبلغ واحد</th>
                  <th className="border p-1 font-semibold">مبلغ کل</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => {
                   const product = products.find(p => p.id === item.productId);
                   const imageUrl = item.imageUrl || product?.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(item.productName)}/40/40`;
                   return (
                  <tr key={index}>
                    <td className="border p-1 text-center">{toPersianDigits(index + 1)}</td>
                     <td className="border p-1">
                        {imageUrl && (
                            <Image 
                                src={imageUrl} 
                                alt={item.productName} 
                                width={40} 
                                height={40} 
                                className="object-cover rounded-md mx-auto"
                            />
                        )}
                    </td>
                    <td className="border p-1">{item.productName}</td>
                    <td className="border p-1 text-center font-mono">{toPersianDigits(item.quantity)}</td>
                    <td className="border p-1 text-center">{item.unit}</td>
                    <td className="border p-1 text-center font-mono">{formatCurrency(item.unitPrice)}</td>
                    <td className="border p-1 text-center font-mono">{formatCurrency(item.totalPrice)}</td>
                  </tr>
                )})}
              </tbody>
            </table>
          </section>

          <section className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div className="space-y-2 text-xs">
              <p><strong>اعتبار پیش فاکتور:</strong> {toPersianDigits(24)} ساعت می‌باشد.</p>
              {store.bankAccountHolder && <p><strong>صاحب حساب:</strong> {store.bankAccountHolder}</p>}
              {store.bankName && <p><strong>نام بانک:</strong> {store.bankName}</p>}
              {store.bankCardNumber && <p><strong>شماره کارت:</strong> <span className="font-mono" dir="ltr">{toPersianDigits(store.bankCardNumber)}</span></p>}
              {store.bankAccountNumber && <p><strong>شماره حساب:</strong> <span className="font-mono" dir="ltr">{toPersianDigits(store.bankAccountNumber)}</span></p>}
              {store.bankIban && <p><strong>شماره شبا:</strong> <span className="font-mono" dir="ltr">{toPersianDigits(store.bankIban)}</span></p>}
            </div>
            <div className="border rounded-md p-2 space-y-1">
              <p className="flex justify-between"><strong>جمع جزء:</strong> <span className="font-mono">{formatCurrency(invoice.subtotal)}</span></p>
              {invoice.discount > 0 && <p className="flex justify-between"><strong>تخفیف:</strong> <span className="font-mono text-red-600">-{formatCurrency(invoice.discount)}</span></p>}
              {invoice.additions > 0 && <p className="flex justify-between"><strong>اضافات:</strong> <span className="font-mono">{formatCurrency(invoice.additions)}</span></p>}
              {invoice.tax > 0 && <p className="flex justify-between"><strong>مالیات:</strong> <span className="font-mono">{formatCurrency(invoice.tax)}</span></p>}
              <hr className="my-1 border-dashed" />
              <p className="flex justify-between font-bold text-base"><strong>جمع کل:</strong> <span className="font-mono">{formatCurrency(invoice.total)}</span></p>
            </div>
          </section>
          
          <section className="mt-4 pt-4 border-t text-sm">
                <p className="font-bold">مبلغ به حروف: {toWords(Math.floor(invoice.total))} ریال</p>
                <p className="mt-2"><strong>توضیحات:</strong> {invoice.description}</p>
          </section>

        </div>
    </div>
    </TooltipProvider>
  );
}

    