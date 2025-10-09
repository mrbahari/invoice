
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { MaterialResult } from '../estimators-page';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';

type GridCeilingFormProps = {
    onAddToList: (description: string, results: MaterialResult[]) => void;
    onBack: () => void;
};


export function GridCeilingForm({ onAddToList, onBack }: GridCeilingFormProps) {
  const [length, setLength] = useState<number | ''>('');
  const [width, setWidth] = useState<number | ''>('');
  const [displayLength, setDisplayLength] = useState('');
  const [displayWidth, setDisplayWidth] = useState('');
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
    const screws = Math.ceil(perimeter / 0.3); // Screws for L-profile, every 30cm

    return [
      { material: 'تایل پی وی سی', quantity: tiles, unit: 'عدد' },
      { material: 'نبشی L24', quantity: lProfilePieces, unit: 'شاخه' },
      { material: 'سپری T360', quantity: t360Pieces, unit: 'شاخه' },
      { material: 'سپری T120', quantity: t120Pieces, unit: 'شاخه' },
      { material: 'سپری T60', quantity: t60Pieces, unit: 'شاخه' },
      { material: 'آویز', quantity: hangers, unit: 'عدد' },
      { material: 'پیچ ۲.۵', quantity: screws, unit: 'عدد'},
    ].filter(item => item.quantity > 0);
  }, [length, width]);
  
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number | ''>>, displaySetter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseFormattedNumber(value);
    displaySetter(formatNumber(numericValue));
    setter(numericValue);
  };

  const handleAddClick = () => {
    if (results.length === 0) {
      // You can add a toast message here
      return;
    }
    const description = `سقف مشبک: ${displayLength} * ${displayWidth} متر`;
    onAddToList(description, results);
  };

  return (
    <div className="pb-28">
      <Card>
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
                type="text"
                placeholder="مثال: ۸"
                value={displayLength}
                onChange={handleInputChange(setLength, setDisplayLength)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="width">عرض اتاق (متر)</Label>
              <Input
                id="width"
                type="text"
                placeholder="مثال: ۴"
                value={displayWidth}
                onChange={handleInputChange(setWidth, setDisplayWidth)}
              />
            </div>
          </div>

          {results.length > 0 && (
            <div>
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
                      <TableCell className="text-center font-mono text-lg">{formatNumber(item.quantity)}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground pt-4">
                  توجه: مقادیر محاسبه شده تقریبی است. این محاسبه برای سازه گذاری ۱۲۰ * ۶۰ می باشد.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {results.length > 0 && (
        <div 
          className="fixed bottom-20 left-0 right-0 z-10 p-4 bg-background/90 border-t backdrop-blur-sm no-print"
          style={{ bottom: '64px' }}
        >
          <div className="max-w-4xl mx-auto">
              <Button onClick={handleAddClick} size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                  <PlusCircle className="ml-2 h-5 w-5" />
                  افزودن به لیست برآورد
              </Button>
          </div>
        </div>
      )}
    </div>
  );
}
