
'use client';

import Link from 'next/link';
import {
  CreditCard,
  DollarSign,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { initialInvoices, initialCustomers } from '@/lib/data';
import { formatCurrency } from '@/lib/utils';
import type { InvoiceStatus, Invoice, Customer } from '@/lib/definitions';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { useRouter } from 'next/navigation';

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


export default function DashboardPage() {
  const [invoices] = useLocalStorage<Invoice[]>('invoices', initialInvoices);
  const [customers] = useLocalStorage<Customer[]>('customers', initialCustomers);
  const router = useRouter();
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalSales = invoices.length;
  const totalCustomers = customers.length;
  const recentInvoices = invoices.slice(0, 5);
  
  const handleRowClick = (invoiceId: string) => {
    router.push(`/dashboard/invoices/${invoiceId}/edit`);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card className="animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">درآمد کل</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              مجموع درآمد از تمام فاکتورها
            </p>
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجموع فروش</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalSales}</div>
            <p className="text-xs text-muted-foreground">
              تعداد کل فاکتورهای صادر شده
            </p>
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجموع مشتریان</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              تعداد کل مشتریان ثبت شده
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 md:grid-cols-2 xl:grid-cols-3">
        <Link href="/dashboard/reports" className="block animate-fade-in-up xl:col-span-2" style={{ animationDelay: '0.3s' }}>
          <Card className="transition-all hover:shadow-lg hover:-translate-y-1 h-full">
            <CardHeader>
              <CardTitle>نمای کلی فروش</CardTitle>
              <CardDescription>نمای کلی از فروش در ۱۲ ماه گذشته.</CardDescription>
            </CardHeader>
            <CardContent className="pr-2">
              <OverviewChart invoices={invoices} />
            </CardContent>
          </Card>
        </Link>
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle>فاکتورهای اخیر</CardTitle>
            <CardDescription>
              شما {invoices.filter(inv => inv.status === 'Pending').length} فاکتور در انتظار پرداخت دارید.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>مشتری</TableHead>
                  <TableHead className='text-right'>مبلغ</TableHead>
                  <TableHead className='text-center'>وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((invoice) => {
                  const customer = customers.find(c => c.id === invoice.customerId);
                  return (
                    <TableRow 
                      key={invoice.id} 
                      onClick={() => handleRowClick(invoice.id)} 
                      className="cursor-pointer transition-colors hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="font-medium">{invoice.customerName}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          {customer?.phone || 'شماره ثبت نشده'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                      <TableCell className='text-center'>
                        <Badge className={`capitalize ${statusStyles[invoice.status]}`} variant="outline">
                          {statusTranslation[invoice.status]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
