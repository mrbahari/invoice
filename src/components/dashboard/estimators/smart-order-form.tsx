'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, Loader2, CheckCircle, PlusCircle, Trash2, ListTree } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { extractMaterialsFromFile } from '@/ai/flows/extract-materials-flow';
import type { MaterialResult } from '../estimators-page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { useData } from '@/context/data-context';
import { Badge } from '@/components/ui/badge';
import type { Product, Category } from '@/lib/definitions';
import { useUser, useFirestore } from '@/firebase';
import { writeBatch, doc, collection } from 'firebase/firestore';


type ExtractedProduct = {
    isNew: boolean;
    productId: string;
    name: string;
    quantity: number;
    unit: string;
};

type SmartOrderFormProps = {
  onAddToList: (description: string, results: MaterialResult[]) => void;
  onBack: () => void;
};

export function SmartOrderForm({ onAddToList, onBack }: SmartOrderFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedResults, setExtractedResults] = useState<ExtractedProduct[]>([]);
  const { toast } = useToast();
  const { data: appData, addDocument } = useData();
  const { products, categories, stores } = appData;
  const { user } = useUser();
  const firestore = useFirestore();


  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0] || null);
    setExtractedResults([]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });
  
  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  }

  const handleProcessFile = async () => {
    if (!file || !user) return;
    setIsLoading(true);
    setExtractedResults([]);

    try {
      const fileDataUri = await fileToDataUri(file);
      
      const result = await extractMaterialsFromFile({ 
          fileDataUri,
          existingProducts: products,
          existingCategories: categories,
      });

      if (result.materials && result.materials.length > 0) {
        setExtractedResults(result.materials);
        toast({
          variant: 'success',
          title: 'پردازش موفق',
          description: `${result.materials.length} مورد با موفقیت از فایل استخراج و مقایسه شد.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'نتیجه‌ای یافت نشد',
          description: 'هوش مصنوعی نتوانست موردی را از فایل استخراج کند. لطفاً از یک فایل واضح‌تر استفاده کنید.',
        });
      }

    } catch (error) {
      console.error("Error processing file with AI:", error);
      toast({
        variant: 'destructive',
        title: 'خطا در پردازش فایل',
        description: 'مشکلی در ارتباط با هوش مصنوعی پیش آمد. لطفاً دوباره تلاش کنید.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddClick = async () => {
    if (extractedResults.length === 0 || !file || !user || !firestore) {
      return;
    }

    const newProductsToCreate = extractedResults.filter(p => p.isNew);
    const materialResults: MaterialResult[] = [];
    const batch = writeBatch(firestore);
    
    // Find or create "چکنویس" category for the first available store
    const storeId = stores[0]?.id;
    if (!storeId) {
        toast({ variant: 'destructive', title: 'فروشگاهی یافت نشد', description: 'برای ایجاد محصولات جدید، ابتدا یک فروشگاه ایجاد کنید.' });
        return;
    }
    
    let draftCategoryId = categories.find(c => c.name === 'چکنویس' && c.storeId === storeId)?.id;
    if (!draftCategoryId) {
        const categoryRef = doc(collection(firestore, 'users', user.uid, 'categories'));
        draftCategoryId = categoryRef.id;
        batch.set(categoryRef, { name: 'چکنویس', storeId: storeId });
    }

    // Process new products
    for (const newProd of newProductsToCreate) {
        const productRef = doc(collection(firestore, 'users', user.uid, 'products'));
        const newProductData: Omit<Product, 'id'> = {
            name: newProd.name,
            price: 0, // Default price
            description: `ایجاد شده توسط سفارش هوشمند از فایل ${file.name}`,
            storeId: storeId,
            subCategoryId: draftCategoryId,
            unit: newProd.unit,
            imageUrl: `https://picsum.photos/seed/${encodeURIComponent(newProd.name)}/400/300`,
        };
        batch.set(productRef, newProductData);
        materialResults.push({ material: newProd.name, quantity: newProd.quantity, unit: newProd.unit });
    }

    // Process existing products
    extractedResults.filter(p => !p.isNew).forEach(existingProd => {
        materialResults.push({ material: existingProd.name, quantity: existingProd.quantity, unit: existingProd.unit });
    });

    try {
        await batch.commit();
        if (newProductsToCreate.length > 0) {
            toast({ variant: 'success', title: 'محصولات جدید ایجاد شد', description: `${newProductsToCreate.length} محصول جدید در دسته "چکنویس" ایجاد شد.` });
        }
    } catch (error) {
        console.error("Error creating new products in batch:", error);
        toast({ variant: 'destructive', title: 'خطا در ذخیره‌سازی', description: 'مشکلی در ایجاد محصولات جدید رخ داد.' });
        return; // Stop if batch fails
    }

    const description = `استخراج شده از فایل: ${file.name}`;
    onAddToList(description, materialResults);
  };
  
  const removeFile = () => {
    setFile(null);
    setExtractedResults([]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>سفارش هوشمند با AI</CardTitle>
        <CardDescription>
          فایل لیست مصالح خود (عکس، PDF یا متن) را آپلود کنید. هوش مصنوعی آن را تحلیل کرده و به صورت خودکار به آیتم‌های فاکتور تبدیل می‌کند.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Column */}
            <div className="space-y-6">
                <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}
                >
                <input {...getInputProps()} />
                <div className="text-center">
                    <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground" />
                    {isDragActive ? (
                    <p className="mt-4 text-primary font-semibold">فایل را اینجا رها کنید...</p>
                    ) : (
                    <>
                        <p className="mt-4 text-sm text-muted-foreground">
                        فایل خود را اینجا بکشید یا برای انتخاب کلیک کنید
                        </p>
                        <p className="text-xs text-muted-foreground/80 mt-1">
                        (PDF, TXT, JPG, PNG)
                        </p>
                    </>
                    )}
                </div>
                </div>

                {file && (
                <div className="p-3 border rounded-lg flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-primary" />
                    <div className="grid gap-0.5">
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                        </span>
                    </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={removeFile}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                )}
                
                <Button 
                onClick={handleProcessFile} 
                disabled={!file || isLoading} 
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
                >
                {isLoading ? (
                    <>
                    <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                    در حال پردازش با هوش مصنوعی...
                    </>
                ) : (
                    'شروع پردازش فایل'
                )}
                </Button>
            </div>

            {/* Output Column */}
            <div className="border rounded-lg p-4 space-y-4">
                <h3 className="text-lg font-semibold text-center">نتایج استخراج شده</h3>
                 <Separator />

                {extractedResults.length > 0 ? (
                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>نوع مصالح</TableHead>
                                <TableHead className="text-center w-1/4">مقدار</TableHead>
                                <TableHead className="w-1/4">وضعیت</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {extractedResults.map((item, index) => (
                                <TableRow key={`${item.productId}-${index}`}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-center font-mono text-lg">{item.quantity.toLocaleString('fa-IR')}</TableCell>
                                <TableCell>
                                    {item.isNew ? (
                                        <Badge variant="outline" className="text-amber-600 border-amber-500">جدید</Badge>
                                    ) : (
                                        <Badge variant="secondary" className="text-green-600 border-green-500">موجود</Badge>
                                    )}
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>

                        <div className="pt-4">
                            <Button onClick={handleAddClick} size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                                <PlusCircle className="ml-2 h-5 w-5" />
                                افزودن به لیست برآورد
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center py-10">
                        <ListTree className="w-12 h-12 mb-4" />
                        <p>نتایج پس از پردازش فایل در اینجا نمایش داده می‌شوند.</p>
                    </div>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
