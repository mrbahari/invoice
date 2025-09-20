
'use client';

import type { Invoice, Customer, InvoiceStatus, DailySales } from '@/lib/definitions';
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
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, CreditCard, Users, ArrowUp } from 'lucide-react';
import { useMemo } from 'react';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import Link from 'next/link';
import { subDays, format, parseISO } from 'date-fns-jalali';
import type { DashboardTab } from '@/app/dashboard/dashboard-client';
import { useData } from '@/context/data-context';

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

type DashboardHomePageProps = {
  onNavigate: (tab: DashboardTab) => void;
};


export default function DashboardHomePageContent({ onNavigate }: DashboardHomePageProps) {
  const { data } = useData();
  const { invoices: allInvoices, customers: allCustomers } = data;

  const { totalRevenue, totalPaidInvoices, newCustomers, paidInvoices, chartData } = useMemo(() => {
    const paid = allInvoices.filter(inv => inv.status === 'Paid');
    const revenue = paid.reduce((acc, inv) => acc + inv.total, 0);

    const newCustomerCount = allCustomers.length;
    
    // Chart Data for last 7 days
    const salesByDay: Record<string, { paid: number; unpaid: number }> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dayString = format(date, 'yyyy-MM-dd');
        salesByDay[dayString] = { paid: 0, unpaid: 0 };
    }

    const sevenDaysAgo = subDays(today, 7);
    const invoicesInPeriod = allInvoices.filter(inv => parseISO(inv.date) >= sevenDaysAgo);

    invoicesInPeriod.forEach(invoice => {
        const day = format(parseISO(invoice.date), 'yyyy-MM-dd');
        if (salesByDay[day]) {
            if (invoice.status === 'Paid') {
                salesByDay[day].paid += invoice.total;
            } else {
                salesByDay[day].unpaid += invoice.total;
            }
        }
    });

    const finalChartData: DailySales[] = Object.keys(salesByDay).sort().map(dayString => ({
        date: format(parseISO(dayString), 'MM/dd'),
        paid: salesByDay[dayString].paid,
        unpaid: salesByDay[dayString].unpaid,
    }));

    return { 
        totalRevenue: revenue, 
        totalPaidInvoices: paid.length, 
        newCustomers: newCustomerCount,
        paidInvoices: paid,
        chartData: finalChartData,
    };
  }, [allInvoices, allCustomers]);
  
  const recentPaidInvoices = useMemo(() => {
    return paidInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [paidInvoices]);


  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          <button onClick={() => onNavigate('reports')} className="w-full text-right transition-all hover:shadow-lg hover:-translate-y-1">
            <Card className="animate-fade-in-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  درآمد کل
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  فقط از فاکتورهای پرداخت شده
                </p>
              </CardContent>
            </Card>
          </button>
          <button onClick={() => onNavigate('invoices')} className="w-full text-right transition-all hover:shadow-lg hover:-translate-y-1">
            <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">فاکتورهای پرداخت شده</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{totalPaidInvoices}</div>
                <p className="text-xs text-muted-foreground">
                  تعداد کل فاکتورهای پرداخت شده
                </p>
              </CardContent>
            </Card>
          </button>
          <button onClick={() => onNavigate('customers')} className="w-full text-right transition-all hover:shadow-lg hover:-translate-y-1">
            <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">مشتریان</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{newCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  تعداد کل مشتریان ثبت شده
                </p>
              </CardContent>
            </Card>
          </button>
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-2">
            <Card className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <CardHeader>
                    <CardTitle>نمای کلی فروش</CardTitle>
                    <CardDescription>نمای کلی درآمد در ۷ روز گذشته.</CardDescription>
                </CardHeader>
                <CardContent className="pr-2">
                    <OverviewChart data={chartData} />
                </CardContent>
            </Card>
            <Card className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                        <CardTitle>فاکتورهای اخیر</CardTitle>
                        <CardDescription>
                        آخرین فاکتورهایی که پرداخت شده‌اند.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>مشتری</TableHead>
                        <TableHead className="text-right">مبلغ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentPaidInvoices.map(invoice => {
                             const customer = allCustomers.find(c => c.id === invoice.customerId);
                             const hasValidName = customer && customer.name && customer.name !== 'مشتری بدون نام';
                             const displayName = hasValidName ? customer!.name : (invoice.customerName && invoice.customerName !== 'مشتری بدون نام' ? invoice.customerName : '');
                             const displayPhone = customer?.phone || 'بدون تماس';

                             return (
                               <TableRow key={invoice.id}>
                                  <TableCell>
                                      <div className="font-medium">{displayPhone}</div>
                                      {displayName && (
                                        <div className="text-sm text-muted-foreground">
                                          {displayName}
                                        </div>
                                      )}
                                  </TableCell>
                                  <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                              </TableRow>
                             )
                        })}
                         {recentPaidInvoices.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                    هنوز هیچ فاکتور پرداخت شده‌ای ثبت نشده است.
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
