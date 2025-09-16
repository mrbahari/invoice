
'use client';

import { useState, useMemo } from 'react';
import { subDays, startOfMonth, format, parseISO } from 'date-fns-jalali';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Invoice, Customer } from '@/lib/definitions';
import { initialInvoices, initialCustomers } from '@/lib/data';
import { DollarSign, CreditCard, Users, ArrowUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

type Period = 'all' | '30d' | '7d' | 'today';

export default function ReportsPage() {
  const [allInvoices] = useLocalStorage<Invoice[]>('invoices', initialInvoices);
  const [allCustomers] = useLocalStorage<Customer[]>('customers', initialCustomers);
  const [period, setPeriod] = useState<Period>('all');

  const { invoicesInPeriod, totalRevenue, invoiceCount, customerCount, topCustomers } = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case 'all':
      default:
        startDate = new Date(0); // The beginning of time
    }

    const invoicesInPeriod = allInvoices.filter(inv => parseISO(inv.date) >= startDate);
    const totalRevenue = invoicesInPeriod.reduce((acc, inv) => acc + inv.total, 0);
    const invoiceCount = invoicesInPeriod.length;

    const uniqueCustomerIds = new Set(invoicesInPeriod.map(inv => inv.customerId));
    const customerCount = uniqueCustomerIds.size;
    
    const customerSpending = invoicesInPeriod.reduce<Record<string, { total: number, name: string }>>((acc, inv) => {
        if (!acc[inv.customerId]) {
          acc[inv.customerId] = { total: 0, name: inv.customerName };
        }
        acc[inv.customerId].total += inv.total;
        return acc;
    }, {});

    const topCustomers = Object.entries(customerSpending)
      .map(([id, { total, name }]) => ({
        id,
        name,
        total,
        avatar: allCustomers.find(c => c.id === id)?.email || '' // Placeholder for avatar logic
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);


    return { invoicesInPeriod, totalRevenue, invoiceCount, customerCount, topCustomers };
  }, [allInvoices, allCustomers, period]);

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">گزارشات</h1>
                <p className="text-muted-foreground">
                    عملکرد فروش و معیارهای کلیدی خود را تحلیل کنید.
                </p>
            </div>
            <Tabs defaultValue="all" dir="rtl" onValueChange={(value) => setPeriod(value as Period)}>
                <TabsList>
                    <TabsTrigger value="all">کل زمان</TabsTrigger>
                    <TabsTrigger value="30d">۳۰ روز گذشته</TabsTrigger>
                    <TabsTrigger value="7d">۷ روز گذشته</TabsTrigger>
                    <TabsTrigger value="today">امروز</TabsTrigger>
                </TabsList>
            </Tabs>
       </div>

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              درآمد کل
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              بر اساس بازه زمانی انتخاب شده
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فاکتورها</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{invoiceCount}</div>
             <p className="text-xs text-muted-foreground">
              تعداد کل فاکتورهای صادر شده
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مشتریان فعال</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{customerCount}</div>
            <p className="text-xs text-muted-foreground">
              مشتریانی که در این دوره خرید کرده‌اند
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>نمای کلی فروش</CardTitle>
            <CardDescription>نمای کلی درآمد در بازه زمانی انتخاب شده.</CardDescription>
          </CardHeader>
          <CardContent className="pr-2">
             <OverviewChart invoices={invoicesInPeriod} period={period} />
          </CardContent>
        </Card>

         <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>مشتریان برتر</CardTitle>
            <CardDescription>
              مشتریانی با بیشترین میزان خرید در این دوره.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>مشتری</TableHead>
                        <TableHead className="text-left">مجموع خرید</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {topCustomers.map(customer => (
                    <TableRow key={customer.id}>
                        <TableCell>
                            <Link href={`/dashboard/customers/${customer.id}/edit`}>
                                <div className="flex items-center gap-3 hover:underline">
                                    <Avatar className="hidden h-9 w-9 sm:flex">
                                        <AvatarImage src={`https://picsum.photos/seed/${customer.id}/36/36`} alt="آواتار" />
                                        <AvatarFallback>{customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{customer.name}</span>
                                </div>
                            </Link>
                        </TableCell>
                        <TableCell className="text-left font-mono">{formatCurrency(customer.total)}</TableCell>
                    </TableRow>
                ))}
                 {topCustomers.length === 0 && (
                     <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                            هیچ مشتری در این بازه زمانی خریدی نداشته است.
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
