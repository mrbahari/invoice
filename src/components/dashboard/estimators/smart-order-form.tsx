'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, Loader2, ListTree, Mic, MicOff, X, FileImage } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import Image from 'next/image';


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
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedResults, setExtractedResults] = useState<ExtractedProduct[]>([]);
  const { toast } = useToast();
  const { data: appData } = useData();
  const { products, categories, stores } = appData;
  const { user } = useUser();
  const firestore = useFirestore();
  const { transcript, isListening, startListening, stopListening } = useSpeechRecognition({
      onResult: (result) => setTextInput(prev => prev ? `${prev} ${result}`: result),
      onError: (error) => toast({ variant: 'destructive', title: 'خطای گفتار', description: error })
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setExtractedResults([]);

    if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target?.result as string);
        reader.readAsDataURL(selectedFile);
    } else {
        setFilePreview(null);
    }
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

  const handleProcess = async (source: 'file' | 'text') => {
    if (!user) return;
    
    let inputForAI = {};
    let fileName = 'ورودی متنی';

    if (source === 'file' && file) {
        fileName = file.name;
        const fileDataUri = await fileToDataUri(file);
        inputForAI = { fileDataUri };
    } else if (source === 'text' && textInput) {
        inputForAI = { textInput };
    } else {
        return; // Nothing to process
    }

    setIsLoading(true);
    setExtractedResults([]);

    try {
      const result = await extractMaterialsFromFile({ 
          ...inputForAI,
          existingProducts: products,
          existingCategories: categories,
      });

      if (result.materials && result.materials.length > 0) {
        setExtractedResults(result.materials);
        toast({
          variant: 'success',
          title: 'پردازش موفق',
          description: `${result.materials.length} مورد با موفقیت استخراج و مقایسه شد.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'نتیجه‌ای یافت نشد',
          description: 'هوش مصنوعی نتوانست موردی را استخراج کند. لطفاً ورودی خود را بررسی کنید.',
        });
      }

    } catch (error) {
      console.error("Error processing with AI:", error);
      toast({
        variant: 'destructive',
        title: 'خطا در پردازش',
        description: 'مشکلی در ارتباط با هوش مصنوعی پیش آمد. لطفاً دوباره تلاش کنید.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddClick = async () => {
    if (extractedResults.length === 0 || !user || !firestore) {
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
            description: `ایجاد شده توسط سفارش هوشمند`,
            storeId: storeId,
            subCategoryId: draftCategoryId,
            unit: newProd.unit,
            imageUrl: `https://picsum.photos/seed/${encodeURIComponent(newProd.name)}/400/300`,
            subUnit: '',
            subUnitQuantity: 0,
            subUnitPrice: 0,
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

    const description = `استخراج شده از ورودی هوشمند`;
    onAddToList(description, materialResults);
  };
  
  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setFilePreview(null);
    setExtractedResults([]);
  }

  const renderFilePreview = () => {
    if (!file) return null;

    return (
        <div className="mt-4 p-3 border rounded-lg flex items-center justify-between bg-muted/30 relative">
            <div className="flex items-center gap-3">
                {filePreview ? (
                     <Image src={filePreview} alt="پیش‌نمایش" width={48} height={48} className="object-cover rounded-md" />
                ) : (
                     file.type.includes('pdf') ? <FileText className="w-8 h-8 text-red-500" /> : <FileText className="w-8 h-8 text-primary" />
                )}
                <div className="grid gap-0.5">
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                    </span>
                </div>
            </div>
             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={removeFile}>
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>سفارش هوشمند با AI</CardTitle>
        <CardDescription>
          لیست مصالح خود را از طریق فایل، متن یا گفتار وارد کنید تا هوش مصنوعی آن را تحلیل کرده و به صورت خودکار به آیتم‌های قابل استفاده تبدیل کند.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Column */}
            <div className="space-y-6">
                <Tabs defaultValue="file" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="file">آپلود فایل</TabsTrigger>
                        <TabsTrigger value="text">ورودی متن</TabsTrigger>
                    </TabsList>
                    <TabsContent value="file" className="pt-4">
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

                        {renderFilePreview()}
                        
                        <Button 
                            onClick={() => handleProcess('file')} 
                            disabled={!file || isLoading} 
                            className="w-full mt-4 bg-green-600 hover:bg-green-700"
                            size="lg"
                        >
                            {isLoading ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : null}
                            پردازش فایل
                        </Button>
                    </TabsContent>
                    <TabsContent value="text" className="pt-4">
                        <div className="relative">
                            <Textarea 
                                placeholder="لیست مصالح خود را اینجا تایپ یا جایگذاری کنید...&#10;مثال:&#10;پروفیل F47 - ۶۰ شاخه&#10;پانل کناف - ۲۵ برگ"
                                className="w-full min-h-[220px] p-4 pr-12"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                            />
                            <Button
                                type="button"
                                variant={isListening ? 'destructive' : 'outline'}
                                size="icon"
                                className="absolute top-3 right-3 h-8 w-8"
                                onClick={isListening ? stopListening : startListening}
                            >
                                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                <span className="sr-only">{isListening ? 'توقف ضبط' : 'شروع ضبط'}</span>
                            </Button>
                        </div>
                         <Button 
                            onClick={() => handleProcess('text')} 
                            disabled={!textInput || isLoading} 
                            className="w-full mt-4 bg-green-600 hover:bg-green-700"
                            size="lg"
                        >
                            {isLoading ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : null}
                            پردازش متن
                        </Button>
                    </TabsContent>
                </Tabs>
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
                                افزودن به لیست برآورد
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center py-10">
                        <ListTree className="w-12 h-12 mb-4" />
                        <p>نتایج پس از پردازش در اینجا نمایش داده می‌شوند.</p>
                    </div>
                )}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
