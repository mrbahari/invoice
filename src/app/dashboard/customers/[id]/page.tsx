'use client';

import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { initialCustomers, initialInvoices } from '@/lib/data';
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


export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const [customers] = useLocalStorage<Customer[]>('customers', initialCustomers);
  const [invoices] = useLocalStorage<Invoice[]>('invoices', initialInvoices);

  const customer = customers.find((c) => c.id === params.id);

  const customerInvoices = useMemo(() => {
    if (!customer) return [];
    return invoices
      .filter((inv) => inv.customerId === customer.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [customer, invoices]);

  const stats = useMemo(() => {
    const totalSpent = customerInvoices.reduce((acc, inv) => acc + inv.total, 0);
    const orderCount = customerInvoices.length;
    return { totalSpent, orderCount };
  }, [customerInvoices]);

  if (!customer) {
    notFound();
  }
  
  const nameInitials = customer.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border">
                <AvatarImage src={`https://picsum.photos/seed/${customer.id}/64/64`} alt={customer.name} />
                <AvatarFallback>{nameInitials}</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
                <p className="text-muted-foreground">{customer.phone}</p>
            </div>
        </div>
        <Link href={`/dashboard/customers/${customer.id}/edit`}>
            <Button variant="outline">
                <FilePen className="ml-2 h-4 w-4" />
                ویرایش مشتری
            </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجموع خرید</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد سفارشات</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orderCount}</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>تاریخچه خرید</CardTitle>
            <CardDescription>نمودار میزان خرید مشتری در طول زمان.</CardDescription>
        </CardHeader>
        <CardContent>
            <OverviewChart invoices={customerInvoices} period="all" />
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
                        <TableHead className="text-right">مبلغ کل</TableHead>
                         <TableHead>
                            <span className="sr-only">اقدامات</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customerInvoices.length > 0 ? (
                        customerInvoices.map(invoice => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                <TableCell>{new Date(invoice.date).toLocaleDateString('fa-IR')}</TableCell>
                                <TableCell>
                                     <Badge className={`capitalize ${statusStyles[invoice.status]}`} variant="outline">
                                        {statusTranslation[invoice.status]}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                                 <TableCell className="text-right">
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={`/dashboard/invoices/${invoice.id}/edit`}>مشاهده</Link>
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
  );
}
