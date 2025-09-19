
'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Download, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import type { Store, Customer, Invoice, Product } from '@/lib/definitions';
import html2canvas from 'html2canvas';
import { useEffect, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { useData } from '@/context/data-context';

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
  const { invoices, products, stores, customers } = data;

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  const invoice = useMemo(() => invoices.find((inv) => inv.id === invoiceId), [invoices, invoiceId]);
  const customer = useMemo(() => customers.find((c) => c.id === invoice?.customerId), [customers, invoice]);
  
  const store = useMemo(() => {
    if (!invoice?.items.length) return undefined;
    const firstItem = invoice.items[0];
    const productInfo = products.find(p => p.id === firstItem?.productId);
    if (!productInfo) return undefined;
    return stores.find(s => s.id === productInfo.storeId);
  }, [invoice, products, stores]);



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
  
  if(!customer || !store) {
      // Data might be inconsistent for a moment
      return null;
  }

  
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
            <div className="max-w-5xl mx-auto bg-white p-4 sm:p-8 border" id="invoice-card">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex items-center justify-center sm:justify-start w-full sm:w-1/6 order-2 sm:order-1">
                      {qrCodeUrl && <Image src={qrCodeUrl} alt="QR Code" width={96} height={96} />}
                  </div>
                  <div className="text-center w-full sm:w-2/3 order-1 sm:order-2">
                      <h1 className="text-xl font-bold text-black">پیش فاکتور فروش</h1>
                      <h2 className="text-lg font-semibold text-black">{store?.name}</h2>
                      <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-8 mt-2 text-sm text-black">
                        <span>شماره پیش فاکتور: <span className="font-mono">{invoice.invoiceNumber}</span></span>
                        <span>تاریخ: <span className="font-mono">{new Date(invoice.date).toLocaleDateString('fa-IR')}</span></span>
                      </div>
                  </div>
              </div>


              {/* Seller and Buyer Info */}
              <div className="border border-black">
                <div className="bg-gray-200 p-1 font-bold text-center text-sm text-black">اطلاعات کارشناس فروش</div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="p-1 border-l border-black w-1/4 align-middle text-black">نام فروشگاه: {store?.name}</td>
                      <td className="p-1 w-3/4 align-middle text-black">شماره تماس: {store?.phone}<span className='mx-4'>|</span>آدرس: {store?.address}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border border-t-0 border-black mt-2">
                <div className="bg-gray-200 p-1 font-bold text-center text-sm text-black">اطلاعات خریدار</div>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="p-1 border-r border-black w-1/2 align-middle text-black">نام: {customer?.name}</td>
                      <td className="p-1 w-1/2 align-middle text-black">شماره تماس: {customer?.phone}<span className='mx-4'>|</span>آدرس: {customer?.address}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Items Table */}
              <div className="mt-4">
                <table className="w-full text-sm border-collapse border border-black">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border border-black p-1 font-semibold align-middle text-black">ردیف</th>
                      <th className="border border-black p-1 font-semibold w-2/5 align-middle text-black">شرح کالا / خدمات</th>
                      <th className="border border-black p-1 font-semibold align-middle text-black">مقدار</th>
                      <th className="border border-black p-1 font-semibold align-middle text-black">واحد</th>
                      <th className="border border-black p-1 font-semibold align-middle text-black">مبلغ واحد (ریال)</th>
                      <th className="border border-black p-1 font-semibold align-middle text-black">مبلغ کل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => {
                      const itemTotal = item.quantity * item.unitPrice;
                      return (
                      <tr key={index}>
                        <td className="border border-black p-1 text-center align-middle text-black">{index + 1}</td>
                        <td className="border border-black p-1 align-middle text-black">{item.productName}</td>
                        <td className="border border-black p-1 text-center font-mono align-middle text-black">{item.quantity.toLocaleString('fa-IR')}</td>
                        <td className="border border-black p-1 text-center align-middle text-black">{item.unit}</td>
                        <td className="border border-black p-1 text-center font-mono align-middle text-black">{formatCurrency(item.unitPrice)}</td>
                        <td className="border border-black p-1 text-center font-mono align-middle text-black">{formatCurrency(itemTotal)}</td>
                      </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                        <td colSpan={4} className="border border-black p-1 text-center align-middle font-bold text-black">مبلغ به حروف: {toWords(Math.floor(invoice.total))} ریال</td>
                        <td className="border border-black p-1 text-center align-middle text-black">جمع کل</td>
                        <td className="border border-black p-1 text-center font-mono align-middle text-black">{formatCurrency(invoice.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              
              <div className="border border-black mt-2 p-2 text-sm text-black">
                  <p>۱. اعتبار پیش فاکتور: ۲۴ ساعت می باشد.</p>
                  <p>۲. برای استعلام اصالت فاکتور میتوانید بارکد بالای صفحه را اسکن کنید</p>
                  {store.bankAccountHolder && <p>صاحب حساب: {store.bankAccountHolder}</p>}
                  {store.bankIban && <p>شماره شبا: {store.bankIban}</p>}
                  {store.bankCardNumber && <p>شماره کارت: {store.bankCardNumber}</p>}
              </div>


              {/* Footer */}
              <div className="mt-8 flex justify-between text-xs text-black">
                <span>صفحه ۱ از ۱</span>
                <span>تاریخ گزارش: {new Date().toLocaleDateString('fa-IR')} ساعت {new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

            </div>
        </div>
    </div>
  );
}
