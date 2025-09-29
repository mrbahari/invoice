
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowRight, Trash2, FilePlus, ClipboardList, ChevronsUp, ChevronsDown } from 'lucide-react';
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
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';


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
        images: [
            '/sample/b1.jpg',
            '/sample/b2.jpg',
            '/sample/b3.jpg',
            '/sample/b4.jpg',
        ],
        component: BoxCeilingForm,
    },
    {
        id: 'grid-ceiling' as EstimatorType,
        title: 'سقف مشبک',
        images: [
             '/sample/s1.jpg',
             '/sample/s2.jpg',
             '/sample/s3.jpg',
             '/sample/s4.jpg',
        ],
        component: GridCeilingForm,
    },
    {
        id: 'flat-ceiling' as EstimatorType,
        title: 'سقف فلت',
        images: [
            '/sample/f1.jpg',
            '/sample/f2.jpg',
            '/sample/f3.jpg',
            '/sample/f4.jpg',
        ],
        component: FlatCeilingForm,
    },
    {
        id: 'drywall' as EstimatorType,
        title: 'دیوار خشک',
        images: [
            '/sample/d1.jpg',
            '/sample/d2.jpg',
            '/sample/d3.jpg',
            '/sample/d4.jpg',
        ],
        component: DrywallForm,
    }
];


const StaticImageGrid = ({ images }: { images: string[] }) => {
    return (
        <div className="grid grid-cols-2 grid-rows-2 gap-1 aspect-[4/3] w-full h-full overflow-hidden">
            {images.slice(0, 4).map((src, index) => (
                <div key={src} className="relative w-full h-full">
                    <Image
                        src={src}
                        alt={`Sample image ${index + 1}`}
                        fill
                        className="object-cover"
                    />
                </div>
            ))}
        </div>
    );
};


type EstimatorsPageProps = {
    onNavigate: (tab: DashboardTab, data?: { invoice: Omit<Invoice, 'id'> }) => void;
};

export default function EstimatorsPage({ onNavigate }: EstimatorsPageProps) {
  const [activeEstimator, setActiveEstimator] = useState<EstimatorType | null>(null);
  const [estimationList, setEstimationList] = useState<Estimation[]>([]);
  const { data: appData } = useData();
  const { products, invoices } = appData;
  const { toast } = useToast();
  const [isAggregatedListOpen, setIsAggregatedListOpen] = useState(false);

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
    setIsAggregatedListOpen(false);
    toast({ title: 'لیست برآورد پاک شد' });
  };
  
  const handleRemoveFromList = (id: string) => {
    setEstimationList(prev => {
        const newList = prev.filter(item => item.id !== id);
        if (newList.length === 0) {
            setIsAggregatedListOpen(false); // Close list if it becomes empty
        }
        return newList;
    });
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
    setIsAggregatedListOpen(false);
  };


  const AggregatedListContent = () => (
      <div className="bg-card border-t border-b rounded-t-lg">
        <ScrollArea className="h-[40vh] p-4">
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
        </ScrollArea>
        <div className="p-4 flex flex-col sm:flex-row gap-2 border-t">
             <Button onClick={handleClearList} variant="outline" className="w-full sm:w-auto">
                <Trash2 className="ml-2 h-4 w-4" />
                پاک کردن لیست
            </Button>
            <Button onClick={handleCreateFinalInvoice} size="lg" className="w-full sm:flex-1 bg-green-600 hover:bg-green-700">
                <FilePlus className="ml-2 h-5 w-5" />
                ایجاد فاکتور نهایی
            </Button>
        </div>
      </div>
  );

  if (activeEstimator) {
    const ActiveComponent = estimatorTypes.find(e => e.id === activeEstimator)?.component;
    if (ActiveComponent) {
        return (
            <div className="max-w-4xl mx-auto pb-28">
                 <div className="mb-4">
                    <Button variant="ghost" onClick={() => setActiveEstimator(null)}>
                        <ArrowRight className="w-4 h-4 ml-2" />
                        بازگشت به لیست برآوردها
                    </Button>
                </div>
                <ActiveComponent onAddToList={handleAddToList} />
            </div>
        );
    }
  }

  return (
    <div className='pb-40' data-main-page="true">
        <div className="grid gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>برآورد مصالح</CardTitle>
                    <CardDescription>
                    ابتدا نوع محاسبه را انتخاب کرده، ابعاد را وارد کنید و به لیست برآورد اضافه کنید. در انتها می‌توانید از لیست تجمیعی، یک فاکتور نهایی بسازید.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-2 gap-4 md:gap-6">
                {estimatorTypes.map((estimator) => (
                    <Card 
                        key={estimator.id}
                        onClick={() => setActiveEstimator(estimator.id)}
                        className="group overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                    >
                        <div className="relative aspect-[4/3]">
                            <StaticImageGrid images={estimator.images} />
                             <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 md:p-4">
                                <CardTitle className="text-sm md:text-lg font-bold text-white">{estimator.title}</CardTitle>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>

        
        {estimationList.length > 0 && (
              <Collapsible
                open={isAggregatedListOpen}
                onOpenChange={setIsAggregatedListOpen}
                className="fixed bottom-20 left-0 right-0 z-40"
             >
                <div
                    className="w-full max-w-4xl mx-auto"
                >
                    <CollapsibleContent>
                        <AggregatedListContent />
                    </CollapsibleContent>
                     <CollapsibleTrigger asChild>
                         <div className="w-full bg-green-600 text-white p-3 rounded-b-lg cursor-pointer hover:bg-green-700 transition-colors flex justify-between items-center shadow-lg">
                            <div className="flex items-center gap-2">
                                 <Badge variant="secondary" className="text-green-700">{estimationList.length}</Badge>
                                <p className="font-semibold text-sm">
                                    آخرین آیتم: {estimationList[estimationList.length - 1].description}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>مشاهده لیست کل</span>
                                 {isAggregatedListOpen ? <ChevronsDown className="h-5 w-5" /> : <ChevronsUp className="h-5 w-5" />}
                            </div>
                        </div>
                    </CollapsibleTrigger>
                </div>
            </Collapsible>
        )}
    </div>
  );
}
