
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
import { Printer, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category, Customer, Invoice, Product } from '@/lib/definitions';

// A simple number to words converter for Persian
function toWords(num: number): string {
    const units = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
    const teens = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
    const tens = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
    const hundreds = ["", "یکصد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
    const thousands = ["", " هزار", " میلیون", " میلیارد"];

    if (num === 0) return "صفر";

    let word = '';
    let i = 0;

    while (num > 0) {
        const chunk = num % 1000;
        if (chunk > 0) {
            let chunkWord = '';
            const h = Math.floor(chunk / 100);
            const t = Math.floor((chunk % 100) / 10);
            const u = chunk % 10;

            if (h > 0) {
                chunkWord += hundreds[h] + (t > 0 || u > 0 ? " و " : "");
            }
            if (t === 1) {
                chunkWord += teens[u];
            } else {
                if (t > 1) {
                    chunkWord += tens[t] + (u > 0 ? " و " : "");
                }
                if (u > 0 && t !== 1) {
                    chunkWord += units[u];
                }
            }
            word = chunkWord.trim() + thousands[i] + (word ? " و " : "") + word;
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
  const product = products.find(p => p.id === firstItem.productId);
  const category = categories.find(c => c.id === product?.categoryId);

  const storeInfo = {
    name: category?.storeName || "فروشگاه",
    logoUrl: category?.logoUrl,
    address: category?.storeAddress || 'آدرس ثبت نشده',
    phone: category?.storePhone || 'شماره ثبت نشده',
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
        window.print();
    }
  };

  return (
    <div id="invoice-preview">
        <div className="bg-muted p-4 sm:p-8 rounded-lg">
            <div className="flex justify-center gap-2 mb-6 no-print">
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handlePrint}>
                    <Printer className="h-3.5 w-3.5" />
                    <span>چاپ / PDF</span>
                </Button>
            </div>
            <Card className="max-w-4xl mx-auto font-sans shadow-lg" id="invoice-card">
                <header className="relative bg-white rounded-t-lg overflow-hidden border-b-4 border-primary">
                    <div className="absolute top-0 right-0 h-full w-full bg-primary/5"></div>
                    <div className="relative p-8">
                        <div className="h-28 w-full bg-primary absolute top-0 right-0" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 65%, 85% 100%, 0 100%)' }}></div>
                        <div className="relative flex items-center justify-between">
                           <div className="flex items-center gap-4">
                                <div className="bg-white p-2 rounded-full shadow-md w-16 h-16 flex items-center justify-center">
                                   {storeInfo.logoUrl ? (
                                        <Image
                                            src={storeInfo.logoUrl}
                                            alt={`${storeInfo.name} logo`}
                                            width={48}
                                            height={48}
                                            className="object-contain"
                                        />
                                   ) : (
                                       <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-anchor text-primary"><path d="M12 22V8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/><path d="M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>
                                   )}
                                </div>
                               <h1 className="text-3xl font-bold text-white tracking-tight">{storeInfo.name}</h1>
                           </div>
                        </div>
                    </div>
                </header>
                
                <CardContent className="p-8 bg-white">
                     <div className="flex justify-between items-start text-sm border-b pb-6 mb-10">
                        <div className="flex items-baseline gap-4">
                            <span className="font-semibold text-gray-500 whitespace-nowrap">صورتحساب آقای/خانم:</span>
                            <div className="flex flex-col items-start gap-1">
                                <span className="font-bold text-lg text-gray-800">{invoice.customerName}</span>
                                {customer?.phone && (
                                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                      <span>شماره تماس:</span>
                                      <span className="font-mono">{customer.phone.toLocaleString('fa-IR')}</span>
                                  </div>
                                )}
                            </div>
                        </div>
                        <div className="text-left">
                            <div className="flex justify-end">
                                <span className='font-semibold text-gray-500'>تاریخ:</span>
                                <span className="mr-2 font-mono">{new Date(invoice.date).toLocaleDateString('fa-IR')}</span>
                            </div>
                         </div>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                <TableHead className="w-16 text-center rounded-r-md">ردیف</TableHead>
                                <TableHead>شرح</TableHead>
                                <TableHead className="w-24 text-center">تعداد</TableHead>
                                <TableHead className="w-32 text-center">فی</TableHead>
                                <TableHead className="w-32 text-center rounded-l-md">جمع کل</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.items.map((item, index) => (
                            <TableRow key={index} className="border-b-gray-100">
                                <TableCell className="text-center align-top font-medium bg-primary/10 text-primary pt-3 font-mono">{String(index + 1).padStart(2, '0').toLocaleString('fa-IR')}</TableCell>
                                <TableCell className="py-3 align-top">
                                    <p className="font-semibold text-gray-800">{item.productName}</p>
                                    <p className="text-xs text-gray-500">{products.find(p=>p.id === item.productId)?.description}</p>
                                </TableCell>
                                <TableCell className="text-center py-3 align-top font-bold text-base">{item.quantity.toLocaleString('fa-IR')}</TableCell>
                                <TableCell className="text-center py-3 align-top font-mono text-base">{formatCurrency(item.unitPrice)}</TableCell>
                                <TableCell className="text-center py-3 align-top font-mono text-base">{formatCurrency(item.totalPrice)}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    
                     <div className="mt-8 border-t pt-6 text-sm">
                        <div className="flex justify-between items-start">
                            <div className="w-2/3 pr-4">
                                <span className="font-semibold text-gray-500">مبلغ به حروف:</span>
                                <p className="mt-1 text-gray-700 font-medium">{toWords(invoice.total)} ریال</p>
                                <div className="mt-10 pt-4 border-t border-dashed">
                                    <span className="text-xs text-muted-foreground">جای مهر و امضاء فروشگاه</span>
                                </div>
                            </div>
                            <div className="w-1/3 space-y-2">
                                 <div className="flex justify-between items-center bg-primary/5 p-3 rounded-md">
                                    <span className="text-base font-bold text-primary">جمع کل:</span>
                                    <span className="text-base font-bold font-mono text-primary">{formatCurrency(invoice.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </CardContent>
                 <footer className="relative bg-white rounded-b-lg mt-10">
                    <div className="h-16 bg-primary" style={{ clipPath: 'polygon(15% 0, 100% 0, 100% 100%, 0 100%)' }}></div>
                     <div className="absolute inset-0 p-4 flex items-center justify-center text-white text-xs">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Phone size={14} />
                                <span>{storeInfo.phone}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <Mail size={14} />
                                <span>info@{storeInfo.name.split(' ')[0].toLowerCase()}.ir</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <MapPin size={14} />
                                <span>{storeInfo.address}</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </Card>
        </div>
    </div>
  );
}

    