'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Box, Grid, MinusSquare, ArrowRight, Trash2, FilePlus } from 'lucide-react';
import { Button } from '../ui/button';
import { GridCeilingForm } from './estimators/grid-ceiling-form';
import { BoxCeilingForm } from './estimators/box-ceiling-form';
import { FlatCeilingForm } from './estimators/flat-ceiling-form';
import type { Invoice, InvoiceItem, Product } from '@/lib/definitions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getStorePrefix } from '@/lib/utils';
import { useData } from '@/context/data-context';
import { useToast } from '@/hooks/use-toast';

type EstimatorType = 'grid-ceiling' | 'box' | 'flat-ceiling';

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

const estimatorTypes = [
    {
        id: 'box' as EstimatorType,
        title: 'محاسبه مصالح باکس و نورمخفی',
        description: 'طول باکس را وارد کرده و لیست مصالح مورد نیاز را دریافت کنید.',
        icon: Box,
        component: BoxCeilingForm,
    },
    {
        id: 'grid-ceiling' as EstimatorType,
        title: 'محاسبه مصالح سقف مشبک',
        description: 'مساحت سقف را وارد کرده و لیست مصالح لازم را مشاهده کنید.',
        icon: Grid,
        component: GridCeilingForm,
    },
    {
        id: 'flat-ceiling' as EstimatorType,
        title: 'محاسبه مصالح سقف فلت',
        description: 'مساحت سقف را وارد کرده و برآورد مصالح لازم را دریافت کنید.',
        icon: MinusSquare,
        component: FlatCeilingForm,
    }
];

type EstimatorsPageProps = {
    onNavigate: (tab: 'invoices', data?: { invoice: Omit<Invoice, 'id'> }) => void;
};

