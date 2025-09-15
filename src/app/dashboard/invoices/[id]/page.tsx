
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Separator } from '@/components/ui/separator';
import { invoices } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import type { InvoiceStatus } from '@/lib/definitions';
import { Package2 } from 'lucide-react';
import { InvoiceActions } from '@/components/dashboard/invoice-actions';

const statusStyles: Record<InvoiceStatus, string> = {
  Paid: 'text-green-600 bg-green-500/10',
  Pending: 'text-orange-600 bg-orange-500/10',
  Overdue: 'text-red-600 bg-red-500/10',
};

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

  return (
    <Card className="overflow-hidden" id="invoice-preview">
        <CardHeader className="flex flex-row items-start bg-muted/50">
            <div className="grid gap-0.5">
            <CardTitle className="group flex items-center gap-2 text-lg">
                <Package2 className="h-6 w-6 text-primary" />
            </CardTitle>
            <CardDescription>فاکتور {invoice.invoiceNumber}</CardDescription>
            </div>
            <div className="mr-auto flex items-center gap-2 no-print">
              <InvoiceActions />
            </div>
        </CardHeader>
        <CardContent className="p-6 text-sm">
            <div className="grid sm:grid-cols-3 gap-6">
                <div className="grid gap-3">
                    <div className="font-semibold">صورتحساب برای</div>
                    <address className="grid gap-1 not-italic text-muted-foreground">
                        <span className="font-medium text-foreground">{invoice.customerName}</span>
                        <span>{invoice.customerEmail}</span>
                    </address>
                </div>
                <div className="grid auto-rows-max gap-3 sm:mr-auto">
                    <div className="font-semibold">جزئیات فاکتور</div>
                    <ul className="grid gap-2">
                        <li className="flex items-center justify-between">
                            <span className="text-muted-foreground">تاریخ:</span>
                            <span>{new Date(invoice.date).toLocaleDateString('fa-IR')}</span>
                        </li>
                        <li className="flex items-center justify-between">
                            <span className="text-muted-foreground">تاریخ سررسید:</span>
                            <span>{new Date(invoice.dueDate).toLocaleDateString('fa-IR')}</span>
                        </li>
                    </ul>
                </div>
                <div className="grid auto-rows-max gap-3 sm:mr-auto">
                    <div className="font-semibold">وضعیت</div>
                     <Badge className={`capitalize justify-center ${statusStyles[invoice.status]}`} variant="outline">
                        {statusTranslation[invoice.status]}
                    </Badge>
                </div>
            </div>
            
            <Separator className="my-6" />

            <div className="grid gap-3">
                <div className="font-semibold">توضیحات</div>
                <p className="text-muted-foreground">{invoice.description}</p>
            </div>
            
            <Separator className="my-6" />

            <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>قلم</TableHead>
                    <TableHead className="hidden sm:table-cell text-center">تعداد</TableHead>
                    <TableHead className="hidden sm:table-cell">واحد</TableHead>
                    <TableHead className="text-right">قیمت</TableHead>
                    <TableHead className="text-right">جمع</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoice.items.map((item, index) => (
                <TableRow key={index}>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell className="hidden sm:table-cell text-center">{item.quantity}</TableCell>
                    <TableCell className="hidden sm:table-cell">{item.unit}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
        <CardFooter className="flex flex-col items-end gap-2 border-t bg-muted/50 px-6 py-4">
            <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">جمع جزء</span>
                    <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discount > 0 && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">تخفیف</span>
                        <span>-{formatCurrency(invoice.discount)}</span>
                    </div>
                )}
                {invoice.tax > 0 && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">مالیات</span>
                        <span>{formatCurrency(invoice.tax)}</span>
                    </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold text-lg">
                    <span>جمع کل</span>
                    <span>{formatCurrency(invoice.total)}</span>
                </div>
            </div>
        </CardFooter>
    </Card>
  );
}
