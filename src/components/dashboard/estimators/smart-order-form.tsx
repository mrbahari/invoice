'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, Loader2, CheckCircle, PlusCircle, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { extractMaterialsFromFile } from '@/ai/flows/extract-materials-flow';
import type { MaterialResult } from '../estimators-page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type SmartOrderFormProps = {
  onAddToList: (description: string, results: MaterialResult[]) => void;
  onBack: () => void;
};

export function SmartOrderForm({ onAddToList, onBack }: SmartOrderFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedResults, setExtractedResults] = useState<MaterialResult[]>([]);
  const { toast } = useToast();

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
    if (!file) return;
    setIsLoading(true);
    setExtractedResults([]);

    try {
      const fileDataUri = await fileToDataUri(file);
      
      const result = await extractMaterialsFromFile({ fileDataUri });

      if (result.materials && result.materials.length > 0) {
        setExtractedResults(result.materials);
        toast({
          variant: 'success',
          title: 'پردازش موفق',
          description: `${result.materials.length} مورد با موفقیت از فایل استخراج شد.`,
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
  
  const handleAddClick = () => {
    if (extractedResults.length === 0 || !file) {
      return;
    }
    const description = `استخراج شده از فایل: ${file.name}`;
    onAddToList(description, extractedResults);
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
      <CardContent className="space-y-6">
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
            <Button variant="ghost" size="sm" onClick={removeFile}>حذف</Button>
          </div>
        )}
        
        <Button 
          onClick={handleProcessFile} 
          disabled={!file || isLoading} 
          className="w-full"
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

        {extractedResults.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">نتایج استخراج شده:</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نوع مصالح</TableHead>
                    <TableHead className="text-center">مقدار</TableHead>
                    <TableHead>واحد</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractedResults.map((item, index) => (
                    <TableRow key={`${item.material}-${index}`}>
                      <TableCell className="font-medium">{item.material}</TableCell>
                      <TableCell className="text-center font-mono text-lg">{item.quantity.toLocaleString('fa-IR')}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div 
                className="pt-4"
              >
                <Button onClick={handleAddClick} size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
                    <PlusCircle className="ml-2 h-5 w-5" />
                    افزودن به لیست برآورد
                </Button>
              </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
