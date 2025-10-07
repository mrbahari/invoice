
'use client';

import { useState } from 'react';
import { useToast } from './use-toast';

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File, path?: string): Promise<string | null> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    if(path) {
        formData.append('path', path);
    }

    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const currentProgress = (event.loaded / event.total) * 100;
                setProgress(currentProgress);
            }
        });

        xhr.addEventListener('load', () => {
            setIsUploading(false);
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText);
                toast({ variant: 'success', title: 'آپلود موفق', description: 'تصویر با موفقیت آپلود شد.' });
                resolve(response.url);
            } else {
                const errorMessage = `آپلود تصویر با خطا مواجه شد. (وضعیت: ${xhr.status})`;
                console.error("Upload failed:", xhr.responseText);
                setError(errorMessage);
                toast({ variant: 'destructive', title: 'خطا در آپلود', description: xhr.responseText || errorMessage });
                resolve(null);
            }
        });

        xhr.addEventListener('error', () => {
            const errorMessage = "خطا در شبکه هنگام آپلود فایل.";
            console.error("Upload failed due to a network error.");
            setError(errorMessage);
            toast({ variant: 'destructive', title: 'خطا در آپلود', description: errorMessage });
            setIsUploading(false);
            resolve(null);
        });

        xhr.open('POST', '/api/upload', true);
        xhr.send(formData);
    });
  };

  return { uploadFile, isUploading, progress, error };
}
