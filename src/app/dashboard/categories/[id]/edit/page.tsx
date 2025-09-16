
'use client';

import { CategoryForm } from '@/components/dashboard/category-form';
import { initialCategories } from '@/lib/data';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category } from '@/lib/definitions';
import { notFound, useParams } from 'next/navigation';

export default function EditCategoryPage() {
  const params = useParams<{ id: string }>();
  const [categories] = useLocalStorage<Category[]>('categories', initialCategories);
  const category = categories.find((c) => c.id === params.id);

  if (!category) {
    notFound();
  }

  return <CategoryForm category={category} />;
}
