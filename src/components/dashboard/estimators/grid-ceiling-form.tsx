
'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
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

interface MaterialResult {
  material: string;
  quantity: number;
  unit: string;
}

export function GridCeilingForm() {
  const [length, setLength] = useState<number | ''>('');
  const [width, setWidth] = useState<number | ''>('');

  const results: MaterialResult[] = useMemo(() => {
    const l = Number(length);
    const w = Number(width);

    if (isNaN(l) || isNaN(w) || l <= 0 || w <= 0) {
      return [];
    }

    const perimeter = (l + w) * 2;
    const area = l * w;
    
    // Ensure length is always the longer side for calculation consistency
    const longSide = Math.max(l, w);
    const shortSide = Math.min(l, w);

    // 1. نبشی L24 (دور کار)
    const lProfile = perimeter;

    // 2. سپری T360 (پروفیل اصلی)
    const t360Count = Math.ceil(shortSide / 1.2);
    const t360TotalLength = t360Count * longSide;
    const t360Pieces = Math.ceil(t360TotalLength / 3.6);

    // 3. سپری T120
    const t120Count = Math.ceil(longSide / 0.6) - 1;
    const t120TotalLength = t120Count * shortSide;
    const t120Pieces = Math.ceil(t120TotalLength / 1.2);

    // 4. سپری T60
    const t60TotalLength = t360TotalLength; // Same length as T360 runs
    const t60Pieces = Math.ceil(t60TotalLength / 0.6);

    // 5. تایل 60x60
    const tiles = Math.ceil(area / 0.36);

    // 6. آویز (میخ و فنر)
    const hangers = Math.ceil(area * 1); // Approximation: 1 hanger per sq meter

    return [
      { material: 'نبشی L24 (دور کار)', quantity: parseFloat(lProfile.toFixed(2)), unit: 'متر' },
      { material: 'سپری T360 (پروفیل اصلی)', quantity: t360Pieces, unit: 'شاخه ۳.۶ متری' },
      { material: 'سپری T120', quantity: t120Pieces, unit: 'شاخه ۱.۲ متری' },
      { material: 'سپری T60', quantity: t60Pieces, unit: 'شاخه ۰.۶ متری' },
      { material: 'تایل ۶۰x۶۰', quantity: tiles, unit: 'عدد' },
      { material: 'آویز (میخ و فنر)', quantity: hangers, unit: 'عدد' },
    ];
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
             <p className="text-xs text-muted-foreground mt-4">
                توجه: مقادیر محاسبه شده تقریبی بوده و ممکن است بسته به شرایط اجرایی و پرت مصالح، تا ۱۰٪ افزایش یابد. همیشه مقداری مصالح اضافی تهیه فرمایید.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
