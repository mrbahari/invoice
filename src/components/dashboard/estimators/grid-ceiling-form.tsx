
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

type GridCeilingFormProps = {
    onNavigate: (tab: 'invoices', data: { invoice: Invoice }) => void;
};


export function GridCeilingForm({ onNavigate }: GridCeilingFormProps) {
  const [length, setLength] = useState<number | ''>('');
  const [width, setWidth] = useState<number | ''>('');
  const { data, setData } = useData();
  const { products, invoices } = data;
  const { toast } = useToast();

  const results: MaterialResult[] = useMemo(() => {
    const l = Number(length);
    const w = Number(width);

    if (isNaN(l) || isNaN(w) || l <= 0 || w <= 0) {
      return [];
    }

    const perimeter = (l + w) * 2;
    const area = l * w;
    
    const longSide = Math.max(l, w);
    const shortSide = Math.min(l, w);

    const lProfilePieces = Math.ceil(perimeter / 3);
    const t360Count = Math.ceil(shortSide / 1.2);
    const t360TotalLength = t360Count * longSide;
    const t360Pieces = Math.ceil(t360TotalLength / 3.6);
    const t120Count = Math.ceil(longSide / 0.6) - 1;
    const t120TotalLength = t120Count * shortSide;
    const t120Pieces = Math.ceil(t120TotalLength / 1.2);
    const t60Pieces = Math.ceil(area / 0.72);
    const tiles = Math.ceil((area / 0.36) * 1.03);
    const hangers = Math.ceil(area * 0.8);

    return [
      { material: 'نبشی L24', quantity: lProfilePieces, unit: 'شاخه' },
      { material: 'سپری T360', quantity: t360Pieces, unit: 'شاخه' },
      { material: 'سپری T120', quantity: t120Pieces, unit: 'شاخه' },
      { material: 'سپری T60', quantity: t60Pieces, unit: 'شاخه' },
      { material: 'تایل', quantity: tiles, unit: 'عدد' },
      { material: 'آویز', quantity: hangers, unit: 'عدد' },
    ].filter(item => item.quantity > 0);
  }, [length, width]);
  
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
      toast({ variant: 'destructive', title: 'لیست مصالح خالی است', description: 'ابتدا ابعاد را وارد کرده و مصالح را محاسبه کنید.'});
      return;
    }

    const invoiceItems: InvoiceItem[] = [];
    let notFoundProducts: string[] = [];

    results.forEach(item => {
      const product = products.find(p => p.name.includes(item.material));
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
      description: 'ایجاد شده از برآورد مصالح سقف مشبک',
    };
    
    toast({ title: 'فاکتور با موفقیت ایجاد شد', description: 'اکنون می‌توانید فاکتور را ویرایش کرده و مشتری را انتخاب کنید.'});
    onNavigate('invoices', { invoice: newInvoice as Invoice });
  };

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle>محاسبه مصالح سقف مشبک</CardTitle>
        <CardDescription>
          ابعاد اتاق را به متر وارد کنید تا لیست مصالح مورد نیاز را دریافت کنید.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="grid gap-2">
            <Label htmlFor="length">طول اتاق (متر)</Label>
            <Input
              id="length"
              type="number"
              placeholder="مثال: 8"
              value={length}
              onChange={handleInputChange(setLength)}
              step="0.01"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="width">عرض اتاق (متر)</Label>
            <Input
              id="width"
              type="number"
              placeholder="مثال: 4"
              value={width}
              onChange={handleInputChange(setWidth)}
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
                توجه: مقادیر محاسبه شده تقریبی بوده و ممکن است بسته به شرایط اجرایی و پرت مصالح، تا ۱۰٪ افزایش یابد. همیشه مقداری مصالح اضافی تهیه فرمایید. این محاسبه برای سازه گذاری ۱۲۰ * ۶۰ می باشد.
            </p>
            <Button onClick={handleCreateInvoice} size="lg" className="w-full">
                <FilePlus className="ml-2 h-5 w-5" />
                ایجاد فاکتور از این لیست
            </Button>
        </CardFooter>
       )}
    </Card>
  );
}
