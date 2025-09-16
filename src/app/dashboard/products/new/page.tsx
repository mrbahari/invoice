
'use client';

import { ProductForm } from '@/components/dashboard/product-form';
import { initialCategories } from '@/lib/data';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Category } from '@/lib/definitions';

export default function NewProductPage() {
  const [categories] = useLocalStorage<Category[]>('categories', initialCategories);
  return <ProductForm categories={categories} />;
}
