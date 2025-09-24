
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Box, Grid, MinusSquare, ArrowRight, Trash2, FilePlus, Square, Shuffle } from 'lucide-react';
import { Button } from '../ui/button';
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
    },
    {
        id: 'drywall' as EstimatorType,
        title: 'محاسبه مصالح دیوار خشک',
        description: 'ابعاد دیوار (جداکننده یا پوششی) و عایق صوتی آن را مشخص کنید.',
        icon: Square,
        component: DrywallForm,
    }
];



type EstimatorsPageProps = {
    onNavigate: (tab: DashboardTab, data?: { invoice: Omit<Invoice, 'id'> }) => void;
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
        const existing = acc.find(item => item.material.trim().toLowerCase() === result.material.trim().toLowerCase() && item.unit === result.unit);
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
    
    // Improved mapping for more reliable product finding
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
        'پیچ ۲.۵': ['پیچ ۲.۵', 'پیچ پنل', 'tn25'],
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

        // Convert screw count to packs if needed
        if ((materialNameLower.includes('پیچ ۲.۵') || materialNameLower.includes('پیچ سازه')) && item.unit === 'عدد') {
            quantity = Math.ceil(item.quantity / 1000);
            unit = 'بسته';
        } else {
            quantity = Math.ceil(quantity); // Round up quantities like panels, profiles, etc.
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
    setEstimationList([]); // Clear list after invoice creation
  };

  if (activeEstimator) {
    const ActiveComponent = estimatorTypes.find(e => e.id === activeEstimator)?.component;
    if (ActiveComponent) {
        return (
            <div className="max-w-4xl mx-auto pb-28">
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
    <div className='grid md:grid-cols-3 gap-8 pb-28'>
        <div className="md:col-span-2 grid gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>برآورد مصالح</CardTitle>
                    <CardDescription>
                    ابتدا نوع محاسبه را انتخاب کرده، ابعاد را وارد کنید و به لیست برآورد اضافه کنید. در انتها می‌توانید از لیست تجمیعی، یک فاکتور نهایی بسازید.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {estimatorTypes.map((estimator) => (
                    <Card 
                        key={estimator.id}
                        onClick={() => setActiveEstimator(estimator.id)}
                        className="flex flex-col cursor-pointer"
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

        <div className="md:col-span-1">
             {estimationList.length > 0 && (
                <Card className="sticky top-20">
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
                                <TableHead className="text-center">مقدار</TableHead>
                                <TableHead>واحد</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {aggregatedResults.map((item) => (
                                <TableRow key={`${item.material}-${item.unit}`}>
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
                            ایجاد فاکتور نهایی
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    </div>
  );
}
