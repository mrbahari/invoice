
'use client';

import { ProductForm } from '@/components/dashboard/product-form';
import { initialProducts, initialCategories } from '@/lib/data';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Product, Category } from '@/lib/definitions';
import { notFound, useParams } from 'next/navigation';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [products] = useLocalStorage<Product[]>('products', initialProducts);
  const [categories] = useLocalStorage<Category[]>('categories', initialCategories);
  const product = products.find((p) => p.id === params.id);

  if (!product) {
    notFound();
  }

  return <ProductForm product={product} categories={categories} />;
}
