
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
            scale: 2, 
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
                 <header className="border-b-2 border-gray-100">
                     <div className="h-24" style={{ backgroundColor: category?.themeColor || 'hsl(var(--primary))' }}>
                         {category?.logoUrl && category.logoUrl.startsWith('data:image/svg+xml') &&
                            <div className="p-6 text-white h-full flex items-center">
                                <Image
                                    src={category.logoUrl}
                                    alt={`${category?.storeName} logo`}
                                    width={48}
                                    height={48}
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>
                         }
                     </div>
                     <div className="p-8 sm:p-12 grid grid-cols-2 gap-12 items-end">
                        <div className="col-span-1 space-y-2">
                           <h1 className="text-2xl font-bold">{category?.storeName}</h1>
                           <p className="text-sm text-muted-foreground">{category?.storeAddress}</p>
                           <p className="text-sm text-muted-foreground font-mono">{category?.storePhone}</p>
                        </div>
                        <div className="col-span-1 space-y-4 text-left">
                            <h2 className="text-5xl font-bold tracking-tight">فاکتور</h2>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-end gap-4">
                                    <span className="font-semibold text-muted-foreground">شماره:</span>
                                    <span className="font-mono font-bold">{invoice.invoiceNumber}</span>
                                </div>
                                <div className="flex justify-end gap-4">
                                    <span className="font-semibold text-muted-foreground">تاریخ:</span>
                                    <span className="font-mono font-bold">{new Date(invoice.date).toLocaleDateString('fa-IR')}</span>
                                </div>
                            </div>
                        </div>
                     </div>
                     <div className="px-8 sm:px-12 pb-8">
                         <h3 className="font-semibold mb-2 text-muted-foreground">صورتحساب برای:</h3>
                         <p className="font-bold text-base">{customer?.name}</p>
                         <p className="text-sm">{customer?.address}</p>
                     </div>
                </header>
                
                <CardContent className="px-8 sm:px-12 py-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b-2 hover:bg-transparent">
                                <TableHead className="w-12 text-center text-xs tracking-wider uppercase">#</TableHead>
                                <TableHead className="text-xs tracking-wider uppercase">شرح کالا</TableHead>
                                <TableHead className="w-24 text-center text-xs tracking-wider uppercase">مقدار</TableHead>
                                <TableHead className="w-32 text-center text-xs tracking-wider uppercase">واحد</TableHead>
                                <TableHead className="w-32 text-right text-xs tracking-wider uppercase">قیمت واحد</TableHead>
                                <TableHead className="w-36 text-right text-xs tracking-wider uppercase">جمع کل</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.items.map((item, index) => (
                                <TableRow key={index} className="border-b-gray-100 hover:bg-gray-50/50">
                                    <TableCell className="text-center align-top font-medium text-muted-foreground">{index + 1}</TableCell>
                                    <TableCell className="py-4 align-top text-right font-semibold">{item.productName}</TableCell>
                                    <TableCell className="text-center py-4 align-top font-mono">{item.quantity.toLocaleString('fa-IR')}</TableCell>
                                    <TableCell className="text-center py-4 align-top">{item.unit}</TableCell>
                                    <TableCell className="text-right py-4 align-top font-mono">{formatCurrency(item.unitPrice)}</TableCell>
                                    <TableCell className="text-right py-4 align-top font-mono font-semibold">{formatCurrency(item.totalPrice)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    
                     <div className="mt-12 flex justify-between items-start gap-8">
                        <div className="w-2/3 pr-4 pt-4">
                            <h4 className="font-semibold text-muted-foreground mb-2 text-sm">یادداشت‌ها</h4>
                            <p className="text-sm text-gray-700">مبلغ به حروف: {toWords(Math.floor(invoice.total))} ریال</p>
                        </div>
                        <div className="w-1/3 space-y-4 bg-gray-50 rounded-lg p-6">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">جمع جزء:</span>
                                <span className="font-medium font-mono">{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">تخفیف:</span>
                                <span className="font-medium font-mono text-destructive">{formatCurrency(invoice.discount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">مالیات:</span>
                                <span className="font-medium font-mono">{formatCurrency(invoice.tax)}</span>
                            </div>
                            <hr className="my-2 border-t border-dashed" />
                            <div className="flex justify-between items-center text-xl">
                                <span className="font-extrabold">جمع کل:</span>
                                <span className="font-extrabold font-mono" style={{ color: category?.themeColor || 'hsl(var(--primary))' }}>{formatCurrency(invoice.total)}</span>
                            </div>
                        </div>
                    </div>

                </CardContent>
                 <footer className="p-8 sm:p-12 mt-12 text-center text-sm text-muted-foreground">
                    <hr className="mb-8" />
                    <p>با تشکر از خرید شما</p>
                    <div className="mt-24 h-px w-48 bg-gray-300 mx-auto"></div>
                    <p className="mt-2">مهر و امضای فروشنده</p>
                 </footer>
            </Card>
        </div>
    </div>
  );

    