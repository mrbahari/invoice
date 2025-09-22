'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MaterialResult } from '../estimators-page';

type FlatCeilingFormProps = {
    onAddToList: (description: string, results: MaterialResult[]) => void;
};

export function FlatCeilingForm({ onAddToList }: FlatCeilingFormProps) {
  const [length, setLength] = useState<number | ''>('');
  const [width, setWidth] = useState<number | ''>('');
  const { toast } = useToast();

  const results: MaterialResult[] = useMemo(() => {
    const l = Number(length);
    const w = Number(width);

    if (isNaN(l) || isNaN(w) || l <= 0 || w <= 0) {
      return [];
    }

    const area = l * w;
    const perimeter = (l + w) * 2;
    
    const f47RowCount = Math.ceil(w / 0.6);
    const totalF47Length = f47RowCount * l;
    const f47Profiles = Math.ceil(totalF47Length / 4);

    const hangersPerRun = Math.ceil(l / 0.6);
    const totalHangers = f47RowCount * hangersPerRun;

    const u36HangerLength = totalHangers * 0.30;
    const u36Profiles = Math.ceil(u36HangerLength / 4);

    const l25Profiles = Math.ceil(perimeter / 3);
    
    const nailAndChargeCount = totalHangers;
    const nailAndChargePacks = nailAndChargeCount < 100 && nailAndChargeCount > 0 ? 1 : Math.ceil(nailAndChargeCount / 100);

    const structureScrews = Math.ceil(totalHangers * 2);
    
    const panelScrewsForPerimeter = Math.ceil(perimeter / 0.2);
    const panelScrewsForF47 = Math.ceil(totalF47Length / 0.2);
    const totalPanelScrews = Math.ceil(panelScrewsForPerimeter + panelScrewsForF47);

    const panels = Math.ceil(area / 2.88);

    return [
      { material: 'سازه F47', quantity: f47Profiles, unit: 'شاخه' },
      { material: 'سازه U36', quantity: u36Profiles, unit: 'شاخه' },
      { material: 'نبشی L25', quantity: l25Profiles, unit: 'شاخه' },
      { material: 'پانل گچی', quantity: panels, unit: 'عدد' },
      { material: 'میخ و چاشنی', quantity: nailAndChargePacks, unit: 'بسته' },
      { material: 'پیچ سازه', quantity: structureScrews, unit: 'عدد' },
      { material: 'پیچ ۲.۵', quantity: totalPanelScrews, unit: 'عدد' },
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

  const handleAddClick = () => {
    if (results.length === 0) {
      toast({ variant: 'destructive', title: 'لیست مصالح خالی است', description: 'ابتدا ابعاد را وارد کرده و مصالح را محاسبه کنید.'});
      return;
    }
    const description = `سقف فلت: ${length} * ${width} متر`;
    onAddToList(description, results);
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
                توجه: مقادیر محاسبه شده تقریبی بوده و ممکن است بسته به شرایط اجرایی و پرت مصالح، تا ۱۰٪ افزایش یابد.
            </p>
            <Button onClick={handleAddClick} size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="ml-2 h-5 w-5" />
                افزودن به لیست برآورد
            </Button>
        </CardFooter>
       )}
    </Card>
  );
}
