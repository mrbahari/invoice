
'use client';

import { CategoryForm } from '@/components/dashboard/category-form';
import { categories } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';

export default function EditCategoryPage() {
  const params = useParams<{ id: string }>();
  const category = categories.find((c) => c.id === params.id);

  if (!category) {
    notFound();
  }

  return <CategoryForm category={category} />;
}
