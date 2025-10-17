
'use client';

import React, { useMemo } from 'react';
import type { Product, Invoice, InvoiceStatus, Store, Category, PriceHistory } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Edit, Package, DollarSign, FileText, Store as StoreIcon, Copy } from 'lucide-react';
import { useData } from '@/context/data-context';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { FloatingToolbar } from './floating-toolbar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import Image from 'next/image';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { format, parseISO } from 'date-fns-jalali';

type ProductDetailPageProps = {
  product: Product;
  onBack: () => void;
  onEdit: (product: Product) => void;
  onCopy: (product: Product) => void;
};

const statusTranslation: Record<InvoiceStatus, string> = {
  Paid: 'پرداخت شده',
  Pending: 'در انتظار',
  Overdue: 'سررسید گذشته',
};

const statusStyles: Record<InvoiceStatus, string> = {
  Paid: 'text-green-600 border-green-600/50 bg-green-500/10',
  Pending: 'text-orange-600 border-orange-500/50 bg-orange-500/10',
  Overdue: 'text-red-600 border-red-500/50 bg-red-500/10',
};

export function ProductDetailPage({ product, onBack, onEdit, onCopy }: ProductDetailPageProps) {
  const { data } = useData();
  const { invoices, stores, categories } = data;

  const productInvoices = useMemo(() => {
    return invoices
      .filter(inv => inv.items.some(item => item.productId === product.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, product.id]);

  const totalSold = useMemo(() => {
    return productInvoices.reduce((acc, inv) => {
      const item = inv.items.find(i => i.productId === product.id);
      return acc + (item?.quantity || 0);
    }, 0);
  }, [productInvoices, product.id]);

  const totalRevenue = useMemo(() => {
    return productInvoices
      .filter(inv => inv.status === 'Paid')
      .reduce((acc, inv) => {
        const item = inv.items.find(i => i.productId === product.id);
        return acc + (item?.totalPrice || 0);
      }, 0);
  }, [productInvoices, product.id]);

  const store = stores.find(s => s.id === product.storeId);
  const category = categories.find(c => c.id === product.subCategoryId);

  const getCategoryPath = (catId?: string): string => {
    if (!catId) return 'نامشخص';
    const currentCat = categories.find(c => c.id === catId);
    if (!currentCat) return 'نامشخص';
    if (!currentCat.parentId) return currentCat.name;
    const parentCat = categories.find(c => c.id === currentCat.parentId);
    return parentCat ? `${parentCat.name} > ${currentCat.name}` : currentCat.name;
  };
  
  const priceHistoryData = useMemo(() => {
    const history: PriceHistory[] = product.priceHistory || [];
    let allEntries: { date: Date; price: number }[] = history.map(entry => ({
        date: parseISO(entry.date),
        price: entry.price,
    }));

    // Find a valid start date for the current price
    let initialDate: Date | null = null;
    if (product.createdAt) {
        initialDate = parseISO(product.createdAt);
    } else if (productInvoices.length > 0) {
        // Use the oldest invoice date as a fallback
        initialDate = parseISO(productInvoices[productInvoices.length - 1].date);
    }

    if (initialDate) {
        allEntries.push({ date: initialDate, price: product.price });
    }

    if (allEntries.length === 0) {
        return [];
    }

    // Remove duplicates and sort
    const uniqueEntries = Array.from(new Map(allEntries.map(e => [e.date.getTime(), e])).values());
    return uniqueEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

  }, [product.priceHistory, product.price, product.createdAt, productInvoices]);

  return (
    <TooltipProvider>
      <div className="grid gap-6 pb-24">
        <FloatingToolbar pageKey="product-detail-page">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={onBack} className="text-muted-foreground w-8 h-8">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>بازگشت به لیست</p></TooltipContent>
            </Tooltip>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(product)} className="text-muted-foreground w-8 h-8">
                        <Edit className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>ویرایش محصول</p></TooltipContent>
            </Tooltip>
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" onClick={() => onCopy(product)} className="text-muted-foreground w-8 h-8">
                        <Copy className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left"><p>کپی کردن محصول</p></TooltipContent>
            </Tooltip>
        </FloatingToolbar>

        <Card className="overflow-hidden">
            <div className="relative h-48 w-full bg-muted">
                <Image 
                    src={`https://picsum.photos/seed/${product.id}/1200/400`}
                    alt={`بنر محصول ${product.name}`}
                    fill
                    className="object-cover"
                    data-ai-hint="abstract background"
                />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex flex-col justify-end">
                    <div className="flex items-end justify-between gap-4">
                        <div className='flex-1 flex items-center gap-4'>
                            <div className='relative w-24 h-24 rounded-md border-2 border-white/50 overflow-hidden shadow-lg flex-shrink-0'>
                                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white shadow-lg">{product.name}</h1>
                                <p className='text-sm text-white/80 mt-1'>{product.description}</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => onEdit(product)} className="bg-white/20 text-white backdrop-blur-sm border-white/50 hover:bg-white/30">
                            <Edit className="ml-2 h-4 w-4" />
                            ویرایش
                        </Button>
                    </div>
                </div>
            </div>
            <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3"><StoreIcon className="h-5 w-5" /><span>{store?.name || 'نامشخص'}</span></div>
                    <div className="flex items-center gap-3"><Package className="h-5 w-5" /><span>{getCategoryPath(product.subCategoryId)}</span></div>
                </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">قیمت فعلی</CardTitle>
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(product.price)}</div>
                    <p className="text-xs text-muted-foreground">آخرین قیمت ثبت شده</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">تعداد فروش</CardTitle>
                    <Package className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{totalSold.toLocaleString('fa-IR')}</div>
                    <p className="text-xs text-muted-foreground">در کل فاکتورها</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">درآمد کل</CardTitle>
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">از فاکتورهای پرداخت شده</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">تعداد فاکتور</CardTitle>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold">{productInvoices.length.toLocaleString('fa-IR')}</div>
                    <p className="text-xs text-muted-foreground">فاکتور شامل این محصول</p>
                </CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>تاریخچه قیمت</CardTitle>
            <CardDescription>نمودار تغییرات قیمت این محصول در طول زمان.</CardDescription>
          </CardHeader>
          <CardContent>
              {priceHistoryData.length > 1 ? (
                <ChartContainer config={{price: {label: 'قیمت', color: 'hsl(var(--chart-1))'}}} className="h-[250px] w-full">
                    <LineChart data={priceHistoryData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(value) => format(value, 'd MMMM')} />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent 
                                    labelFormatter={(value) => {
                                        if (value instanceof Date && !isNaN(value.getTime())) {
                                            return format(value, 'eeee, d MMMM yyyy');
                                        }
                                        return String(value);
                                    }}
                                    formatter={(value) => [formatCurrency(value as number), 'قیمت']}
                                    indicator="dot"
                                />
                            }
                        />
                        <Line type="monotone" dataKey="price" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ChartContainer>
              ) : (
                <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                    <p>داده کافی برای نمایش نمودار تاریخچه قیمت وجود ندارد.</p>
                </div>
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>تاریخچه فاکتورها</CardTitle>
            <CardDescription>لیست تمام فاکتورهایی که این محصول در آن‌ها وجود داشته است.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>شماره فاکتور</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تعداد</TableHead>
                    <TableHead className="text-left">مبلغ کل (آیتم)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {productInvoices.length > 0 ? productInvoices.map(invoice => {
                        const item = invoice.items.find(i => i.productId === product.id);
                        return (
                        <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                            <TableCell>{new Date(invoice.date).toLocaleDateString('fa-IR')}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={statusStyles[invoice.status]}>{statusTranslation[invoice.status]}</Badge>
                            </TableCell>
                            <TableCell>{item?.quantity.toLocaleString('fa-IR')} {item?.unit}</TableCell>
                            <TableCell className="text-left font-mono">{formatCurrency(item?.totalPrice || 0)}</TableCell>
                        </TableRow>
                    )}) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                این محصول در هیچ فاکتوری استفاده نشده است.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
