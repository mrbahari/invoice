'use client';

import Link from 'next/link';
import type { Customer, Invoice } from '@/lib/definitions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DollarSign,
  ShoppingBag,
  FilePen,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useMemo } from 'react';
import { useData } from '@/context/data-context';

const statusStyles: Record<Invoice['status'], string> = {
  Paid: 'text-green-600 bg-green-500/10',
  Pending: 'text-orange-600 bg-orange-500/10',
  Overdue: 'text-red-600 bg-red-500/10',
};
const statusTranslation: Record<Invoice['status'], string> = {
    Paid: 'پرداخت شده',
    Pending: 'در انتظار',
    Overdue: 'سررسید گذشته',
};

type CustomerDetailPageProps = {
    customerId: string;
    onBack: () => void;
    onEdit: (customer: Customer) => void;
    onInvoiceClick: (invoiceId: string) => void;
}

export default function CustomerDetailPage({ customerId, onBack, onEdit, onInvoiceClick }: CustomerDetailPageProps) {
  const { data } = useData();
  const { customers, invoices } = data;

  const customer = customers.find((c) => c.id === customerId);

  const customerInvoices = useMemo(() => {
    if (!customer) return [];
    return invoices
      .filter((inv) => inv.customerId === customer.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [customer, invoices]);

  const { paidInvoices, totalSpent, orderCount } = useMemo(() => {
    const paid = customerInvoices.filter(inv => inv.status === 'Paid');
    const spent = paid.reduce((acc, inv) => acc + inv.total, 0);
    return { paidInvoices: paid, totalSpent: spent, orderCount: paid.length };
  }, [customerInvoices]);

  if (!customer) {
    return (
        <Card>
            <CardContent className="py-16 text-center">
                <p className="text-muted-foreground mb-4">مشتری مورد نظر یافت نشد.</p>
                 <Button onClick={onBack}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    بازگشت به لیست مشتریان
                </Button>
            </CardContent>
        </Card>
    );
  }
  
  const nameInitials = customer.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                 <Button onClick={onBack} variant="outline" size="icon" className="h-8 w-8">
                    <ArrowRight className="h-4 w-4" />
                </Button>
                <Avatar className="h-16 w-16 border">
                    <AvatarImage src={`https://picsum.photos/seed/${customer.id}/64/64`} alt={customer.name} />
                    <AvatarFallback>{nameInitials}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
                    <p className="text-muted-foreground">{customer.phone}</p>
                </div>
            </div>
            <Button variant="outline" onClick={() => onEdit(customer)}>
                <FilePen className="ml-2 h-4 w-4" />
                ویرایش مشتری
            </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجموع خرید</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد سفارشات پرداخت شده</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCount}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>تاریخچه خرید</CardTitle>
                <CardDescription>نمودار میزان خرید مشتری در ۷ روز گذشته.</CardDescription>
            </CardHeader>
            <CardContent>
                <OverviewChart data={[]} />
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>فاکتورها</CardTitle>
                <CardDescription>لیست تمام فاکتورهای صادر شده برای این مشتری.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>شماره فاکتور</TableHead>
                            <TableHead>تاریخ</TableHead>
                            <TableHead>وضعیت</TableHead>
                            <TableHead className="text-left">مبلغ کل</TableHead>
                             <TableHead>
                                <span className="sr-only">اقدامات</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customerInvoices.length > 0 ? (
                            customerInvoices.map(invoice => (
                                <TableRow key={invoice.id} onClick={() => onInvoiceClick(invoice.id)} className="cursor-pointer hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                    <TableCell>{new Date(invoice.date).toLocaleDateString('fa-IR')}</TableCell>
                                    <TableCell>
                                         <Badge className={`capitalize ${statusStyles[invoice.status]}`} variant="outline">
                                            {statusTranslation[invoice.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-left">{formatCurrency(invoice.total)}</TableCell>
                                     <TableCell className="text-left">
                                        <Button asChild variant="ghost" size="sm">
                                            <button>مشاهده</button>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    هیچ فاکتوری برای این مشتری یافت نشد.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
