import { ProductForm } from '@/components/dashboard/product-form';
import { categories } from '@/lib/data';

export default function NewProductPage() {
  return <ProductForm categories={categories} />;
}
