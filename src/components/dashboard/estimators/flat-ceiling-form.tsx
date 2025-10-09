
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle, Layers, CheckCircle2 } from 'lucide-react';
import type { MaterialResult } from '../estimators-page';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';

// =================================================================
// Helper Functions
// =================================================================

const L25_LENGTH = 4;
const F47_LENGTH = 4;
const U36_LENGTH = 4;
const PANEL_LENGTH = 2.4;
const PANEL_WIDTH = 1.2;

interface CutResult {
  pieces: number;
  waste: number;
  cuts: { piece: number, length: number, from: number }[];
}


function calculateProfileCuts(count: number, length: number, stockLength: number): CutResult {
    if (length <= 0 || count <= 0) {
      return { pieces: 0, waste: 0, cuts: [] };
    }
  
    // Array to store the lengths of all pieces to be cut
    const allPieces: number[] = Array(count).fill(length);
    let stockUsed = 0;
    const cuts: { piece: number; length: number; from: number }[] = [];
  
    // Bin packing algorithm (First Fit Decreasing) - simplified for identical pieces
    const bins: number[] = []; // Represents remaining length in each stock
  
    for (let i = 0; i < allPieces.length; i++) {
      const pieceLength = allPieces[i];
      let placed = false;
  
      // Handle pieces longer than stock length
      if (pieceLength > stockLength) {
          const numStock = Math.floor(pieceLength / stockLength);
          const remainder = pieceLength % stockLength;

          for (let k=0; k < numStock; k++) {
              stockUsed++;
              cuts.push({ piece: i + 1, length: stockLength, from: stockUsed });
          }

          if (remainder > 0.01) { // Check for significant remainder
            let remainderPlaced = false;
            // Try to fit the remainder in an existing bin
            for (let j = 0; j < bins.length; j++) {
              if (bins[j] >= remainder) {
                bins[j] -= remainder;
                cuts.push({ piece: i + 1, length: remainder, from: j + 1 });
                remainderPlaced = true;
                break;
              }
            }
            // If remainder doesn't fit, open a new bin
            if (!remainderPlaced) {
              stockUsed++;
              const newBinRemaining = stockLength - remainder;
              bins.push(newBinRemaining);
              cuts.push({ piece: i + 1, length: remainder, from: stockUsed });
            }
          }
          placed = true;

      } else {
        // Try to fit the piece into an existing bin (stock)
        for (let j = 0; j < bins.length; j++) {
          if (bins[j] >= pieceLength) {
            bins[j] -= pieceLength;
            cuts.push({ piece: i + 1, length: pieceLength, from: j + 1 });
            placed = true;
            break;
          }
        }
      }
  
      // If it doesn't fit, open a new bin (use a new stock)
      if (!placed) {
        stockUsed++;
        const newBinRemaining = stockLength - pieceLength;
        bins.push(newBinRemaining);
        cuts.push({ piece: i + 1, length: pieceLength, from: stockUsed });
      }
    }
    
    const totalLengthUsed = count * length;
    const totalStockLengthUsed = stockUsed * stockLength;
    const waste = totalStockLengthUsed - totalLengthUsed;
  
    return { pieces: stockUsed, waste, cuts };
}


interface PanelLayout {
  panelsNeeded: number;
  waste: number;
  wastePieces: { width: number; length: number; count: number }[];
}

/**
 * Calculates panel layout to minimize waste.
 * @param roomLength - The length of the room.
 * @param roomWidth - The width of the room.
 * @returns The better of the two layouts (lengthwise or widthwise).
 */
