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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';


type DrywallFormProps = {
    onAddToList: (description: string, results: MaterialResult[]) => void;
};

type WallType = 'partition' | 'lining';


export function DrywallForm({ onAddToList }: DrywallFormProps) {
  const [length, setLength] = useState<number | ''>(3.20);
  const [height, setHeight] = useState<number | ''>(2.80);
  const [wallType, setWallType] = useState<WallType>('partition');
  const [includeWool, setIncludeWool] = useState(true);

  const { toast } = useToast();

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
    const totalStudMeter = studCount * h;
    const screwsPerStud = Math.ceil(h / 0.2) * 2; // both edges of stud
    const totalScrews = (totalStudMeter / 0.2) * panelMultiplier;
    const screwPacks = Math.ceil(totalScrews / 1000); // Assuming 1000 screws per pack

    // Rock wool calculation
    let woolSheetsNeeded = 0;
    if (includeWool) {
        woolSheetsNeeded = Math.ceil(wallArea / woolSheetArea);
    }
    const woolPacks = includeWool ? Math.ceil(woolSheetsNeeded / 6) : 0; // Assuming 6 sheets per pack

    const materialList: MaterialResult[] = [
      { material: 'رانر', quantity: totalRunners, unit: 'شاخه' },
      { material: 'استاد', quantity: studsNeeded, unit: 'شاخه' },
      { material: 'پانل', quantity: panelsNeeded, unit: 'برگ' },
      { material: 'پیچ پنل', quantity: screwPacks, unit: 'بسته' },
    ];
    
    if (includeWool) {
        materialList.push({ material: 'پشم سنگ', quantity: woolPacks, unit: 'بسته' });
    }

    return materialList.filter(item => item.quantity > 0);
  }, [length, height, wallType, includeWool]);
  
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
      toast({ variant: 'destructive', title: 'لیست مصالح خالی است', description: 'ابتدا ابعاد دیوار را وارد کرده و مصالح را محاسبه کنید.'});
      return;
    }
    const typeText = wallType === 'partition' ? 'جداکننده' : 'پوششی';
    const woolText = includeWool ? 'با پشم سنگ' : 'بدون پشم سنگ';
    const description = `دیوار ${typeText}: ${length} * ${height} متر (${woolText})`;
    onAddToList(description, results);
  };

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle>محاسبه مصالح دیوار خشک (کناف)</CardTitle>
        <CardDescription>
          ابعاد دیوار و نوع آن را مشخص کنید تا لیست مصالح مورد نیاز را دریافت کنید.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="grid gap-2">
            <Label htmlFor="length">طول دیوار (متر)</Label>
            <Input
              id="length"
              type="number"
              placeholder="مثال: 3.20"
              value={length}
              onChange={handleInputChange(setLength)}
              step="0.01"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="height">ارتفاع دیوار (متر)</Label>
            <Input
              id="height"
              type="number"
              placeholder="مثال: 2.80"
              value={height}
              onChange={handleInputChange(setHeight)}
              step="0.01"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="grid gap-2">
                <Label>نوع دیوار</Label>
                <RadioGroup defaultValue="partition" onValueChange={(value) => setWallType(value as WallType)} className="flex gap-4 pt-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="partition" id="r-partition" />
                        <Label htmlFor="r-partition">جداکننده (دو طرف پنل)</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <RadioGroupItem value="lining" id="r-lining" />
                        <Label htmlFor="r-lining">پوششی (یک طرف پنل)</Label>
                    </div>
                </RadioGroup>
            </div>
             <div className="grid gap-2">
                <Label>عایق صوتی</Label>
                <div className="flex items-center space-x-2 space-x-reverse pt-2">
                    <Checkbox id="include-wool" checked={includeWool} onCheckedChange={(checked) => setIncludeWool(checked as boolean)} />
                    <label
                        htmlFor="include-wool"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        محاسبه پشم سنگ برای عایق صوتی
                    </label>
                </div>
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
                توجه: مقادیر محاسبه شده تقریبی بوده و پرت مصالح در نظر گرفته نشده است. محاسبات بر اساس سازه‌های استاندارد با فاصله ۶۰ سانتی‌متر است.
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
