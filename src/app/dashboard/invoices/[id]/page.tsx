
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
import { Badge } from '@/components/ui/badge';
import { invoices } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import type { InvoiceStatus } from '@/lib/definitions';
import { Refrigerator, WashingMachine, Printer, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

const statusTranslation: Record<InvoiceStatus, string> = {
    Paid: 'پرداخت شده',
    Pending: 'در انتظار',
    Overdue: 'سررسید گذشته',
};

export default function InvoicePreviewPage() {
  const params = useParams<{ id: string }>();
  const invoice = invoices.find((inv) => inv.id === params.id);

  if (!invoice) {
    notFound();
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
        window.print();
    }
  };

  const handlePayment = () => {
    alert('در حال اتصال به درگاه پرداخت...');
  }

  return (
    <div className="bg-gray-100 p-4 sm:p-8 rounded-lg" id="invoice-preview">
        <Card className="max-w-4xl mx-auto font-sans shadow-lg">
            <header className="relative bg-white rounded-t-lg">
                <div className="h-24 bg-red-600 p-8 rounded-t-lg"></div>
                <div className="absolute top-8 right-0 bg-gray-800 w-2/3 h-16" style={{clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0% 100%)'}}></div>
                 <div className="absolute top-12 left-8 flex gap-2 text-sm text-gray-500">
                    <div>تاریخ: {new Date(invoice.date).toLocaleDateString('fa-IR')}</div>
                    <div>/</div>
                    <div>شماره: {invoice.invoiceNumber}</div>
                </div>
                <div className="relative bg-white p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">فروشگاه لوازم خانگی سپهر</h1>
                        <p className="text-red-600 font-medium">فروش اقساطی لوازم خانگی ایرانی و خارجی</p>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                        <Refrigerator size={32} />
                        <WashingMachine size={32} />
                    </div>
                </div>
            </header>
            
            <CardContent className="p-6 bg-white">
                <div className="grid grid-cols-3 gap-6 mb-8 text-sm">
                    <div className="col-span-2">
                        <span className="text-gray-600 font-semibold">صورتحساب: </span>
                        <span>{invoice.customerName}</span>
                    </div>
                    <div>
                        <span className="text-gray-600 font-semibold">وضعیت: </span>
                        <Badge variant="outline" className="font-mono">{statusTranslation[invoice.status]}</Badge>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-800 hover:bg-gray-800">
                            <TableHead className="w-16 text-center text-white rounded-r-md">ردیف</TableHead>
                            <TableHead className="text-white">شرح کالا یا خدمات</TableHead>
                            <TableHead className="w-24 text-center text-white">تعداد</TableHead>
                            <TableHead className="w-32 text-center text-white">قیمت واحد</TableHead>
                            <TableHead className="w-32 text-center text-white rounded-l-md">قیمت کل</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoice.items.map((item, index) => (
                        <TableRow key={index} className="border-b-0">
                            <TableCell className="text-center align-top">
                                <div className="bg-red-600 text-white rounded-md w-8 h-8 flex items-center justify-center font-bold mx-auto">{index + 1}</div>
                            </TableCell>
                            <TableCell className="border-b border-dashed border-gray-300 py-3 align-top font-medium">{item.productName}</TableCell>
                            <TableCell className="text-center border-b border-dashed border-gray-300 py-3 align-top">{item.quantity}</TableCell>
                            <TableCell className="text-center border-b border-dashed border-gray-300 py-3 align-top">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-center border-b border-dashed border-gray-300 py-3 align-top">{formatCurrency(item.totalPrice)}</TableCell>
                        </TableRow>
                        ))}
                        {/* Fill empty rows */}
                        {Array.from({ length: Math.max(0, 10 - invoice.items.length) }).map((_, i) => (
                             <TableRow key={`empty-${i}`} className="h-12 border-b-0">
                                <TableCell className="text-center"></TableCell>
                                <TableCell className="border-b border-dashed border-gray-300"></TableCell>
                                <TableCell className="border-b border-dashed border-gray-300"></TableCell>
                                <TableCell className="border-b border-dashed border-gray-300"></TableCell>
                                <TableCell className="border-b border-dashed border-gray-300"></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                
                <div className="mt-8 space-y-4 text-sm">
                    <div className="p-2 bg-gray-100 rounded-md">
                        <span className="font-semibold">جمع کل (به عدد): </span>
                        <span className="font-mono">{formatCurrency(invoice.total)}</span>
                    </div>
                     <div className="p-2 bg-gray-100 rounded-md">
                        <span className="font-semibold">جمع کل (به حروف): </span>
                        <span>-</span>
                    </div>
                     <div className="p-2 bg-gray-100 rounded-md h-20">
                        <span className="font-semibold">توضیحات: </span>
                        <span>{invoice.description}</span>
                    </div>
                </div>

                <div className="mt-24 grid grid-cols-2 gap-8 text-center text-sm">
                    <div>
                        <div className="border-t border-gray-400 pt-2">امضاء خریدار</div>
                    </div>
                    <div>
                        <div className="border-t border-gray-400 pt-2">مهر و امضاء فروشنده</div>
                    </div>
                </div>

            </CardContent>
            <footer className="relative bg-white rounded-b-lg">
                <div className="h-12 bg-red-600 p-4 rounded-b-lg flex items-center justify-center text-white text-xs">
                    <span>میدان توحید، خیابان ولیعصر، ابتدای کوچه مروارید، جنب سنگکی تهرانی</span>
                </div>
                <div className="absolute bottom-6 right-0 bg-gray-800 w-1/3 h-10" style={{clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0% 100%)'}}></div>
                 <div className="absolute bottom-8 left-8 flex gap-4 text-white text-sm">
                    <span>۰۲۱۸۸۴۴۴۴۰۰۰</span>
                    <span>۰۹۲۱۸۰۰۴۱۱۱۱</span>
                </div>
            </footer>
        </Card>
        <div className="mt-6 flex justify-center gap-2 no-print">
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" />
                <span>چاپ / PDF</span>
            </Button>
            <Button size="sm" className="h-8 gap-1" onClick={handlePayment}>
                <CreditCard className="h-3.5 w-3.5" />
                <span>پرداخت</span>
            </Button>
        </div>
    </div>
  );
}

    