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

type BoxCeilingFormProps = {
    onAddToList: (description: string, results: MaterialResult[]) => void;
};


export function BoxCeilingForm({ onAddToList }: BoxCeilingFormProps) {
  const [length, setLength] = useState<number | ''>('');
  const { toast } = useToast();

  const results: MaterialResult[] = useMemo(() => {
    const l = Number(length);

    if (isNaN(l) || l <= 0) {
      return [];
    }
    
    const screws = l * (2200 / 45);
    const screwPacks = screws > 0 ? Math.round(screws / 1000) : 0;
    const l25Profiles = Math.ceil(l);
    const panels = Math.ceil(l / 4.5);


    return [
      { material: 'پیچ پنل 2.5', quantity: screwPacks, unit: 'بسته' },
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

  const handleAddClick = () => {
    if (results.length === 0) {
      toast({ variant: 'destructive', title: 'لیست مصالح خالی است', description: 'ابتدا طول باکس را وارد کرده و مصالح را محاسبه کنید.'});
      return;
    }
    const description = `باکس و نورمخفی: ${length} متر`;
    onAddToList(description, results);
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
            <Button onClick={handleAddClick} size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="ml-2 h-5 w-5" />
                افزودن به لیست برآورد
            </Button>
        </CardFooter>
       )}
    </Card>
  );
}
