'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, Loader2, CheckCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

type SmartOrderFormProps = {
  onBack: () => void;
};

export function SmartOrderForm({ onBack }: SmartOrderFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // For now, we'll just handle one file, but this setup allows multiple.
    setFiles(acceptedFiles);
    setIsSuccess(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  const handleProcessFile = async () => {
    if (files.length === 0) return;
    setIsLoading(true);

    // ===============================================================
    // TODO: AI Processing Logic Will Go Here
    // 1. Read the file (using FileReader for client-side preview, or send to server)
    // 2. Send the file content (or file itself) to a Genkit flow.
    // 3. The flow will process the text/image/pdf and extract items.
    // 4. The flow will return a structured list of potential invoice items.
    // 5. This component will then likely pass those items to the invoice editor.
    // ===============================================================
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsLoading(false);
    setIsSuccess(true);

    // In a real implementation, you would navigate or pass data here.
    // For now, we just show a success message.
  };
  
  const removeFile = () => {
    setFiles([]);
    setIsSuccess(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>سفارش هوشمند با AI</CardTitle>
        <CardDescription>
          فایل لیست مصالح خود (اکسل، عکس، PDF یا متن) را آپلود کنید. هوش مصنوعی آن را تحلیل کرده و به صورت خودکار به آیتم‌های فاکتور تبدیل می‌کند.
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
                  (PDF, Excel, CSV, JPG, PNG, TXT)
                </p>
              </>
            )}
          </div>
        </div>

        {files.length > 0 && (
          <div className="p-3 border rounded-lg flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <div className="grid gap-0.5">
                <span className="text-sm font-medium">{files[0].name}</span>
                <span className="text-xs text-muted-foreground">
                  {(files[0].size / 1024).toFixed(2)} KB
                </span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={removeFile}>حذف</Button>
          </div>
        )}

        {isSuccess && (
            <div className="p-4 border rounded-lg flex items-center gap-3 bg-green-500/10 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <p className="text-sm font-medium">فایل با موفقیت پردازش شد! (شبیه‌سازی)</p>
            </div>
        )}

        <Button 
          onClick={handleProcessFile} 
          disabled={files.length === 0 || isLoading || isSuccess} 
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
      </CardContent>
    </Card>
  );
}
