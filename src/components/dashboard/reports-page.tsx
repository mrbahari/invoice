
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import type { Invoice, Customer, Product, DailySales, DashboardTab, Category } from '@/lib/definitions';
import { DollarSign, CreditCard, Users, Hourglass, Loader2, Wrench } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { useData } from '@/context/data-context';
import { useSearch } from './search-provider';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { writeBatch, doc } from 'firebase/firestore';
import { Badge } from '../ui/badge';


type Period = 'all' | '30d' | '7d' | 'today';

type ReportsPageProps = {
  onNavigate: (tab: DashboardTab) => void;
};


export default function ReportsPage({ onNavigate }: ReportsPageProps) {
  const { data, updateDocuments } = useData();
  const { invoices: allInvoices, customers: allCustomers, products: allProducts, categories: allCategories } = data;
  const { setSearchVisible } = useSearch();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [period, setPeriod] = useState<Period>('all');
  const [replacementProduct, setReplacementProduct] = useState<Product | null>(null);
  const [deletedProductId, setDeletedProductId] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);

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
    
    const salesByDay: Record<string, { revenue: number; newCustomers: number; invoices: number; }> = {};
    const seenCustomers = new Set();
    
    invoicesInPeriod.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).forEach(invoice => {
        const invoiceDate = parseISO(invoice.date);
        if (isValid(invoiceDate)) {
            const day = format(invoiceDate, 'yyyy-MM-dd');
            if (!salesByDay[day]) {
                salesByDay[day] = { revenue: 0, newCustomers: 0, invoices: 0 };
            }

            salesByDay[day].invoices += 1;
            
            if (invoice.status === 'Paid') {
                salesByDay[day].revenue += invoice.total;
            }

            if (!seenCustomers.has(invoice.customerId)) {
                salesByDay[day].newCustomers += 1;
                seenCustomers.add(invoice.customerId);
            }
        }
    });

    const chartData: DailySales[] = Object.keys(salesByDay).sort().map(dayString => {
      const dateObj = parseISO(dayString);
      return {
        date: isValid(dateObj) ? format(dateObj, 'MM/dd') : 'تاریخ نامعتبر',
        revenue: salesByDay[dayString].revenue,
        customers: salesByDay[dayString].newCustomers,
        invoices: salesByDay[dayString].invoices,
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

    const handleConfirmReplacement = async () => {
        if (!deletedProductId || !replacementProduct || !firestore || !user) return;
        
        setIsReplacing(true);
        try {
            const invoicesToUpdate = allInvoices.filter(inv => 
                inv.items.some(item => item.productId === deletedProductId)
            );
            
            if (invoicesToUpdate.length === 0) {
                toast({ variant: "default", title: "موردی یافت نشد", description: "هیچ فاکتوری با این محصول حذف شده یافت نشد." });
                return;
            }

            const batch = writeBatch(firestore);
            
            invoicesToUpdate.forEach(invoice => {
                const invoiceRef = doc(firestore, 'users', user.uid, 'invoices', invoice.id);
                const newItems = invoice.items.map(item => {
                    if (item.productId === deletedProductId) {
                        return {
                            ...item,
                            productId: replacementProduct.id,
                            productName: replacementProduct.name,
                            unitPrice: replacementProduct.price, // Update price as well
                            totalPrice: item.quantity * replacementProduct.price,
                            imageUrl: replacementProduct.imageUrl,
                        };
                    }
                    return item;
                });
                 const newSubtotal = newItems.reduce((acc, item) => acc + item.totalPrice, 0);
                 const newTotal = newSubtotal - invoice.discount + invoice.additions + invoice.tax;

                batch.update(invoiceRef, { items: newItems, subtotal: newSubtotal, total: newTotal });
            });
            
            await batch.commit();

            toast({
                variant: 'success',
                title: 'جایگزینی موفق',
                description: `محصول در ${invoicesToUpdate.length} فاکتور با موفقیت جایگزین شد.`,
            });

        } catch (error) {
            console.error("Error replacing product in invoices:", error);
            toast({
                variant: 'destructive',
                title: 'خطا در جایگزینی',
                description: 'مشکلی در به‌روزرسانی فاکتورها رخ داد.',
            });
        } finally {
            setIsReplacing(false);
            setDeletedProductId(null);
            setReplacementProduct(null);
        }
    };
    
    const groupedProductsForDialog = useMemo(() => {
        if (!allProducts || !allCategories) return {};
        
        return allProducts.reduce((acc, product) => {
            const categoryId = product.subCategoryId || 'uncategorized';
            if (!acc[categoryId]) {
                acc[categoryId] = [];
            }
            acc[categoryId].push(product);
            return acc;
        }, {} as Record<string, Product[]>);
    }, [allProducts, allCategories]);

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
       <div className="col-span-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

       <div className="col-span-full grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      
      <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
        <motion.div custom={4} initial="hidden" animate="visible" variants={animationVariants} className="lg:col-span-2">
            <OverviewChart data={chartData} />
        </motion.div>
        <motion.div custom={5} initial="hidden" animate="visible" variants={animationVariants} className="lg:col-span-1">
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

      <motion.div custom={6} initial="hidden" animate="visible" variants={animationVariants} className="lg:col-span-3">
        <Card>
            <CardHeader>
                <CardTitle>پرفروش‌ترین محصولات</CardTitle>
                <CardDescription>محصولاتی که بیشترین تعداد فروش را در این دوره داشته‌اند.</CardDescription>
            </CardHeader>
            <CardContent>
                {topProducts.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {topProducts.map(product => (
                            <Card key={product.id} className="group overflow-hidden">
                                <CardHeader className="p-0 relative aspect-square">
                                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                                    <Badge className="absolute top-1 right-1 bg-primary/90 text-primary-foreground">
                                        {product.quantity.toLocaleString('fa-IR')}
                                    </Badge>
                                    {product.name === 'محصول حذف شده' && (
                                         <AlertDialog onOpenChange={(open) => !open && setReplacementProduct(null)}>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => setDeletedProductId(product.id)}
                                                >
                                                    <Wrench className="h-5 w-5" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="max-w-2xl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>جایگزینی محصول حذف شده</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        یک محصول از لیست زیر انتخاب کنید تا در تمام فاکتورهای مربوطه جایگزین شود. این عمل غیرقابل بازگشت است.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <ScrollArea className="h-96 border rounded-md">
                                                    <Accordion type="single" collapsible className="w-full">
                                                        {Object.keys(groupedProductsForDialog).map(categoryId => {
                                                            const category = allCategories.find(c => c.id === categoryId);
                                                            const categoryName = category?.name || 'بدون دسته‌بندی';
                                                            return (
                                                                <AccordionItem value={categoryId} key={categoryId}>
                                                                    <AccordionTrigger className="px-4 py-2 hover:bg-muted/50">{categoryName}</AccordionTrigger>
                                                                    <AccordionContent>
                                                                        <div className="p-2 space-y-2">
                                                                            {groupedProductsForDialog[categoryId].map(p => (
                                                                                <Card key={p.id} className={`p-2 flex items-center gap-3 cursor-pointer hover:bg-muted ${replacementProduct?.id === p.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setReplacementProduct(p)}>
                                                                                    <Image src={p.imageUrl} alt={p.name} width={40} height={40} className="rounded-md object-cover" />
                                                                                    <div className="flex-1">
                                                                                        <p className="font-semibold text-sm">{p.name}</p>
                                                                                        <p className="text-xs text-muted-foreground">{formatCurrency(p.price)}</p>
                                                                                    </div>
                                                                                </Card>
                                                                            ))}
                                                                        </div>
                                                                    </AccordionContent>
                                                                </AccordionItem>
                                                            )
                                                        })}
                                                    </Accordion>
                                                </ScrollArea>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>انصراف</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleConfirmReplacement} disabled={!replacementProduct || isReplacing}>
                                                        {isReplacing && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                                                        تایید
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </CardHeader>
                                <CardContent className="p-2">
                                    <h3 className="text-xs font-semibold truncate">{product.name}</h3>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-16">
                        هیچ محصولی در این بازه زمانی فروخته نشده است.
                    </div>
                )}
            </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
