
'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { initialData } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import { Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category, Customer, Invoice, Product } from '@/lib/definitions';
import html2canvas from 'html2canvas';
import { useEffect, useState, useMemo } from 'react';
import QRCode from 'qrcode';

function toWords(num: number): string {
    const units = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
    const teens = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
    const tens = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
    const hundreds = ["", "یکصد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
    const thousands = ["", " هزار", " میلیون", " میلیارد", " تریلیون"];

    if (num === 0) return "صفر";
    if (num < 0) return "منفی " + toWords(Math.abs(num));

    let word = "";
    let i = 0;

    while (num > 0) {
        let chunk = num % 1000;
        if (chunk > 0) {
            let chunkWord = "";
            let h = Math.floor(chunk / 100);
            if (h > 0) {
                chunkWord += hundreds[h];
                if (chunk % 100 > 0) chunkWord += " و ";
            }
            let t = chunk % 100;
            if (t > 0) {
                if (t < 10) {
                    chunkWord += units[t];
                } else if (t < 20) {
                    chunkWord += teens[t - 10];
                } else {
                    chunkWord += tens[Math.floor(t / 10)];
                    if (t % 10 > 0) {
                        chunkWord += " و " + units[t % 10];
                    }
                }
            }
            word = chunkWord + thousands[i] + (word ? " و " : "") + word;
        }
        num = Math.floor(num / 1000);
        i++;
    }

    return word.trim();
}

type InvoicePreviewPageProps = {
    invoiceId: string;
    onBack: () => void;
}
export default function InvoicePreviewPage({ invoiceId, onBack }: InvoicePreviewPageProps) {
  
  const [invoices] = useLocalStorage<Invoice[]>('invoices', initialData.invoices);
  const [products] = useLocalStorage<Product[]>('products', initialData.products);
  const [categories] = useLocalStorage<Category[]>('categories', initialData.categories);
  const [customers] = useLocalStorage<Customer[]>('customers', initialData.customers);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  const invoice = useMemo(() => invoices.find((inv) => inv.id === invoiceId), [invoices, invoiceId]);
  const customer = useMemo(() => customers.find((c) => c.id === invoice?.customerId), [customers, invoice]);


  useEffect(() => {
    if (invoice && customer) {
        const qrData = `Invoice No: ${invoice.invoiceNumber}\nCustomer: ${customer.name}\nTotal: ${formatCurrency(invoice.total)}`;
        QRCode.toDataURL(qrData, { width: 96, margin: 1 })
            .then(url => {
                setQrCodeUrl(url);
            })
            .catch(err => {
                console.error('Failed to generate QR code:', err);
            });
    }
  }, [invoice, customer]);

  if (!invoice) {
    return (
        <Card>
            <CardContent className="py-16 text-center">
                <p className="text-muted-foreground mb-4">فاکتور مورد نظر یافت نشد.</p>
                 <Button onClick={onBack}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    بازگشت به لیست فاکتورها
                </Button>
            </CardContent>
        </Card>
    );
  }
  
  if(!customer) {
      // Data might be inconsistent for a moment
      return null;
  }

  const firstItem = invoice.items[0];
  const productInfo = products.find(p => p.id === firstItem?.productId);
  const category = categories.find(c => c.id === productInfo?.categoryId);
  
  const handleDownloadImage = () => {
    const invoiceElement = document.getElementById('invoice-card');
    if (invoiceElement) {
        // Temporarily set a fixed width for consistent image output
        const originalWidth = invoiceElement.style.width;
        invoiceElement.style.width = '1024px';

        html2canvas(invoiceElement, {
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff',
            windowWidth: 1024, // Ensure canvas width matches
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `invoice-${invoice?.invoiceNumber}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).finally(() => {
            // Revert the width back to its original state
            invoiceElement.style.width = originalWidth;
        });
    }
  };

  return (
    <div id="invoice-preview" className="font-sans animate-fade-in-up">
        <div className="bg-muted p-4 sm:p-8 rounded-lg no-print">
            <div className="flex justify-between gap-2 mb-6">
                <Button type="button" variant="outline" onClick={onBack}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    بازگشت به لیست
                </Button>
                <Button size="sm" variant="outline" className="h-10 gap-1" onClick={handleDownloadImage}>
                    <Download className="h-3.5 w-3.5" />
                    <span>دانلود تصویر</span>
                </Button>
            </div>
            <div className="max-w-5xl mx-auto bg-white p-8 border" id="invoice-card">
              {/* Header */}
              <table className="w-full mb-4">
                <tbody>
                  <tr>
                    <td className="w-1/6 align-top">
                      <div className="flex items-center justify-start h-full">
                        {qrCodeUrl && (
                            <Image
                                src={qrCodeUrl}
                                alt="QR Code"
                                width={96}
                                height={96}
                            />
                        )}
                      </div>
                    </td>
                    <td className="w-2/3 text-center align-top">
                      <h1 className="text-xl font-bold">پیش فاکتور فروش</h1>
                      <h2 className="text-lg font-semibold">{category?.storeName}</h2>
                      <p className="text-sm">{category?.description}</p>
                      <div className="flex justify-center gap-8 mt-2 text-sm">
                        <span>شماره پیش فاکتور: <span className="font-mono">{invoice.invoiceNumber}</span></span>
                        <span>تاریخ: <span className="font-mono">{new Date(invoice.date).toLocaleDateString('fa-IR')}</span></span>
                      </div>
                    </td>
                    <td className="w-1/6"></td>
                  </tr>
                </tbody>
              </table>

              {/* Seller and Buyer Info */}
              <div className="border border-black">
                <div className="bg-gray-200 p-1 font-bold text-center text-sm">اطلاعات کارشناس فروش</div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="p-1 border-l border-black w-1/4 align-middle">نام فروشگاه: {category?.storeName}</td>
                      <td className="p-1 w-3/4 align-middle">شماره تماس: {category?.storePhone}<span className='mx-4'>|</span>آدرس: {category?.storeAddress}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border border-t-0 border-black mt-2">
                <div className="bg-gray-200 p-1 font-bold text-center text-sm">اطلاعات خریدار</div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="p-1 border-r border-black w-1/2 align-middle">نام: {customer?.name}</td>
                      <td className="p-1 w-1/2 align-middle">شماره تماس: {customer?.phone}<span className='mx-4'>|</span>آدرس: {customer?.address}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Items Table */}
              <div className="mt-4">
                <table className="w-full text-sm border-collapse border border-black">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border border-black p-1 font-semibold align-middle">ردیف</th>
                      <th className="border border-black p-1 font-semibold w-2/5 align-middle">شرح کالا / خدمات</th>
                      <th className="border border-black p-1 font-semibold align-middle">مقدار</th>
                      <th className="border border-black p-1 font-semibold align-middle">واحد</th>
                      <th className="border border-black p-1 font-semibold align-middle">مبلغ واحد (ریال)</th>
                      <th className="border border-black p-1 font-semibold align-middle">مبلغ کل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => {
                      const itemTotal = item.quantity * item.unitPrice;
                      return (
                      <tr key={index}>
                        <td className="border border-black p-1 text-center align-middle">{index + 1}</td>
                        <td className="border border-black p-1 align-middle">{item.productName}</td>
                        <td className="border border-black p-1 text-center font-mono align-middle">{item.quantity.toLocaleString('fa-IR')}</td>
                        <td className="border border-black p-1 text-center align-middle">{item.unit}</td>
                        <td className="border border-black p-1 text-center font-mono align-middle">{formatCurrency(item.unitPrice)}</td>
                        <td className="border border-black p-1 text-center font-mono align-middle">{formatCurrency(itemTotal)}</td>
                      </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                        <td colSpan={4} className="border border-black p-1 align-middle"></td>
                        <td className="border border-black p-1 text-center align-middle">جمع کل</td>
                        <td className="border border-black p-1 text-center font-mono align-middle">{formatCurrency(invoice.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Summary and Signatures */}
              
              <div className="border border-black mt-2 p-2 text-sm">
                  <p className="font-bold">مبلغ به حروف: {toWords(Math.floor(invoice.total))} ریال</p>
                  <p>۱. اعتبار پیش فاکتور: ۲۴ ساعت می باشد.</p>
                  <p>۲. برای استعلام اصالت فاکتور میتوانید بارکد بالای صفحه را اسکن کنید</p>
              </div>


              {/* Footer */}
              <div className="mt-8 flex justify-between text-xs text-gray-500">
                <span>صفحه ۱ از ۱</span>
                <span>تاریخ گزارش: {new Date().toLocaleDateString('fa-IR')} ساعت {new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

            </div>
        </div>
    </div>
  );
}
