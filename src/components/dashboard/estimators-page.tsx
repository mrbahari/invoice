'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowRight, Trash2, FilePlus, ClipboardList, ChevronLeft, ChevronsUpDown, User, Wrench, Building, Bot } from 'lucide-react';
import { Button } from '../ui/button';
import { GridCeilingForm } from './estimators/grid-ceiling-form';
import { BoxCeilingForm } from './estimators/box-ceiling-form';
import { FlatCeilingForm } from './estimators/flat-ceiling-form';
import { DrywallForm } from './estimators/drywall-form';
import type { Invoice, InvoiceItem, Product, Category } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStorePrefix, formatNumber } from '@/lib/utils';
import { useData } from '@/context/data-context';
import type { DashboardTab } from '@/app/dashboard/page';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { FloatingToolbar } from './floating-toolbar';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useSearch } from './search-provider';
import { SmartOrderForm } from './estimators/smart-order-form';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';


export interface MaterialResult {
  material: string;
  quantity: number;
  unit: string;
}

export interface Estimation {
  id: string;
  description: string;
  results: MaterialResult[];
}

type EstimatorType = 'grid-ceiling' | 'box' | 'flat-ceiling' | 'drywall' | 'smart-order';

const estimatorTypes = [
    {
        id: 'box' as EstimatorType,
        title: 'باکس و نورمخفی',
        imageUrl: '/images/b2.jpg',
        imageHint: 'drywall ceiling',
        component: BoxCeilingForm,
        icon: Wrench,
    },
    {
        id: 'grid-ceiling' as EstimatorType,
        title: 'سقف مشبک',
        imageUrl: '/images/s2.jpg',
        imageHint: 'grid ceiling',
        component: GridCeilingForm,
        icon: Wrench,
    },
    {
        id: 'flat-ceiling' as EstimatorType,
        title: 'سقف فلت',
        imageUrl: '/images/f2.jpg',
        imageHint: 'flat ceiling',
        component: FlatCeilingForm,
        icon: Wrench,
    },
    {
        id: 'drywall' as EstimatorType,
        title: 'دیوار خشک',
        imageUrl: '/images/d2.jpg',
        imageHint: 'drywall installation',
        component: DrywallForm,
        icon: Wrench,
    }
];

type EstimatorsPageProps = {
    onNavigate: (tab: DashboardTab, data?: { invoice: Partial<Invoice> }) => void;
};

