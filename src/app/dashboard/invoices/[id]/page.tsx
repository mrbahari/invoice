
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
import { invoices, products } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import type { InvoiceStatus } from '@/lib/definitions';
import { Printer, CreditCard, Package2, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const statusTranslation: Record<InvoiceStatus, string> = {
    Paid: 'پرداخت شده',
    Pending: 'در انتظار',
    Overdue: 'سررسید گذشته',
};

const statusColors: Record<InvoiceStatus, string> = {
    Paid: 'bg-green-500',
    Pending: 'bg-yellow-500',
    Overdue: 'bg-red-500',
}

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
    <div className="bg-muted p-4 sm:p-8 rounded-lg" id="invoice-preview-container">
        <div className="flex justify-center gap-2 mb-6 no-print">
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handlePrint}>
                <Printer className="h-3.5 w-3.5" />
                <span>چاپ / PDF</span>
            </Button>
            <Button size="sm" className="h-8 gap-1" onClick={handlePayment}>
                <CreditCard className="h-3.5 w-3.5" />
                <span>پرداخت</span>
            </Button>
        </div>
        <Card className="max-w-4xl mx-auto font-sans shadow-lg" id="invoice-preview">
            <header className="relative bg-white rounded-t-lg overflow-hidden">
                <div className="absolute top-0 right-0 h-full w-2/3 bg-primary" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0% 100%)' }}></div>
                <div className="relative grid grid-cols-2 p-8">
                     <div className="text-white">
                        <Package2 className="h-12 w-12 mb-4" />
                        <h1 className="text-3xl font-bold mb-1">فاکتور</h1>
                        <div className="text-sm space-y-1">
                            <p>شماره فاکتور: {invoice.invoiceNumber}</p>
                            <p>تاریخ صدور: {new Date(invoice.date).toLocaleDateString('fa-IR')}</p>
                        </div>
                    </div>
                    <div className="text-right flex flex-col justify-end items-end">
                        <h2 className="text-2xl font-bold text-gray-800">فروشگاه سپهر</h2>
                        <p className="text-sm text-gray-600">عرضه‌کننده بهترین لوازم خانگی</p>
                    </div>
                </div>
            </header>
            
            <CardContent className="p-8 bg-white">
                 <div className="grid grid-cols-2 gap-8 mb-10 text-sm">
                    <div>
                        <h3 className="font-semibold text-gray-500 mb-2">صورتحساب برای:</h3>
                        <p className="font-bold text-lg text-gray-800">{invoice.customerName}</p>
                        <p className="text-gray-600">{invoice.customerEmail}</p>
                    </div>
                     <div className="text-left flex items-end justify-end">
                        <div className='text-right'>
                            <h3 className="font-semibold text-gray-500 mb-2">وضعیت پرداخت:</h3>
                            <Badge variant="default" className={`text-sm ${statusColors[invoice.status]}`}>
                                {statusTranslation[invoice.status]}
                            </Badge>
                        </div>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="bg-accent hover:bg-accent/90">
                            <TableHead className="w-16 text-center text-accent-foreground rounded-r-md">ردیف</TableHead>
                            <TableHead className="text-accent-foreground">شرح</TableHead>
                            <TableHead className="w-24 text-center text-accent-foreground">تعداد</TableHead>
                            <TableHead className="w-32 text-center text-accent-foreground">قیمت واحد</TableHead>
                            <TableHead className="w-32 text-center text-accent-foreground rounded-l-md">جمع کل</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoice.items.map((item, index) => (
                        <TableRow key={index} className="border-b-gray-100">
                            <TableCell className="text-center align-top font-medium text-gray-600 pt-4">{String(index + 1).padStart(2, '0')}</TableCell>
                            <TableCell className="py-3 align-top">
                                <p className="font-semibold text-gray-800">{item.productName}</p>
                                <p className="text-xs text-gray-500">{products.find(p=>p.id === item.productId)?.description}</p>
                            </TableCell>
                            <TableCell className="text-center py-3 align-top">{item.quantity}</TableCell>
                            <TableCell className="text-center py-3 align-top font-mono">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-center py-3 align-top font-mono">{formatCurrency(item.totalPrice)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
                
                <div className="grid grid-cols-3 mt-10 gap-8">
                     <div className="col-span-1 space-y-4">
                        <h4 className="font-semibold text-gray-700">از خرید شما متشکریم!</h4>
                         <p className="text-xs text-gray-500">
                           {invoice.description || 'لطفا مبلغ فاکتور را ظرف مدت ۳۰ روز آینده تسویه نمایید. برای اطلاعات بیشتر با ما در تماس باشید.'}
                         </p>
                    </div>
                    <div className="col-span-2">
                        <div className="w-full max-w-sm ml-auto space-y-2 text-sm">
                            <div className="flex justify-between items-center py-2 border-b">
                                <span className="text-gray-600">جمع جزء:</span>
                                <span className="font-mono font-medium">{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            {invoice.discount > 0 && (
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-gray-600">تخفیف:</span>
                                    <span className="font-mono font-medium text-destructive">-{formatCurrency(invoice.discount)}</span>
                                </div>
                            )}
                            {invoice.tax > 0 && (
                                <div className="flex justify-between items-center py-2 border-b">
                                    <span className="text-gray-600">مالیات:</span>
                                    <span className="font-mono font-medium">{formatCurrency(invoice.tax)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center py-3 px-4 bg-primary text-primary-foreground rounded-md">
                                <span className="text-base font-bold">جمع کل:</span>
                                <span className="text-xl font-bold font-mono">{formatCurrency(invoice.total)}</span>
                            </div>
                        </div>
                         <div className="mt-20 text-center">
                            <div className="inline-block border-t-2 border-gray-300 w-48 pt-2 text-xs text-gray-500">مهر و امضاء</div>
                        </div>
                    </div>
                </div>

            </CardContent>
            <footer className="relative bg-white rounded-b-lg overflow-hidden">
                <div className="h-16 bg-primary"></div>
                 <div className="absolute inset-0 p-4 flex items-center justify-center text-white text-xs">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Phone size={14} />
                            <span>۰۲۱-۸۸۴۴۴۴۰۰</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <Mail size={14} />
                            <span>info@sepehr.com</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <MapPin size={14} />
                            <span>میدان توحید، خیابان ولیعصر، پلاک ۱۲</span>
                        </div>
                    </div>
                </div>
            </footer>
        </Card>
    </div>
  );
}
