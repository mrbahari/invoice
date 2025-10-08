
'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { formatCurrency, toPersianDigits } from '@/lib/utils';
import Image from 'next/image';
import type { Store, Customer, Invoice } from '@/lib/definitions';
import { useEffect, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { useData } from '@/context/data-context';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

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

export default function PublicInvoicePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const { data, isInitialized } = useData();
  const { invoices, stores, customers, products } = data;
  const invoiceId = params.invoiceId as string;

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  const invoice = useMemo(() => invoices.find((inv) => inv.id === invoiceId), [invoices, invoiceId]);
  
  const customer: Customer | undefined = useMemo(() => {
    if (!invoice) return undefined;
    return customers.find((c) => c.id === invoice.customerId) || {
      id: invoice.customerId,
      name: invoice.customerName,
      phone: (invoice as any).customerPhone || 'شماره ثبت نشده',
      address: (invoice as any).customerAddress || 'آدرس ثبت نشده',
      email: invoice.customerEmail || 'ایمیل ثبت نشده',
      purchaseHistory: 'مشتری جدید',
    };
  }, [customers, invoice]);
  
  const store = useMemo(() => {
    if (!invoice || !invoice.items || invoice.items.length === 0) return stores[0] || undefined;
    const firstItem = invoice.items[0];
    return stores.find(s => s.id === data.products.find(p => p.id === firstItem.productId)?.storeId) || stores[0] || undefined;
  }, [invoice, data.products, stores]);

  useEffect(() => {
    if (invoice && typeof window !== 'undefined') {
        const url = window.location.href;
        QRCode.toDataURL(url, { width: 96, margin: 1, errorCorrectionLevel: 'low' })
            .then(url => setQrCodeUrl(url))
            .catch(err => console.error('Failed to generate QR code:', err));
    }
  }, [invoice]);

  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  if (!invoice || !customer || !store) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-muted">
            <Card className="w-full max-w-md mx-4">
                <CardContent className="py-16 text-center">
                    <p className="text-muted-foreground mb-4">فاکتور مورد نظر یافت نشد.</p>
                     <Button onClick={() => router.push('/')}>
                        <ArrowRight className="ml-2 h-4 w-4" />
                        بازگشت به صفحه اصلی
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-muted p-4 sm:p-8 flex items-center justify-center">
        <div className="max-w-4xl w-full mx-auto bg-white p-4 sm:p-8 border text-black shadow-2xl rounded-lg" id="invoice-card">
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
                    const imageUrl = product?.imageUrl || item.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(item.productName)}/40/40`;
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
              <div className="space-y-1">
                <p><strong>توضیحات:</strong> {invoice.description}</p>
                <p className="font-bold pt-4">مبلغ به حروف: {toWords(Math.floor(invoice.total))} ریال</p>
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

            <footer className="border-t mt-4 pt-2 text-xs text-gray-600">
              <p>{toPersianDigits(1)}. اعتبار پیش فاکتور {toPersianDigits(24)} ساعت می‌باشد.</p>
               <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  {store.bankAccountHolder && <span><strong>صاحب حساب:</strong> {store.bankAccountHolder}</span>}
                  {store.bankName && <span className="hidden sm:inline">|</span>}
                  {store.bankName && <span><strong>بانک:</strong> {store.bankName}</span>}
                   {store.bankCardNumber && <span className="hidden sm:inline">|</span>}
                  {store.bankCardNumber && <span><strong>شماره کارت:</strong> <span className="font-mono" dir="ltr">{toPersianDigits(store.bankCardNumber)}</span></span>}
                  {store.bankAccountNumber && <span className="hidden sm:inline">|</span>}
                  {store.bankAccountNumber && <span><strong>شماره حساب:</strong> <span className="font-mono" dir="ltr">{toPersianDigits(store.bankAccountNumber)}</span></span>}
                  {store.bankIban && <span className="hidden sm:inline">|</span>}
                  {store.bankIban && <span><strong>شماره شبا:</strong> <span className="font-mono" dir="ltr">{toPersianDigits(store.bankIban)}</span></span>}
              </p>
            </footer>
        </div>
      </div>
  );
}
