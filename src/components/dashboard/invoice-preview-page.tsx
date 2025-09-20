
'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import type { Store, Customer, Invoice } from '@/lib/definitions';
import html2canvas from 'html2canvas';
import { useEffect, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';

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
}
export default function InvoicePreviewPage({ invoiceId, onBack }: InvoicePreviewPageProps) {
  
  const { data } = useData();
  const { toast } = useToast();
  const { invoices, products, stores, customers } = data;

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  const invoice = useMemo(() => invoices.find((inv) => inv.id === invoiceId), [invoices, invoiceId]);
  const customer = useMemo(() => customers.find((c) => c.id === invoice?.customerId), [customers, invoice]);
  
  const store = useMemo(() => {
    if (!invoice?.items.length) return stores[0] || undefined;
    const firstItem = invoice.items[0];
    const productInfo = products.find(p => p.id === firstItem?.productId);
    if (!productInfo) return stores[0] || undefined; // Fallback to first store
    return stores.find(s => s.id === productInfo.storeId) || stores[0];
  }, [invoice, products, stores]);



  useEffect(() => {
    if (invoice && customer) {
        const qrData = `Invoice No: ${invoice.invoiceNumber}\nCustomer: ${customer.name}\nTotal: ${formatCurrency(invoice.total)}`;
        QRCode.toDataURL(qrData, { width: 96, margin: 1 })
            .then(url => setQrCodeUrl(url))
            .catch(err => console.error('Failed to generate QR code:', err));
    }
  }, [invoice, customer]);

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

  const handleDownloadImage = () => {
    const invoiceElement = document.getElementById('invoice-card');
    if (invoiceElement) {
        toast({ title: 'در حال آماده‌سازی تصویر...', description: 'لطفا چند لحظه صبر کنید.' });

        // Add a small delay to ensure all fonts and images are rendered
        setTimeout(() => {
            const originalWidth = invoiceElement.style.width;
            invoiceElement.style.width = '1024px'; // Set a fixed width for consistent output

            html2canvas(invoiceElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                windowWidth: 1024,
                windowHeight: invoiceElement.scrollHeight, // Capture full height
                onclone: (document) => {
                    // This can be used to apply styles only for the screenshot
                }
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `invoice-${invoice.invoiceNumber}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                toast({ variant: 'success', title: 'دانلود شروع شد', description: 'تصویر فاکتور با موفقیت دانلود شد.' });
            }).catch(err => {
                console.error("html2canvas error:", err);
                toast({ variant: 'destructive', title: 'خطا در دانلود', description: 'مشکلی در ایجاد تصویر پیش آمد.' });
            }).finally(() => {
                // Restore original style
                invoiceElement.style.width = originalWidth;
            });
        }, 500); // 500ms delay
    }
  };

  return (
    <div className="animate-fade-in-up">
        <div className="bg-muted p-4 sm:p-8 rounded-lg no-print">
            <div className="flex justify-between gap-2 mb-6">
                <Button type="button" variant="outline" onClick={onBack}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    بازگشت
                </Button>
                <Button size="sm" variant="outline" className="h-10 gap-1" onClick={handleDownloadImage}>
                    <Download className="h-3.5 w-3.5" />
                    <span>دانلود تصویر</span>
                </Button>
            </div>
            <div className="max-w-5xl mx-auto bg-white p-4 sm:p-8 border text-black" id="invoice-card">
              <header className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex items-center justify-center w-1/6">
                      {qrCodeUrl && <Image src={qrCodeUrl} alt="QR Code" width={96} height={96} />}
                  </div>
                  <div className="text-center w-2/3">
                      <h1 className="text-xl font-bold">پیش فاکتور فروش</h1>
                      <h2 className="text-lg font-semibold">{store?.name}</h2>
                      <div className="flex justify-center gap-8 mt-2 text-sm">
                        <span>شماره: <span className="font-mono">{invoice.invoiceNumber}</span></span>
                        <span>تاریخ: <span className="font-mono">{new Date(invoice.date).toLocaleDateString('fa-IR')}</span></span>
                      </div>
                  </div>
                   <div className="w-1/6 flex justify-end">
                     {store.logoUrl && <Image src={store.logoUrl} alt="Store Logo" width={80} height={80} className="object-contain" />}
                   </div>
              </header>

              <section className="grid grid-cols-2 gap-4 mb-4 text-sm">
                 <div className="border rounded-md p-2">
                   <h3 className="font-bold border-b pb-1 mb-1">فروشنده</h3>
                   <p><strong>فروشگاه:</strong> {store.name}</p>
                   <p><strong>تلفن:</strong> {store.phone}</p>
                   <p><strong>آدرس:</strong> {store.address}</p>
                 </div>
                 <div className="border rounded-md p-2">
                   <h3 className="font-bold border-b pb-1 mb-1">خریدار</h3>
                   <p><strong>نام:</strong> {customer.name}</p>
                   <p><strong>تلفن:</strong> {customer.phone}</p>
                   <p><strong>آدرس:</strong> {customer.address}</p>
                 </div>
              </section>

              <section className="mt-4">
                <table className="w-full text-sm border-collapse border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border p-1 font-semibold">ردیف</th>
                      <th className="border p-1 font-semibold w-2/5 text-right">شرح کالا / خدمات</th>
                      <th className="border p-1 font-semibold">مقدار</th>
                      <th className="border p-1 font-semibold">واحد</th>
                      <th className="border p-1 font-semibold">مبلغ واحد</th>
                      <th className="border p-1 font-semibold">مبلغ کل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="border p-1 text-center">{index + 1}</td>
                        <td className="border p-1">{item.productName}</td>
                        <td className="border p-1 text-center font-mono">{item.quantity.toLocaleString('fa-IR')}</td>
                        <td className="border p-1 text-center">{item.unit}</td>
                        <td className="border p-1 text-center font-mono">{formatCurrency(item.unitPrice)}</td>
                        <td className="border p-1 text-center font-mono">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
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

               <footer className="border-t mt-4 pt-2 text-xs text-gray-600 space-y-1">
                  <p>۱. اعتبار پیش فاکتور ۲۴ ساعت می‌باشد.</p>
                  {store.bankAccountHolder && <p><strong>صاحب حساب:</strong> {store.bankAccountHolder} <span className="font-mono mx-2">{store.bankCardNumber}</span> {store.bankName}</p>}
               </footer>

            </div>
        </div>
    </div>
  );
}