function calculatePanelLayout(roomLength: number, roomWidth: number): PanelLayout {
    // Layout 1: Placing panels lengthwise
    const panelsInLength1 = Math.ceil(roomLength / PANEL_LENGTH);
    const panelsInWidth1 = Math.ceil(roomWidth / PANEL_WIDTH);
    const totalPanels1 = panelsInLength1 * panelsInWidth1;
    
    const wastePieces1 = [];
    if (panelsInLength1 * PANEL_LENGTH > roomLength) {
       wastePieces1.push({ width: roomWidth, length: (panelsInLength1 * PANEL_LENGTH) - roomLength, count: 1 });
    }
    if (panelsInWidth1 * PANEL_WIDTH > roomWidth) {
       wastePieces1.push({ width: (panelsInWidth1 * PANEL_WIDTH) - roomWidth, length: roomLength, count: 1 });
    }
    const totalWaste1 = wastePieces1.reduce((acc, p) => acc + (p.width * p.length * p.count), 0);


    // Layout 2: Placing panels widthwise
    const panelsInLength2 = Math.ceil(roomLength / PANEL_WIDTH);
    const panelsInWidth2 = Math.ceil(roomWidth / PANEL_LENGTH);
    const totalPanels2 = panelsInLength2 * panelsInWidth2;
     const wastePieces2 = [];
    if (panelsInLength2 * PANEL_WIDTH > roomLength) {
       wastePieces2.push({ width: (panelsInLength2 * PANEL_WIDTH) - roomLength, length: roomWidth, count: 1 });
    }
    if (panelsInWidth2 * PANEL_LENGTH > roomWidth) {
       wastePieces2.push({ width: roomWidth, length: (panelsInWidth2 * PANEL_LENGTH) - roomWidth, count: 1 });
    }
    const totalWaste2 = wastePieces2.reduce((acc, p) => acc + (p.width * p.length * p.count), 0);

    // Compare and return the better layout
    if (totalWaste1 <= totalWaste2) {
        return { panelsNeeded: totalPanels1, waste: totalWaste1, wastePieces: wastePieces1 };
    } else {
        return { panelsNeeded: totalPanels2, waste: totalWaste2, wastePieces: wastePieces2 };
    }
}


// =================================================================
// Component
// =================================================================
type FlatCeilingFormProps = {
    onAddToList: (description: string, results: MaterialResult[], details: any) => void;
    onBack: () => void;
};

type CeilingType = 'A' | 'B';