export default function EstimatorsPage({ onNavigate }: EstimatorsPageProps) {
  const [activeEstimator, setActiveEstimator] = useState<EstimatorType | null>(null);
  const [estimationList, setEstimationList] = useState<Estimation[]>([]);
  const { data: appData } = useData();
  const { products, invoices } = appData;
  const { toast } = useToast();

  const handleAddToList = (description: string, results: MaterialResult[]) => {
    const newEstimation: Estimation = {
        id: `est-${Date.now()}`,
        description,
        results
    };
    setEstimationList(prev => [...prev, newEstimation]);
    toast({ variant: 'success', title: 'به لیست برآورد اضافه شد' });
    setActiveEstimator(null); // Return to main page after adding
  };

  const handleClearList = () => {
    setEstimationList([]);
    toast({ title: 'لیست برآورد پاک شد' });
  };
  
  const handleRemoveFromList = (id: string) => {
    setEstimationList(prev => prev.filter(item => item.id !== id));
  }

  const aggregatedResults: MaterialResult[] = estimationList.reduce((acc, current) => {
    current.results.forEach(result => {
        const existing = acc.find(item => item.material === result.material);
        if (existing) {
            existing.quantity += result.quantity;
        } else {
            acc.push({ ...result });
        }
    });
    return acc;
  }, [] as MaterialResult[]);

  const handleCreateFinalInvoice = () => {
    if (aggregatedResults.length === 0) {
      toast({ variant: 'destructive', title: 'لیست مصالح خالی است', description: 'ابتدا حداقل یک بخش را محاسبه و اضافه کنید.'});
      return;
    }

    const invoiceItems: InvoiceItem[] = [];
    let notFoundProducts: string[] = [];

    aggregatedResults.forEach(item => {
        let product: Product | undefined;
        const materialLowerCase = item.material.toLowerCase();
        
        if (materialLowerCase.includes('پیچ سازه')) { 
            product = products.find(p => p.name.toLowerCase().includes('پیچ سازه'));
        }
        else if (materialLowerCase.includes('f47')) { product = products.find(p => p.name.toLowerCase().includes('f47')); }
        else if (materialLowerCase.includes('u36')) { product = products.find(p => p.name.toLowerCase().includes('u36')); }
        else if (materialLowerCase.includes('l25')) { product = products.find(p => p.name.toLowerCase().includes('l25')); }
        else if (materialLowerCase.includes('l24')) { product = products.find(p => p.name.toLowerCase().includes('l24')); }
        else if (materialLowerCase.includes('t360')) { product = products.find(p => p.name.toLowerCase().includes('t360')); }
        else if (materialLowerCase.includes('t120')) { product = products.find(p => p.name.toLowerCase().includes('t120')); }
        else if (materialLowerCase.includes('t60')) { product = products.find(p => p.name.toLowerCase().includes('t60')); }
        else {
            const searchTerms = materialLowerCase.split(' ').filter(t => t);
            product = products.find(p => searchTerms.every(term => p.name.toLowerCase().includes(term)));
        }

        if (product) {
            invoiceItems.push({
            productId: product.id,
            productName: product.name,
            quantity: Math.ceil(item.quantity), // Round up to nearest whole number
            unit: item.unit,
            unitPrice: product.price,
            totalPrice: Math.ceil(item.quantity) * product.price,
            });
        } else {
            notFoundProducts.push(item.material);
        }
    });

    if (notFoundProducts.length > 0) {
      toast({ variant: 'destructive', title: 'برخی محصولات یافت نشدند', description: `موارد زیر در لیست محصولات شما یافت نشدند: ${notFoundProducts.join(', ')}`});
    }

    if (invoiceItems.length === 0) {
      toast({ variant: 'destructive', title: 'هیچ محصولی به فاکتور اضافه نشد' });
      return;
    }

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
    setEstimationList([]); // Clear list after invoice creation
  };

  if (activeEstimator) {
    const ActiveComponent = estimatorTypes.find(e => e.id === activeEstimator)?.component;
    if (ActiveComponent) {
        return (
            <div className="max-w-4xl mx-auto">
                 <div className="mb-4">
                    <Button onClick={() => setActiveEstimator(null)} variant="outline">
                        <ArrowRight className="ml-2 h-4 w-4" />
                        بازگشت
                    </Button>
                </div>
                <ActiveComponent onAddToList={handleAddToList} />
            </div>
        );
    }
  }

  return (
    <div className='grid gap-8'>
        <Card className="animate-fade-in-up">
            <CardHeader>
                <CardTitle>برآورد مصالح</CardTitle>
                <CardDescription>
                ابتدا نوع محاسبه را انتخاب کرده، ابعاد را وارد کنید و به لیست برآورد اضافه کنید. در انتها می‌توانید از لیست تجمیعی، یک فاکتور نهایی بسازید.
                </CardDescription>
            </CardHeader>
        </Card>

        {estimationList.length > 0 && (
            <Card className="animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>لیست تجمیعی مصالح</CardTitle>
                       <Button onClick={handleClearList} variant="destructive" size="sm">
                            <Trash2 className="ml-2 h-4 w-4" />
                            پاک کردن لیست
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
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
                            <TableRow key={item.material}>
                                <TableCell className="font-medium">{item.material}</TableCell>
                                <TableCell className="text-center font-mono text-lg">{Math.ceil(item.quantity).toLocaleString('fa-IR')}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="mt-4 text-sm text-muted-foreground space-y-1">
                        <p className="font-semibold">بخش‌های محاسبه شده:</p>
                        {estimationList.map(est => (
                             <div key={est.id} className="flex items-center justify-between">
                                <span>- {est.description}</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveFromList(est.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleCreateFinalInvoice} size="lg" className="w-full bg-green-600 hover:bg-green-700">
                        <FilePlus className="ml-2 h-5 w-5" />
                        ایجاد فاکتور نهایی از لیست
                    </Button>
                </CardFooter>
            </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            {estimatorTypes.map((estimator) => (
                <Card 
                    key={estimator.id}
                    onClick={() => setActiveEstimator(estimator.id)}
                    className="flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                >
                    <CardHeader className="flex-row gap-4 items-center">
                        <estimator.icon className="h-10 w-10 text-primary" />
                        <div>
                            <CardTitle>{estimator.title}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <CardDescription>{estimator.description}</CardDescription>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}
