
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Waves, Square, Layers, CheckCircle2 } from 'lucide-react';
import type { MaterialResult } from '../estimators-page';
import { cn } from '@/lib/utils';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';


type DrywallFormProps = {
    onAddToList: (description: string, results: MaterialResult[]) => void;
    onBack: () => void;
};

type WallType = 'partition' | 'lining';


export function DrywallForm({ onAddToList, onBack }: DrywallFormProps) {
  const [length, setLength] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [displayLength, setDisplayLength] = useState('');
  const [displayHeight, setDisplayHeight] = useState('');

  const [wallType, setWallType] = useState<WallType>('partition');
  const [includeWool, setIncludeWool] = useState(true);

  const results: MaterialResult[] = useMemo(() => {
    const l = Number(length);
    const h = Number(height);

    if (isNaN(l) || isNaN(h) || l <= 0 || h <= 0) {
      return [];
    }

    const runnerLength = 4; // 4 meters
    const studLength = 3; // Assuming 3m studs
    const panelArea = 1.2 * 2.4; // Assuming 1.2m x 2.4m panels -> 2.88 sqm
    const woolSheetArea = 1.2 * 0.6; // 0.72 sqm

    // Runner calculation
    const floorCeilingRunners = Math.ceil((l * 2) / runnerLength);
    const sideRunners = Math.ceil((h * 2) / runnerLength);
    const totalRunners = floorCeilingRunners + sideRunners;

    // Stud calculation
    const studCount = Math.ceil(l / 0.6);
    const studsNeeded = Math.ceil((studCount * h) / studLength);

    // Panel calculation
    const wallArea = l * h;
    const panelMultiplier = wallType === 'partition' ? 2 : 1;
    const totalPanelArea = wallArea * panelMultiplier;
    const panelsNeeded = Math.ceil(totalPanelArea / panelArea);
    
    // Screw calculation (approximation)
    const totalScrews = Math.ceil(studCount * h * panelMultiplier * 15);

    // Rock wool calculation
    let woolSheetsNeeded = 0;
    if (includeWool) {
        woolSheetsNeeded = Math.ceil(wallArea / woolSheetArea);
    }
    const woolPacks = includeWool ? Math.ceil(woolSheetsNeeded / 6) : 0; // Assuming 6 sheets per pack

    const materialList: MaterialResult[] = [
      { material: 'پنل RG', quantity: panelsNeeded, unit: 'برگ' },
      { material: 'رانر', quantity: totalRunners, unit: 'شاخه' },
      { material: 'استاد', quantity: studsNeeded, unit: 'شاخه' },
      { material: 'پیچ ۲.۵', quantity: totalScrews, unit: 'عدد' },
    ];
    
    if (includeWool) {
        materialList.push({ material: 'پشم سنگ', quantity: woolPacks, unit: 'بسته' });
    }

    return materialList.filter(item => item.quantity > 0);
  }, [length, height, wallType, includeWool]);
  
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number | ''>>, displaySetter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseFormattedNumber(value);
    displaySetter(formatNumber(numericValue));
    setter(numericValue);
  };

  const handleAddClick = () => {
    if (results.length === 0) {
      // You can show a toast or message here
      return;
    }
    const typeText = wallType === 'partition' ? 'جداکننده' : 'پوششی';
    const woolText = includeWool ? 'با پشم سنگ' : 'بدون پشم سنگ';
    const description = `دیوار ${typeText}: ${displayLength} * ${displayHeight} متر (${woolText})`;
    onAddToList(description, results);
  };

  return (
    <div className="pb-28">
      <Card>
        <CardHeader>
          <CardTitle>محاسبه مصالح دیوار خشک (کناف)</CardTitle>
          <CardDescription>
            ابعاد دیوار و نوع آن را مشخص کنید تا لیست مصالح مورد نیاز را دریافت کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
              <h3 className="text-lg font-semibold mb-4 text-primary">۱. ابعاد دیوار</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="length">طول دیوار (متر)</Label>
                  <Input
                    id="length"
                    type="text"
                    placeholder="مثال: ۳.۲۰"
                    value={displayLength}
                    onChange={handleInputChange(setLength, setDisplayLength)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="height">ارتفاع دیوار (متر)</Label>
                  <Input
                    id="height"
                    type="text"
                    placeholder="مثال: ۲.۸۰"
                    value={displayHeight}
                    onChange={handleInputChange(setHeight, setDisplayHeight)}
                  />
                </div>
              </div>
          </div>
          
          <div>
              <h3 className="text-lg font-semibold mb-4 text-primary">۲. گزینه‌های دیوار</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card 
                      className={cn("cursor-pointer", wallType === 'partition' && 'border-primary ring-2 ring-primary')}
                      onClick={() => setWallType('partition')}
                  >
                      <CardHeader className="flex-row items-start gap-4 space-y-0 p-4">
                          <Layers className="h-8 w-8 text-primary" />
                          <div className="grid gap-1">
                              <CardTitle className="text-base">دیوار جداکننده</CardTitle>
                              <CardDescription className="text-xs">دو طرف دیوار با پنل پوشیده می‌شود.</CardDescription>
                          </div>
                          {wallType === 'partition' && <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />}
                      </CardHeader>
                  </Card>
                  <Card 
                      className={cn("cursor-pointer", wallType === 'lining' && 'border-primary ring-2 ring-primary')}
                      onClick={() => setWallType('lining')}
                  >
                      <CardHeader className="flex-row items-start gap-4 space-y-0 p-4">
                          <Square className="h-8 w-8 text-primary" />
                          <div className="grid gap-1">
                              <CardTitle className="text-base">دیوار پوششی</CardTitle>
                              <CardDescription className="text-xs">یک طرف دیوار با پنل پوشیده می‌شود.</CardDescription>
                          </div>
                          {wallType === 'lining' && <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />}
                      </CardHeader>
                  </Card>
              </div>
              <Card 
                  className={cn("cursor-pointer mt-4", includeWool && 'border-primary ring-2 ring-primary')}
                  onClick={() => setIncludeWool(!includeWool)}
              >
                  <CardHeader className="flex-row items-start gap-4 space-y-0 p-4">
                      <Waves className="h-8 w-8 text-primary" />
                      <div className="grid gap-1">
                          <CardTitle className="text-base">عایق صوتی (پشم سنگ)</CardTitle>
                          <CardDescription className="text-xs">پشم سنگ برای بهبود عملکرد صوتی دیوار محاسبه شود.</CardDescription>
                      </div>
                      {includeWool && <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />}
                  </CardHeader>
              </Card>
          </div>


          {results.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary">۳. لیست مصالح مورد نیاز</h3>
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
                  توجه: مقادیر محاسبه شده تقریبی بوده و پرت مصالح در نظر گرفته نشده است. محاسبات بر اساس سازه‌های استاندارد با فاصله ۶۰ سانتی‌متر است.
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