export function FlatCeilingForm({ onAddToList, onBack }: FlatCeilingFormProps) {
  const [length, setLength] = useState<number | ''>('');
  const [width, setWidth] = useState<number | ''>('');
  const [suspensionHeight, setSuspensionHeight] = useState<number | ''>(20);
  const [joistSpacing, setJoistSpacing] = useState<number | ''>(60);
  
  const [displayLength, setDisplayLength] = useState('');
  const [displayWidth, setDisplayWidth] = useState('');
  const [displaySuspensionHeight, setDisplaySuspensionHeight] = useState(() => formatNumber(20));
  const [displayJoistSpacing, setDisplayJoistSpacing] = useState(() => formatNumber(60));

  const [ceilingType, setCeilingType] = useState<CeilingType>('B');
  

  const { results, details } = useMemo(() => {
    const l = Number(length);
    const w = Number(width);
    const sHeight = Number(suspensionHeight);
    const jSpacing = Number(joistSpacing) / 100; // convert cm to m

    if (isNaN(l) || isNaN(w) || l <= 0 || w <= 0 || isNaN(sHeight) || sHeight < 0 || isNaN(jSpacing) || jSpacing <=0) {
      return { results: [], details: null };
    }
    
    // 1. Perimeter and Area
    const longSide = Math.max(l, w);
    const shortSide = Math.min(l, w);
    const perimeter = (l + w) * 2;
    const area = l * w;

    // 2. L25 Profiles
    const l25Profiles = Math.ceil(perimeter / L25_LENGTH);

    // 3. F47 Main Runners (Load-bearing)
    const f47MainRunnerCount = Math.ceil(shortSide / 0.6) - 1;
    const { pieces: f47MainProfiles, waste: f47MainWaste, cuts: f47MainCuts } = calculateProfileCuts(f47MainRunnerCount, longSide, F47_LENGTH);
    const f47MainTotalLength = f47MainRunnerCount * longSide;
    
    // W Connectors: number of times a piece is longer than stock
    const wConnectors = f47MainRunnerCount * Math.floor(longSide / F47_LENGTH);

    // 4. Suspension System
    const useBrackets = sHeight <= 12;
    const hangersPerRow = Math.ceil(longSide / jSpacing);
    const totalHangers = f47MainRunnerCount * hangersPerRow;
    const nailAndChargeCount = totalHangers;
    
    let u36Profiles = 0;
    if (!useBrackets) {
        const u36HangerLength = totalHangers * Math.max(0.20, sHeight / 100);
        u36Profiles = Math.ceil(u36HangerLength / U36_LENGTH);
    }
    
    const clips = totalHangers;
    const structureScrews = clips * 2;
    
    // 5. Panel Layout
    const panelLayout = calculatePanelLayout(longSide, shortSide);

    // 6. Panel Screws (TN25 - pich 2.5)
    // Screws are needed for F47s and for perimeter L25s
    const panelScrewsForF47 = Math.ceil(f47MainTotalLength / 0.2);
    const panelScrewsForL25 = Math.ceil(perimeter / 0.2); 
    const totalPanelScrews = panelScrewsForF47 + panelScrewsForL25;
    
    // --- Type A Specific Calculations ---
    let f47SecondaryProfiles = 0;
    let typeAClips = 0;
    if (ceilingType === 'A') {
        const f47SecondaryRunnerCount = Math.floor(longSide / 0.9);
        const { pieces: secondaryPieces } = calculateProfileCuts(f47SecondaryRunnerCount, shortSide, F47_LENGTH);
        f47SecondaryProfiles = secondaryPieces;
        typeAClips = f47SecondaryRunnerCount * f47MainRunnerCount;
    }

    const materialList: MaterialResult[] = [
      { material: 'پنل RG باتیس', quantity: panelLayout.panelsNeeded, unit: 'برگ' },
      { material: 'نبشی L25', quantity: l25Profiles, unit: 'شاخه' },
      { material: 'سازه F47', quantity: f47MainProfiles + f47SecondaryProfiles, unit: 'شاخه' },
      { material: 'پیچ 2.5', quantity: totalPanelScrews, unit: 'عدد' },
    ];
    
    if (u36Profiles > 0) {
        materialList.push({ material: 'سازه U36', quantity: u36Profiles, unit: 'شاخه' });
    }

    materialList.push(
        { material: 'پیچ سازه', quantity: structureScrews, unit: 'عدد' },
        { material: 'میخ و چاشنی', quantity: nailAndChargeCount, unit: 'عدد' },
        { material: 'اتصال W', quantity: wConnectors, unit: 'عدد' },
        { material: 'کلیپس', quantity: clips + typeAClips, unit: 'عدد' },
    )
    
    if (useBrackets) {
        materialList.push({ material: 'براکت', quantity: totalHangers, unit: 'عدد' });
    }

    const estimationDetails = {
        area,
        perimeter,
        l25Profiles: { count: l25Profiles, length: L25_LENGTH },
        f47MainProfiles: { count: f47MainProfiles, waste: f47MainWaste, rows: f47MainRunnerCount },
        panelLayout,
    };

    return { results: materialList.filter(item => item.quantity > 0), details: estimationDetails };
  }, [length, width, suspensionHeight, joistSpacing, ceilingType]);
  
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number | ''>>, displaySetter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // For placeholder behavior, we set the actual value directly
    if (value === '') {
        displaySetter('');
        setter('');
        return;
    }
    const numericValue = parseFormattedNumber(value);
    displaySetter(formatNumber(numericValue));
    setter(numericValue);
  };

  const handleAddClick = () => {
    if (results.length === 0) return;
    const description = `سقف فلت تیپ ${ceilingType}: ${displayLength || length} * ${displayWidth || width} متر`;
    onAddToList(description, results, details);
  };

  return (
    <div className="pb-28">
      <Card>
        <CardHeader>
          <CardTitle>محاسبه مصالح سقف فلت</CardTitle>
          <CardDescription>
            ابعاد اتاق و نوع سقف را وارد کنید تا لیست مصالح مورد نیاز را دریافت کنید.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">۱. مشخصات سقف</h3>
            <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="length">طول اتاق (متر)</Label>
                    <Input id="length" type="text" placeholder="مثال: ۶.۳۲" value={displayLength} onChange={handleInputChange(setLength, setDisplayLength)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="width">عرض اتاق (متر)</Label>
                    <Input id="width" type="text" placeholder="مثال: ۳.۱۴" value={displayWidth} onChange={handleInputChange(setWidth, setDisplayWidth)} />
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4 mt-6">
                  <Card className={cn("cursor-pointer", ceilingType === 'B' && 'border-primary ring-2 ring-primary')} onClick={() => setCeilingType('B')}>
                      <CardHeader className="flex-row items-start gap-4 space-y-0 p-4">
                          <Layers className="h-8 w-8 text-primary" />
                          <div className="grid gap-1">
                              <CardTitle className="text-base">تیپ B (استاندارد)</CardTitle>
                              <CardDescription className="text-xs">سازه کشی یک طرفه. مناسب برای دهانه‌های کوتاه و کاربری‌های معمول.</CardDescription>
                          </div>
                          {ceilingType === 'B' && <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />}
                      </CardHeader>
                  </Card>
                  <Card className={cn("cursor-pointer", ceilingType === 'A' && 'border-primary ring-2 ring-primary')} onClick={() => setCeilingType('A')}>
                      <CardHeader className="flex-row items-start gap-4 space-y-0 p-4">
                          <div className="relative">
                            <Layers className="h-8 w-8 text-primary" />
                            <Layers className="h-8 w-8 text-primary absolute top-0 left-0 opacity-50 transform rotate-90" />
                          </div>
                          <div className="grid gap-1">
                              <CardTitle className="text-base">تیپ A (پیشرفته)</CardTitle>
                              <CardDescription className="text-xs">سازه کشی دو طرفه. مناسب برای دهانه‌های بزرگ و استحکام بیشتر.</CardDescription>
                          </div>
                          {ceilingType === 'A' && <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />}
                      </CardHeader>
                  </Card>
            </div>
            <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="grid gap-2">
                    <Label htmlFor="sHeight">ارتفاع آویز (سانتی‌متر)</Label>
                    <Input id="sHeight" type="text" placeholder="مثال: ۲۰" value={displaySuspensionHeight} onChange={handleInputChange(setSuspensionHeight, setDisplaySuspensionHeight)} />
                    <p className="text-xs text-muted-foreground">اگر ارتفاع کمتر از ۱۲ سانتی‌متر باشد، از براکت به جای آویز U36 استفاده می‌شود.</p>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="jSpacing">فاصله تیرچه‌ها (سانتی‌متر)</Label>
                    <Input id="jSpacing" type="text" placeholder="مثال: ۶۰" value={displayJoistSpacing} onChange={handleInputChange(setJoistSpacing, setDisplayJoistSpacing)} />
                    <p className="text-xs text-muted-foreground">فاصله مرکز به مرکز تیرچه‌های باربر سقف.</p>
                </div>
            </div>
          </div>

          {results.length > 0 && (
            <div>
              <Separator className="my-6" />
              <h3 className="text-lg font-semibold mb-4 text-primary">۲. لیست مصالح مورد نیاز</h3>
              <Table>
                <TableHeader><TableRow><TableHead>نوع مصالح</TableHead><TableHead className="text-center">مقدار</TableHead><TableHead>واحد</TableHead></TableRow></TableHeader>
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
            </div>
          )}

          {details && (
             <div>
                <Separator className="my-6" />
                <h3 className="text-lg font-semibold mb-4 text-primary">۳. جزئیات و پرت مصالح</h3>
                 <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>مساحت کل:</strong> {formatNumber(details.area.toFixed(2))} متر مربع</p>
                    <p><strong>محیط:</strong> {formatNumber(details.perimeter.toFixed(2))} متر</p>
                    <p><strong>نبشی L25:</strong> به {formatNumber(details.l25Profiles.count)} شاخه {formatNumber(details.l25Profiles.length)} متری نیاز است.</p>
                    <p><strong>سازه F47 اصلی:</strong> برای {formatNumber(details.f47MainProfiles.rows)} ردیف، به {formatNumber(details.f47MainProfiles.count)} شاخه نیاز است. پرت تقریبی: {formatNumber(details.f47MainProfiles.waste.toFixed(2))} متر.</p>
                    <p><strong>پنل‌ها:</strong> به {formatNumber(details.panelLayout.panelsNeeded)} برگ پنل نیاز است. پرت کل: {formatNumber(details.panelLayout.waste.toFixed(2))} متر مربع.</p>
                    {details.panelLayout.wastePieces.map((p: any, i: number) => (
                       <p key={i} className="pr-4"> - قطعه پرت {formatNumber(i+1)}: {formatNumber(p.count)} عدد به ابعاد {formatNumber(p.length.toFixed(2))} در {formatNumber(p.width.toFixed(2))} متر</p>
                    ))}
                </div>
            </div>
          )}

        </CardContent>
      </Card>
       {results.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-10 p-4 bg-background/90 border-t backdrop-blur-sm no-print" style={{ bottom: '80px' }}>
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
