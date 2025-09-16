
'use client';

import {
  Activity,
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
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.total, 0);
  const totalSales = invoices.length;
  const totalCustomers = customers.length;
  const recentInvoices = invoices.slice(0, 5);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">درآمد کل</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              ۲۰.۱% + از ماه گذشته
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجموع فروش</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalSales}</div>
            <p className="text-xs text-muted-foreground">
              ۱۸۰.۱% + از ماه گذشته
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجموع مشتریان</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              ۱۹% + از ماه گذشته
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فعال در حال حاضر</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+۵۷۳</div>
            <p className="text-xs text-muted-foreground">
               ۲۰۱+ از ساعت گذشته
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>نمای کلی فروش</CardTitle>
            <CardDescription>نمای کلی از فروش در ۱۲ ماه گذشته.</CardDescription>
          </CardHeader>
          <CardContent className="pr-2">
            <OverviewChart invoices={invoices} />
          </CardContent>
        </Card>
        <Card>
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
                  <TableHead className='text-left'>مبلغ</TableHead>
                  <TableHead className='text-center'>وضعیت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="font-medium">{invoice.customerName}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {invoice.customerEmail}
                      </div>
                    </TableCell>
                    <TableCell className="text-left">{formatCurrency(invoice.total)}</TableCell>
                    <TableCell className='text-center'>
                      <Badge className={`capitalize ${statusStyles[invoice.status]}`} variant="outline">
                        {statusTranslation[invoice.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
