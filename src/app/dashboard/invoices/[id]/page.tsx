
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
import { Download, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category, Customer, Invoice, Product } from '@/lib/definitions';
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
  const product = products.find(p => p.id === firstItem.productId);
  const category = categories.find(c => c.id === product?.categoryId);

  const defaultThemeColor = 'hsl(var(--primary))';
  
  const storeInfo = {
    name: category?.storeName || "فروشگاه",
    logoUrl: category?.logoUrl,
    address: category?.storeAddress || '',
    phone: category?.storePhone || '',
    themeColor: category?.themeColor || defaultThemeColor,
  };

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
            <Card className="max-w-4xl mx-auto font-sans shadow-lg" id="invoice-card">
                 <header className="relative rounded-t-lg overflow-hidden p-8" style={{ backgroundColor: storeInfo.themeColor }}>
                    <div className="grid grid-cols-2 items-start gap-12">
                        <div className="flex items-center gap-4">
                            <div className="w-40 h-40 flex items-center justify-center">
                               {storeInfo.logoUrl && (
                                    <Image
                                        src={storeInfo.logoUrl}
                                        alt={`${storeInfo.name} logo`}
                                        width={150}
                                        height={150}
                                        className="object-contain"
                                        unoptimized
                                    />
                               )}
                            </div>
                           <div className="px-4 py-1 rounded-md">
                            <h1 className="text-3xl font-bold text-white">{storeInfo.name}</h1>
                            {category?.description && <p className="text-sm text-white/90 mt-1">{category.description}</p>}
                           </div>
                       </div>
                       
                        <div className="w-full space-y-2 text-sm bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                             <div className="flex justify-between text-white">
                                <span className="font-semibold opacity-80">شماره سریال:</span>
                                <span className="font-mono font-bold">{invoice.invoiceNumber}</span>
                            </div>
                             <div className="flex justify-between text-white">
                                <span className="font-semibold opacity-80">تاریخ:</span>
                                <span className="font-mono font-bold">{new Date(invoice.date).toLocaleDateString('fa-IR')}</span>
                            </div>
                            <div className="flex justify-between text-white">
                                <span className="font-semibold opacity-80">آقای/خانم:</span>
                                <span className="font-bold">{invoice.customerName}</span>
                            </div>
                            {customer?.phone && (
                                <div className="flex justify-between text-white">
                                    <span className="font-semibold opacity-80">شماره تماس:</span>
                                    <span className="font-mono font-bold">{customer.phone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                
                <CardContent className="p-8 bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-primary/90 text-primary-foreground" style={{ backgroundColor: storeInfo.themeColor }}>
                                <TableHead className="w-16 text-center rounded-r-md text-white">ردیف</TableHead>
                                <TableHead className='text-right text-white'>نام کالا</TableHead>
                                <TableHead className="w-24 text-center text-white">واحد</TableHead>
                                <TableHead className="w-24 text-center text-white">مقدار</TableHead>
                                <TableHead className="w-32 text-right text-white">قیمت</TableHead>
                                <TableHead className="w-32 text-right rounded-l-md text-white">جمع کل</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.items.map((item, index) => (
                            <TableRow key={index} className="border-b-gray-100">
                                <TableCell className="text-center align-top font-medium bg-primary/10 text-primary pt-3 font-mono" style={{ backgroundColor: `${storeInfo.themeColor}1A`, color: storeInfo.themeColor}}>{String(index + 1).padStart(2, '0')}</TableCell>
                                <TableCell className="py-3 align-top text-right">
                                    <p className="font-semibold text-gray-800">{item.productName}</p>
                                    <p className="text-xs text-gray-500">{products.find(p=>p.id === item.productId)?.description}</p>
                                </TableCell>
                                <TableCell className="text-center py-3 align-top font-bold text-base font-mono">{item.unit}</TableCell>
                                <TableCell className="text-center py-3 align-top font-bold text-base font-mono">{item.quantity.toLocaleString('fa-IR')}</TableCell>
                                <TableCell className="text-right py-3 align-top font-mono text-base">{formatCurrency(item.unitPrice)}</TableCell>
                                <TableCell className="text-right py-3 align-top font-mono text-base">{formatCurrency(item.totalPrice)}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    
                     <div className="mt-8 border-t pt-6 text-sm">
                        <div className="flex justify-between items-start">
                            <div className="w-2/3 pr-4">
                                <span className="font-semibold text-gray-500">مبلغ به حروف:</span>
                                <p className="mt-1 text-gray-700 font-medium">{toWords(Math.floor(invoice.total))} ریال</p>
                            </div>
                            <div className="w-1/3 space-y-2">
                                 <div className="flex justify-between items-center p-3 rounded-md" style={{ backgroundColor: `${storeInfo.themeColor}1A` }}>
                                    <span className="text-base font-bold" style={{ color: storeInfo.themeColor }}>جمع کل:</span>
                                    <span className="text-base font-bold font-mono" style={{ color: storeInfo.themeColor }}>{formatCurrency(invoice.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </CardContent>
                 <footer className="relative bg-white rounded-b-lg">
                    <div className="h-16" style={{ backgroundColor: storeInfo.themeColor }}></div>
                     <div className="absolute inset-0 p-4 flex items-center justify-center text-white text-xs">
                        <div className="flex items-center gap-6">
                            {storeInfo.phone && (
                              <div className="flex items-center gap-2">
                                  <Phone size={14} />
                                  <span className="font-mono">{storeInfo.phone}</span>
                              </div>
                            )}
                             {storeInfo.address && (
                               <div className="flex items-center gap-2">
                                  <MapPin size={14} />
                                  <span>{storeInfo.address}</span>
                              </div>
                             )}
                        </div>
                    </div>
                </footer>
            </Card>
        </div>
    </div>
  );

    

    

}

    

    