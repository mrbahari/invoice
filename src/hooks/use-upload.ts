'use client';

import { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useToast } from './use-toast';

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    const storageRef = ref(storage, `product-images/${Date.now()}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const currentProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(currentProgress);
        },
        (uploadError) => {
          console.error("Upload failed:", uploadError);
          const errorMessage = "آپلود تصویر با خطا مواجه شد. لطفاً دوباره تلاش کنید.";
          setError(errorMessage);
          toast({ variant: 'destructive', title: 'خطا در آپلود', description: errorMessage });
          setIsUploading(false);
          reject(null);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            toast({ variant: 'success', title: 'آپلود موفق', description: 'تصویر با موفقیت آپلود شد.' });
            setIsUploading(false);
            resolve(downloadURL);
          } catch (e) {
            console.error("Could not get download URL:", e);
            const errorMessage = "خطا در دریافت آدرس تصویر پس از آپلود.";
            setError(errorMessage);
            toast({ variant: 'destructive', title: 'خطا', description: errorMessage });
            setIsUploading(false);
            reject(null);
          }
        }
      );
    });
  };

  return { uploadFile, isUploading, progress, error };
}
