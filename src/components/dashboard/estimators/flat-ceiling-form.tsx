
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

type FlatCeilingFormProps = {
    onNavigate: (tab: 'invoices', data: { invoice: Invoice }) => void;
};


export function FlatCeilingForm({ onNavigate }: FlatCeilingFormProps) {
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

    const area = l * w;
    const perimeter = (l + w) * 2;
    
    // F47 profiles are installed along the length (l), spaced every 60cm across the width (w)
    const f47RowCount = Math.ceil(w / 0.6);
    const totalF47Length = f47RowCount * l;
    const f47Profiles = Math.ceil(totalF47Length / 4); // Assuming 4m length for F47 profiles

    // Hangers (aviz) calculation based on user's new logic
    const hangersPerRun = Math.ceil(l / 0.6);
    const totalHangers = f47RowCount * hangersPerRun;

    const u36HangerLength = totalHangers * 0.30; // 30cm per hanger
    const u36Profiles = Math.ceil(u36HangerLength / 4); // Assuming 4m length for U36 profiles

    const l25Profiles = Math.ceil(perimeter / 3); // Assuming 3m length for L25 profiles
    
    // Fasteners calculation based on user's new logic
    const nailAndChargeCount = totalHangers;
    const nailAndChargePacks = nailAndChargeCount < 100 && nailAndChargeCount > 0 ? 1 : Math.ceil(nailAndChargeCount / 100);

    const structureScrews = totalHangers * 2; // پیچ سازه به سازه (LN)
    
    const panelScrewsForPerimeter = Math.ceil(perimeter / 0.2);
    const panelScrewsForF47 = Math.ceil(totalF47Length / 0.2);
    const totalPanelScrews = panelScrewsForPerimeter + panelScrewsForF47;


    const panels = Math.ceil(area / 2.88); // Assuming panel size 1.2m x 2.4m = 2.88 sqm

    return [
      { material: 'سازه F47', quantity: f47Profiles, unit: 'شاخه' },
      { material: 'سازه U36', quantity: u36Profiles, unit: 'شاخه' },
      { material: 'نبشی L25', quantity: l25Profiles, unit: 'شاخه' },
      { material: 'پانل گچی', quantity: panels, unit: 'عدد' },
      { material: 'میخ و چاشنی', quantity: nailAndChargePacks, unit: 'بسته' },
      { material: 'پیچ سازه به سازه (LN)', quantity: Math.ceil(structureScrews / 1000), unit: 'بسته' },
      { material: 'پیچ پانل به سازه (TN)', quantity: Math.ceil(totalPanelScrews / 1000), unit: 'بسته' },
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
      let product: Product | undefined;

      if (item.material.includes('پیچ پانل')) {
        product = products.find(p => p.name.includes('پیچ پنل 2.5'));
      } else {
        product = products.find(p => p.name.includes(item.material));
      }

      if (product) {
        invoiceItems.push({
          productId: product.id,
          productName: item.material, // Use the specific material name for the invoice
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: product.price, // Price per package/item
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
      description: 'ایجاد شده از برآورد مصالح سقف فلت',
    };
    
    // The navigation logic passes the invoice object to the InvoicesPage,
    // which then sets it as the initialInvoice for the editor.
    toast({ variant: 'success', title: 'فاکتور با موفقیت ایجاد شد', description: 'اکنون می‌توانید فاکتور را ویرایش کرده و مشتری را انتخاب کنید.'});
    onNavigate('invoices', { invoice: newInvoice as Invoice });
  };

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle>محاسبه مصالح سقف فلت</CardTitle>
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
              placeholder="مثال: 5"
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
                توجه: مقادیر محاسبه شده تقریبی بوده و ممکن است بسته به شرایط اجرایی و پرت مصالح، تا ۱۰٪ افزایش یابد. این محاسبه بر اساس استانداردهای رایج اجرایی است.
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
