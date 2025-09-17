
'use client';

import { useRouter } from 'next/navigation';

export default function EditCategoryPage() {
  const router = useRouter();
  
  // This page is now handled within CategoriesPage.
  // We redirect to the main categories page.
  if (typeof window !== 'undefined') {
    router.replace('/dashboard/categories');
  }

  return null; // or a loading indicator
}
