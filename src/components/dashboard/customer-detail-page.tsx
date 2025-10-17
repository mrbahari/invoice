
'use client';

import React from 'react';
import type { Customer, Invoice, InvoiceStatus } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowRight, Edit, Phone, Mail, MapPin, DollarSign, FileText } from 'lucide-react';
import { useData } from '@/context/data-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { FloatingToolbar } from './floating-toolbar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import Image from 'next/image';

type CustomerDetailPageProps = {
  customer: Customer;
  onBack: () => void;
  onEdit: (customer: Customer) => void;
};

const statusTranslation: Record<InvoiceStatus, string> = {
  Paid: 'پرداخت شده',
  Pending: 'در انتظار',
  Overdue: 'سررسید گذشته',
};

const statusStyles: Record<InvoiceStatus, string> = {
  Paid: 'text-green-600 border-green-600/50 bg-green-500/10',
  Pending: 'text-orange-600 border-orange-500/50 bg-orange-500/10',
  Overdue: 'text-red-600 border-red-500/50 bg-red-500/10',
};

export function CustomerDetailPage({ customer, onBack, onEdit }: CustomerDetailPageProps) {
  const { data } = useData();
  const { invoices } = data;

  const customerInvoices = invoices.filter(inv => inv.customerId === customer.id);
  const totalSpent = customerInvoices.reduce((acc, inv) => acc + (inv.status === 'Paid' ? inv.total : 0), 0);
  const nameInitials = (customer.name !== 'مشتری بدون نام' ? customer.name : customer.phone).split(' ').map(n => n[0]).join('');

  return (
    <TooltipProvider>
      <div className="grid gap-6 pb-24">
        <FloatingToolbar pageKey="customer-detail-page">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={onBack} className="text-muted-foreground w-8 h-8">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>بازگشت به لیست</p></TooltipContent>
            </Tooltip>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(customer)} className="text-muted-foreground w-8 h-8">
                        <Edit className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>ویرایش مشتری</p></TooltipContent>
            </Tooltip>
        </FloatingToolbar>

        <Card className="overflow-hidden">
            <div className="relative h-48 w-full">
                <Image 
                    src={`https://picsum.photos/seed/${customer.id}/1200/400`}
                    alt={`بنر مشتری ${customer.name}`}
                    fill
                    className="object-cover"
                    data-ai-hint="abstract background"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-white shadow-lg">{customer.name}</h1>
                        <Button variant="outline" size="sm" onClick={() => onEdit(customer)} className="bg-white/20 text-white backdrop-blur-sm border-white/50 hover:bg-white/30">
                            <Edit className="ml-2 h-4 w-4" />
                            ویرایش
                        </Button>
                    </div>
                </div>
            </div>
            <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    {customer.phone !== 'شماره ثبت نشده' && <div className="flex items-center gap-3"><Phone className="h-5 w-5" /><span>{customer.phone}</span></div>}
                    {customer.email !== 'ایمیل ثبت نشده' && <div className="flex items-center gap-3"><Mail className="h-5 w-5" /><span>{customer.email}</span></div>}
                    {customer.address !== 'آدرس ثبت نشده' && <div className="flex items-center gap-3 sm:col-span-3"><MapPin className="h-5 w-5" /><span>{customer.address}</span></div>}
                </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">مجموع خرید</CardTitle>
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(totalSpent)}</div>
                    <p className="text-xs text-muted-foreground">بر اساس فاکتورهای پرداخت شده</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">تعداد فاکتورها</CardTitle>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{customerInvoices.length.toLocaleString('fa-IR')}</div>
                    <p className="text-xs text-muted-foreground">کل فاکتورهای ثبت شده</p>
                </CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>تاریخچه فاکتورها</CardTitle>
            <CardDescription>لیست تمام فاکتورهای ثبت شده برای این مشتری.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>شماره فاکتور</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead className="text-left">مبلغ کل</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customerInvoices.length > 0 ? customerInvoices.map(invoice => (
                        <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                            <TableCell>{new Date(invoice.date).toLocaleDateString('fa-IR')}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={statusStyles[invoice.status]}>{statusTranslation[invoice.status]}</Badge>
                            </TableCell>
                            <TableCell className="text-left font-mono">{formatCurrency(invoice.total)}</TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                هیچ فاکتوری برای این مشتری ثبت نشده است.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
