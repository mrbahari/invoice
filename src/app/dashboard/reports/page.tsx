
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
import type { Invoice, Customer, Product, DailySales } from '@/lib/definitions';
import { initialData } from '@/lib/data';
import { DollarSign, CreditCard, Users, Hourglass, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import Image from 'next/image';

type Period = 'all' | '30d' | '7d' | 'today';

export default function ReportsPage() {
  const [allInvoices] = useLocalStorage<Invoice[]>('invoices', initialData.invoices);
  const [allCustomers] = useLocalStorage<Customer[]>('customers', initialData.customers);
  const [allProducts] = useLocalStorage<Product[]>('products', initialData.products);
  const [period, setPeriod] = useState<Period>('all');

  const { 
    totalRevenue, 
    paidInvoiceCount, 
    unpaidInvoiceCount,
    customerCount, 
    topCustomers, 
    topProducts,
    chartData
  } = useMemo(() => {
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
    
    const paidInvoicesInPeriod = invoicesInPeriod.filter(inv => inv.status === 'Paid');
    const unpaidInvoicesInPeriod = invoicesInPeriod.filter(inv => inv.status !== 'Paid');

    const totalRevenue = paidInvoicesInPeriod.reduce((acc, inv) => acc + inv.total, 0);
    
    const uniqueCustomerIds = new Set(paidInvoicesInPeriod.map(inv => inv.customerId));
    const customerCount = uniqueCustomerIds.size;
    
    // Process chart data
    const salesByDay: Record<string, { paid: number; unpaid: number }> = {};
    
    invoicesInPeriod.forEach(invoice => {
        const day = format(parseISO(invoice.date), 'yyyy-MM-dd');
        if (!salesByDay[day]) {
            salesByDay[day] = { paid: 0, unpaid: 0 };
        }
        if (invoice.status === 'Paid') {
            salesByDay[day].paid += invoice.total;
        } else {
            salesByDay[day].unpaid += invoice.total;
        }
    });

    const chartData: DailySales[] = Object.keys(salesByDay).sort().map(dayString => ({
        date: format(parseISO(dayString), 'MM/dd'),
        paid: salesByDay[dayString].paid,
        unpaid: salesByDay[dayString].unpaid,
    }));


    const customerSpending = paidInvoicesInPeriod.reduce<Record<string, { total: number, name: string }>>((acc, inv) => {
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
        avatar: allCustomers.find(c => c.id === id)?.email || ''
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const productSales = paidInvoicesInPeriod.flatMap(inv => inv.items).reduce<Record<string, number>>((acc, item) => {
        if (!acc[item.productId]) {
            acc[item.productId] = 0;
        }
        acc[item.productId] += item.quantity;
        return acc;
    }, {});

    const topProducts = Object.entries(productSales)
        .map(([productId, quantity]) => {
            const product = allProducts.find(p => p.id === productId);
            return {
                id: productId,
                name: product?.name || 'محصول حذف شده',
                imageUrl: product?.imageUrl || 'https://placehold.co/64x64',
                quantity,
            };
        })
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);


    return { 
        totalRevenue, 
        paidInvoiceCount: paidInvoicesInPeriod.length,
        unpaidInvoiceCount: unpaidInvoicesInPeriod.length, 
        customerCount, 
        topCustomers, 
        topProducts,
        chartData
    };
  }, [allInvoices, allCustomers, allProducts, period]);

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

      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
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
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">فاکتورهای پرداخت شده</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{paidInvoiceCount}</div>
             <p className="text-xs text-muted-foreground">
              تعداد فاکتورهای پرداخت شده در این دوره
            </p>
          </CardContent>
        </Card>
         <Card className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">سفارش‌های در انتظار</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{unpaidInvoiceCount}</div>
            <p className="text-xs text-muted-foreground">
              فاکتورهای در انتظار و سررسید گذشته
            </p>
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
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

      <div className="grid gap-4 md:gap-8">
        <Card className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle>نمای کلی فروش</CardTitle>
            <CardDescription>مقایسه درآمد پرداخت شده و پرداخت نشده در بازه زمانی انتخاب شده.</CardDescription>
          </CardHeader>
          <CardContent className="pr-2">
             <OverviewChart data={chartData} />
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
            <Card className="animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
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
                        <TableRow key={customer.id} className="transition-all hover:shadow-md hover:-translate-y-1">
                            <TableCell>
                                <Link href={`/dashboard/customers/${customer.id}`}>
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

            <Card className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <CardHeader>
                    <CardTitle>پرفروش‌ترین محصولات</CardTitle>
                    <CardDescription>
                        محصولاتی که بیشترین تعداد فروش را در این دوره داشته‌اند.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>محصول</TableHead>
                                <TableHead className="text-center">تعداد فروش</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {topProducts.map(product => (
                            <TableRow key={product.id} className="transition-all hover:shadow-md hover:-translate-y-1">
                                <TableCell>
                                    <Link href={`/dashboard/products/${product.id}/edit`}>
                                        <div className="flex items-center gap-3 hover:underline">
                                            <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="rounded-md object-cover" />
                                            <span className="font-medium">{product.name}</span>
                                        </div>
                                    </Link>
                                </TableCell>
                                <TableCell className="text-center font-mono font-bold">{product.quantity.toLocaleString('fa-IR')}</TableCell>
                            </TableRow>
                        ))}
                        {topProducts.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                    هیچ محصولی در این بازه زمانی فروخته نشده است.
                                </TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
