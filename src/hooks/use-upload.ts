'use client';

import { useState } from 'react';
import { useToast } from './use-toast';

const MAX_WIDTH = 300;
const MAX_HEIGHT = 300;

const resizeAndOptimizeImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Failed to get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error('Canvas to Blob conversion failed'));
            }
            const newFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          'image/jpeg',
          0.8
        ); // 80% quality
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};


export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File, path?: string): Promise<string | null> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const optimizedFile = await resizeAndOptimizeImage(file);
      
      const formData = new FormData();
      formData.append('file', optimizedFile);
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
                  const errorMessage = `آپلود تصویر با خطا مواجه شد. (وضعیت: ${'xhr.status'})`;
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

    } catch (resizeError) {
        console.error("Image optimization failed:", resizeError);
        setError("خطا در بهینه‌سازی تصویر.");
        toast({ variant: 'destructive', title: 'خطا در بهینه‌سازی', description: 'امکان تغییر اندازه یا فشرده‌سازی تصویر وجود نداشت.' });
        setIsUploading(false);
        return null;
    }
  };

  return { uploadFile, isUploading, progress, error };
}
