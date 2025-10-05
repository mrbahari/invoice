
'use client';

import { useState, useMemo, useEffect } from 'react';
import { subDays, format, parseISO, isValid } from 'date-fns-jalali';
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
import type { Invoice, Customer, Product, DailySales, DashboardTab } from '@/lib/definitions';
import { DollarSign, CreditCard, Users, Hourglass } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useData } from '@/context/data-context';
import { useSearch } from './search-provider';

type Period = 'all' | '30d' | '7d' | 'today';

type ReportsPageProps = {
  onNavigate: (tab: DashboardTab) => void;
};


export default function ReportsPage({ onNavigate }: ReportsPageProps) {
  const { data } = useData();
  const { invoices: allInvoices, customers: allCustomers, products: allProducts } = data;
  const { setSearchVisible } = useSearch();

  const [period, setPeriod] = useState<Period>('all');

  useEffect(() => {
    setSearchVisible(false);
    return () => setSearchVisible(true);
  }, [setSearchVisible]);

  const { 
    totalRevenue, 
    paidInvoiceCount, 
    unpaidInvoiceCount,
    customerCount, 
    topCustomers, 
    topProducts,
    chartData
  } = useMemo(() => {
    if (!allInvoices || !allCustomers || !allProducts) {
      return {
        totalRevenue: 0,
        paidInvoiceCount: 0,
        unpaidInvoiceCount: 0,
        customerCount: 0,
        topCustomers: [],
        topProducts: [],
        chartData: [],
      };
    }
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

    const invoicesInPeriod = allInvoices.filter(inv => {
        // Ensure inv.date is a valid date string before parsing
        if (!inv.date || typeof inv.date !== 'string') return false;
        const invoiceDate = parseISO(inv.date);
        return isValid(invoiceDate) && invoiceDate >= startDate;
    });
    
    const paidInvoicesInPeriod = invoicesInPeriod.filter(inv => inv.status === 'Paid');
    const unpaidInvoicesInPeriod = invoicesInPeriod.filter(inv => inv.status !== 'Paid');

    const totalRevenue = paidInvoicesInPeriod.reduce((acc, inv) => acc + inv.total, 0);
    
    const uniqueCustomerIds = new Set(paidInvoicesInPeriod.map(inv => inv.customerId));
    const customerCount = uniqueCustomerIds.size;
    
    // Process chart data
    const salesByDay: Record<string, { paid: number; unpaid: number }> = {};
    
    invoicesInPeriod.forEach(invoice => {
        const invoiceDate = parseISO(invoice.date);
        if (isValid(invoiceDate)) {
            const day = format(invoiceDate, 'yyyy-MM-dd');
            if (!salesByDay[day]) {
                salesByDay[day] = { paid: 0, unpaid: 0 };
            }
            if (invoice.status === 'Paid') {
                salesByDay[day].paid += invoice.total;
            } else {
                salesByDay[day].unpaid += invoice.total;
            }
        }
    });

    const chartData: DailySales[] = Object.keys(salesByDay).sort().map(dayString => {
      const dateObj = parseISO(dayString);
      return {
        date: isValid(dateObj) ? format(dateObj, 'MM/dd') : 'تاریخ نامعتبر',
        paid: salesByDay[dayString].paid,
        unpaid: salesByDay[dayString].unpaid,
      };
    });


    const customerSpending = paidInvoicesInPeriod.reduce<Record<string, { total: number, name: string }>>((acc, inv) => {
        if (!acc[inv.customerId]) {
          acc[inv.customerId] = { total: 0, name: inv.customerName };
        }
        acc[inv.customerId].total += inv.total;
        return acc;
    }, {});

    const topCustomers = Object.entries(customerSpending)
      .map(([id, { total, name }]) => {
        const customerDetails = allCustomers.find(c => c.id === id);
        return {
            id,
            name,
            phone: customerDetails?.phone || '',
            total,
            avatar: customerDetails?.email || ''
        }
      })
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
    <div className="grid flex-1 items-start gap-4 md:gap-8" data-main-page="true">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        <button onClick={() => onNavigate('invoices')} className="w-full text-right">
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
                فقط از فاکتورهای پرداخت شده
              </p>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => onNavigate('invoices')} className="w-full text-right">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">فاکتورهای پرداخت شده</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{paidInvoiceCount.toLocaleString('fa-IR')}</div>
               <p className="text-xs text-muted-foreground">
                تعداد فاکتورهای پرداخت شده در این دوره
              </p>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => onNavigate('invoices')} className="w-full text-right">
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">سفارش‌های در انتظار</CardTitle>
              <Hourglass className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{unpaidInvoiceCount.toLocaleString('fa-IR')}</div>
              <p className="text-xs text-muted-foreground">
                فاکتورهای در انتظار و سررسید گذشته
              </p>
            </CardContent>
          </Card>
        </button>
        <button onClick={() => onNavigate('customers')} className="w-full text-right">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">مشتریان فعال</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{customerCount.toLocaleString('fa-IR')}</div>
              <p className="text-xs text-muted-foreground">
                مشتریانی که در این دوره خرید کرده‌اند
              </p>
            </CardContent>
          </Card>
        </button>
      </div>

      <Accordion 
        type="multiple" 
        defaultValue={["sales-overview", "top-customers", "top-products"]}
        className="grid gap-4 md:gap-8"
      >
        <AccordionItem value="sales-overview" className="border-b-0">
          <Card>
              <AccordionTrigger className="p-6 hover:no-underline">
                <div className='text-right'>
                  <CardTitle>نمای کلی فروش</CardTitle>
                  <CardDescription className='mt-2'>مقایسه درآمد پرداخت شده و پرداخت نشده در بازه زمانی انتخاب شده.</CardDescription>
                </div>
              </AccordionTrigger>
            <AccordionContent>
              <CardContent className="pr-2">
                <OverviewChart data={chartData} />
              </CardContent>
            </AccordionContent>
          </Card>
        </AccordionItem>
        
        <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
          <AccordionItem value="top-customers" className="border-b-0">
            <Card>
              <AccordionTrigger className="p-6 hover:no-underline">
                 <div className='text-right'>
                    <CardTitle>مشتریان برتر</CardTitle>
                    <CardDescription className='mt-2'>
                    مشتریانی با بیشترین میزان خرید در این دوره.
                    </CardDescription>
                  </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>مشتری</TableHead>
                                <TableHead className="text-left">مجموع خرید</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {topCustomers.map(customer => {
                            const hasValidName = customer.name && customer.name !== 'مشتری بدون نام';
                            const initials = (hasValidName ? customer.name : customer.phone).split(' ').map(n => n[0]).join('');
                            return (
                                <TableRow key={customer.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3 hover:underline">
                                            <Avatar className="hidden h-9 w-9 sm:flex">
                                                <AvatarImage src={`https://picsum.photos/seed/${customer.id}/36/36`} alt="آواتار" />
                                                <AvatarFallback>{initials}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{customer.phone}</div>
                                                <div className="text-sm text-muted-foreground">{hasValidName ? customer.name : 'بی نام'}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-left font-mono">{formatCurrency(customer.total)}</TableCell>
                                </TableRow>
                            );
                        })}
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
              </AccordionContent>
            </Card>
          </AccordionItem>

          <AccordionItem value="top-products" className="border-b-0">
            <Card>
                <AccordionTrigger className="p-6 hover:no-underline">
                  <div className='text-right'>
                    <CardTitle>پرفروش‌ترین محصولات</CardTitle>
                    <CardDescription className='mt-2'>
                        محصولاتی که بیشترین تعداد فروش را در این دوره داشته‌اند.
                    </CardDescription>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
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
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3 hover:underline">
                                            <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="rounded-md object-cover" />
                                            <span className="font-medium">{product.name}</span>
                                        </div>
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
                </AccordionContent>
            </Card>
          </AccordionItem>
        </div>
      </Accordion>
    </div>
  );
}
