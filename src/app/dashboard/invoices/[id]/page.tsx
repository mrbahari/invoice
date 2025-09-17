
'use client';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  // Determine the store info based on the category of the first item
  const firstItem = invoice.items[0];
  const productInfo = products.find(p => p.id === firstItem.productId);
  const category = categories.find(c => c.id === productInfo?.categoryId);
  
  const handleDownloadImage = () => {
    const invoiceElement = document.getElementById('invoice-card');
    if (invoiceElement) {
        html2canvas(invoiceElement, {
            scale: 2, // Increase resolution
            useCORS: true, 
            backgroundColor: null, 
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `invoice-${invoice?.invoiceNumber}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }
  };

  return (
    <div id="invoice-preview">
        <div className="bg-muted p-4 sm:p-8 rounded-lg no-print">
            <div className="flex justify-center gap-2 mb-6">
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleDownloadImage}>
                    <Download className="h-3.5 w-3.5" />
                    <span>دانلود تصویر</span>
                </Button>
            </div>
            <Card className="max-w-5xl mx-auto font-sans shadow-lg bg-white" id="invoice-card">
                 <header className="p-8 sm:p-12">
                     <div className="grid grid-cols-2 gap-12 items-start">
                        <div className="col-span-1 space-y-2">
                           {category?.logoUrl && (
                                <Image
                                    src={category.logoUrl}
                                    alt={`${category?.storeName} logo`}
                                    width={80}
                                    height={80}
                                    className="object-contain"
                                    unoptimized
                                    style={{ color: category.themeColor }}
                                />
                           )}
                           <h1 className="text-xl font-bold">{category?.storeName}</h1>
                           <p className="text-sm text-muted-foreground">{category?.storeAddress}</p>
                           <p className="text-sm text-muted-foreground font-mono">{category?.storePhone}</p>
                        </div>
                        <div className="col-span-1 space-y-4 text-left">
                            <h2 className="text-4xl font-bold tracking-tight">فاکتور</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-end gap-4">
                                    <span className="font-semibold text-muted-foreground">شماره فاکتور:</span>
                                    <span className="font-mono font-bold">{invoice.invoiceNumber}</span>
                                </div>
                                <div className="flex justify-end gap-4">
                                    <span className="font-semibold text-muted-foreground">تاریخ:</span>
                                    <span className="font-mono font-bold">{new Date(invoice.date).toLocaleDateString('fa-IR')}</span>
                                </div>
                            </div>
                        </div>
                     </div>
                     <div className="mt-12 border-t pt-8">
                         <h3 className="font-semibold mb-4">صورتحساب برای:</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                             <p className="font-bold text-base">{customer?.name}</p>
                             <p><span className="text-muted-foreground">آدرس:</span> {customer?.address}</p>
                             <p><span className="text-muted-foreground">تلفن:</span> {customer?.phone}</p>
                             <p><span className="text-muted-foreground">ایمیل:</span> {customer?.email}</p>
                         </div>
                     </div>
                </header>
                
                <CardContent className="px-8 sm:px-12 py-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50 hover:bg-gray-50 border-b-2">
                                <TableHead className="w-12 text-center">#</TableHead>
                                <TableHead>شرح کالا</TableHead>
                                <TableHead className="w-24 text-center">مقدار</TableHead>
                                <TableHead className="w-32 text-center">واحد</TableHead>
                                <TableHead className="w-32 text-right">قیمت واحد</TableHead>
                                <TableHead className="w-36 text-right">جمع کل</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.items.map((item, index) => {
                                return (
                                <TableRow key={index} className="border-b-gray-100">
                                    <TableCell className="text-center align-top font-medium text-muted-foreground">{index + 1}</TableCell>
                                    <TableCell className="py-4 align-top text-right font-semibold">{item.productName}</TableCell>
                                    <TableCell className="text-center py-4 align-top font-mono">{item.quantity.toLocaleString('fa-IR')}</TableCell>
                                    <TableCell className="text-center py-4 align-top">{item.unit}</TableCell>
                                    <TableCell className="text-right py-4 align-top font-mono">{formatCurrency(item.unitPrice)}</TableCell>
                                    <TableCell className="text-right py-4 align-top font-mono font-semibold">{formatCurrency(item.totalPrice)}</TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                    
                     <div className="mt-12 flex justify-between items-start gap-8">
                        <div className="w-2/3 pr-4">
                            <h4 className="font-semibold text-muted-foreground mb-2">یادداشت‌ها</h4>
                            <p className="text-sm text-gray-700">مبلغ به حروف: {toWords(Math.floor(invoice.total))} ریال</p>
                        </div>
                        <div className="w-1/3 space-y-4">
                             <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">جمع جزء:</span>
                                <span className="font-medium font-mono">{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">تخفیف:</span>
                                <span className="font-medium font-mono text-destructive">{formatCurrency(invoice.discount)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">مالیات:</span>
                                <span className="font-medium font-mono">{formatCurrency(invoice.tax)}</span>
                            </div>
                            <hr className="my-2 border-t border-dashed" />
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-extrabold">جمع کل:</span>
                                <span className="font-extrabold font-mono">{formatCurrency(invoice.total)}</span>
                            </div>
                        </div>
                    </div>

                </CardContent>
                 <footer className="p-8 sm:p-12 mt-12 text-center text-sm text-muted-foreground">
                    <p>با تشکر از خرید شما</p>
                    <p className="mt-8">مهر و امضای فروشنده</p>
                 </footer>
            </Card>
        </div>
    </div>
  );
}
