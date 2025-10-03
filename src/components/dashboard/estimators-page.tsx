
'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowRight, Trash2, FilePlus, ClipboardList } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GridCeilingForm } from './estimators/grid-ceiling-form';
import { BoxCeilingForm } from './estimators/box-ceiling-form';
import { FlatCeilingForm } from './estimators/flat-ceiling-form';
import { DrywallForm } from './estimators/drywall-form';
import type { Invoice, InvoiceItem, Product } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStorePrefix } from '@/lib/utils';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';
import type { DashboardTab } from '@/app/dashboard/dashboard-client';
import { AnimatePresence, motion } from 'framer-motion';


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

type EstimatorType = 'grid-ceiling' | 'box' | 'flat-ceiling' | 'drywall';

const estimatorTypes = [
    {
        id: 'box' as EstimatorType,
        title: 'باکس و نورمخفی',
        imageKey: 'estimator-box',
        component: BoxCeilingForm,
    },
    {
        id: 'grid-ceiling' as EstimatorType,
        title: 'سقف مشبک',
        imageKey: 'estimator-grid',
        component: GridCeilingForm,
    },
    {
        id: 'flat-ceiling' as EstimatorType,
        title: 'سقف فلت',
        imageKey: 'estimator-flat',
        component: FlatCeilingForm,
    },
    {
        id: 'drywall' as EstimatorType,
        title: 'دیوار خشک',
        imageKey: 'estimator-drywall',
        component: DrywallForm,
    }
];

type EstimatorsPageProps = {
    onNavigate: (tab: DashboardTab, data?: { invoice: Omit<Invoice, 'id'> }) => void;
};

