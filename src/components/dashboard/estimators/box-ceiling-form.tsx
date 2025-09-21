
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FilePlus } from 'lucide-react';
import type { Product, Invoice, InvoiceItem } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { getStorePrefix } from '@/lib/utils';
import { useData } from '@/context/data-context';

interface MaterialResult {
  material: string;
  quantity: number;
  unit: string;
}

type BoxCeilingFormProps = {
    onNavigate: (tab: 'invoices', data: { invoice: Omit<Invoice, 'id'>}) => void;
};


export function BoxCeilingForm({ onNavigate }: BoxCeilingFormProps) {
  const [length, setLength] = useState<number | ''>('');
  const { data: appData } = useData();
  const { products, invoices } = appData;
  const { toast } = useToast();

  const results: MaterialResult[] = useMemo(() => {
    const l = Number(length);

    if (isNaN(l) || l <= 0) {
      return [];
    }
    
    const screws = l * (2200 / 45); // For 45m -> 2200 screws
    const screwPacks = screws > 0 ? Math.round(screws / 1000) : 0; // Round to nearest pack
    const l25Profiles = Math.ceil(l);
    const panels = Math.ceil(l / 4.5);


    return [
      { material: 'پیچ', quantity: screwPacks, unit: 'بسته' },
      { material: 'نبشی L25', quantity: l25Profiles, unit: 'شاخه' },
      { material: 'پانل', quantity: panels, unit: 'عدد' },
    ].filter(item => item.quantity > 0);
  }, [length]);
  
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number | ''>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setter('');
    } else {
      const num = parseFloat(value);
      setter(isNaN(num) ? '' : num);
    }
  };

  const handleCreateInvoice = () => {
    if (results.length === 0) {
      toast({ variant: 'destructive', title: 'لیست مصالح خالی است', description: 'ابتدا طول باکس را وارد کرده و مصالح را محاسبه کنید.'});
      return;
    }

    const invoiceItems: InvoiceItem[] = [];
    let notFoundProducts: string[] = [];

    results.forEach(item => {
      const searchTerms = item.material.toLowerCase().split(' ').filter(t => t);
      const product = products.find(p => 
        searchTerms.every(term => p.name.toLowerCase().includes(term))
      );
      
      if (product) {
        invoiceItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unit: product.unit,
          unitPrice: product.price,
          totalPrice: item.quantity * product.price,
        });
      } else {
        notFoundProducts.push(item.material);
      }
    });

    if (notFoundProducts.length > 0) {
      toast({
        variant: 'destructive',
        title: 'برخی محصولات یافت نشدند',
        description: `محصولات زیر در لیست شما یافت نشدند و به فاکتور اضافه نشدند: ${notFoundProducts.join(', ')}`,
      });
    }

    if (invoiceItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'هیچ محصولی به فاکتور اضافه نشد',
        description: 'هیچ‌کدام از مصالح محاسبه شده در لیست محصولات شما یافت نشد.',
      });
      return;
    }

    const subtotal = invoiceItems.reduce((acc, item) => acc + item.totalPrice, 0);

    const newInvoice: Omit<Invoice, 'id'> = {
      invoiceNumber: `${getStorePrefix('Est')}-${(invoices.length + 1).toString().padStart(4, '0')}`,
      customerId: '', // To be selected in editor
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
      description: 'ایجاد شده از برآورد مصالح باکس و نورمخفی',
    };
    
    // This part should be handled by a proper state management solution that updates the context
    // For now, we'll navigate and pass the data. The invoices page should handle it.
    toast({ variant: 'success', title: 'فاکتور با موفقیت ایجاد شد', description: 'اکنون می‌توانید فاکتور را ویرایش کرده و مشتری را انتخاب کنید.'});
    onNavigate('invoices', { invoice: newInvoice });
  };

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle>محاسبه مصالح باکس و نورمخفی</CardTitle>
        <CardDescription>
          طول باکس را به متر وارد کنید تا لیست مصالح مورد نیاز را دریافت کنید.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="grid gap-2">
            <Label htmlFor="length">طول باکس (متر)</Label>
            <Input
              id="length"
              type="number"
              placeholder="مثال: 15"
              value={length}
              onChange={handleInputChange(setLength)}
              step="0.01"
            />
          </div>
        </div>

        {results.length > 0 && (
          <div className="animate-fade-in-up">
            <h3 className="text-lg font-semibold mb-4">لیست مصالح مورد نیاز:</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نوع مصالح</TableHead>
                  <TableHead className="text-center">مقدار</TableHead>
                  <TableHead>واحد</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((item) => (
                  <TableRow key={item.material}>
                    <TableCell className="font-medium">{item.material}</TableCell>
                    <TableCell className="text-center font-mono text-lg">{item.quantity.toLocaleString('fa-IR')}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {results.length > 0 && (
        <CardFooter className="flex-col items-stretch gap-4">
             <p className="text-xs text-muted-foreground">
                توجه: مقادیر محاسبه شده تقریبی بوده و ممکن است بسته به شرایط اجرایی و پرت مصالح، تا ۱۰٪ افزایش یابد.
            </p>
            <Button onClick={handleCreateInvoice} size="lg" className="w-full bg-green-600 hover:bg-green-700">
                <FilePlus className="ml-2 h-5 w-5" />
                ایجاد فاکتور از این لیست
            </Button>
        </CardFooter>
       )}
    </Card>
  );
}