export default function EstimatorsPage({ onNavigate }: EstimatorsPageProps) {
  const [selectedEstimator, setSelectedEstimator] = useState<EstimatorType | null>(null);
  const [estimationList, setEstimationList] = useState<Estimation[]>([]);
  const { data: appData } = useData();
  const { products, invoices, categories } = appData;
  const { setSearchVisible } = useSearch();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    setSearchVisible(false);
    return () => setSearchVisible(true);
  }, [setSearchVisible]);

  const handleEstimatorSelect = (estimatorId: EstimatorType) => {
     if (!user) {
      toast({
        variant: 'destructive',
        title: 'ورود لازم است',
        description: 'برای دسترسی به این بخش، لطفاً ابتدا وارد حساب خود شوید.',
      });
      return;
    }
    setSelectedEstimator(estimatorId);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  const handleBackToList = () => {
    setSelectedEstimator(null);
  }

  const handleAddToList = (description: string, results: MaterialResult[]) => {
    const newEstimation: Estimation = {
        id: `est-${Date.now()}`,
        description,
        results
    };
    setEstimationList(prev => [...prev, newEstimation]);
    handleBackToList();
  };

  const handleClearList = () => {
    setEstimationList([]);
  };
  
  const handleRemoveFromList = (id: string) => {
    setEstimationList(prev => prev.filter(item => item.id !== id));
  }

  const aggregatedResults: MaterialResult[] = useMemo(() => {
    const aggregation: Record<string, { quantity: number; unit: string }> = {};
    estimationList.forEach(estimation => {
      estimation.results.forEach(result => {
        const key = `${result.material}|${result.unit}`;
        if (aggregation[key]) {
          aggregation[key].quantity += result.quantity;
        } else {
          aggregation[key] = { quantity: result.quantity, unit: result.unit };
        }
      });
    });

    return Object.entries(aggregation).map(([key, value]) => {
      const [material] = key.split('|');
      return { material, ...value };
    });
  }, [estimationList]);

  const handleCreateFinalInvoice = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'ورود لازم است',
        description: 'برای ایجاد فاکتور، لطفاً ابتدا وارد حساب خود شوید.',
      });
      return;
    }
    if (aggregatedResults.length === 0) {
      return;
    }

    const invoiceItems: InvoiceItem[] = [];

    const productMap: Record<string, { aliases: string[], category: string }> = {
      'پنل والیز': { aliases: ['پنل والیز', 'پانل گچی', 'panel'], category: 'پنل' },
      'پنل جی برد': { aliases: ['پنل جی برد', 'پانل گچی', 'panel'], category: 'پنل' },
      'تایل پی وی سی': { aliases: ['تایل', 'pvc'], category: 'تایل' },
      'سازه f47': { aliases: ['f47'], category: 'سازه سقف' },
      'سازه u36': { aliases: ['u36'], category: 'سازه سقف' },
      'نبشی l25': { aliases: ['l25'], category: 'سازه سقف' },
      'نبشی l24': { aliases: ['l24'], category: 'سپری' },
      'سپری t360': { aliases: ['t360', '3.60'], category: 'سپری' },
      'سپری t120': { aliases: ['t120', '1.20'], category: 'سپری' },
      'سپری t60': { aliases: ['t60', '0.60'], category: 'سپری' },
      'رانر': { aliases: ['runner'], category: 'سازه دیوار' },
      'استاد': { aliases: ['stud'], category: 'سازه دیوار' },
      'پیچ ۲.۵': { aliases: ['پیچ پنل', 'پیچ 2.5', 'پیچ ۲.۵', 'tn25'], category: 'پیچ' },
      'پیچ سازه': { aliases: ['پیچ سازه', 'ln9', 'پیچ LN'], category: 'پیچ' },
      'آویز': { aliases: ['آویز', 'hanger'], category: 'ملزومات نصب' },
      'میخ و چاشنی': { aliases: ['میخ', 'چاشنی'], category: 'میخ و چاشنی' },
      'پشم سنگ': { aliases: ['پشم سنگ', 'rockwool'], category: 'پشم سنگ' },
      'اتصال W': { aliases: ['اتصال w', 'w clip', 'دبلیو'], category: 'ملزومات نصب' },
      'کلیپس': { aliases: ['کلیپس', 'clip'], category: 'ملزومات نصب' },
      'براکت': { aliases: ['براکت', 'bracket'], category: 'ملزومات نصب' },
    };

    aggregatedResults.forEach(item => {
        let matchedProduct: Product | undefined;
        const materialNameLower = item.material.toLowerCase();

        // Find the category and aliases for the current material
        let bestMatchKey: string | undefined;
        for (const key in productMap) {
            if (productMap[key].aliases.some(alias => materialNameLower.includes(alias.toLowerCase()))) {
                bestMatchKey = key;
                break;
            }
        }
        
        const searchAliases = bestMatchKey ? productMap[bestMatchKey].aliases : [materialNameLower];

        // 1. Try to find an exact match using aliases
        matchedProduct = products.find(p => 
            searchAliases.some(alias => p.name.toLowerCase().includes(alias.toLowerCase()))
        );

        // 2. If no exact match, find a substitute from the same category
        if (!matchedProduct && bestMatchKey) {
            const categoryName = productMap[bestMatchKey].category;
            const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
            if (category) {
                // Find the first available product in that category as a substitute
                const substituteProduct = products.find(p => p.subCategoryId === category.id);
                if (substituteProduct) {
                    matchedProduct = substituteProduct;
                }
            }
        }

        let quantity = item.quantity;
        let unit = item.unit;
        let unitPrice = matchedProduct ? matchedProduct.price : 0;
        let productId = matchedProduct ? matchedProduct.id : `mat-${item.material.replace(/\s+/g, '-')}`;
        let productName = matchedProduct ? matchedProduct.name : item.material;
        const imageUrl = matchedProduct ? matchedProduct.imageUrl : `https://picsum.photos/seed/${encodeURIComponent(productName)}/400/300`;

        if ((materialNameLower.includes('پیچ') || materialNameLower.includes('میخ')) && item.unit === 'عدد') {
            quantity = Math.ceil(item.quantity / 1000);
            unit = 'بسته';
        } else {
            quantity = Math.ceil(quantity);
        }

        const existingInvoiceItemIndex = invoiceItems.findIndex(invItem => invItem.productId === productId && invItem.unit === unit);

        if (existingInvoiceItemIndex > -1) {
            invoiceItems[existingInvoiceItemIndex].quantity += quantity;
            const currentItem = invoiceItems[existingInvoiceItemIndex];
            currentItem.totalPrice = currentItem.quantity * currentItem.unitPrice;
        } else {
            invoiceItems.push({
                productId: productId,
                productName: productName,
                quantity: quantity,
                unit: unit,
                unitPrice: unitPrice,
                totalPrice: quantity * unitPrice,
                imageUrl: imageUrl,
            });
        }
    });

    const subtotal = invoiceItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const invoiceDescription = estimationList.map(est => `- ${est.description}`).join('\n');

    const newInvoice: Partial<Invoice> = {
      invoiceNumber: `${getStorePrefix('Est')}-${(invoices.length + 1).toString().padStart(4, '0')}`,
      customerId: '',
      customerName: '',
      customerEmail: '',
      date: new Date().toISOString(),
      status: 'Pending',
      items: invoiceItems,
      subtotal: subtotal,
      discount: 0,
      additions: 0,
      tax: 0,
      total: subtotal,
      description: `ایجاد شده از برآورد مصالح برای بخش‌های:\n${invoiceDescription}`,
    };
    
    onNavigate('invoices', { invoice: newInvoice });
    setEstimationList([]);
  };

  const ActiveForm = selectedEstimator ? (estimatorTypes.find(e => e.id === selectedEstimator)?.component || (selectedEstimator === 'smart-order' ? SmartOrderForm : null)) : null;

  return (
    <div className='pb-40' data-main-page="true">
        <div className="grid gap-8">
            <AnimatePresence mode="wait">
                {selectedEstimator && ActiveForm ? (
                    <motion.div
                        key={selectedEstimator}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                    >
                         <TooltipProvider>
                            <FloatingToolbar pageKey={`estimator-${selectedEstimator}`}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={handleBackToList} className="flex items-center gap-2 w-10 h-10 text-muted-foreground">
                                            <ArrowRight className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="left"><p>بازگشت به لیست</p></TooltipContent>
                                </Tooltip>
                            </FloatingToolbar>
                         </TooltipProvider>
                        <ActiveForm onAddToList={handleAddToList} onBack={handleBackToList} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="list"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 50 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card>
                            <CardHeader className="items-center">
                                <CardTitle>برآوردگر مصالح</CardTitle>
                                <CardDescription>
                                نوع محاسبه را انتخاب کنید، ابعاد را وارد کرده و به لیست برآورد اضافه کنید.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                        
                        <div className="grid grid-cols-1 gap-6 mt-8">
                             <Card 
                                onClick={() => handleEstimatorSelect('smart-order')}
                                className="group overflow-hidden cursor-pointer transition-all hover:shadow-lg bg-gradient-to-tr from-primary/10 to-transparent"
                            >
                                <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                                    <div className="flex-shrink-0 flex items-center justify-center h-20 w-20 rounded-full bg-primary/20 border-2 border-primary/30">
                                         <Bot className="h-10 w-10 text-primary" />
                                    </div>
                                    <div className="text-center md:text-right">
                                        <CardTitle className="text-xl font-bold text-primary">سفارش هوشمند</CardTitle>
                                        <p className="text-muted-foreground mt-2">
                                        لیست مصالح خود را از روی فایل، عکس یا متن وارد کنید تا به صورت هوشمند به فاکتور تبدیل شود.
                                        </p>
                                    </div>
                                </div>
                            </Card>

                             <Card>
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <Wrench className="h-6 w-6 text-muted-foreground" />
                                        <CardTitle className="text-xl font-bold">برآوردگر دستی مصالح</CardTitle>
                                    </div>
                                    <CardDescription>ابتدا نوع محاسبه را انتخاب کرده، ابعاد را وارد کنید و به لیست برآورد اضافه کنید.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                     {estimatorTypes.map((estimator) => (
                                        <Card 
                                            key={estimator.id}
                                            onClick={() => handleEstimatorSelect(estimator.id)}
                                            className="group overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                                        >
                                            <div className="relative w-full h-[120px] overflow-hidden">
                                                <Image
                                                    src={estimator.imageUrl}
                                                    alt={estimator.title}
                                                    fill
                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                    data-ai-hint={estimator.imageHint}
                                                />
                                            </div>
                                            <div className="p-3 text-center">
                                                <CardTitle className="text-base font-bold">{estimator.title}</CardTitle>
                                            </div>
                                        </Card>
                                    ))}
                                </CardContent>
                            </Card>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {estimationList.length > 0 && (
                <AnimatePresence>
                     <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>
                                            <ClipboardList className="inline-block ml-2" />
                                            لیست برآورد تجمیعی
                                        </CardTitle>
                                        <CardDescription>مجموع مصالح مورد نیاز برای بخش‌های انتخاب شده.</CardDescription>
                                    </div>
                                    <Button onClick={handleClearList} variant="outline" size="sm">
                                        <Trash2 className="ml-2 h-4 w-4" />
                                        پاک کردن لیست
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className='mb-4 space-y-2'>
                                {estimationList.map(item => (
                                    <Collapsible key={item.id} className="border-b">
                                        <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md">
                                            <CollapsibleTrigger className="flex-1 text-right">
                                                <div className="flex items-center justify-between w-full">
                                                    <p className="text-sm font-medium">{item.description}</p>
                                                    <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </CollapsibleTrigger>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 mr-2" onClick={() => handleRemoveFromList(item.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                        <CollapsibleContent>
                                            <div className="p-4 pt-0">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>مصالح</TableHead>
                                                            <TableHead className="text-center">مقدار</TableHead>
                                                            <TableHead>واحد</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {item.results.map(res => (
                                                            <TableRow key={res.material}>
                                                                <TableCell className="text-xs">{res.material}</TableCell>
                                                                <TableCell className="text-center text-xs font-mono">{formatNumber(res.quantity)}</TableCell>
                                                                <TableCell className="text-xs">{res.unit}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                ))}
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                        <TableHead>نوع مصالح</TableHead>
                                        <TableHead className="text-center">مقدار کل</TableHead>
                                        <TableHead>واحد</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {aggregatedResults.map((item) => (
                                        <TableRow key={`${item.material}-${item.unit}`}>
                                            <TableCell className="font-medium">{item.material}</TableCell>
                                            <TableCell className="text-center font-mono text-lg">{`${formatNumber(Math.ceil(item.quantity))}`}</TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                        </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleCreateFinalInvoice} className="w-full bg-green-600 hover:bg-green-700">
                                    <FilePlus className="ml-2 h-5 w-5" />
                                    ایجاد فاکتور نهایی
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    </div>
  );
}
