
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import type { MaterialResult } from '../estimators-page';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';

type BoxCeilingFormProps = {
    onAddToList: (description: string, results: MaterialResult[]) => void;
    onBack: () => void;
};


export function BoxCeilingForm({ onAddToList, onBack }: BoxCeilingFormProps) {
  const [length, setLength] = useState<number | ''>('');
  const [displayLength, setDisplayLength] = useState('');

  const results: MaterialResult[] = useMemo(() => {
    const l = Number(length);

    if (isNaN(l) || l <= 0) {
      return [];
    }
    
    const screws = Math.ceil(l * (2200 / 45));
    const l25Profiles = Math.ceil(l);
    const panels = Math.ceil(l / 4.5);


    return [
      { material: 'پنل والیز', quantity: panels, unit: 'برگ' },
      { material: 'نبشی L25', quantity: l25Profiles, unit: 'شاخه' },
      { material: 'پیچ ۲.۵', quantity: screws, unit: 'عدد' },
    ].filter(item => item.quantity > 0);
  }, [length]);
  
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number | ''>>, displaySetter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseFormattedNumber(value);
    displaySetter(formatNumber(numericValue));
    setter(numericValue);
  };

  const handleAddClick = () => {
    if (results.length === 0) {
      // You can show a toast or message here if you have a toast system
      console.error("No results to add.");
      return;
    }
    const description = `باکس و نورمخفی: ${displayLength} متر`;
    onAddToList(description, results);
  };

  return (
    <div className="pb-28">
      <Card>
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
                type="text"
                placeholder="مثال: ۱۵"
                value={displayLength}
                onChange={handleInputChange(setLength, setDisplayLength)}
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
                      <TableCell className="text-center font-mono text-lg">{item.quantity.toLocaleString('fa-IR')}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground pt-4">
                  توجه: مقادیر محاسبه شده تقریبی بوده و ممکن است بسته به شرایط اجرایی و پرت مصالح، تا ۱۰٪ افزایش یابد.
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
