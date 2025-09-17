
'use client';

import { useRouter } from 'next/navigation';

export default function EditProductPage() {
  const router = useRouter();
  
  // This page is now handled within ProductsPage.
  // We redirect to the main products page.
  if (typeof window !== 'undefined') {
    router.replace('/dashboard/products');
  }

  return null; // or a loading indicator
}