export default function EstimatorsPage({ onNavigate }: EstimatorsPageProps) {
  const [selectedEstimator, setSelectedEstimator] = useState<EstimatorType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [estimationList, setEstimationList] = useState<Estimation[]>([]);
  const { data: appData } = useData();
  const { products, invoices, placeholderImages } = appData;
  const { toast } = useToast();

  const handleEstimatorSelect = (estimatorId: EstimatorType) => {
    setSelectedEstimator(estimatorId);
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    // A slight delay to allow the dialog to close before resetting the content
    setTimeout(() => setSelectedEstimator(null), 300);
  };

  const handleAddToList = (description: string, results: MaterialResult[]) => {
    const newEstimation: Estimation = {
        id: `est-${Date.now()}`,
        description,
        results
    };
    setEstimationList(prev => [...prev, newEstimation]);
    toast({ variant: 'success', title: 'به لیست برآورد اضافه شد' });
    handleDialogClose();
  };

  const handleClearList = () => {
    setEstimationList([]);
    toast({ title: 'لیست برآورد پاک شد' });
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
    if (aggregatedResults.length === 0) {
      toast({ variant: 'destructive', title: 'لیست مصالح خالی است', description: 'ابتدا حداقل یک بخش را محاسبه و اضافه کنید.'});
      return;
    }

    const invoiceItems: InvoiceItem[] = [];
    
    const productMap: Record<string, string[]> = {
        'پنل والیز': ['پنل والیز', 'پانل گچی', 'panel'],
        'پنل جی برد': ['پنل جی برد', 'پانل گچی', 'panel'],
        'تایل پی وی سی': ['تایل پی وی سی', 'تایل', 'tile'],
        'سازه f47': ['سازه f47', 'f47'],
        'سازه u36': ['سازه u36', 'u36'],
        'نبشی l25': ['نبشی l25', 'l25'],
        'نبشی l24': ['نبشی l24', 'l24'],
        'سپری t360': ['سپری t360', 't360'],
        'سپری t120': ['سپری t120', 't120'],
        'سپری t60': ['سپری t60', 't60'],
        'رانر': ['رانر', 'runner'],
        'استاد': ['استاد', 'stud'],
        'پیچ ۲.۵': ['پیچ ۲.۵', 'پیچ پنل', 'tn25', 'پیچ 2.5'],
        'پیچ سازه': ['پیچ سازه', 'ln9'],
        'آویز': ['آویز', 'hanger'],
        'میخ و چاشنی': ['میخ', 'چاشنی', 'میخ و چاشنی'],
        'پشم سنگ': ['پشم سنگ', 'rockwool'],
    };

    aggregatedResults.forEach(item => {
        let product: Product | undefined;
        const materialNameLower = item.material.trim().toLowerCase();
        
        let foundKey: string | undefined;
        for (const key in productMap) {
            if (productMap[key].some(alias => materialNameLower.includes(alias.toLowerCase()))) {
                foundKey = key;
                break;
            }
        }
        
        const aliases = foundKey ? productMap[foundKey] : [materialNameLower];

        product = products.find(p => 
            aliases.some(alias => p.name.toLowerCase().includes(alias.toLowerCase()))
        );

        let quantity = item.quantity;
        let unit = item.unit;
        let unitPrice = product ? product.price : 0;
        let productId = product ? product.id : `mat-${item.material.replace(/\s+/g, '-')}`;
        let productName = product ? product.name : item.material;

        if ((materialNameLower.includes('پیچ ۲.۵') || materialNameLower.includes('پیچ سازه')) && item.unit === 'عدد') {
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
            });
        }
    });

    const subtotal = invoiceItems.reduce((acc, item) => acc + item.totalPrice, 0);
    const invoiceDescription = estimationList.map(est => `- ${est.description}`).join('\n');

    const newInvoice: Omit<Invoice, 'id'> = {
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
    
    toast({ variant: 'success', title: 'فاکتور با موفقیت ایجاد شد', description: 'اکنون می‌توانید فاکتور را ویرایش کنید.'});
    onNavigate('invoices', { invoice: newInvoice });
    setEstimationList([]);
  };

  const ActiveForm = estimatorTypes.find(e => e.id === selectedEstimator)?.component;

  return (
    <div className='pb-40' data-main-page="true">
        <div className="grid gap-8">
            <Card>
                <CardHeader className="items-center">
                    <CardTitle>برآورد مصالح</CardTitle>
                    <CardDescription>
                    ابتدا نوع محاسبه را انتخاب کرده، ابعاد را وارد کنید و به لیست برآورد اضافه کنید. در انتها می‌توانید از لیست تجمیعی، یک فاکتور نهایی بسازید.
                    </CardDescription>
                </CardHeader>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
                    {estimatorTypes.map((estimator) => {
                        const image = placeholderImages.find(img => img.id === estimator.imageKey);
                        return(
                            <Card 
                                key={estimator.id}
                                onClick={() => handleEstimatorSelect(estimator.id)}
                                className="group overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                            >
                                <div className="relative w-full h-[120px] overflow-hidden">
                                    <Image
                                        src={image?.imageUrl || `https://placehold.co/600x400`}
                                        alt={estimator.title}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        data-ai-hint={image?.imageHint}
                                    />
                                </div>
                                <div className="p-4 text-center">
                                    <CardTitle className="text-base md:text-lg font-bold">{estimator.title}</CardTitle>
                                </div>
                            </Card>
                        );
                    })}
                </div>
                 {ActiveForm && (
                    <DialogContent className="sm:max-w-[625px]">
                        <DialogHeader>
                            <DialogTitle>{estimatorTypes.find(e => e.id === selectedEstimator)?.title}</DialogTitle>
                            <DialogDescription>
                                ابعاد را وارد کنید تا لیست مصالح مورد نیاز محاسبه شود.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="pt-4">
                            <ActiveForm onAddToList={handleAddToList} />
                        </div>
                    </DialogContent>
                )}
            </Dialog>

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
                                    <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                                        <p className="text-sm font-medium">{item.description}</p>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveFromList(item.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                        <TableHead>نوع مصالح</TableHead>
                                        <TableHead className="text-center">مقدار</TableHead>
                                        <TableHead>واحد</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {aggregatedResults.map((item) => (
                                        <TableRow key={`${item.material}-${item.unit}`}>
                                            <TableCell className="font-medium">{item.material}</TableCell>
                                            <TableCell className="text-center font-mono text-lg">{`${Math.ceil(item.quantity).toLocaleString('fa-IR')}`}</TableCell>
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
