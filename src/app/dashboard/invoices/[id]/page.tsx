
'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { initialInvoices, initialProducts, initialCategories, initialCustomers } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category, Customer, Invoice, Product, InvoiceItem } from '@/lib/definitions';
import html2canvas from 'html2canvas';

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


export default function InvoicePreviewPage() {
  const params = useParams<{ id: string }>();
  const [invoices] = useLocalStorage<Invoice[]>('invoices', initialInvoices);
  const [products] = useLocalStorage<Product[]>('products', initialProducts);
  const [categories] = useLocalStorage<Category[]>('categories', initialCategories);
  const [customers] = useLocalStorage<Customer[]>('customers', initialCustomers);
  
  const invoice = invoices.find((inv) => inv.id === params.id);
  const customer = customers.find((c) => c.id === invoice?.customerId);


  if (!invoice) {
    notFound();
  }

  const firstItem = invoice.items[0];
  const productInfo = products.find(p => p.id === firstItem?.productId);
  const category = categories.find(c => c.id === productInfo?.categoryId);
  
  const handleDownloadImage = () => {
    const invoiceElement = document.getElementById('invoice-card');
    if (invoiceElement) {
        html2canvas(invoiceElement, {
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff',
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `invoice-${invoice?.invoiceNumber}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
  };

  const qrData = `Invoice No: ${invoice.invoiceNumber}\nCustomer: ${customer?.name}\nTotal: ${formatCurrency(invoice.total)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(qrData)}`;

  return (
    <div id="invoice-preview" className="font-sans">
        <div className="bg-muted p-4 sm:p-8 rounded-lg no-print">
            <div className="flex justify-center gap-2 mb-6">
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleDownloadImage}>
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
                        <Image
                            src={qrCodeUrl}
                            alt="QR Code"
                            width={96}
                            height={96}
                            unoptimized
                        />
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
                      <td className="p-1 border-l border-black w-1/4">نام فروشگاه: {category?.storeName}</td>
                      <td className="p-1 w-3/4">شماره تماس: {category?.storePhone}<span className='mx-4'>|</span>آدرس: {category?.storeAddress}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border border-t-0 border-black mt-2">
                <div className="bg-gray-200 p-1 font-bold text-center text-sm">اطلاعات خریدار</div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="p-1 border-r border-black w-1/3">نام: {customer?.name}</td>
                      <td className="p-1 w-2/3">شماره تماس: {customer?.phone}<span className='mx-4'>|</span>آدرس: {customer?.address}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Items Table */}
              <div className="mt-4">
                <table className="w-full text-sm border-collapse border border-black">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border border-black p-1 font-semibold">ردیف</th>
                      <th className="border border-black p-1 font-semibold w-2/5">شرح کالا / خدمات</th>
                      <th className="border border-black p-1 font-semibold">مقدار</th>
                      <th className="border border-black p-1 font-semibold">واحد</th>
                      <th className="border border-black p-1 font-semibold">مبلغ واحد (ریال)</th>
                      <th className="border border-black p-1 font-semibold">مبلغ کل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => {
                      const itemTotal = item.quantity * item.unitPrice;
                      return (
                      <tr key={index}>
                        <td className="border border-black p-1 text-center">{index + 1}</td>
                        <td className="border border-black p-1">{item.productName}</td>
                        <td className="border border-black p-1 text-center font-mono">{item.quantity.toLocaleString('fa-IR')}</td>
                        <td className="border border-black p-1 text-center">{item.unit}</td>
                        <td className="border border-black p-1 text-center font-mono">{formatCurrency(item.unitPrice)}</td>
                        <td className="border border-black p-1 text-center font-mono">{formatCurrency(itemTotal)}</td>
                      </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                        <td colSpan={4} className="border border-black p-1"></td>
                        <td className="border border-black p-1 text-center">جمع کل</td>
                        <td className="border border-black p-1 text-center font-mono">{formatCurrency(invoice.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Summary and Signatures */}
              
              <div className="border border-black mt-2 p-2 text-sm">
                  <p>۱. اعتبار پیش فاکتور: ۲۴ ساعت می باشد.</p>
                  <p>۲. برای استعلام اصالت فاکتور میتوانید بارکد بالای صفحه را اسکن کنید</p>
              </div>

              <div className="border border-t-0 border-black p-2 text-sm">
                 مبلغ به حروف: {toWords(Math.floor(invoice.total))} ریال
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
