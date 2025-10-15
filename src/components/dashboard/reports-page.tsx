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
import { useData } from '@/context/data-context';
import { useSearch } from './search-provider';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

type Period = 'all' | '30d' | '7d' | 'today';

type ReportsPageProps = {
  onNavigate: (tab: DashboardTab) => void;
};


export default function ReportsPage({ onNavigate }: ReportsPageProps) {
  const { data } = useData();
  const { invoices: allInvoices, customers: allCustomers, products: allProducts } = data;
  const { setSearchVisible } = useSearch();
  const { user } = useUser();
  const { toast } = useToast();

  const [period, setPeriod] = useState<Period>('all');

  useEffect(() => {
    setSearchVisible(false);
    return () => setSearchVisible(true);
  }, [setSearchVisible]);

  const handleNavigation = (tab: DashboardTab) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'ورود لازم است',
        description: 'برای مشاهده این بخش، لطفاً ابتدا وارد حساب خود شوید.',
      });
      return;
    }
    onNavigate(tab);
  };

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
        if (!inv.date || typeof inv.date !== 'string') return false;
        const invoiceDate = parseISO(inv.date);
        return isValid(invoiceDate) && invoiceDate >= startDate;
    });
    
    const paidInvoicesInPeriod = invoicesInPeriod.filter(inv => inv.status === 'Paid');
    const unpaidInvoicesInPeriod = invoicesInPeriod.filter(inv => inv.status !== 'Paid');

    const totalRevenue = paidInvoicesInPeriod.reduce((acc, inv) => acc + inv.total, 0);
    
    const uniqueCustomerIds = new Set(paidInvoicesInPeriod.map(inv => inv.customerId));
    const customerCount = uniqueCustomerIds.size;
    
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

  const animationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      },
    }),
  };

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
        {[
          { title: 'درآمد کل', value: formatCurrency(totalRevenue), icon: DollarSign, description: 'فقط از فاکتورهای پرداخت شده', tab: 'invoices' },
          { title: 'فاکتورهای پرداخت شده', value: `+${paidInvoiceCount.toLocaleString('fa-IR')}`, icon: CreditCard, description: 'تعداد فاکتورهای پرداخت شده', tab: 'invoices' },
          { title: 'سفارش‌های در انتظار', value: `+${unpaidInvoiceCount.toLocaleString('fa-IR')}`, icon: Hourglass, description: 'فاکتورهای در انتظار و سررسید گذشته', tab: 'invoices' },
          { title: 'مشتریان فعال', value: `+${customerCount.toLocaleString('fa-IR')}`, icon: Users, description: 'خریداران در این دوره', tab: 'customers' },
        ].map((stat, i) => (
          <motion.div key={stat.title} custom={i} initial="hidden" animate="visible" variants={animationVariants}>
            <button onClick={() => handleNavigation(stat.tab as DashboardTab)} className="w-full text-right">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            </button>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-5">
        <motion.div custom={4} initial="hidden" animate="visible" variants={animationVariants} className="lg:col-span-3">
            <Card>
                <CardHeader>
                    <CardTitle>نمای کلی فروش</CardTitle>
                    <CardDescription>مقایسه درآمد پرداخت شده و پرداخت نشده در بازه زمانی انتخاب شده.</CardDescription>
                </CardHeader>
                <CardContent className="pr-2">
                    <OverviewChart data={chartData} />
                </CardContent>
            </Card>
        </motion.div>

        <motion.div custom={5} initial="hidden" animate="visible" variants={animationVariants} className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>مشتریان برتر</CardTitle>
                    <CardDescription>مشتریانی با بیشترین میزان خرید در این دوره.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {topCustomers.map(customer => {
                            const hasValidName = customer.name && customer.name !== 'مشتری بدون نام';
                            const initials = (hasValidName ? customer.name : customer.phone).split(' ').map(n => n[0]).join('');
                            return (
                                <div key={customer.id} className="flex items-center gap-4">
                                    <Avatar className="hidden h-9 w-9 sm:flex">
                                        <AvatarImage src={`https://picsum.photos/seed/${customer.id}/36/36`} alt="آواتار" />
                                        <AvatarFallback>{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-1 flex-1">
                                        <p className="text-sm font-medium leading-none">{customer.phone}</p>
                                        <p className="text-sm text-muted-foreground">{hasValidName ? customer.name : 'بی نام'}</p>
                                    </div>
                                    <div className="ml-auto font-medium">{formatCurrency(customer.total)}</div>
                                </div>
                            )
                        })}
                        {topCustomers.length === 0 && (
                            <div className="text-center text-muted-foreground py-8">
                                هیچ مشتری در این بازه زمانی خریدی نداشته است.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
      </div>

      <motion.div custom={6} initial="hidden" animate="visible" variants={animationVariants}>
        <Card>
            <CardHeader>
                <CardTitle>پرفروش‌ترین محصولات</CardTitle>
                <CardDescription>محصولاتی که بیشترین تعداد فروش را در این دوره داشته‌اند.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">تصویر</TableHead>
                            <TableHead>محصول</TableHead>
                            <TableHead className="text-center">تعداد فروش</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {topProducts.map(product => (
                        <TableRow key={product.id}>
                            <TableCell>
                                <Image src={product.imageUrl} alt={product.name} width={64} height={64} className="rounded-md object-cover" />
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-center font-mono font-bold text-lg">{product.quantity.toLocaleString('fa-IR')}</TableCell>
                        </TableRow>
                    ))}
                    {topProducts.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground h-32">
                                هیچ محصولی در این بازه زمانی فروخته نشده است.
                            </TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
